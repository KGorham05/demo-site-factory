/**
 * Site Generator CLI
 *
 * Commands:
 *   generate  - Generate a demo site from a template and business lead data
 *   build     - Run `astro build` in a generated site directory
 *   preview   - Run `astro preview` in a generated site directory
 *   outreach  - Generate an outreach email for a business lead
 */

import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Command } from "commander";
import { config } from "dotenv";
import fs from "fs-extra";

import type { HydrationExtras } from "./hydrator.js";
import { hydrate } from "./hydrator.js";
import { loadLead } from "./lead-loader.js";
import { generateOutreachEmail } from "./outreach.js";
import { slugify } from "./slug.js";
import { deployToVercel, setCustomDomain, VercelDeployError } from "./vercel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (three levels up from src/site-generator/src/)
config({ path: path.resolve(__dirname, "..", "..", "..", ".env") });

/** Resolve a path relative to the monorepo root (two levels up from src/) */
function repoRoot(): string {
  return path.resolve(__dirname, "..", "..", "..");
}

const program = new Command();

program
  .name("site-generator")
  .description("Generate demo sites from templates and business data")
  .version("0.1.0");

program
  .command("generate")
  .description("Generate a demo site for a business")
  .requiredOption("-b, --business <path>", "Path to business JSON file or lead ID")
  .option("-t, --template <name>", "Template to use", "home-services")
  .option("-o, --output <path>", "Output directory", path.join(repoRoot(), "generated"))
  .option("--purchase-url-standard <url>", "Stripe checkout URL for Standard plan")
  .option("--purchase-url-standard-domain <url>", "Stripe checkout URL for Standard + domain")
  .option("--purchase-url-premium <url>", "Stripe checkout URL for Premium plan")
  .option("--purchase-url-premium-domain <url>", "Stripe checkout URL for Premium + domain")
  .option("--owner-email <email>", "Owner contact email", "kevin.gorham@gmail.com")
  .option("--owner-phone <phone>", "Owner contact phone")
  .action(
    async (options: {
      business: string;
      template: string;
      output: string;
      purchaseUrlStandard?: string;
      purchaseUrlStandardDomain?: string;
      purchaseUrlPremium?: string;
      purchaseUrlPremiumDomain?: string;
      ownerEmail: string;
      ownerPhone?: string;
    }) => {
      try {
        const leadsDir = path.join(repoRoot(), "data", "leads");
        const lead = await loadLead(options.business, leadsDir);
        const slug = slugify(lead.name);

        const templateDir = path.join(repoRoot(), "templates", options.template);
        const outputDir = path.join(options.output, slug);

        if (!(await fs.pathExists(templateDir))) {
          console.error(`Template not found: ${templateDir}`);
          process.exit(1);
        }

        // Resolve Stripe Payment Links: CLI flags > env vars (based on STRIPE_MODE) > fallback
        const stripeMode = process.env.STRIPE_MODE === "live" ? "LIVE" : "TEST";
        const envUrl = (key: string): string | undefined =>
          process.env[`STRIPE_${stripeMode}_URL_${key}`];

        const extras: HydrationExtras = {
          ownerEmail: options.ownerEmail,
          ownerPhone: options.ownerPhone,
          purchaseUrls: {
            standard: options.purchaseUrlStandard ?? envUrl("STANDARD") ?? "#pricing",
            standardDomain:
              options.purchaseUrlStandardDomain ?? envUrl("STANDARD_DOMAIN") ?? "#pricing",
            premium: options.purchaseUrlPremium ?? envUrl("PREMIUM") ?? "#pricing",
            premiumDomain:
              options.purchaseUrlPremiumDomain ?? envUrl("PREMIUM_DOMAIN") ?? "#pricing",
          },
        };

        console.log(`Generating site for: ${lead.name}`);
        console.log(`  Template: ${options.template}`);
        console.log(`  Output:   ${outputDir}`);

        const result = await hydrate({
          lead,
          templateDir,
          outputDir,
          extras,
        });

        console.log(`\nInstalling dependencies...`);
        execSync("npm install --silent", {
          cwd: result.outputDir,
          stdio: "pipe",
        });

        console.log(`\nSite generated successfully!`);
        console.log(`  Directory:       ${result.outputDir}`);
        console.log(`  Files processed: ${result.filesProcessed}`);
        console.log(`  Files copied:    ${result.filesCopied}`);
        console.log(`  Slug:            ${result.slug}`);
        console.log(`\nNext steps:`);
        console.log(`  1. cd ${result.outputDir}`);
        console.log(`  2. npm run dev`);
      } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    },
  );

program
  .command("build")
  .description("Run astro build in a generated site directory")
  .requiredOption("-s, --site <path>", "Path to generated site directory")
  .action(async (options: { site: string }) => {
    try {
      const sitePath = path.resolve(options.site);

      if (!(await fs.pathExists(sitePath))) {
        console.error(`Site directory not found: ${sitePath}`);
        process.exit(1);
      }

      const packageJsonPath = path.join(sitePath, "package.json");
      if (!(await fs.pathExists(packageJsonPath))) {
        console.error(`No package.json found in ${sitePath}. Is this a valid site directory?`);
        process.exit(1);
      }

      console.log(`Building site at: ${sitePath}`);
      execSync("npx astro build", {
        cwd: sitePath,
        stdio: "inherit",
      });

      console.log("\nBuild complete!");
    } catch (error) {
      if (error instanceof Error && "status" in error) {
        process.exit((error as NodeJS.ErrnoException & { status: number }).status ?? 1);
      }
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

program
  .command("preview")
  .description("Run astro preview in a generated site directory")
  .requiredOption("-s, --site <path>", "Path to generated site directory")
  .action(async (options: { site: string }) => {
    try {
      const sitePath = path.resolve(options.site);

      if (!(await fs.pathExists(sitePath))) {
        console.error(`Site directory not found: ${sitePath}`);
        process.exit(1);
      }

      const packageJsonPath = path.join(sitePath, "package.json");
      if (!(await fs.pathExists(packageJsonPath))) {
        console.error(`No package.json found in ${sitePath}. Is this a valid site directory?`);
        process.exit(1);
      }

      console.log(`Previewing site at: ${sitePath}`);
      execSync("npx astro preview", {
        cwd: sitePath,
        stdio: "inherit",
      });
    } catch (error) {
      if (error instanceof Error && "status" in error) {
        process.exit((error as NodeJS.ErrnoException & { status: number }).status ?? 1);
      }
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

program
  .command("deploy")
  .description("Deploy a generated demo site to Vercel")
  .requiredOption("-s, --site <path>", "Path to generated site directory")
  .option("-t, --token <token>", "Vercel API token (falls back to VERCEL_TOKEN env var)")
  .option("--team <teamId>", "Vercel team ID (falls back to VERCEL_TEAM_ID env var)")
  .option("-d, --domain <domain>", "Custom domain to assign after deployment")
  .action(async (options: { site: string; token?: string; team?: string; domain?: string }) => {
    try {
      const sitePath = path.resolve(options.site);

      if (!(await fs.pathExists(sitePath))) {
        console.error(`Site directory not found: ${sitePath}`);
        process.exit(1);
      }

      const packageJsonPath = path.join(sitePath, "package.json");
      if (!(await fs.pathExists(packageJsonPath))) {
        console.error(`No package.json found in ${sitePath}. Is this a valid site directory?`);
        process.exit(1);
      }

      const token = options.token ?? process.env.VERCEL_TOKEN;
      if (!token) {
        console.error(
          "Vercel token is required. Provide --token or set the VERCEL_TOKEN environment variable.",
        );
        process.exit(1);
      }

      const teamId = options.team ?? process.env.VERCEL_TEAM_ID;

      console.log(`Deploying site at: ${sitePath}`);

      const result = deployToVercel({
        siteDir: sitePath,
        token,
        teamId,
        projectName: path.basename(sitePath),
      });

      console.log(`\nDeployment successful!`);
      console.log(`  URL: ${result.url}`);
      console.log(`  Deployment ID: ${result.deploymentId}`);

      if (options.domain) {
        console.log(`\nSetting custom domain: ${options.domain}`);
        await setCustomDomain(result.projectId, options.domain, token);
        console.log(`  Domain configured: ${options.domain}`);
      }
    } catch (error) {
      if (error instanceof VercelDeployError) {
        console.error(`Vercel deploy error: ${error.message}`);
        if (error.statusCode) {
          console.error(`  HTTP status: ${error.statusCode}`);
        }
      } else {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
      process.exit(1);
    }
  });

program
  .command("outreach")
  .description("Generate an outreach email for a business lead")
  .requiredOption("-b, --business <path>", "Path to business JSON or lead ID")
  .option("-u, --demo-url <url>", "Demo site URL")
  .option("-s, --stage <stage>", "Outreach stage: initial, follow-up, final", "initial")
  .option("--sender <name>", "Sender name", "Kevin")
  .option("--purchase-url <url>", "Stripe checkout URL")
  .action(
    async (options: {
      business: string;
      demoUrl?: string;
      stage: string;
      sender: string;
      purchaseUrl?: string;
    }) => {
      try {
        const leadsDir = path.join(repoRoot(), "data", "leads");
        const lead = await loadLead(options.business, leadsDir);

        // Use the lead's demoUrl if none was provided via CLI
        const demoUrl = options.demoUrl ?? lead.demoUrl;
        if (!demoUrl) {
          console.error(
            "Demo URL is required. Provide --demo-url or ensure the lead has a demoUrl field.",
          );
          process.exit(1);
        }

        const stage = options.stage as "initial" | "follow-up" | "final";
        if (!["initial", "follow-up", "final"].includes(stage)) {
          console.error(`Invalid stage "${options.stage}". Use: initial, follow-up, final`);
          process.exit(1);
        }

        const email = generateOutreachEmail(lead, demoUrl, {
          stage,
          senderName: options.sender,
          purchaseUrl: options.purchaseUrl,
        });

        console.log(`Subject: ${email.subject}\n`);
        console.log(email.body);

        // Try to copy to clipboard on macOS
        try {
          execSync("which pbcopy", { stdio: "ignore" });
          execSync("pbcopy", {
            input: `Subject: ${email.subject}\n\n${email.body}`,
            stdio: ["pipe", "ignore", "ignore"],
          });
          console.log("\n(Copied to clipboard)");
        } catch {
          // pbcopy not available, skip clipboard
        }
      } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    },
  );

program.parse();
