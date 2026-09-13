import { defineConfig } from "@playwright/test";

/**
 * Thin e2e stub for Block 2 (per this build's scope): one smoke test proving the app boots
 * and `/api/healthz` returns 200. The full intake -> diagnosis -> plan -> stakeholder-map
 * journey e2e test is explicitly Block 3's job, once all three worktrees are integrated.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  webServer: {
    command: "npm run dev -- --port 3100",
    url: "http://localhost:3100/api/healthz",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  use: {
    baseURL: "http://localhost:3100",
  },
});
