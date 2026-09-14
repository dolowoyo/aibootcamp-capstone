import path from "node:path";
import { defineConfig } from "vitest/config";

// Test files live at the repo root's `lib/` directory (see docs/tasks/TASKS-00N-*.md's
// literal test paths, which scripts/check-traceability.ts resolves relative to the repo
// root, not to app/). This config's `root` stays at app/ (matching where `npm test
// --workspace app` invokes vitest), while `include` reaches up to the repo-root lib/ tree
// where the actual spec files and the domain modules they test are co-located.
export default defineConfig({
  test: {
    environment: "node",
    include: ["../lib/**/*.spec.ts", "**/*.spec.ts"],
    exclude: ["node_modules", ".next", "../node_modules", "e2e/**"],
    globals: false,
  },
  resolve: {
    alias: {
      "@lib": path.resolve(__dirname, "../lib"),
      "@": path.resolve(__dirname, "."),
    },
  },
});
