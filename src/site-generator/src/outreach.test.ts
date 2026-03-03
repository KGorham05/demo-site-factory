import { describe, expect, it } from "vitest";

import type { BusinessLead } from "@demo-site-factory/types";

import { generateOutreachEmail } from "./outreach.js";

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
  status: "demo_generated",
  foundAt: "2026-03-03T00:00:00Z",
  updatedAt: "2026-03-03T00:00:00Z",
};

const DEMO_URL = "https://mikes-plumbing-and-drain.vercel.app";

/** Count the words in a plain-text string */
function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

// ---------------------------------------------------------------------------
// Initial outreach
// ---------------------------------------------------------------------------

describe("initial outreach email", () => {
  it("contains the business name in subject and body", () => {
    const email = generateOutreachEmail(sampleLead, DEMO_URL, { stage: "initial" });
    expect(email.subject).toContain("Mike's Plumbing & Drain");
    expect(email.body).toContain("Mike's Plumbing & Drain");
  });

  it("contains the demo URL in the body", () => {
    const email = generateOutreachEmail(sampleLead, DEMO_URL, { stage: "initial" });
    expect(email.body).toContain(DEMO_URL);
  });

  it("references the industry", () => {
    const email = generateOutreachEmail(sampleLead, DEMO_URL, { stage: "initial" });
    expect(email.body.toLowerCase()).toContain("plumbing");
  });

  it("references the city", () => {
    const email = generateOutreachEmail(sampleLead, DEMO_URL, { stage: "initial" });
    expect(email.body).toContain("Denver");
  });

  it("uses the provided sender name", () => {
    const email = generateOutreachEmail(sampleLead, DEMO_URL, {
      stage: "initial",
      senderName: "Sarah",
    });
    expect(email.body).toContain("Sarah");
  });

  it("defaults sender name to Kevin when not provided", () => {
    const email = generateOutreachEmail(sampleLead, DEMO_URL, { stage: "initial" });
    expect(email.body).toContain("Kevin");
  });
});

// ---------------------------------------------------------------------------
// Follow-up outreach
// ---------------------------------------------------------------------------

describe("follow-up outreach email", () => {
  it("has a different subject than initial outreach", () => {
    const initial = generateOutreachEmail(sampleLead, DEMO_URL, { stage: "initial" });
    const followUp = generateOutreachEmail(sampleLead, DEMO_URL, { stage: "follow-up" });
    expect(followUp.subject).not.toBe(initial.subject);
  });

  it("has a different tone/body than initial outreach", () => {
    const initial = generateOutreachEmail(sampleLead, DEMO_URL, { stage: "initial" });
    const followUp = generateOutreachEmail(sampleLead, DEMO_URL, { stage: "follow-up" });
    expect(followUp.body).not.toBe(initial.body);
  });

  it("contains follow-up language", () => {
    const email = generateOutreachEmail(sampleLead, DEMO_URL, { stage: "follow-up" });
    expect(email.body.toLowerCase()).toContain("follow up");
  });

  it("still contains the demo URL", () => {
    const email = generateOutreachEmail(sampleLead, DEMO_URL, { stage: "follow-up" });
    expect(email.body).toContain(DEMO_URL);
  });
});

// ---------------------------------------------------------------------------
// Final follow-up outreach
// ---------------------------------------------------------------------------

describe("final follow-up outreach email", () => {
  it("has urgency language", () => {
    const email = generateOutreachEmail(sampleLead, DEMO_URL, { stage: "final" });
    const bodyLower = email.body.toLowerCase();
    const subjectLower = email.subject.toLowerCase();
    const combined = bodyLower + " " + subjectLower;

    // Should contain at least one urgency indicator
    const hasUrgency =
      combined.includes("last") ||
      combined.includes("expir") ||
      combined.includes("few more days") ||
      combined.includes("miss out") ||
      combined.includes("now is the time");

    expect(hasUrgency).toBe(true);
  });

  it("has a different subject than initial and follow-up", () => {
    const initial = generateOutreachEmail(sampleLead, DEMO_URL, { stage: "initial" });
    const followUp = generateOutreachEmail(sampleLead, DEMO_URL, { stage: "follow-up" });
    const final = generateOutreachEmail(sampleLead, DEMO_URL, { stage: "final" });
    expect(final.subject).not.toBe(initial.subject);
    expect(final.subject).not.toBe(followUp.subject);
  });

  it("still contains the demo URL", () => {
    const email = generateOutreachEmail(sampleLead, DEMO_URL, { stage: "final" });
    expect(email.body).toContain(DEMO_URL);
  });
});

// ---------------------------------------------------------------------------
// Word count constraint
// ---------------------------------------------------------------------------

describe("email word count", () => {
  it("initial email body is under 200 words", () => {
    const email = generateOutreachEmail(sampleLead, DEMO_URL, { stage: "initial" });
    expect(wordCount(email.body)).toBeLessThan(200);
  });

  it("follow-up email body is under 200 words", () => {
    const email = generateOutreachEmail(sampleLead, DEMO_URL, { stage: "follow-up" });
    expect(wordCount(email.body)).toBeLessThan(200);
  });

  it("final email body is under 200 words", () => {
    const email = generateOutreachEmail(sampleLead, DEMO_URL, { stage: "final" });
    expect(wordCount(email.body)).toBeLessThan(200);
  });

  it("email with purchase URL is still under 200 words", () => {
    const email = generateOutreachEmail(sampleLead, DEMO_URL, {
      stage: "initial",
      purchaseUrl: "https://buy.stripe.com/test_abc123",
    });
    expect(wordCount(email.body)).toBeLessThan(200);
  });
});

// ---------------------------------------------------------------------------
// HTML body
// ---------------------------------------------------------------------------

describe("HTML email body", () => {
  it("contains a clickable link for the demo URL", () => {
    const email = generateOutreachEmail(sampleLead, DEMO_URL, { stage: "initial" });
    expect(email.htmlBody).toContain(`href="${DEMO_URL}"`);
    expect(email.htmlBody).toContain("<a ");
  });

  it("wraps content in proper HTML structure", () => {
    const email = generateOutreachEmail(sampleLead, DEMO_URL, { stage: "initial" });
    expect(email.htmlBody).toContain("<!DOCTYPE html>");
    expect(email.htmlBody).toContain("<html>");
    expect(email.htmlBody).toContain("</html>");
    expect(email.htmlBody).toContain("<body");
  });

  it("contains a clickable purchase URL when provided", () => {
    const purchaseUrl = "https://buy.stripe.com/test_abc123";
    const email = generateOutreachEmail(sampleLead, DEMO_URL, {
      stage: "initial",
      purchaseUrl,
    });
    expect(email.htmlBody).toContain(`href="${purchaseUrl}"`);
  });

  it("does not contain raw purchase URL markup when not provided", () => {
    const email = generateOutreachEmail(sampleLead, DEMO_URL, { stage: "initial" });
    // Should not have "secure your site" purchase block when no purchaseUrl
    expect(email.body).not.toContain("secure your site");
  });
});

// ---------------------------------------------------------------------------
// Missing optional fields handled gracefully
// ---------------------------------------------------------------------------

describe("graceful handling of missing optional fields", () => {
  it("works with a minimal lead (no optional fields)", () => {
    const minimalLead: BusinessLead = {
      id: "minimal-001",
      name: "Basic Services",
      address: "100 Oak Ave",
      city: "Austin",
      state: "TX",
      zip: "73301",
      industry: "handyman",
      services: [],
      status: "lead",
      foundAt: "2026-03-03T00:00:00Z",
      updatedAt: "2026-03-03T00:00:00Z",
    };

    const email = generateOutreachEmail(minimalLead, "https://basic-services.vercel.app");
    expect(email.subject).toContain("Basic Services");
    expect(email.body).toContain("Austin");
    expect(email.body).toContain("https://basic-services.vercel.app");
  });

  it("defaults to initial stage when no options are provided", () => {
    const email = generateOutreachEmail(sampleLead, DEMO_URL);
    // Should match the initial template subject pattern
    expect(email.subject).toContain("Ready to Preview");
  });

  it("defaults sender name to Kevin when options are provided without senderName", () => {
    const email = generateOutreachEmail(sampleLead, DEMO_URL, { stage: "follow-up" });
    expect(email.body).toContain("Kevin");
  });

  it("includes purchase block only when purchaseUrl is provided", () => {
    const withoutPurchase = generateOutreachEmail(sampleLead, DEMO_URL, { stage: "initial" });
    const withPurchase = generateOutreachEmail(sampleLead, DEMO_URL, {
      stage: "initial",
      purchaseUrl: "https://buy.stripe.com/test",
    });

    expect(withoutPurchase.body).not.toContain("stripe.com");
    expect(withPurchase.body).toContain("https://buy.stripe.com/test");
  });
});
