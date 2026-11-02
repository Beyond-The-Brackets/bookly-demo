import path from "node:path";
import { defineConfig } from "vitest/config";

// Tests that reproduce a known problem. They fail until it is fixed.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/repro/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
