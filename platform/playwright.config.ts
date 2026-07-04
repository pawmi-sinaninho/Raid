import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_PATH ?? [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/chromium"
].find((candidate) => existsSync(candidate));

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  expect: { timeout: 30000 },
  retries: 0,
  reporter: [["list"], ["html", { outputFolder: "artifacts/playwright-report", open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: { executablePath: chromiumPath, args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-background-networking", "--disable-gpu", "--disable-software-rasterizer"] }
  },
  webServer: process.env.RAIDWEAVE_EXTERNAL_SERVER === "1" ? undefined : {
    command: "npm run start:test",
    url: "http://127.0.0.1:3100/api/health",
    reuseExistingServer: false,
    timeout: 120000
  },
  projects: [
    { name: "mobile-390", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } } },
    { name: "desktop-1440", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }
  ]
});
