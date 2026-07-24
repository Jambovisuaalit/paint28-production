import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run build -- --mode vercel && npm run preview -- --host 127.0.0.1 --port 4173",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          ...process.env,
          VITE_SUPABASE_URL:
            process.env.VITE_SUPABASE_URL ?? "https://example.supabase.co",
          VITE_SUPABASE_PUBLISHABLE_KEY:
            process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
            "sb_publishable_playwright_placeholder",
          VITE_EDGE_FUNCTION_NAME:
            process.env.VITE_EDGE_FUNCTION_NAME ?? "submit-quote",
          VITE_PREVIEW_ADMIN_EMAIL:
            process.env.VITE_PREVIEW_ADMIN_EMAIL ?? "ville@vidosocial.com",
        },
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
