import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Application Health Check', () => {
  test('application starts and loads homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Freelaw/);
    
    // Check for critical UI elements
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('API health endpoint responds', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBeLessThan(500);
    
    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(['healthy', 'ok', 'degraded']).toContain(data.status);
  });

  test('login page is accessible', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
  });

  test('no console errors on homepage', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known Sentry warnings
    const criticalErrors = errors.filter(error => 
      !error.includes('Sentry') && 
      !error.includes('Transport disabled')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});

