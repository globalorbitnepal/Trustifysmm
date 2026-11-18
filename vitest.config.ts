import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    /*
     * Test files share the JSON runtime store, so they run one file at a time. Running them in
     * parallel let one file's temporary price change leak into another file's assertions.
     */
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});