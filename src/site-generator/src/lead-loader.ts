/**
 * Load and validate business lead data from JSON files.
 */

import path from "node:path";

import fs from "fs-extra";
import { z } from "zod";

import type { BusinessLead, Industry } from "@demo-site-factory/types";

/** Zod schema for validating a BusinessLead JSON file */
const DayHoursSchema = z
  .object({
    open: z.string(),
    close: z.string(),
  })
  .nullable()
  .optional();

const BusinessHoursSchema = z.object({
  monday: DayHoursSchema,
  tuesday: DayHoursSchema,
  wednesday: DayHoursSchema,
  thursday: DayHoursSchema,
  friday: DayHoursSchema,
  saturday: DayHoursSchema,
  sunday: DayHoursSchema,
});

const IndustrySchema = z.enum([
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
]) satisfies z.ZodType<Industry>;

const BusinessLeadSchema = z.object({
  id: z.string(),
  placeId: z.string().optional(),
  name: z.string(),
  phone: z.string().optional(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  industry: IndustrySchema,
  services: z.array(z.string()),
  hours: BusinessHoursSchema.optional(),
  rating: z.number().optional(),
  reviewCount: z.number().optional(),
  status: z.enum(["lead", "demo_generated", "demo_sent", "purchased", "deployed"]),
  demoUrl: z.string().optional(),
  customDomain: z.string().optional(),
  foundAt: z.string(),
  updatedAt: z.string(),
}) satisfies z.ZodType<BusinessLead>;

export { BusinessLeadSchema };

/**
 * Load a lead from a JSON file path.
 * If the file contains an array of leads, returns the first one.
 * Use loadLeadFromFileById to pick a specific lead from an array.
 * Throws if the file does not exist or fails validation.
 */
export async function loadLeadFromFile(filePath: string, leadId?: string): Promise<BusinessLead> {
  const absolutePath = path.resolve(filePath);

  if (!(await fs.pathExists(absolutePath))) {
    throw new Error(`Lead file not found: ${absolutePath}`);
  }

  const raw = await fs.readJson(absolutePath);

  // Handle arrays of leads
  if (Array.isArray(raw)) {
    const target = leadId ? raw.find((r) => r.id === leadId) : raw[0];

    if (!target) {
      throw new Error(
        leadId
          ? `No lead with ID "${leadId}" found in ${absolutePath}`
          : `No leads found in ${absolutePath}`,
      );
    }

    const result = BusinessLeadSchema.safeParse(target);
    if (!result.success) {
      const issues = result.error.issues
        .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
        .join("\n");
      throw new Error(`Invalid lead data in ${absolutePath}:\n${issues}`);
    }
    return result.data;
  }

  const result = BusinessLeadSchema.safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid lead data in ${absolutePath}:\n${issues}`);
  }

  return result.data;
}

/**
 * Search for a lead by ID in the data/leads/ directory.
 * Scans all JSON files and returns the first match.
 */
export async function loadLeadById(leadId: string, leadsDir: string): Promise<BusinessLead> {
  const absoluteDir = path.resolve(leadsDir);

  if (!(await fs.pathExists(absoluteDir))) {
    throw new Error(`Leads directory not found: ${absoluteDir}`);
  }

  const files = await fs.readdir(absoluteDir);
  const jsonFiles = files.filter((f) => f.endsWith(".json"));

  for (const file of jsonFiles) {
    const filePath = path.join(absoluteDir, file);
    try {
      const raw = await fs.readJson(filePath);
      const entries = Array.isArray(raw) ? raw : [raw];

      for (const entry of entries) {
        if (entry.id === leadId) {
          const result = BusinessLeadSchema.safeParse(entry);
          if (result.success) {
            return result.data;
          }
        }
      }
    } catch {
      // Skip files that cannot be parsed
      continue;
    }
  }

  throw new Error(`No lead found with ID "${leadId}" in ${absoluteDir}`);
}

/**
 * Load a lead either from a file path or by searching for an ID.
 * If the input looks like a file path (contains / or . or \), load from file.
 * Otherwise, treat it as a lead ID and search in the leads directory.
 */
export async function loadLead(input: string, leadsDir: string): Promise<BusinessLead> {
  const isFilePath = input.includes("/") || input.includes("\\") || input.endsWith(".json");

  if (isFilePath) {
    return loadLeadFromFile(input);
  }

  return loadLeadById(input, leadsDir);
}
