import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;

export default defineConfig({
  // testDir is tests/, so the reporter prints e2e/<file>.
  testDir: 'tests',
  testMatch: 'e2e/**/*.spec.ts',
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  use: { baseURL: `http://127.0.0.1:${String(PORT)}` },
  // Every e2e test runs at a phone and a desktop width (D10). Both are Chromium.
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `node scripts/e2e-server.mjs ${String(PORT)}`,
    url: `http://127.0.0.1:${String(PORT)}/health/live`,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
