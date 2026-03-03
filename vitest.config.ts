import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/src/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "generated/**"],
  },
});
