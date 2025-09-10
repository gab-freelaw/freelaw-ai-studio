import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Global environment variables for tests */
  globalSetup: require.resolve('./tests/global-setup.ts'),
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? 'github' : [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    /* Video on failure */
    video: 'retain-on-failure',
    /* Environment variables for tests */
    extraHTTPHeaders: {
      'X-Test-Mode': 'true',
    },
  },

  /* Configure projects for major browsers */
  projects: [
    // Quick smoke tests - run first
    {
      name: 'smoke',
      testMatch: /smoke\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    
    // Critical path tests - most important features
    {
      name: 'critical',
      testMatch: /critical\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['smoke'],
    },

    // API tests - can run in parallel
    {
      name: 'api',
      testMatch: /api\//,
      use: { ...devices['Desktop Chrome'] },
      fullyParallel: true,
    },

    // E2E tests - full browser tests
    {
      name: 'e2e',
      testMatch: /e2e\//,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['critical'],
    },

    // Mobile tests - only if desktop passes
    {
      name: 'mobile',
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices['iPhone 12'] },
      dependencies: ['critical'],
    },
  ],

  /* Server already running on port 3001 */
  // webServer disabled - using existing server
});