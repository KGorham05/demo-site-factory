import Stripe from "stripe";
import { z } from "zod";

/** Available pricing tier identifiers */
export type PricingTierName = "basic" | "standard" | "premium";

/** A pricing tier with details about what's included */
export interface PricingTier {
  name: PricingTierName;
  displayName: string;
  /** Price in cents */
  priceInCents: number;
  /** Price formatted for display (e.g., "$499") */
  priceFormatted: string;
  features: string[];
}

/** Configuration for creating a Stripe Checkout Session */
export interface CheckoutConfig {
  /** Lead ID from the pipeline */
  leadId: string;
  /** Business name for the product description */
  businessName: string;
  /** Demo site URL */
  demoUrl: string;
  /** Pricing tier to use */
  tier: PricingTierName;
  /** URL to redirect to after successful purchase */
  successUrl: string;
  /** URL to redirect to if the customer cancels */
  cancelUrl: string;
}

/** Result of creating a Stripe Checkout Session */
export interface CheckoutResult {
  /** Stripe Checkout Session ID */
  sessionId: string;
  /** URL to redirect the customer to for payment */
  checkoutUrl: string;
}

/** Zod schema for validating CheckoutConfig input */
export const CheckoutConfigSchema = z.object({
  leadId: z.string().min(1, "leadId is required"),
  businessName: z.string().min(1, "businessName is required"),
  demoUrl: z.string().url("demoUrl must be a valid URL"),
  tier: z.enum(["basic", "standard", "premium"]),
  successUrl: z.string().url("successUrl must be a valid URL"),
  cancelUrl: z.string().url("cancelUrl must be a valid URL"),
});

/**
 * Returns available pricing tiers for demo site purchases.
 */
export function createPricingTiers(): PricingTier[] {
  return [
    {
      name: "basic",
      displayName: "Basic",
      priceInCents: 29900,
      priceFormatted: "$299",
      features: ["3-page site", "Basic styling", "Contact form"],
    },
    {
      name: "standard",
      displayName: "Standard",
      priceInCents: 49900,
      priceFormatted: "$499",
      features: ["5-page site", "Custom styling", "Contact form", "SEO optimization"],
    },
    {
      name: "premium",
      displayName: "Premium",
      priceInCents: 79900,
      priceFormatted: "$799",
      features: [
        "5-page site",
        "Custom styling",
        "Contact form",
        "SEO optimization",
        "Google Business integration",
        "3 months support",
      ],
    },
  ];
}

/**
 * Looks up a pricing tier by name.
 * Throws if the tier name is invalid.
 */
export function getPricingTier(tierName: PricingTierName): PricingTier {
  const tiers = createPricingTiers();
  const tier = tiers.find((t) => t.name === tierName);

  if (!tier) {
    throw new Error(`Unknown pricing tier: ${tierName}`);
  }

  return tier;
}

/**
 * Builds the Stripe line item configuration for a checkout session.
 * Exported for testing.
 */
export function buildCheckoutLineItem(
  config: CheckoutConfig,
  tier: PricingTier,
): Stripe.Checkout.SessionCreateParams.LineItem {
  return {
    price_data: {
      currency: "usd",
      product_data: {
        name: `Professional Website - ${config.businessName}`,
        description: `${tier.displayName} plan: ${tier.features.join(", ")}`,
        metadata: {
          leadId: config.leadId,
          businessName: config.businessName,
          demoUrl: config.demoUrl,
          tier: tier.name,
        },
      },
      unit_amount: tier.priceInCents,
    },
    quantity: 1,
  };
}

/**
 * Creates a Stripe Checkout Session for purchasing a demo site.
 *
 * Requires STRIPE_SECRET_KEY to be set in the environment.
 */
export async function createCheckoutSession(config: CheckoutConfig): Promise<CheckoutResult> {
  const parsed = CheckoutConfigSchema.parse(config);

  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    throw new Error(
      "STRIPE_SECRET_KEY environment variable is not set. " + "Add it to your .env file.",
    );
  }

  const stripe = new Stripe(stripeKey);
  const tier = getPricingTier(parsed.tier);
  const lineItem = buildCheckoutLineItem(parsed, tier);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [lineItem],
    success_url: parsed.successUrl,
    cancel_url: parsed.cancelUrl,
    metadata: {
      leadId: parsed.leadId,
      businessName: parsed.businessName,
      demoUrl: parsed.demoUrl,
      tier: parsed.tier,
    },
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  return {
    sessionId: session.id,
    checkoutUrl: session.url,
  };
}

/**
 * Verifies a Stripe webhook event signature.
 *
 * @param payload - Raw request body
 * @param signature - Value of the stripe-signature header
 * @param secret - Webhook endpoint secret
 * @returns The verified Stripe event
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string,
): Stripe.Event {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "unused");

  return stripe.webhooks.constructEvent(payload, signature, secret);
}
