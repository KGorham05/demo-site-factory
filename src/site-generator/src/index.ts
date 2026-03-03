/**
 * Site Generator CLI
 *
 * Commands:
 *   generate  - Generate a demo site from a template and business lead data
 *   build     - Run `astro build` in a generated site directory
 *   preview   - Run `astro preview` in a generated site directory
 */

import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Command } from "commander";
import fs from "fs-extra";

import { hydrate } from "./hydrator.js";
import { loadLead } from "./lead-loader.js";
import { slugify } from "./slug.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Resolve a path relative to the monorepo root (two levels up from src/) */
function repoRoot(): string {
  return path.resolve(__dirname, "..", "..", "..");
}

const program = new Command();

program
  .name("site-generator")
  .description("Generate demo sites from templates and business data")
  .version("0.1.0");

program
  .command("generate")
  .description("Generate a demo site for a business")
  .requiredOption("-b, --business <path>", "Path to business JSON file or lead ID")
  .option("-t, --template <name>", "Template to use", "home-services")
  .option("-o, --output <path>", "Output directory", path.join(repoRoot(), "generated"))
  .action(async (options: { business: string; template: string; output: string }) => {
    try {
      const leadsDir = path.join(repoRoot(), "data", "leads");
      const lead = await loadLead(options.business, leadsDir);
      const slug = slugify(lead.name);

      const templateDir = path.join(repoRoot(), "templates", options.template);
      const outputDir = path.join(options.output, slug);

      if (!(await fs.pathExists(templateDir))) {
        console.error(`Template not found: ${templateDir}`);
        process.exit(1);
      }

      console.log(`Generating site for: ${lead.name}`);
      console.log(`  Template: ${options.template}`);
      console.log(`  Output:   ${outputDir}`);

      const result = await hydrate({
        lead,
        templateDir,
        outputDir,
      });

      console.log(`\nSite generated successfully!`);
      console.log(`  Directory:       ${result.outputDir}`);
      console.log(`  Files processed: ${result.filesProcessed}`);
      console.log(`  Files copied:    ${result.filesCopied}`);
      console.log(`  Slug:            ${result.slug}`);
      console.log(`\nNext steps:`);
      console.log(`  1. cd ${result.outputDir}`);
      console.log(`  2. pnpm install`);
      console.log(`  3. pnpm dev`);
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

program
  .command("build")
  .description("Run astro build in a generated site directory")
  .requiredOption("-s, --site <path>", "Path to generated site directory")
  .action(async (options: { site: string }) => {
    try {
      const sitePath = path.resolve(options.site);

      if (!(await fs.pathExists(sitePath))) {
        console.error(`Site directory not found: ${sitePath}`);
        process.exit(1);
      }

      const packageJsonPath = path.join(sitePath, "package.json");
      if (!(await fs.pathExists(packageJsonPath))) {
        console.error(`No package.json found in ${sitePath}. Is this a valid site directory?`);
        process.exit(1);
      }

      console.log(`Building site at: ${sitePath}`);
      execSync("npx astro build", {
        cwd: sitePath,
        stdio: "inherit",
      });

      console.log("\nBuild complete!");
    } catch (error) {
      if (error instanceof Error && "status" in error) {
        process.exit((error as NodeJS.ErrnoException & { status: number }).status ?? 1);
      }
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

program
  .command("preview")
  .description("Run astro preview in a generated site directory")
  .requiredOption("-s, --site <path>", "Path to generated site directory")
  .action(async (options: { site: string }) => {
    try {
      const sitePath = path.resolve(options.site);

      if (!(await fs.pathExists(sitePath))) {
        console.error(`Site directory not found: ${sitePath}`);
        process.exit(1);
      }

      const packageJsonPath = path.join(sitePath, "package.json");
      if (!(await fs.pathExists(packageJsonPath))) {
        console.error(`No package.json found in ${sitePath}. Is this a valid site directory?`);
        process.exit(1);
      }

      console.log(`Previewing site at: ${sitePath}`);
      execSync("npx astro preview", {
        cwd: sitePath,
        stdio: "inherit",
      });
    } catch (error) {
      if (error instanceof Error && "status" in error) {
        process.exit((error as NodeJS.ErrnoException & { status: number }).status ?? 1);
      }
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

program.parse();
