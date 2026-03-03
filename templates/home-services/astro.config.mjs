import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@astrojs/tailwind";

export default defineConfig({
  integrations: [react(), tailwindcss()],
  output: "static",
});
