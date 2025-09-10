import { test, expect } from '@playwright/test';

test.describe('Freelaw AI MVP Tests', () => {
  test('Homepage loads with all main features', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Check if logo is visible
    await expect(page.locator('img[alt="Freelaw AI"]').first()).toBeVisible();
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('Seu Escritório Jurídico');
    await expect(page.locator('h1')).toContainText('Potencializado por IA');
    
    // Check if all 4 feature cards are present
    await expect(page.locator('text=Assistente Jurídico IA')).toBeVisible();
    await expect(page.locator('text=Elaborar Petições')).toBeVisible();
    await expect(page.locator('text=Pesquisa Jurídica')).toBeVisible();
    await expect(page.locator('text=Análise de Documentos')).toBeVisible();
    
    // Check CTA buttons
    await expect(page.locator('text=Experimentar Chat IA')).toBeVisible();
    await expect(page.locator('text=Criar Petição').first()).toBeVisible();
  });

  test('Chat page loads and accepts input', async ({ page }) => {
    await page.goto('http://localhost:3000/chat');
    
    // Check if chat interface loads
    await expect(page.locator('text=Assistente Jurídico IA')).toBeVisible();
    await expect(page.locator('text=Como posso ajudar você hoje?')).toBeVisible();
    
    // Check suggestion cards
    await expect(page.locator('text=Qual o prazo para contestação?')).toBeVisible();
    await expect(page.locator('text=Como elaborar uma petição inicial?')).toBeVisible();
    
    // Test input field
    const textarea = page.locator('textarea[placeholder="Digite sua pergunta jurídica..."]');
    await expect(textarea).toBeVisible();
    await textarea.fill('Teste de mensagem');
    await expect(textarea).toHaveValue('Teste de mensagem');
    
    // Test send button
    const sendButton = page.locator('button:has(svg)').last();
    await expect(sendButton).toBeVisible();
    await sendButton.click();
    
    // Check if message appears
    await expect(page.locator('text=Teste de mensagem')).toBeVisible({ timeout: 5000 });
    
    // Check if AI response appears
    await expect(page.locator('text=Pensando...')).toBeVisible();
    await expect(page.locator('text=Entendi sua pergunta')).toBeVisible({ timeout: 3000 });
  });

  test('Documents page loads with upload interface', async ({ page }) => {
    await page.goto('http://localhost:3000/documents');
    
    // Check header
    await expect(page.locator('h1')).toContainText('Gerenciamento de Documentos');
    
    // Check tabs
    await expect(page.locator('text=Meus Documentos')).toBeVisible();
    await expect(page.locator('text=Novo Upload')).toBeVisible();
    
    // Click on upload tab
    await page.locator('text=Novo Upload').click();
    
    // Check upload area
    await expect(page.locator('text=Arraste um documento aqui')).toBeVisible();
    await expect(page.locator('text=ou clique para selecionar')).toBeVisible();
    
    // Check info cards
    await expect(page.locator('text=Processamento Inteligente')).toBeVisible();
    await expect(page.locator('text=Múltiplos Formatos')).toBeVisible();
    await expect(page.locator('text=Schemas Personalizados')).toBeVisible();
  });

  test('Navigation between pages works', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Navigate to Chat
    await page.locator('text=Chat IA').first().click();
    await expect(page).toHaveURL('http://localhost:3000/chat');
    await expect(page.locator('text=Assistente Jurídico IA')).toBeVisible();
    
    // Navigate back to home
    await page.locator('svg').first().click(); // Back arrow
    await expect(page).toHaveURL('http://localhost:3000/');
    
    // Navigate to Documents
    await page.locator('text=Documentos').first().click();
    await expect(page).toHaveURL('http://localhost:3000/documents');
    await expect(page.locator('text=Gerenciamento de Documentos')).toBeVisible();
  });

  test('Responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    
    // Check if page adapts to mobile
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Assistente Jurídico IA')).toBeVisible();
    
    // Test mobile navigation
    await page.goto('http://localhost:3000/chat');
    const menuButton = page.locator('button:has(svg)').first();
    await expect(menuButton).toBeVisible();
    
    // Toggle sidebar
    await menuButton.click();
    await page.waitForTimeout(500); // Wait for animation
  });

  test('Brand colors are applied correctly', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Check if purple gradient is applied
    const purpleButton = page.locator('text=Experimentar Chat IA');
    await expect(purpleButton).toHaveCSS('background-image', /gradient/);
    
    // Check feature cards have proper styling
    const featureCard = page.locator('text=Assistente Jurídico IA').locator('..');
    await expect(featureCard).toBeVisible();
  });
});

test.describe('Functionality Tests', () => {
  test('Chat suggestion cards work', async ({ page }) => {
    await page.goto('http://localhost:3000/chat');
    
    // Click on a suggestion
    await page.locator('text=Qual o prazo para contestação?').click();
    
    // Check if text appears in input
    const textarea = page.locator('textarea[placeholder="Digite sua pergunta jurídica..."]');
    await expect(textarea).toHaveValue('Qual o prazo para contestação?');
  });

  test('Document filters are interactive', async ({ page }) => {
    await page.goto('http://localhost:3000/documents');
    
    // Test search input
    const searchInput = page.locator('input[placeholder="Buscar documentos..."]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('teste');
    await expect(searchInput).toHaveValue('teste');
    
    // Test type filter
    const typeSelect = page.locator('select').first();
    await expect(typeSelect).toBeVisible();
    await typeSelect.selectOption('contract');
    
    // Test category filter
    const categorySelect = page.locator('select').nth(1);
    await expect(categorySelect).toBeVisible();
    await categorySelect.selectOption('civel');
  });
});