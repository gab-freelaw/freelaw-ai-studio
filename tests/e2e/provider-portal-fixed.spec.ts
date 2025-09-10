import { test, expect } from '@playwright/test';

test.describe('Application Form Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/portal-prestador/aplicacao');
    await expect(page.getByText('Aplicação FreeLaw')).toBeVisible();
  });

  test('validates required fields in step 1', async ({ page }) => {
    // Try to proceed without filling required fields
    await page.getByRole('button', { name: /Próximo/i }).click();
    
    // Should show validation errors and stay on step 1
    await expect(page.getByText('Informações Pessoais')).toBeVisible();
  });

  test('navigates through all steps', async ({ page }) => {
    // Step 1 - Personal Info
    await page.getByLabel('Nome Completo *').fill('João Silva');
    await page.getByLabel('E-mail *').fill('joao@test.com');
    await page.getByLabel('Telefone *').fill('11987654321');
    await page.getByLabel('Número OAB *').fill('123456');
    
    // Select OAB state
    await page.locator('[data-testid="oab-state-select"]').click();
    await page.getByRole('option', { name: 'SP' }).click();
    
    await page.getByLabel('Cidade *').fill('São Paulo');
    
    // Select state
    await page.locator('[data-testid="state-select"]').click();
    await page.getByRole('option', { name: 'São Paulo' }).click();
    
    await page.getByRole('button', { name: /Próximo/i }).click();
    
    // Step 2 - Professional Experience
    await expect(page.getByText('Experiência Profissional').first()).toBeVisible();
    
    // Select years of experience
    await page.locator('[data-testid="experience-select"]').click();
    await page.getByRole('option', { name: '3 a 5 anos' }).click();
    
    await page.getByLabel('Advogado autônomo').check();
    await page.getByLabel('Direito Civil').check();
    await page.getByLabel('Direito Trabalhista').check();
    await page.getByRole('button', { name: /Próximo/i }).click();

    // Step 3 - Availability & Expectations
    await expect(page.getByText('Disponibilidade e Expectativas')).toBeVisible();
    
    // Fill all required fields
    await page.locator('select').filter({ hasText: 'Selecione' }).first().selectOption('20-30');
    await page.getByLabel('Tribunal de Justiça').check();
    await page.locator('select').filter({ hasText: 'Selecione' }).nth(1).selectOption('2000-4000');
    await page.locator('select').filter({ hasText: 'Selecione' }).nth(2).selectOption('immediately');
    await page.getByRole('button', { name: /Próximo/i }).click();

    // Step 4 - Motivation
    await expect(page.getByText('Motivação e Comprometimento')).toBeVisible();
    await page.getByLabel('Por que você quer se juntar à FreeLaw? *').fill('Quero crescer profissionalmente');
    await page.getByLabel('O que mais te empolga nesta oportunidade?').fill('Usar tecnologia na advocacia');
    await page.getByLabel('Quais são seus planos de crescimento profissional?').fill('Me especializar em direito digital');
    await page.getByLabel('Aceito os termos e condições').check();
    
    // Submit form
    await page.getByRole('button', { name: /Enviar Aplicação/i }).click();

    // Should redirect to success page or show success message
    await expect(page.url()).toContain('/sucesso');
  });

  test('can navigate back to previous steps', async ({ page }) => {
    // Fill step 1
    await page.getByLabel('Nome Completo *').fill('Maria Santos');
    await page.getByLabel('E-mail *').fill('maria@test.com');
    await page.getByLabel('Telefone *').fill('11987654321');
    await page.getByLabel('Número OAB *').fill('654321');
    
    await page.locator('[data-testid="oab-state-select"]').click();
    await page.getByRole('option', { name: 'RJ' }).click();
    
    await page.getByLabel('Cidade *').fill('Rio de Janeiro');
    
    await page.locator('[data-testid="state-select"]').click();
    await page.getByRole('option', { name: 'Rio de Janeiro' }).click();
    
    await page.getByRole('button', { name: /Próximo/i }).click();

    // Navigate to step 2
    await expect(page.getByText('Experiência Profissional').first()).toBeVisible();
    
    // Go back to step 1
    await page.getByRole('button', { name: /Anterior/i }).click();
    
    // Should be back on step 1 with data preserved
    await expect(page.getByText('Informações Pessoais')).toBeVisible();
    await expect(page.getByLabel('Nome Completo *')).toHaveValue('Maria Santos');
  });

  test('validates email format', async ({ page }) => {
    await page.getByLabel('E-mail *').fill('invalid-email');
    await page.getByLabel('Nome Completo *').click(); // Trigger validation
    
    // Should show email validation error
    await expect(page.getByText('E-mail inválido')).toBeVisible();
  });

  test('validates OAB number format', async ({ page }) => {
    await page.getByLabel('Número OAB *').fill('123');
    await page.getByLabel('Nome Completo *').click();
    
    // Should show OAB validation error
    await expect(page.locator('text=OAB deve ter pelo menos 4 dígitos')).toBeVisible();
  });

  test('saves form data locally on navigation', async ({ page }) => {
    // Fill some data
    await page.getByLabel('Nome Completo *').fill('Test User');
    await page.getByLabel('E-mail *').fill('test@test.com');
    
    // Refresh page
    await page.reload();
    
    // Data should be preserved
    await expect(page.getByLabel('Nome Completo *')).toHaveValue('Test User');
    await expect(page.getByLabel('E-mail *')).toHaveValue('test@test.com');
  });

  test('shows progress indicator', async ({ page }) => {
    // Should show progress bar
    await expect(page.locator('[role="progressbar"]')).toBeVisible();
    
    // Should show step 1 of 4
    await expect(page.getByText('1 de 4')).toBeVisible();
  });

  test('handles API errors gracefully', async ({ page }) => {
    // Fill complete form
    await page.getByLabel('Nome Completo *').fill('Error Test');
    await page.getByLabel('E-mail *').fill('existing@test.com'); // Email that might already exist
    await page.getByLabel('Telefone *').fill('11987654321');
    await page.getByLabel('Número OAB *').fill('999999');
    
    await page.locator('[data-testid="oab-state-select"]').click();
    await page.getByRole('option', { name: 'SP' }).click();
    
    await page.getByLabel('Cidade *').fill('São Paulo');
    
    await page.locator('[data-testid="state-select"]').click();
    await page.getByRole('option', { name: 'São Paulo' }).click();
    
    await page.getByRole('button', { name: /Próximo/i }).click();
    
    // Continue through all steps quickly for error testing
    await page.locator('[data-testid="experience-select"]').click();
    await page.getByRole('option', { name: '1 a 3 anos' }).click();
    
    await page.getByLabel('Advogado autônomo').check();
    await page.getByLabel('Direito Civil').check();
    await page.getByRole('button', { name: /Próximo/i }).click();
    
    // Step 3
    await page.locator('select').filter({ hasText: 'Selecione' }).first().selectOption('10-20');
    await page.getByLabel('Tribunal de Justiça').check();
    await page.locator('select').filter({ hasText: 'Selecione' }).nth(1).selectOption('1000-2000');
    await page.locator('select').filter({ hasText: 'Selecione' }).nth(2).selectOption('1week');
    await page.getByRole('button', { name: /Próximo/i }).click();
    
    // Step 4
    await page.getByLabel('Por que você quer se juntar à FreeLaw? *').fill('Testing error handling');
    await page.getByLabel('Aceito os termos e condições').check();
    
    // Mock API error response
    await page.route('/api/providers/register', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'E-mail já cadastrado' })
      });
    });
    
    await page.getByRole('button', { name: /Enviar Aplicação/i }).click();
    
    // Should show error message
    await expect(page.getByText('E-mail já cadastrado')).toBeVisible();
  });
});
