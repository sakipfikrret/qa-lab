import { defineConfig } from '@playwright/test';

const PORT = 3457;

export default defineConfig({
  testDir: './e2e',
  workers: 1,               // tests share one server and build on each other's state
  fullyParallel: false,
  timeout: 30_000,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}`, screenshot: 'off', trace: 'retain-on-failure' },
  webServer: {
    // Production build on purpose: it also proves the strict CSP does not break the app.
    command: `npm run build && rm -rf .e2e-data && NODE_ENV=production DATA_DIR=.e2e-data PORT=${PORT} npx tsx server.ts`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
