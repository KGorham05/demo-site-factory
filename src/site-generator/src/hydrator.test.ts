import path from "node:path";

import fs from "fs-extra";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { BusinessLead } from "@demo-site-factory/types";

import { buildPlaceholderMap, hydrate, replacePlaceholders } from "./hydrator.js";
import { formatIndustryName, generateTagline, getIndustryDefaults } from "./industry-defaults.js";
import { slugify } from "./slug.js";

/** A complete sample lead for testing */
const sampleLead: BusinessLead = {
  id: "test-001",
  placeId: "ChIJTest123",
  name: "Mike's Plumbing & Drain",
  phone: "(555) 123-4567",
  address: "1234 Main St",
  city: "Denver",
  state: "CO",
  zip: "80202",
  industry: "plumber",
  services: [
    "Emergency Plumbing Repair",
    "Drain Cleaning & Unclogging",
    "Water Heater Installation",
  ],
  rating: 4.7,
  reviewCount: 42,
  status: "lead",
  foundAt: "2026-03-03T00:00:00Z",
  updatedAt: "2026-03-03T00:00:00Z",
};

// ---------------------------------------------------------------------------
// Slug tests
// ---------------------------------------------------------------------------

describe("slugify", () => {
  it("converts a business name to a URL-safe slug", () => {
    expect(slugify("Mike's Plumbing & Drain")).toBe("mikes-plumbing-and-drain");
  });

  it("handles all-uppercase input", () => {
    expect(slugify("ACE ELECTRIC LLC")).toBe("ace-electric-llc");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  --Hello World--  ")).toBe("hello-world");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("a  &  b")).toBe("a-and-b");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("handles strings with only special characters", () => {
    expect(slugify("@#$%^")).toBe("");
  });

  it("preserves numbers", () => {
    expect(slugify("Plumber 24/7")).toBe("plumber-24-7");
  });
});

// ---------------------------------------------------------------------------
// Industry defaults tests
// ---------------------------------------------------------------------------

describe("industry defaults", () => {
  it("returns defaults for every supported industry", () => {
    const industries = [
      "plumber",
      "electrician",
      "hvac",
      "landscaping",
      "cleaning",
      "roofing",
      "painting",
      "pest-control",
      "handyman",
      "general-contractor",
    ] as const;

    for (const industry of industries) {
      const defaults = getIndustryDefaults(industry);
      expect(defaults).toBeDefined();
      expect(defaults.displayName).toBeTruthy();
      expect(defaults.taglineTemplate).toContain("{City}");
      expect(defaults.services.length).toBeGreaterThanOrEqual(6);
      expect(defaults.testimonials.length).toBeGreaterThanOrEqual(3);
      expect(defaults.heroSubtitle).toBeTruthy();
      expect(defaults.servicePhrase).toBeTruthy();
    }
  });

  it("formats industry names correctly", () => {
    expect(formatIndustryName("plumber")).toBe("Plumbing");
    expect(formatIndustryName("electrician")).toBe("Electrical");
    expect(formatIndustryName("hvac")).toBe("HVAC");
    expect(formatIndustryName("pest-control")).toBe("Pest Control");
    expect(formatIndustryName("general-contractor")).toBe("General Contracting");
  });

  it("generates taglines with city and industry", () => {
    const tagline = generateTagline("plumber", "Denver");
    expect(tagline).toBe("Denver's Trusted Plumbing Experts");
  });

  it("generates taglines for different industries", () => {
    expect(generateTagline("electrician", "Austin")).toBe("Austin's Trusted Electrical Experts");
    expect(generateTagline("hvac", "Phoenix")).toBe("Phoenix's Trusted HVAC Experts");
  });
});

// ---------------------------------------------------------------------------
// Placeholder replacement tests
// ---------------------------------------------------------------------------

describe("replacePlaceholders", () => {
  it("replaces known placeholders with values", () => {
    const map = { business_name: "Acme Co", city: "Denver" };
    const result = replacePlaceholders("Welcome to {{business_name}} in {{city}}!", map);
    expect(result).toBe("Welcome to Acme Co in Denver!");
  });

  it("leaves unrecognized placeholders intact", () => {
    const map = { business_name: "Acme Co" };
    const result = replacePlaceholders("{{business_name}} - {{unknown_field}}", map);
    expect(result).toBe("Acme Co - {{unknown_field}}");
  });

  it("handles content with no placeholders", () => {
    const map = { business_name: "Acme Co" };
    const result = replacePlaceholders("No placeholders here.", map);
    expect(result).toBe("No placeholders here.");
  });

  it("handles multiple occurrences of the same placeholder", () => {
    const map = { phone: "(555) 123-4567" };
    const result = replacePlaceholders("Call {{phone}} or {{phone}}", map);
    expect(result).toBe("Call (555) 123-4567 or (555) 123-4567");
  });

  it("handles empty string", () => {
    const result = replacePlaceholders("", { foo: "bar" });
    expect(result).toBe("");
  });
});

// ---------------------------------------------------------------------------
// buildPlaceholderMap tests
// ---------------------------------------------------------------------------

describe("buildPlaceholderMap", () => {
  it("builds a complete placeholder map from a lead", () => {
    const map = buildPlaceholderMap(sampleLead);

    expect(map.business_name).toBe("Mike's Plumbing & Drain");
    expect(map.phone).toBe("(555) 123-4567");
    expect(map.email).toBe("mikes-plumbing-and-drain@example.com");
    expect(map.address).toBe("1234 Main St");
    expect(map.city).toBe("Denver");
    expect(map.state).toBe("CO");
    expect(map.zip).toBe("80202");
    expect(map.industry).toBe("Plumbing");
    expect(map.industry_lower).toBe("plumber");
    expect(map.tagline).toBe("Denver's Trusted Plumbing Experts");
    expect(map.hero_subtitle).toContain("Denver");
    expect(map.hero_subtitle).toContain("plumbing");
    expect(map.years_in_business).toBe("10");
    expect(map.stats_years).toBe("10+");
    expect(map.stats_jobs).toBe("1K+");
    expect(map.rating).toBe("4.7");
    expect(map.review_count).toBe("42");
  });

  it("uses lead services when provided", () => {
    const map = buildPlaceholderMap(sampleLead);
    expect(map.service_1_name).toBe("Emergency Plumbing Repair");
    expect(map.service_2_name).toBe("Drain Cleaning & Unclogging");
    expect(map.service_3_name).toBe("Water Heater Installation");
  });

  it("generates service_4, service_5, service_6 from industry defaults", () => {
    const map = buildPlaceholderMap(sampleLead);
    expect(map.service_4_name).toBeTruthy();
    expect(map.service_4_description).toBeTruthy();
    expect(map.service_5_name).toBeTruthy();
    expect(map.service_5_description).toBeTruthy();
    expect(map.service_6_name).toBeTruthy();
    expect(map.service_6_description).toBeTruthy();
  });

  it("falls back to industry defaults when services are missing", () => {
    const leadNoServices: BusinessLead = {
      ...sampleLead,
      services: [],
    };
    const map = buildPlaceholderMap(leadNoServices);
    // Should fall back to default plumber services
    expect(map.service_1_name).toBe("Repairs & Maintenance");
    expect(map.service_1_description).toBeTruthy();
  });

  it("uses default rating and review count when not provided", () => {
    const leadNoRating: BusinessLead = {
      ...sampleLead,
      rating: undefined,
      reviewCount: undefined,
    };
    const map = buildPlaceholderMap(leadNoRating);
    expect(map.rating).toBe("4.8");
    expect(map.review_count).toBe("50");
  });

  it("generates testimonial placeholders", () => {
    const map = buildPlaceholderMap(sampleLead);
    expect(map.testimonial_1_author).toBeTruthy();
    expect(map.testimonial_1_text).toBeTruthy();
    expect(map.testimonial_2_author).toBeTruthy();
    expect(map.testimonial_2_text).toBeTruthy();
    expect(map.testimonial_3_author).toBeTruthy();
    expect(map.testimonial_3_text).toBeTruthy();
  });

  it("uses empty string for phone when not provided", () => {
    const leadNoPhone: BusinessLead = {
      ...sampleLead,
      phone: undefined,
    };
    const map = buildPlaceholderMap(leadNoPhone);
    expect(map.phone).toBe("");
  });
});

// ---------------------------------------------------------------------------
// hydrate integration test
// ---------------------------------------------------------------------------

describe("hydrate", () => {
  const testDir = path.join(process.cwd(), ".test-hydrate-temp");
  const templateDir = path.join(testDir, "template");
  const outputDir = path.join(testDir, "output");

  beforeEach(async () => {
    await fs.ensureDir(templateDir);
    await fs.ensureDir(path.join(templateDir, "src", "pages"));

    // Create test template files
    await fs.writeFile(
      path.join(templateDir, "src", "pages", "index.astro"),
      `<h1>{{business_name}}</h1>\n<p>{{tagline}}</p>\n<p>Call {{phone}}</p>`,
    );

    await fs.writeFile(
      path.join(templateDir, "business.yaml"),
      `name: "{{business_name}}"\ncity: "{{city}}"\nrating: "{{rating}}"`,
    );

    await fs.writeFile(path.join(templateDir, "package.json"), `{"name": "test-template"}`);

    // Create a binary-like file that should not be modified
    await fs.writeFile(path.join(templateDir, "image.png"), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it("copies template files and replaces placeholders", async () => {
    const result = await hydrate({
      lead: sampleLead,
      templateDir,
      outputDir,
    });

    expect(result.slug).toBe("mikes-plumbing-and-drain");
    expect(result.filesProcessed).toBeGreaterThan(0);

    // Check that the astro file was hydrated
    const indexContent = await fs.readFile(
      path.join(outputDir, "src", "pages", "index.astro"),
      "utf-8",
    );
    expect(indexContent).toContain("Mike's Plumbing & Drain");
    expect(indexContent).toContain("Denver's Trusted Plumbing Experts");
    expect(indexContent).toContain("(555) 123-4567");
    expect(indexContent).not.toContain("{{business_name}}");
    expect(indexContent).not.toContain("{{tagline}}");

    // Check the YAML file was hydrated
    const yamlContent = await fs.readFile(path.join(outputDir, "business.yaml"), "utf-8");
    expect(yamlContent).toContain("Mike's Plumbing & Drain");
    expect(yamlContent).toContain("Denver");
    expect(yamlContent).toContain("4.7");
  });

  it("does not modify binary files", async () => {
    await hydrate({
      lead: sampleLead,
      templateDir,
      outputDir,
    });

    const binaryContent = await fs.readFile(path.join(outputDir, "image.png"));
    expect(binaryContent).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  });

  it("does not copy node_modules", async () => {
    // Create a fake node_modules in template
    const nodeModulesDir = path.join(templateDir, "node_modules", "some-pkg");
    await fs.ensureDir(nodeModulesDir);
    await fs.writeFile(path.join(nodeModulesDir, "index.js"), "module.exports = {};");

    await hydrate({
      lead: sampleLead,
      templateDir,
      outputDir,
    });

    const hasNodeModules = await fs.pathExists(path.join(outputDir, "node_modules"));
    expect(hasNodeModules).toBe(false);
  });

  it("throws if template directory does not exist", async () => {
    await expect(
      hydrate({
        lead: sampleLead,
        templateDir: path.join(testDir, "nonexistent"),
        outputDir,
      }),
    ).rejects.toThrow("Template directory not found");
  });
});
