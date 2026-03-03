import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { BusinessLead, LeadStatus } from "@demo-site-factory/types";

/** Payment metadata stored on a purchased lead */
export interface PaymentInfo {
  /** Stripe Checkout Session ID */
  sessionId: string;
  /** Stripe Payment Intent ID */
  paymentIntentId?: string;
  /** Amount paid in cents */
  amountInCents: number;
  /** Pricing tier purchased */
  tier: string;
  /** ISO timestamp of the purchase */
  purchasedAt: string;
}

/**
 * Reads all lead JSON files from a directory and finds the one containing
 * the specified lead ID. Returns the file path and parsed leads array,
 * or null if the lead is not found.
 */
async function findLeadFile(
  leadId: string,
  leadsDir: string,
): Promise<{ filePath: string; leads: BusinessLead[]; index: number } | null> {
  let entries: string[];

  try {
    entries = await readdir(leadsDir);
  } catch {
    return null;
  }

  for (const entry of entries) {
    if (!entry.endsWith(".json") || entry.startsWith(".")) {
      continue;
    }

    const filePath = join(leadsDir, entry);

    try {
      const content = await readFile(filePath, "utf-8");
      const parsed: unknown = JSON.parse(content);
      const leads: BusinessLead[] = Array.isArray(parsed)
        ? (parsed as BusinessLead[])
        : [parsed as BusinessLead];

      const index = leads.findIndex((lead) => lead.id === leadId);

      if (index !== -1) {
        return { filePath, leads, index };
      }
    } catch {
      // Skip files that can't be parsed
      continue;
    }
  }

  return null;
}

/**
 * Updates the status of a lead in the leads directory.
 *
 * Scans all JSON files in leadsDir, finds the lead by ID,
 * updates its status and updatedAt timestamp, and writes back to disk.
 *
 * @param leadId - The lead's unique ID
 * @param newStatus - The new pipeline status
 * @param leadsDir - Path to the leads directory (e.g., data/leads)
 * @returns The updated lead, or null if the lead was not found
 */
export async function updateLeadStatus(
  leadId: string,
  newStatus: LeadStatus,
  leadsDir: string,
): Promise<BusinessLead | null> {
  const result = await findLeadFile(leadId, leadsDir);

  if (!result) {
    return null;
  }

  const { filePath, leads, index } = result;

  leads[index] = {
    ...leads[index],
    status: newStatus,
    updatedAt: new Date().toISOString(),
  };

  await writeFile(filePath, JSON.stringify(leads, null, 2) + "\n", "utf-8");

  return leads[index];
}

/**
 * Marks a lead as purchased and stores payment metadata.
 *
 * This is a convenience wrapper around updateLeadStatus that also
 * attaches payment information to the lead record.
 *
 * @param leadId - The lead's unique ID
 * @param leadsDir - Path to the leads directory
 * @param paymentInfo - Stripe payment details
 * @returns The updated lead, or null if the lead was not found
 */
export async function markAsPurchased(
  leadId: string,
  leadsDir: string,
  paymentInfo: PaymentInfo,
): Promise<(BusinessLead & { paymentInfo: PaymentInfo }) | null> {
  const result = await findLeadFile(leadId, leadsDir);

  if (!result) {
    return null;
  }

  const { filePath, leads, index } = result;

  const updatedLead = {
    ...leads[index],
    status: "purchased" as LeadStatus,
    updatedAt: new Date().toISOString(),
    paymentInfo,
  };

  leads[index] = updatedLead;

  await writeFile(filePath, JSON.stringify(leads, null, 2) + "\n", "utf-8");

  return updatedLead;
}
