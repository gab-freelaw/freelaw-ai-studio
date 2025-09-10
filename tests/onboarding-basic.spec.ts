import { test, expect } from '@playwright/test';

test.describe('Basic Onboarding Tests', () => {
  test('should load onboarding page', async ({ page }) => {
    // Navigate to onboarding
    await page.goto('http://localhost:3000/onboarding');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for main heading
    const heading = page.locator('h1, h2').filter({ hasText: /processos|onboarding|oab/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
    
    // Check for OAB input field
    const oabInput = page.locator('input[placeholder*="número"]').first();
    await expect(oabInput).toBeVisible({ timeout: 10000 });
  });

  test('should have Office ID field', async ({ page }) => {
    await page.goto('http://localhost:3000/onboarding');
    await page.waitForLoadState('networkidle');
    
    // Look for Office ID field
    const officeIdField = page.locator('input[placeholder*="Office"]').first();
    const officeIdLabel = page.locator('label').filter({ hasText: /office.*id/i }).first();
    
    // At least one should be visible
    const hasOfficeField = await officeIdField.isVisible().catch(() => false) || 
                           await officeIdLabel.isVisible().catch(() => false);
    
    expect(hasOfficeField).toBeTruthy();
  });

  test('should enable button when form is filled', async ({ page }) => {
    await page.goto('http://localhost:3000/onboarding');
    await page.waitForLoadState('networkidle');
    
    // Find and fill OAB input
    const oabInput = page.locator('input').first();
    await oabInput.fill('123456');
    
    // Find and click UF selector
    const ufSelector = page.locator('button[role="combobox"]').first();
    await ufSelector.click();
    
    // Select an option
    const spOption = page.locator('[role="option"]').filter({ hasText: /SP|São Paulo/i }).first();
    await spOption.click();
    
    // Check if submit button is enabled
    const submitButton = page.locator('button').filter({ hasText: /buscar|processos/i }).first();
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
  });
});