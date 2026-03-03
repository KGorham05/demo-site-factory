import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { Command } from "commander";
import { config } from "dotenv";
import type { BusinessLead } from "@demo-site-factory/types";
import {
  createCheckoutSession,
  createPricingTiers,
  verifyWebhookSignature,
  type PricingTierName,
} from "./stripe-client.js";
import { markAsPurchased } from "./lead-updater.js";

// Load .env from project root (two levels up from src/purchase-flow)
config({ path: resolve(import.meta.dirname, "../../.env") });

const program = new Command();

program
  .name("purchase-flow")
  .description("Stripe purchase flow for demo site sales")
  .version("0.1.0");

program
  .command("create-link")
  .description("Generate a Stripe checkout link for a lead")
  .requiredOption("--lead <id-or-path>", "Lead ID or path to lead JSON file")
  .option("--tier <tier>", "Pricing tier: basic | standard | premium", "standard")
  .option("--success-url <url>", "Redirect URL after purchase", "https://example.com/success")
  .option(
    "--cancel-url <url>",
    "Redirect URL if purchase is cancelled",
    "https://example.com/cancel",
  )
  .action(async (options) => {
    const { lead, tier, successUrl, cancelUrl } = options as {
      lead: string;
      tier: string;
      successUrl: string;
      cancelUrl: string;
    };

    const validTiers: PricingTierName[] = ["basic", "standard", "premium"];

    if (!validTiers.includes(tier as PricingTierName)) {
      process.stderr.write(
        `Error: Invalid tier "${tier}". Must be one of: ${validTiers.join(", ")}\n`,
      );
      process.exit(1);
    }

    // Resolve lead: either a file path or an ID to look up
    let leadData: BusinessLead;

    if (lead.endsWith(".json") || lead.includes("/")) {
      // Treat as a file path
      const leadPath = resolve(lead);

      try {
        const content = await readFile(leadPath, "utf-8");
        const parsed: unknown = JSON.parse(content);

        if (Array.isArray(parsed)) {
          if (parsed.length === 0) {
            process.stderr.write("Error: Lead file contains an empty array.\n");
            process.exit(1);
          }
          leadData = parsed[0] as BusinessLead;
        } else {
          leadData = parsed as BusinessLead;
        }
      } catch (error) {
        process.stderr.write(
          `Error reading lead file: ${error instanceof Error ? error.message : String(error)}\n`,
        );
        process.exit(1);
      }
    } else {
      // Treat as a lead ID - search data/leads directory
      const leadsDir = resolve(import.meta.dirname, "../../data/leads");

      try {
        const { readdir, readFile: readFileAsync } = await import("node:fs/promises");
        const { join } = await import("node:path");

        const entries = await readdir(leadsDir);
        let found: BusinessLead | undefined;

        for (const entry of entries) {
          if (!entry.endsWith(".json") || entry.startsWith(".")) continue;

          const content = await readFileAsync(join(leadsDir, entry), "utf-8");
          const parsed: unknown = JSON.parse(content);
          const leads: BusinessLead[] = Array.isArray(parsed)
            ? (parsed as BusinessLead[])
            : [parsed as BusinessLead];

          found = leads.find((l) => l.id === lead);

          if (found) break;
        }

        if (!found) {
          process.stderr.write(`Error: Lead with ID "${lead}" not found in ${leadsDir}\n`);
          process.exit(1);
        }

        leadData = found;
      } catch (error) {
        process.stderr.write(
          `Error searching for lead: ${error instanceof Error ? error.message : String(error)}\n`,
        );
        process.exit(1);
      }
    }

    process.stdout.write(`Creating checkout link for "${leadData.name}"...\n`);
    process.stdout.write(`Tier: ${tier}\n`);

    try {
      const result = await createCheckoutSession({
        leadId: leadData.id,
        businessName: leadData.name,
        demoUrl: leadData.demoUrl ?? "https://example.com",
        tier: tier as PricingTierName,
        successUrl,
        cancelUrl,
      });

      process.stdout.write(`\nCheckout URL: ${result.checkoutUrl}\n`);
      process.stdout.write(`Session ID: ${result.sessionId}\n`);
    } catch (error) {
      process.stderr.write(
        `Error creating checkout session: ${error instanceof Error ? error.message : String(error)}\n`,
      );
      process.exit(1);
    }
  });

program
  .command("pricing")
  .description("Display available pricing tiers")
  .action(() => {
    const tiers = createPricingTiers();

    process.stdout.write("\nAvailable Pricing Tiers\n");
    process.stdout.write("=======================\n\n");

    for (const tier of tiers) {
      process.stdout.write(`${tier.displayName} (${tier.priceFormatted})\n`);

      for (const feature of tier.features) {
        process.stdout.write(`  - ${feature}\n`);
      }

      process.stdout.write("\n");
    }
  });

program
  .command("process-webhook")
  .description("Process a Stripe webhook event from stdin")
  .requiredOption("--signature <sig>", "Stripe webhook signature (stripe-signature header)")
  .option(
    "--webhook-secret <secret>",
    "Webhook endpoint secret (or set STRIPE_WEBHOOK_SECRET env var)",
  )
  .action(async (options) => {
    const { signature, webhookSecret } = options as {
      signature: string;
      webhookSecret?: string;
    };

    const secret = webhookSecret ?? process.env.STRIPE_WEBHOOK_SECRET;

    if (!secret) {
      process.stderr.write(
        "Error: Webhook secret is required. Use --webhook-secret or set STRIPE_WEBHOOK_SECRET.\n",
      );
      process.exit(1);
    }

    // Read JSON from stdin
    const chunks: Buffer[] = [];

    for await (const chunk of process.stdin) {
      chunks.push(chunk as Buffer);
    }

    const payload = Buffer.concat(chunks).toString("utf-8");

    if (!payload) {
      process.stderr.write("Error: No data received on stdin.\n");
      process.exit(1);
    }

    try {
      const event = verifyWebhookSignature(payload, signature, secret);

      process.stdout.write(`Verified event: ${event.type} (${event.id})\n`);

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as {
          metadata?: Record<string, string>;
          id?: string;
          amount_total?: number;
        };
        const metadata = session.metadata;

        if (metadata?.leadId) {
          const leadsDir = resolve(import.meta.dirname, "../../data/leads");

          const updated = await markAsPurchased(metadata.leadId, leadsDir, {
            sessionId: session.id ?? "",
            amountInCents: session.amount_total ?? 0,
            tier: metadata.tier ?? "standard",
            purchasedAt: new Date().toISOString(),
          });

          if (updated) {
            process.stdout.write(`Lead "${updated.name}" marked as purchased.\n`);
          } else {
            process.stderr.write(`Warning: Lead "${metadata.leadId}" not found in ${leadsDir}.\n`);
          }
        }
      }
    } catch (error) {
      process.stderr.write(
        `Error processing webhook: ${error instanceof Error ? error.message : String(error)}\n`,
      );
      process.exit(1);
    }
  });

program.parse();
