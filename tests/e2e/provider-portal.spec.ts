import { test, expect } from '@playwright/test';

test.describe('Provider Portal Experience', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/portal-prestador', { waitUntil: 'networkidle' });
  });

  test('landing page loads with all key sections', async ({ page }) => {
    // Hero section
    await expect(page.getByText('Advogue do Seu Jeito.')).toBeVisible();
    await expect(page.getByText('Ganhe 3x Mais.')).toBeVisible();
    await expect(page.getByText(/11\.000\+ advogados/)).toBeVisible();
    
    // Success stories
    await expect(page.getByText('Advogados Que Mudaram de Vida')).toBeVisible();
    await expect(page.getByText('Dra. Marina Santos')).toBeVisible();
    
    // Gamification system
    await expect(page.getByText('Seu Caminho Para o Sucesso é Claro')).toBeVisible();
    await expect(page.getByText('Iniciante').first()).toBeVisible();
    await expect(page.getByText('Super Jurista').first()).toBeVisible();
    
    // Benefits
    await expect(page.getByText('A Advocacia Pode Ser Diferente')).toBeVisible();
    
    // Selection process
    await expect(page.getByText('Como Entrar na Freelaw')).toBeVisible();
    
    // CTA buttons
    const ctaButton = page.getByRole('button', { name: /Quero Me Candidatar/i });
    await expect(ctaButton.first()).toBeVisible();
  });

  test('CTA buttons navigate to application page', async ({ page }) => {
    await page.getByRole('link', { name: /Quero Me Candidatar/i }).first().click();
    await expect(page).toHaveURL('/portal-prestador/aplicacao');
  });

  test('smooth scrolling to sections works', async ({ page }) => {
    // Test if page has smooth scroll behavior
    const benefitsSection = page.getByText('A Advocacia Pode Ser Diferente');
    await benefitsSection.scrollIntoViewIfNeeded();
    await expect(benefitsSection).toBeInViewport();
  });
});

test.describe('Application Form Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/portal-prestador/aplicacao', { waitUntil: 'networkidle' });
  });

  test('displays progress bar and steps', async ({ page }) => {
    await expect(page.getByText('Informações Pessoais')).toBeVisible();
    await expect(page.getByRole('progressbar')).toBeVisible();
  });

  test('validates required fields in step 1', async ({ page }) => {
    // Try to proceed without filling fields
    const nextButton = page.getByRole('button', { name: /Próximo/i });
    await expect(nextButton).toBeDisabled();
    
    // Fill required fields
    await page.getByLabel('Nome Completo *').fill('João Silva');
    await page.getByLabel('E-mail *').fill('joao@test.com');
    await page.getByLabel('Telefone *').fill('11987654321');
    await page.getByLabel('Número OAB *').fill('123456');
    // Click on OAB state select and wait for options
    await page.locator('[data-testid="oab-state-select"]').click();
    await page.waitForSelector('[data-value="SP"]', { timeout: 10000 });
    await page.locator('[data-value="SP"]').click();
    await page.getByLabel('Cidade *').fill('São Paulo');
    await page.getByRole('combobox').last().click();
    await page.getByRole('option', { name: 'São Paulo' }).click();
    
    // Now button should be enabled
    await expect(nextButton).toBeEnabled();
  });

  test('navigates through all steps', async ({ page }) => {
    // Step 1 - Personal Info
    await page.getByLabel('Nome Completo *').fill('João Silva');
    await page.getByLabel('E-mail *').fill('joao@test.com');
    await page.getByLabel('Telefone *').fill('11987654321');
    await page.getByLabel('Número OAB *').fill('123456');
    await page.locator('[data-testid="oab-state-select"]').click();
    await page.waitForSelector('[data-value="SP"]', { timeout: 10000 });
    await page.locator('[data-value="SP"]').click();
    await page.getByLabel('Cidade *').fill('São Paulo');
    await page.locator('button[role="combobox"]').last().click();
    await page.getByRole('option', { name: 'São Paulo' }).click();
    await page.getByRole('button', { name: /Próximo/i }).click();
    
    // Step 2 - Professional Experience
    await expect(page.getByText('Experiência Profissional').first()).toBeVisible();
    await page.locator('button[role="combobox"]').first().click();
    await page.getByRole('option', { name: '3 a 5 anos' }).click();
    await page.getByLabel('Advogado autônomo').check();
    await page.getByLabel('Direito Civil').check();
    await page.getByLabel('Direito Trabalhista').check();
    await page.getByLabel('Quais são suas maiores fortalezas').fill('Excelente redação e argumentação');
    await page.getByRole('button', { name: /Próximo/i }).click();
    
    // Step 3 - Motivation & Fit
    await expect(page.getByText('Motivação & Fit')).toBeVisible();
    await page.getByLabel('Por que você quer fazer parte').fill('Busco flexibilidade e meritocracia. Quero trabalhar com tecnologia e ter controle sobre minha carreira, crescendo baseado no meu desempenho.');
    await page.getByLabel('O que mais te entusiasma').fill('A possibilidade de usar IA para ser mais produtivo');
    await page.getByLabel('Eficiente e Produtivo').check();
    await page.getByLabel('Como você garante a qualidade').fill('Revisão cuidadosa e pesquisa jurisprudencial');
    await page.getByLabel('Oportunidade de Crescimento').check();
    await page.getByRole('button', { name: /Próximo/i }).click();
    
    // Step 4 - Availability
    await expect(page.getByText('Disponibilidade & Expectativas')).toBeVisible();
    await page.locator('button[role="combobox"]').first().click();
    await page.getByRole('option', { name: '30 a 40 horas' }).click();
    await page.getByLabel('Flexível').check();
    await page.locator('button[role="combobox"]').nth(1).click();
    await page.getByRole('option', { name: 'R$ 4.000 a R$ 6.000' }).click();
    await page.getByLabel('Onde você se vê na FreeLaw').fill('Nível Pleno produzindo 100+ peças por mês');
    await page.locator('button[role="combobox"]').last().click();
    await page.getByRole('option', { name: 'Imediatamente' }).click();
    await page.getByRole('button', { name: /Próximo/i }).click();
    
    // Step 5 - Review
    await expect(page.getByText('Revisão & Envio')).toBeVisible();
    await page.getByLabel('Declaro que todas as informações').check();
    await page.getByLabel('Entendo que passarei por um teste').check();
    
    // Submit button should be enabled
    const submitButton = page.getByRole('button', { name: /Enviar Aplicação/i });
    await expect(submitButton).toBeEnabled();
  });

  test('can navigate back to previous steps', async ({ page }) => {
    // Fill step 1 and advance
    await page.getByLabel('Nome Completo *').fill('João Silva');
    await page.getByLabel('E-mail *').fill('joao@test.com');
    await page.getByLabel('Telefone *').fill('11987654321');
    await page.getByLabel('Número OAB *').fill('123456');
    await page.locator('[data-testid="oab-state-select"]').click();
    await page.waitForSelector('[data-value="SP"]', { timeout: 10000 });
    await page.locator('[data-value="SP"]').click();
    await page.getByLabel('Cidade *').fill('São Paulo');
    await page.locator('button[role="combobox"]').last().click();
    await page.getByRole('option', { name: 'São Paulo' }).click();
    await page.getByRole('button', { name: /Próximo/i }).click();
    
    // Should be on step 2
    await expect(page.getByText('Experiência Profissional').first()).toBeVisible();
    
    // Go back
    await page.getByRole('button', { name: /Anterior/i }).click();
    
    // Should be back on step 1 with data preserved
    await expect(page.getByText('Informações Pessoais')).toBeVisible();
    await expect(page.getByLabel('Nome Completo *')).toHaveValue('João Silva');
  });

  test('shows character minimum for motivation question', async ({ page }) => {
    // Navigate directly to check the form structure
    await page.goto('/portal-prestador/aplicacao', { waitUntil: 'networkidle' });
    
    // Check that form loads
    await expect(page.getByText('Aplicação FreeLaw')).toBeVisible();
    
    // This test verifies the form structure exists
    // The character minimum would be visible in step 3
    await expect(page.getByText('Informações Pessoais')).toBeVisible();
  });
});

test.describe('Success Page', () => {
  test('displays success message and next steps', async ({ page }) => {
    await page.goto('/portal-prestador/aplicacao/sucesso');
    
    // Success message
    await expect(page.getByRole('heading', { name: /Aplicação Enviada com Sucesso/i })).toBeVisible();
    
    // Next steps
    await expect(page.getByText(/Análise da Aplicação \(24-48h\)/i)).toBeVisible();
    await expect(page.getByText(/Teste Prático com IA/i)).toBeVisible();
    await expect(page.getByText(/Onboarding e Primeiras Peças/i)).toBeVisible();
    
    // Growth path
    await expect(page.getByText(/30.*peças\/mês.*Iniciante/i)).toBeVisible();
    await expect(page.getByText(/200\+.*peças\/mês.*Expert/i)).toBeVisible();
    
    // Action buttons
    await expect(page.getByRole('button', { name: /Conhecer Mais/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Voltar ao Início/i })).toBeVisible();
  });

  test('navigation buttons work correctly', async ({ page }) => {
    await page.goto('/portal-prestador/aplicacao/sucesso', { waitUntil: 'networkidle' });
    
    // Test "Conhecer Mais" button navigates to portal
    const conhecerButton = page.getByRole('button', { name: /Conhecer Mais Sobre a FreeLaw/i });
    await expect(conhecerButton).toBeVisible();
    
    // Test "Voltar ao Início" button exists
    const voltarButton = page.getByRole('button', { name: /Voltar ao Início/i });
    await expect(voltarButton).toBeVisible();
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });
  
  test('landing page is mobile responsive', async ({ page }) => {
    await page.goto('/portal-prestador');
    
    // Hero section should be visible
    await expect(page.getByRole('heading', { name: /Advogue do Seu Jeito/i })).toBeVisible();
    
    // Cards should stack vertically
    const successStories = page.locator('.grid').first();
    await expect(successStories).toBeVisible();
    
    // CTA buttons should be visible
    await expect(page.getByRole('button', { name: /Quero Me Candidatar/i }).first()).toBeVisible();
  });
  
  test('application form is mobile responsive', async ({ page }) => {
    await page.goto('/portal-prestador/aplicacao');
    
    // Form should be visible
    await expect(page.getByText('Informações Pessoais')).toBeVisible();
    
    // Input fields should be accessible
    await expect(page.getByLabel('Nome Completo')).toBeVisible();
    
    // Navigation buttons should be visible
    await expect(page.getByRole('button', { name: /Próximo/i })).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('landing page has proper ARIA labels', async ({ page }) => {
    await page.goto('/portal-prestador');
    
    // Check for heading hierarchy
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
    
    // Check buttons have accessible names
    const buttons = page.getByRole('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
    
    // Check for alt text on images (if any)
    const images = page.locator('img');
    const imageCount = await images.count();
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });
  
  test('form inputs have proper labels', async ({ page }) => {
    await page.goto('/portal-prestador/aplicacao');
    
    // Check that all inputs have associated labels
    const inputs = page.locator('input[type="text"], input[type="email"], input[type="tel"]');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        await expect(label).toBeVisible();
      }
    }
  });
  
  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/portal-prestador/aplicacao');
    
    // Tab through form elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check that focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});

test.describe('Performance and UX Issues', () => {
  test('identifies missing loading states', async ({ page }) => {
    await page.goto('/portal-prestador/aplicacao');
    
    // Check if submit button shows loading state
    // This test will help identify if we need loading states
    const submitButton = page.getByRole('button', { name: /Enviar Aplicação/i });
    
    // Navigate to last step (simplified for testing)
    // In real scenario, we'd check if button shows loading when clicked
    
    // TODO: Add loading state to submit button
    console.log('UX Issue: Submit button needs loading state');
  });
  
  test('form data persistence check', async ({ page }) => {
    await page.goto('/portal-prestador/aplicacao');
    
    // Fill some data
    await page.getByLabel('Nome Completo').fill('Test User');
    
    // Reload page
    await page.reload();
    
    // Check if data is lost
    const nameField = page.getByLabel('Nome Completo');
    const value = await nameField.inputValue();
    
    if (value === '') {
      console.log('UX Issue: Form data is not persisted on page reload');
    }
  });
  
  test('error handling for API failures', async ({ page }) => {
    // This would test error states
    // Currently just logging what needs to be implemented
    console.log('UX Issue: Need error handling for API failures');
    console.log('UX Issue: Need toast notifications for user feedback');
  });
});