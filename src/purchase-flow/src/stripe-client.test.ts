import { describe, it, expect, beforeEach } from "vitest";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { BusinessLead } from "@demo-site-factory/types";
import {
  createPricingTiers,
  getPricingTier,
  buildCheckoutLineItem,
  CheckoutConfigSchema,
  type CheckoutConfig,
  type PricingTierName,
} from "./stripe-client.js";
import { updateLeadStatus, markAsPurchased } from "./lead-updater.js";

function makeCheckoutConfig(overrides: Partial<CheckoutConfig> = {}): CheckoutConfig {
  return {
    leadId: "test-plumbing-co",
    businessName: "Test Plumbing Co",
    demoUrl: "https://demo.example.com/test-plumbing-co",
    tier: "standard",
    successUrl: "https://example.com/success",
    cancelUrl: "https://example.com/cancel",
    ...overrides,
  };
}

function makeLead(overrides: Partial<BusinessLead> = {}): BusinessLead {
  return {
    id: "test-plumbing-co",
    placeId: "ChIJtest123",
    name: "Test Plumbing Co",
    phone: "(555) 123-4567",
    address: "1234 Main St",
    city: "Denver",
    state: "CO",
    zip: "80202",
    industry: "plumber",
    services: [],
    rating: 4.5,
    reviewCount: 25,
    status: "demo_sent",
    demoUrl: "https://demo.example.com/test-plumbing-co",
    foundAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("pricing tiers", () => {
  it("should return three pricing tiers", () => {
    const tiers = createPricingTiers();

    expect(tiers).toHaveLength(3);
  });

  it("should include basic, standard, and premium tiers", () => {
    const tiers = createPricingTiers();
    const names = tiers.map((t) => t.name);

    expect(names).toEqual(["basic", "standard", "premium"]);
  });

  it("should have correct prices", () => {
    const tiers = createPricingTiers();

    expect(tiers[0].priceInCents).toBe(29900);
    expect(tiers[0].priceFormatted).toBe("$299");

    expect(tiers[1].priceInCents).toBe(49900);
    expect(tiers[1].priceFormatted).toBe("$499");

    expect(tiers[2].priceInCents).toBe(79900);
    expect(tiers[2].priceFormatted).toBe("$799");
  });

  it("should have non-empty features for each tier", () => {
    const tiers = createPricingTiers();

    for (const tier of tiers) {
      expect(tier.features.length).toBeGreaterThan(0);
    }
  });

  it("premium tier should include support and Google Business integration", () => {
    const tiers = createPricingTiers();
    const premium = tiers.find((t) => t.name === "premium");

    expect(premium).toBeDefined();
    expect(premium!.features).toContain("Google Business integration");
    expect(premium!.features).toContain("3 months support");
  });

  it("should look up a tier by name", () => {
    const tier = getPricingTier("standard");

    expect(tier.name).toBe("standard");
    expect(tier.priceInCents).toBe(49900);
  });

  it("should throw for unknown tier name", () => {
    expect(() => getPricingTier("enterprise" as PricingTierName)).toThrow(
      "Unknown pricing tier: enterprise",
    );
  });
});

describe("checkout config validation", () => {
  it("should accept a valid config", () => {
    const config = makeCheckoutConfig();
    const result = CheckoutConfigSchema.parse(config);

    expect(result.leadId).toBe("test-plumbing-co");
    expect(result.tier).toBe("standard");
  });

  it("should reject an empty leadId", () => {
    expect(() => CheckoutConfigSchema.parse(makeCheckoutConfig({ leadId: "" }))).toThrow();
  });

  it("should reject an empty businessName", () => {
    expect(() => CheckoutConfigSchema.parse(makeCheckoutConfig({ businessName: "" }))).toThrow();
  });

  it("should reject an invalid demoUrl", () => {
    expect(() =>
      CheckoutConfigSchema.parse(makeCheckoutConfig({ demoUrl: "not-a-url" })),
    ).toThrow();
  });

  it("should reject an invalid tier", () => {
    expect(() =>
      CheckoutConfigSchema.parse(makeCheckoutConfig({ tier: "enterprise" as PricingTierName })),
    ).toThrow();
  });

  it("should reject an invalid successUrl", () => {
    expect(() => CheckoutConfigSchema.parse(makeCheckoutConfig({ successUrl: "bad" }))).toThrow();
  });

  it("should reject an invalid cancelUrl", () => {
    expect(() => CheckoutConfigSchema.parse(makeCheckoutConfig({ cancelUrl: "bad" }))).toThrow();
  });
});

describe("checkout line item building", () => {
  it("should build a line item with the correct product name", () => {
    const config = makeCheckoutConfig({ businessName: "Joe's HVAC" });
    const tier = getPricingTier("standard");
    const lineItem = buildCheckoutLineItem(config, tier);

    expect(lineItem.price_data?.product_data?.name).toBe("Professional Website - Joe's HVAC");
  });

  it("should include tier price in cents", () => {
    const config = makeCheckoutConfig();
    const tier = getPricingTier("premium");
    const lineItem = buildCheckoutLineItem(config, tier);

    expect(lineItem.price_data?.unit_amount).toBe(79900);
    expect(lineItem.price_data?.currency).toBe("usd");
  });

  it("should include metadata with lead and business info", () => {
    const config = makeCheckoutConfig({
      leadId: "my-lead",
      businessName: "My Biz",
      demoUrl: "https://demo.example.com/my-biz",
    });
    const tier = getPricingTier("basic");
    const lineItem = buildCheckoutLineItem(config, tier);
    const metadata = lineItem.price_data?.product_data?.metadata;

    expect(metadata?.leadId).toBe("my-lead");
    expect(metadata?.businessName).toBe("My Biz");
    expect(metadata?.demoUrl).toBe("https://demo.example.com/my-biz");
    expect(metadata?.tier).toBe("basic");
  });

  it("should set quantity to 1", () => {
    const config = makeCheckoutConfig();
    const tier = getPricingTier("standard");
    const lineItem = buildCheckoutLineItem(config, tier);

    expect(lineItem.quantity).toBe(1);
  });
});

describe("lead status updates", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "purchase-flow-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("should update lead status in a JSON file", async () => {
    const leads = [
      makeLead({ id: "lead-a", name: "Business A" }),
      makeLead({ id: "lead-b", name: "Business B" }),
    ];
    await writeFile(join(tempDir, "test-leads.json"), JSON.stringify(leads, null, 2));

    const updated = await updateLeadStatus("lead-b", "purchased", tempDir);

    expect(updated).not.toBeNull();
    expect(updated!.status).toBe("purchased");
    expect(updated!.name).toBe("Business B");

    // Verify it was written to disk
    const raw = await readFile(join(tempDir, "test-leads.json"), "utf-8");
    const savedLeads = JSON.parse(raw) as BusinessLead[];
    const savedB = savedLeads.find((l) => l.id === "lead-b");

    expect(savedB!.status).toBe("purchased");
  });

  it("should return null when lead ID is not found", async () => {
    const leads = [makeLead({ id: "lead-a" })];
    await writeFile(join(tempDir, "test-leads.json"), JSON.stringify(leads));

    const result = await updateLeadStatus("nonexistent", "purchased", tempDir);

    expect(result).toBeNull();
  });

  it("should return null when leads directory does not exist", async () => {
    const result = await updateLeadStatus("any-id", "purchased", "/tmp/no-such-dir-xyz");

    expect(result).toBeNull();
  });

  it("should not modify other leads in the file", async () => {
    const leads = [
      makeLead({ id: "lead-a", name: "A", status: "demo_sent" }),
      makeLead({ id: "lead-b", name: "B", status: "demo_sent" }),
    ];
    await writeFile(join(tempDir, "test-leads.json"), JSON.stringify(leads, null, 2));

    await updateLeadStatus("lead-b", "purchased", tempDir);

    const raw = await readFile(join(tempDir, "test-leads.json"), "utf-8");
    const savedLeads = JSON.parse(raw) as BusinessLead[];
    const savedA = savedLeads.find((l) => l.id === "lead-a");

    expect(savedA!.status).toBe("demo_sent");
  });

  it("should mark a lead as purchased with payment info", async () => {
    const leads = [makeLead({ id: "lead-a", status: "demo_sent" })];
    await writeFile(join(tempDir, "test-leads.json"), JSON.stringify(leads));

    const paymentInfo = {
      sessionId: "cs_test_abc123",
      paymentIntentId: "pi_test_xyz",
      amountInCents: 49900,
      tier: "standard",
      purchasedAt: "2026-03-01T12:00:00.000Z",
    };

    const result = await markAsPurchased("lead-a", tempDir, paymentInfo);

    expect(result).not.toBeNull();
    expect(result!.status).toBe("purchased");
    expect(result!.paymentInfo.sessionId).toBe("cs_test_abc123");
    expect(result!.paymentInfo.amountInCents).toBe(49900);

    // Verify persisted to disk
    const raw = await readFile(join(tempDir, "test-leads.json"), "utf-8");
    const savedLeads = JSON.parse(raw) as Array<BusinessLead & { paymentInfo?: unknown }>;

    expect(savedLeads[0].status).toBe("purchased");
    expect(savedLeads[0].paymentInfo).toEqual(paymentInfo);
  });

  it("markAsPurchased should return null for missing lead", async () => {
    const leads = [makeLead({ id: "lead-a" })];
    await writeFile(join(tempDir, "test-leads.json"), JSON.stringify(leads));

    const result = await markAsPurchased("nonexistent", tempDir, {
      sessionId: "cs_test",
      amountInCents: 0,
      tier: "basic",
      purchasedAt: new Date().toISOString(),
    });

    expect(result).toBeNull();
  });
});

// Need to import afterEach at top level for cleanup
import { afterEach } from "vitest";
