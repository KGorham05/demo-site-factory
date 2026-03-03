import { Command } from "commander";

const program = new Command();

program
  .name("lead-finder")
  .description("Find local businesses without websites using Google Places API")
  .version("0.1.0");

program
  .command("search")
  .description("Search for businesses in a target area")
  .requiredOption("-l, --location <city,state>", "Target location (e.g., 'Denver,CO')")
  .requiredOption(
    "-i, --industry <type>",
    "Industry type (e.g., 'plumber', 'electrician', 'hvac', 'landscaping', 'cleaning')",
  )
  .option("-r, --radius <meters>", "Search radius in meters", "16000")
  .option("-o, --output <path>", "Output file path", "../../data/leads")
  .action(async (options) => {
    console.log(`Searching for ${options.industry} businesses in ${options.location}...`);
    console.log("TODO: Implement Google Places API integration");
    console.log("Options:", options);
  });

program.parse();
