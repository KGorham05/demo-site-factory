/**
 * Outreach email generator.
 *
 * Generates personalized outreach emails for business leads after a demo site
 * has been deployed. Supports three outreach stages: initial contact, follow-up,
 * and a final follow-up with urgency language.
 */

import type { BusinessLead } from "@demo-site-factory/types";

import { formatIndustryName } from "./industry-defaults.js";

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface OutreachOptions {
  /** Which stage of the outreach sequence this email is for */
  stage: "initial" | "follow-up" | "final";
  /** Name of the person sending the email (defaults to "Kevin") */
  senderName?: string;
  /** Stripe checkout URL for purchasing the site */
  purchaseUrl?: string;
}

export interface OutreachEmail {
  /** Email subject line */
  subject: string;
  /** Plain-text email body */
  body: string;
  /** HTML version of the email body */
  htmlBody: string;
}

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

interface EmailTemplate {
  subject: string;
  body: string;
}

const TEMPLATES: Record<OutreachOptions["stage"], EmailTemplate> = {
  initial: {
    subject: "{businessName} - Your New {industry} Website is Ready to Preview",
    body: `Hi there,

I came across {businessName} while researching {industry} companies in {city}, and I was impressed by what you've built. I put together a custom website demo specifically for your business.

Take a look here: {demoUrl}

The site is fully designed with your business name, services, and local area in mind. It's mobile-friendly, fast, and built to help {city} customers find and contact you.

If you like what you see, I can have it live on your own domain within 24 hours.{purchaseBlock}

I'd love to hear your thoughts. Just reply to this email or let me know a good time to chat.

Best,
{senderName}`,
  },
  "follow-up": {
    subject: "Quick follow-up: {businessName} website demo",
    body: `Hi there,

I wanted to follow up on the custom website demo I built for {businessName}. In case you missed it, here's the link again:

{demoUrl}

I know running a {industry} business in {city} keeps you busy, so I wanted to make sure this didn't slip through the cracks. The demo is tailored to your business and ready to go live whenever you are.

Happy to answer any questions or make adjustments. Just let me know.

Best,
{senderName}`,
  },
  final: {
    subject: "Last chance: {businessName} website demo expiring soon",
    body: `Hi there,

This is my last note about the custom website I built for {businessName}. The demo link below will only be available for a few more days:

{demoUrl}

I'd hate for you to miss out. A strong online presence is one of the best ways to attract new {industry} customers in {city}, and this site is ready to launch today.{purchaseBlock}

If the timing isn't right, no worries at all. But if you're interested, now is the time to grab it.

All the best,
{senderName}`,
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Replace template variables in a string.
 */
function replaceVars(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    // Replace all occurrences of {key} with value
    result = result.split(`{${key}}`).join(value);
  }
  return result;
}

/**
 * Convert plain-text email body to a simple HTML version.
 * - Wraps in basic HTML structure
 * - Converts URLs to clickable links
 * - Preserves paragraph breaks
 */
function textToHtml(text: string, demoUrl: string, purchaseUrl?: string): string {
  // Escape HTML entities
  let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Replace the demo URL with a styled link
  html = html
    .split(demoUrl)
    .join(`<a href="${demoUrl}" style="color: #2563eb; font-weight: bold;">${demoUrl}</a>`);

  // Replace purchase URL with a styled link/button if present
  if (purchaseUrl) {
    html = html
      .split(purchaseUrl)
      .join(
        `<a href="${purchaseUrl}" style="color: #2563eb; font-weight: bold;">${purchaseUrl}</a>`,
      );
  }

  // Convert double newlines to paragraph breaks
  const paragraphs = html.split(/\n\n+/).map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
${paragraphs.join("\n")}
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Generate a personalized outreach email for a business lead.
 *
 * @param lead      - The business lead data
 * @param demoUrl   - The URL where the demo site is deployed
 * @param options   - Outreach options (stage, sender name, purchase URL)
 * @returns An OutreachEmail with subject, body (plain text), and htmlBody
 */
export function generateOutreachEmail(
  lead: BusinessLead,
  demoUrl: string,
  options?: Partial<OutreachOptions>,
): OutreachEmail {
  const stage = options?.stage ?? "initial";
  const senderName = options?.senderName ?? "Kevin";
  const purchaseUrl = options?.purchaseUrl;

  const industry = formatIndustryName(lead.industry);

  // Build the purchase block — always include the claim page link
  const claimUrl = `${demoUrl}/claim`;
  const purchaseBlock = purchaseUrl
    ? `\n\nReady to get started? You can secure your site here: ${purchaseUrl}`
    : `\n\nSee pricing and claim your site: ${claimUrl}`;

  const vars: Record<string, string> = {
    businessName: lead.name,
    city: lead.city,
    industry: industry.toLowerCase(),
    demoUrl,
    senderName,
    purchaseBlock,
  };

  const template = TEMPLATES[stage];
  const subject = replaceVars(template.subject, vars);
  const body = replaceVars(template.body, vars);
  const htmlBody = textToHtml(body, demoUrl, purchaseUrl);

  return { subject, body, htmlBody };
}
