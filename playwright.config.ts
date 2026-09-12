import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: process.env.TEST_URL || "http://localhost:3000",
    headless: true,
    channel: "chrome",
    viewport: { width: 1440, height: 1050 },
  },
  reporter: "list",
});
