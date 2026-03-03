/**
 * Core template hydration logic.
 * Copies an Astro template to an output directory and replaces
 * all {{placeholder}} tokens with real business data.
 */

import path from "node:path";

import fs from "fs-extra";

import type { BusinessLead } from "@demo-site-factory/types";

import { formatIndustryName, generateTagline, getIndustryDefaults } from "./industry-defaults.js";
import { slugify } from "./slug.js";

/** File extensions that should be scanned for placeholder replacement */
const REPLACEABLE_EXTENSIONS = new Set([
  ".astro",
  ".yaml",
  ".yml",
  ".json",
  ".mjs",
  ".cjs",
  ".js",
  ".ts",
  ".tsx",
  ".jsx",
  ".md",
  ".mdx",
  ".html",
  ".css",
  ".svg",
  ".txt",
  ".xml",
]);

/** Directories to skip during file scanning */
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", ".astro"]);

/**
 * Build the full placeholder -> value mapping for a given business lead.
 */
export function buildPlaceholderMap(lead: BusinessLead): Record<string, string> {
  const defaults = getIndustryDefaults(lead.industry);
  const emailSlug = slugify(lead.name);

  const yearsInBusiness = "10";
  const industryName = formatIndustryName(lead.industry);

  // Build hero subtitle from industry defaults template
  const heroSubtitle = defaults.heroSubtitle
    .replace("{City}", lead.city)
    .replace("{Years}", yearsInBusiness)
    .replace("{ServicePhrase}", defaults.servicePhrase);

  const map: Record<string, string> = {
    business_name: lead.name,
    phone: lead.phone ?? "",
    email: `${emailSlug}@example.com`,
    address: lead.address,
    city: lead.city,
    state: lead.state,
    zip: lead.zip,
    industry: industryName,
    industry_lower: lead.industry.replace("-", " "),
    tagline: generateTagline(lead.industry, lead.city),
    hero_subtitle: heroSubtitle,
    years_in_business: yearsInBusiness,
    stats_years: `${yearsInBusiness}+`,
    stats_jobs: "1K+",
    rating: String(lead.rating ?? 4.8),
    review_count: String(lead.reviewCount ?? 50),
  };

  // Service placeholders: service_1_name, service_1_description, etc.
  for (let i = 0; i < 6; i++) {
    const num = i + 1;
    const serviceName = lead.services[i] ?? defaults.services[i]?.name ?? `Service ${num}`;
    const serviceDesc =
      defaults.services[i]?.description ??
      `Professional ${serviceName.toLowerCase()} services for your home.`;

    // If the lead has a custom service name that matches a default, use the default description.
    // If it does not match, generate a generic description.
    let description = serviceDesc;
    if (lead.services[i] && lead.services[i] !== defaults.services[i]?.name) {
      // Custom service name from lead - try to find a matching default, else generate
      const matchingDefault = defaults.services.find(
        (s) => s.name.toLowerCase() === lead.services[i].toLowerCase(),
      );
      description =
        matchingDefault?.description ??
        `Professional ${lead.services[i].toLowerCase()} services you can count on. Our experienced team delivers quality results every time.`;
    }

    map[`service_${num}_name`] = serviceName;
    map[`service_${num}_description`] = description;
  }

  // Testimonial placeholders
  for (let i = 0; i < 3; i++) {
    const num = i + 1;
    const testimonial = defaults.testimonials[i];
    map[`testimonial_${num}_author`] = testimonial?.author ?? `Customer ${num}`;
    map[`testimonial_${num}_text`] =
      testimonial?.text ?? `Great service! We highly recommend ${lead.name}.`;
  }

  return map;
}

/**
 * Replace all {{placeholder}} tokens in a string with values from the map.
 * Unrecognized placeholders are left as-is.
 */
export function replacePlaceholders(
  content: string,
  placeholderMap: Record<string, string>,
): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    if (key in placeholderMap) {
      return placeholderMap[key];
    }
    // Leave unrecognized placeholders as-is
    return `{{${key}}}`;
  });
}

/**
 * Recursively collect all file paths in a directory, skipping excluded directories.
 */
async function collectFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        const nested = await collectFiles(fullPath);
        files.push(...nested);
      }
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Check if a file should have placeholder replacement applied.
 */
function isReplaceableFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return REPLACEABLE_EXTENSIONS.has(ext);
}

export interface HydrateOptions {
  /** The business lead data */
  lead: BusinessLead;
  /** Path to the template directory to copy from */
  templateDir: string;
  /** Path to the output directory */
  outputDir: string;
}

export interface HydrateResult {
  /** Path to the generated site directory */
  outputDir: string;
  /** Number of files processed (placeholder replacement applied) */
  filesProcessed: number;
  /** Number of files copied without modification */
  filesCopied: number;
  /** The business slug used for the directory name */
  slug: string;
}

/**
 * Hydrate a template with business data.
 *
 * 1. Copies all files from templateDir to outputDir
 * 2. Scans all text files for {{placeholder}} tokens
 * 3. Replaces tokens with real business data
 *
 * Returns information about the hydration result.
 */
export async function hydrate(options: HydrateOptions): Promise<HydrateResult> {
  const { lead, templateDir, outputDir } = options;

  const resolvedTemplate = path.resolve(templateDir);
  const resolvedOutput = path.resolve(outputDir);

  // Verify template directory exists
  if (!(await fs.pathExists(resolvedTemplate))) {
    throw new Error(`Template directory not found: ${resolvedTemplate}`);
  }

  // Copy entire template to output
  await fs.copy(resolvedTemplate, resolvedOutput, {
    overwrite: true,
    filter: (src) => {
      // Skip node_modules when copying
      const relative = path.relative(resolvedTemplate, src);
      return !relative.startsWith("node_modules") && !relative.includes("/node_modules/");
    },
  });

  // Build placeholder map
  const placeholderMap = buildPlaceholderMap(lead);

  // Collect all files in the output directory
  const allFiles = await collectFiles(resolvedOutput);

  let filesProcessed = 0;
  let filesCopied = 0;

  for (const filePath of allFiles) {
    if (isReplaceableFile(filePath)) {
      const content = await fs.readFile(filePath, "utf-8");
      const replaced = replacePlaceholders(content, placeholderMap);

      if (replaced !== content) {
        await fs.writeFile(filePath, replaced, "utf-8");
        filesProcessed++;
      } else {
        filesCopied++;
      }
    } else {
      filesCopied++;
    }
  }

  return {
    outputDir: resolvedOutput,
    filesProcessed,
    filesCopied,
    slug: slugify(lead.name),
  };
}
