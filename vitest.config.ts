import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      exclude: [
        "node_modules/**",
        "dist/**",
        "coverage/**",
        "tests/**",
        "examples/**",
        "**/*.d.ts",
        "vitest.config.ts",
        "eslint.config.ts",
      ],
      include: ["src/**/*.ts"],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});