// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    server: { deps: { inline: ["convex", "convex-test"] } },
    coverage: {
      provider: "v8",
      include: ["convex/**/*.ts", "src/lib/**/*.ts"],
      exclude: [
        "convex/_generated/**",
        "convex/globals.d.ts",
        "**/*.d.ts",
        "**/*.test.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
