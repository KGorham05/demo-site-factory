import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { BusinessLead } from "@demo-site-factory/types";

/**
 * Generates a lead filename from city, state, and industry.
 * E.g. "Denver", "CO", "plumber" -> "denver-co-plumber.json"
 */
export function buildFilename(city: string, state: string, industry: string): string {
  const slug = [city, state, industry]
    .map((s) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    )
    .join("-");

  return `${slug}.json`;
}

/**
 * Saves an array of leads to a JSON file in the output directory.
 * If the file already exists, new leads are merged and deduplicated by placeId.
 */
export async function saveLeads(
  leads: BusinessLead[],
  outputDir: string,
  city: string,
  state: string,
  industry: string,
): Promise<{ filename: string; total: number; added: number }> {
  await mkdir(outputDir, { recursive: true });

  const filename = buildFilename(city, state, industry);
  const filePath = join(outputDir, filename);

  const existing = await readLeadsFile(filePath);
  const merged = deduplicateLeads(existing, leads);
  const added = merged.length - existing.length;

  const json = JSON.stringify(merged, null, 2);
  await writeFile(filePath, json + "\n", "utf-8");

  return { filename, total: merged.length, added };
}

/**
 * Reads leads from a JSON file. Returns an empty array if the file
 * does not exist or cannot be parsed.
 */
export async function readLeadsFile(filePath: string): Promise<BusinessLead[]> {
  try {
    const content = await readFile(filePath, "utf-8");
    const parsed: unknown = JSON.parse(content);

    if (Array.isArray(parsed)) {
      return parsed as BusinessLead[];
    }

    // Single lead object (like example-lead.json)
    if (parsed && typeof parsed === "object") {
      return [parsed as BusinessLead];
    }

    return [];
  } catch {
    return [];
  }
}

/**
 * Merges two arrays of leads, deduplicating by placeId.
 * When a placeId collision occurs, the existing lead is kept (preserving its status).
 * Leads without a placeId are deduplicated by their id field.
 */
export function deduplicateLeads(
  existing: BusinessLead[],
  incoming: BusinessLead[],
): BusinessLead[] {
  const seen = new Map<string, BusinessLead>();

  for (const lead of existing) {
    const key = lead.placeId ?? lead.id;
    seen.set(key, lead);
  }

  for (const lead of incoming) {
    const key = lead.placeId ?? lead.id;

    if (!seen.has(key)) {
      seen.set(key, lead);
    }
  }

  return Array.from(seen.values());
}

/**
 * Lists all lead JSON files in the given directory and returns summary info.
 */
export async function listLeadFiles(
  outputDir: string,
): Promise<Array<{ filename: string; count: number; filePath: string }>> {
  let entries: string[];

  try {
    entries = await readdir(outputDir);
  } catch {
    return [];
  }

  const results: Array<{ filename: string; count: number; filePath: string }> = [];

  for (const entry of entries) {
    if (!entry.endsWith(".json") || entry.startsWith(".")) {
      continue;
    }

    const filePath = join(outputDir, entry);
    const leads = await readLeadsFile(filePath);

    results.push({
      filename: entry,
      count: leads.length,
      filePath,
    });
  }

  return results;
}
