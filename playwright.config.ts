import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'e2e', testMatch: /.*\.spec\.ts/, fullyParallel: true, workers: 2, timeout: 90_000,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:3100', trace: 'off', viewport: { width: 1440, height: 900 }, acceptDownloads: true,
    launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] } },
  webServer: { command: 'npm run start', url: 'http://localhost:3100', reuseExistingServer: true, timeout: 60_000 },
});
