import { resolve } from "node:path";
import { Command } from "commander";
import { config } from "dotenv";
import type { Industry } from "@demo-site-factory/types";
import { searchPlaces, PlacesApiError } from "./google-places.js";
import { mapPlacesToLeads } from "./lead-mapper.js";
import { saveLeads, listLeadFiles } from "./storage.js";

// Load .env from project root (three levels up from src/lead-finder/src/)
config({ path: resolve(import.meta.dirname, "../../../.env") });

const VALID_INDUSTRIES: Industry[] = [
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
];

const program = new Command();

program
  .name("lead-finder")
  .description("Find local businesses without websites using Google Places API")
  .version("0.1.0");

program
  .command("search")
  .description("Search for businesses in a target area")
  .requiredOption("-l, --location <city,state>", "Target location (e.g., 'Denver,CO')")
  .requiredOption("-i, --industry <type>", `Industry type (${VALID_INDUSTRIES.join(", ")})`)
  .option("-r, --radius <meters>", "Search radius in meters", "16000")
  .option("-o, --output <path>", "Output directory path", "../../data/leads")
  .action(async (options) => {
    const { location, industry, radius, output } = options as {
      location: string;
      industry: string;
      radius: string;
      output: string;
    };

    if (!VALID_INDUSTRIES.includes(industry as Industry)) {
      process.stderr.write(
        `Error: Invalid industry "${industry}". Must be one of: ${VALID_INDUSTRIES.join(", ")}\n`,
      );
      process.exit(1);
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      process.stderr.write(
        "Error: GOOGLE_PLACES_API_KEY environment variable is not set.\n" +
          "Copy .env.example to .env and add your API key.\n",
      );
      process.exit(1);
    }

    const [city, state] = location.split(",").map((s) => s.trim());

    if (!city || !state) {
      process.stderr.write('Error: Location must be in "City,ST" format (e.g., "Denver,CO").\n');
      process.exit(1);
    }

    const textQuery = `${industry} in ${city} ${state}`;
    const outputDir = resolve(import.meta.dirname, "..", output);

    process.stdout.write(`Searching for ${industry} businesses in ${city}, ${state}...\n`);

    try {
      const places = await searchPlaces(apiKey, {
        textQuery,
        includedType: industry,
        radius: parseInt(radius, 10),
      });

      process.stdout.write(`Found ${places.length} businesses without a website.\n`);

      if (places.length === 0) {
        process.stdout.write("No leads to save. Try a different location or industry.\n");
        return;
      }

      const leads = mapPlacesToLeads(places, industry as Industry);
      const result = await saveLeads(leads, outputDir, city, state, industry);

      process.stdout.write(
        `Saved ${result.added} new leads to ${result.filename} (${result.total} total).\n`,
      );
    } catch (error) {
      if (error instanceof PlacesApiError) {
        process.stderr.write(`API Error: ${error.message}\n`);
      } else if (error instanceof Error) {
        process.stderr.write(`Error: ${error.message}\n`);
      }
      process.exit(1);
    }
  });

program
  .command("list")
  .description("List existing lead files from data/leads")
  .option("-o, --output <path>", "Output directory path", "../../data/leads")
  .action(async (options) => {
    const { output } = options as { output: string };
    const outputDir = resolve(import.meta.dirname, "..", output);

    const files = await listLeadFiles(outputDir);

    if (files.length === 0) {
      process.stdout.write("No lead files found.\n");
      return;
    }

    process.stdout.write("Lead files:\n");

    for (const file of files) {
      process.stdout.write(
        `  ${file.filename} - ${file.count} lead${file.count !== 1 ? "s" : ""}\n`,
      );
    }

    const totalLeads = files.reduce((sum, f) => sum + f.count, 0);
    process.stdout.write(
      `\nTotal: ${files.length} file${files.length !== 1 ? "s" : ""}, ${totalLeads} lead${totalLeads !== 1 ? "s" : ""}\n`,
    );
  });

program.parse();
