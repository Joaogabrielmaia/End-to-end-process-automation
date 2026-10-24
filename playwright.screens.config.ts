import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "scripts",
  testMatch: "screenshots.spec.ts",
  timeout: 120000,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3100", viewport: { width: 1280, height: 800 } },
  webServer: {
    command: "npm run start",
    url: "http://localhost:3100/api/health",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
