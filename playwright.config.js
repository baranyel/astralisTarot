import { defineConfig } from '@playwright/test'
const baseURL = process.env.ASTRALIS_BASE_URL || 'http://127.0.0.1:4175'
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  workers: 2,
  timeout: 35000,
  use: {
    baseURL,
    headless: true,
    viewport: { width: 1440, height: 900 },
    launchOptions: {
      executablePath: process.env.CHROME_PATH || undefined,
      args: ['--enable-unsafe-swiftshader'],
    },
  },
  webServer: process.env.ASTRALIS_BASE_URL
    ? undefined
    : {
        command: 'npm run dev -- --host 127.0.0.1 --port 4175 --strictPort',
        url: baseURL,
        reuseExistingServer: true,
      },
})
