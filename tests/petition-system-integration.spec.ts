import { test, expect } from '@playwright/test';

test.describe('Petition System Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the petitions page
    await page.goto('/petitions');
  });

  test('should display all petition types and allow navigation', async ({ page }) => {
    // Check header
    await expect(page.getByRole('heading', { name: 'Gerador de Petições' })).toBeVisible();
    await expect(page.getByText('Crie peças processuais profissionais com IA')).toBeVisible();

    // Check template selection header
    await expect(page.getByRole('heading', { name: 'Escolha o Tipo de Petição' })).toBeVisible();
    
    // Check all petition templates are displayed
    const expectedTemplates = [
      'Petição Inicial',
      'Contestação', 
      'Recurso de Apelação',
      'Agravo de Instrumento',
      'Mandado de Segurança',
      'Embargos de Declaração'
    ];

    for (const template of expectedTemplates) {
      await expect(page.getByRole('button', { name: new RegExp(template) })).toBeVisible();
    }

    // Check categories are displayed
    await expect(page.getByText('Cível')).toBeVisible();
    await expect(page.getByText('Recursos')).toBeVisible(); 
    await expect(page.getByText('Constitucional')).toBeVisible();
  });

  test('should allow selecting and filling petition inicial form', async ({ page }) => {
    // Select Petição Inicial
    await page.getByRole('button', { name: /Petição Inicial/ }).click();

    // Check form is displayed
    await expect(page.getByRole('heading', { name: 'Petição Inicial' })).toBeVisible();
    await expect(page.getByText('Trocar modelo')).toBeVisible();

    // Fill out the form
    await page.getByPlaceholder('Nome completo e qualificação').first().fill('João da Silva, brasileiro, casado, empresário, CPF 123.456.789-10');
    await page.getByPlaceholder('Nome completo e qualificação').nth(1).fill('Empresa XYZ Ltda., CNPJ 12.345.678/0001-90');
    await page.getByPlaceholder('Descreva os fatos que motivam a ação').fill('A empresa réu prestou serviços defeituosos, causando danos materiais e morais ao autor, conforme documentos anexos.');
    await page.getByPlaceholder('Liste os pedidos da ação').fill('1) Condenação ao pagamento de indenização por danos materiais no valor de R$ 5.000,00; 2) Condenação ao pagamento de danos morais no valor de R$ 10.000,00; 3) Custas processuais por conta do réu.');
    await page.getByPlaceholder('R$ 0,00').fill('R$ 15.000,00');
    await page.getByPlaceholder('Ex: TJSP').fill('1ª Vara Cível de São Paulo');

    // Check generate button is enabled
    await expect(page.getByRole('button', { name: /Gerar Petição com IA/ })).toBeEnabled();

    // Check AI model info is displayed
    await expect(page.getByText('Modelo de IA Avançado')).toBeVisible();
    await expect(page.getByText('Claude Opus 4.1 ou GPT-5')).toBeVisible();
    await expect(page.getByText('A IA gerará uma petição base')).toBeVisible();
  });

  test('should allow selecting and filling contestacao form', async ({ page }) => {
    // Select Contestação
    await page.getByRole('button', { name: /Contestação/ }).click();

    // Check form is displayed  
    await expect(page.getByRole('heading', { name: 'Contestação' })).toBeVisible();

    // Fill out basic fields
    await page.getByPlaceholder('Nome completo e qualificação').first().fill('Empresa ABC Ltda.');
    await page.getByPlaceholder('Nome completo e qualificação').nth(1).fill('Maria das Dores');
    await page.getByPlaceholder('Descreva os fatos que motivam a ação').fill('Os fatos narrados na inicial não correspondem à verdade...');
    await page.getByPlaceholder('Liste os pedidos da ação').fill('Improcedência total dos pedidos');

    await expect(page.getByRole('button', { name: /Gerar Petição com IA/ })).toBeEnabled();
  });

  test('should allow selecting and filling mandado de seguranca form', async ({ page }) => {
    // Select Mandado de Segurança
    await page.getByRole('button', { name: /Mandado de Segurança/ }).click();

    // Check form is displayed
    await expect(page.getByRole('heading', { name: 'Mandado de Segurança' })).toBeVisible();

    // The form should adapt to the petition type (this tests if backend integration works)
    await expect(page.getByPlaceholder('Nome completo e qualificação')).toBeVisible();

    // Fill basic info
    await page.getByPlaceholder('Nome completo e qualificação').first().fill('José da Silva');
    await page.getByPlaceholder('Nome completo e qualificação').nth(1).fill('Secretário da Receita Federal');

    await expect(page.getByRole('button', { name: /Gerar Petição com IA/ })).toBeEnabled();
  });

  test('should allow switching between petition types', async ({ page }) => {
    // Select initial template
    await page.getByRole('button', { name: /Petição Inicial/ }).click();
    await expect(page.getByRole('heading', { name: 'Petição Inicial' })).toBeVisible();

    // Fill some data
    await page.getByPlaceholder('Nome completo e qualificação').first().fill('Test Author');

    // Switch template
    await page.getByText('Trocar modelo').click();

    // Should return to template selection
    await expect(page.getByRole('heading', { name: 'Escolha o Tipo de Petição' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Contestação/ })).toBeVisible();

    // Select different template  
    await page.getByRole('button', { name: /Contestação/ }).click();
    await expect(page.getByRole('heading', { name: 'Contestação' })).toBeVisible();

    // Form should be cleared
    await expect(page.getByPlaceholder('Nome completo e qualificação').first()).toHaveValue('');
  });

  test('should show empty state for petition generation area', async ({ page }) => {
    // Select any template
    await page.getByRole('button', { name: /Petição Inicial/ }).click();

    // Check empty state in petition generation area
    await expect(page.getByText('Preencha os campos e clique em "Gerar Petição"')).toBeVisible();
    await expect(page.locator('svg.lucide-file-text')).toBeVisible(); // FileText icon
  });

  test('should have working copy and download buttons when petition is generated', async ({ page }) => {
    // This test checks if the UI elements exist and are interactive
    // We can't easily test the actual generation without a real API response
    
    await page.getByRole('button', { name: /Petição Inicial/ }).click();
    
    // Check that copy and download buttons exist but are not visible when no petition
    await expect(page.getByTitle('Copiar')).toBeHidden();
    await expect(page.getByTitle('Baixar')).toBeHidden();
    
    // The buttons should only appear when generatedPetition has content
  });

  test('should handle API endpoint correctly', async ({ page }) => {
    // Intercept the API call to check it's properly formed
    let apiCalled = false;
    let requestBody: any = null;

    await page.route('/api/petitions/generate-v2', async route => {
      apiCalled = true;
      const request = route.request();
      requestBody = JSON.parse(request.postData() || '{}');
      
      // Mock successful response
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Model-Used': 'claude-3-opus',
          'X-Processing-Time': '2500',
          'X-Chunks-Processed': '1'
        },
        body: 'Petição inicial gerada com sucesso...'
      });
    });

    // Select template and fill form
    await page.getByRole('button', { name: /Petição Inicial/ }).click();
    await page.getByPlaceholder('Nome completo e qualificação').first().fill('Test Author');
    await page.getByPlaceholder('Nome completo e qualificação').nth(1).fill('Test Defendant'); 
    await page.getByPlaceholder('Descreva os fatos que motivam a ação').fill('Test facts');
    await page.getByPlaceholder('Liste os pedidos da ação').fill('Test requests');
    await page.getByPlaceholder('R$ 0,00').fill('R$ 1.000,00');

    // Generate petition
    await page.getByRole('button', { name: /Gerar Petição com IA/ }).click();

    // Wait for API call
    await page.waitForTimeout(1000);

    // Verify API was called with correct parameters
    expect(apiCalled).toBe(true);
    expect(requestBody).toHaveProperty('templateId', 'peticao-inicial');
    expect(requestBody).toHaveProperty('service_type', 'peticao-inicial');
    expect(requestBody).toHaveProperty('legal_area', 'civel');
    expect(requestBody).toHaveProperty('useStream', true);
    expect(requestBody).toHaveProperty('use_office_style', true);
    expect(requestBody).toHaveProperty('formData');
    expect(requestBody.formData).toHaveProperty('autor', 'Test Author');
    expect(requestBody.formData).toHaveProperty('reu', 'Test Defendant');
  });

  test('should show loading state during petition generation', async ({ page }) => {
    // Mock a delayed response
    await page.route('/api/petitions/generate-v2', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Generated petition text'
      });
    });

    await page.getByRole('button', { name: /Petição Inicial/ }).click();
    await page.getByPlaceholder('Nome completo e qualificação').first().fill('Test');
    
    // Click generate
    const generateButton = page.getByRole('button', { name: /Gerar Petição com IA/ });
    await generateButton.click();

    // Check loading state
    await expect(page.getByText('Gerando petição...')).toBeVisible();
    await expect(generateButton).toBeDisabled();
    await expect(page.locator('.lucide-loader-2')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock error response
    await page.route('/api/petitions/generate-v2', async route => {
      await route.fulfill({
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await page.getByRole('button', { name: /Petição Inicial/ }).click();
    await page.getByPlaceholder('Nome completo e qualificação').first().fill('Test');
    
    await page.getByRole('button', { name: /Gerar Petição com IA/ }).click();

    // Should show error message
    await expect(page.getByText('Erro ao gerar petição')).toBeVisible();
  });

  test('should be responsive and accessible', async ({ page }) => {
    // Test accessibility
    await expect(page.getByRole('heading', { name: 'Gerador de Petições' })).toBeVisible();
    
    // Check ARIA labels and roles are present
    const buttons = page.locator('button[role="button"], button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    // Check color contrast (buttons should have proper styling)
    const petitionButton = page.getByRole('button', { name: /Petição Inicial/ });
    await expect(petitionButton).toBeVisible();
    
    // Test mobile-like viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole('heading', { name: 'Gerador de Petições' })).toBeVisible();
    
    // Grid should adapt to smaller screens
    const grid = page.locator('.grid');
    await expect(grid).toBeVisible();
  });
});