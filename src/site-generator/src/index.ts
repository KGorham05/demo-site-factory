import { Command } from "commander";

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
  .option("-o, --output <path>", "Output directory", "../../generated")
  .action(async (options) => {
    console.log(`Generating demo site using template: ${options.template}`);
    console.log("TODO: Implement template hydration");
    console.log("Options:", options);
  });

program
  .command("deploy")
  .description("Deploy a generated demo site to Vercel")
  .requiredOption("-s, --site <path>", "Path to generated site directory")
  .action(async (options) => {
    console.log(`Deploying site from: ${options.site}`);
    console.log("TODO: Implement Vercel deployment");
  });

program.parse();
