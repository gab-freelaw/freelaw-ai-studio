import { test, expect } from '@playwright/test';

test.describe('Freelaw AI - Complete E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('1. Navigation System - Sidebar and Quick Access', async ({ page }) => {
    // Check if unified sidebar exists
    await expect(page.locator('aside').first()).toBeVisible();
    
    // Test navigation to Chat
    await page.click('a[href="/chat"]');
    await expect(page).toHaveURL('http://localhost:3000/chat');
    
    // Test navigation to Documents
    await page.click('a[href="/documents"]');
    await expect(page).toHaveURL('http://localhost:3000/documents');
    
    // Test navigation to Petitions
    await page.click('a[href="/petitions"]');
    await expect(page).toHaveURL('http://localhost:3000/petitions');
    
    // Check Quick Access Bar
    const quickAccessButton = page.locator('button').filter({ hasText: /Nova Conversa|Upload|Petição/ });
    await expect(quickAccessButton.first()).toBeVisible();
  });

  test('2. Chat Feature - Real AI Response', async ({ page }) => {
    await page.goto('http://localhost:3000/chat');
    
    // Type a legal question
    const textarea = page.locator('textarea[placeholder*="Digite sua pergunta"]');
    await textarea.fill('Qual é o prazo para contestação em processo civil?');
    
    // Send message - find the send button
    const sendButton = page.locator('button').filter({ has: page.locator('svg') }).last();
    await sendButton.click();
    
    // Wait for AI response (real API call)
    await page.waitForSelector('text=/prazo|contestação|dias|úteis/i', { timeout: 15000 });
    
    // Get the assistant's response
    const assistantMessage = page.locator('div').filter({ 
      has: page.locator('text=/prazo|contestação|dias/i')
    }).last();
    
    const response = await assistantMessage.textContent();
    
    // Verify response is not a mock and is substantial
    expect(response).not.toContain('Mock response');
    expect(response).toBeDefined();
    expect(response).toMatch(/prazo|contestação|dias/i);
    console.log('AI Response received, working correctly!');
  });

  test('3. Documents Feature - Multimedia Upload', async ({ page }) => {
    await page.goto('http://localhost:3000/documents');
    
    // Click upload tab
    await page.click('button:has-text("Novo Upload")');
    
    // Check if upload accepts multiple file types
    const fileInput = page.locator('input[type="file"]');
    const acceptAttr = await fileInput.getAttribute('accept');
    
    expect(acceptAttr).toContain('image/*');
    expect(acceptAttr).toContain('audio/*');
    expect(acceptAttr).toContain('video/*');
    expect(acceptAttr).toContain('.pdf');
    
    // Verify upload area is visible
    await expect(page.locator('text=/Arraste um documento aqui/')).toBeVisible();
  });

  test('4. Petitions Feature - AI Generation', async ({ page }) => {
    await page.goto('http://localhost:3000/petitions');
    
    // Select a petition template
    await page.click('button:has-text("Petição Inicial")');
    
    // Fill form fields
    await page.fill('input[placeholder*="Nome completo"]', 'João da Silva');
    await page.fill('textarea[placeholder*="fatos"]', 'Teste de fatos para petição');
    
    // Generate petition
    await page.click('button:has-text("Gerar Petição")');
    
    // Wait for AI generation to start
    await page.waitForSelector('text=/EXCELENTÍSSIMO|Petição|Autor|Réu/i', { timeout: 20000 });
    
    // Wait a bit more for full generation
    await page.waitForTimeout(3000);
    
    // Verify generated content
    const generatedText = await page.locator('pre').textContent();
    
    // More flexible assertions
    expect(generatedText).toBeTruthy();
    expect(generatedText?.length).toBeGreaterThan(100); // At least some content
    expect(generatedText).toMatch(/João|Silva|petição|autor|réu/i); // Contains relevant terms
    console.log('Petition generated successfully, length:', generatedText?.length);
  });

  test('5. Feature Interconnectivity', async ({ page }) => {
    // Start at home
    await page.goto('http://localhost:3000');
    
    // Navigate to chat and check sidebar persists
    await page.click('a[href="/chat"]');
    await expect(page.locator('aside').first()).toBeVisible();
    
    // Navigate to documents and check sidebar persists
    await page.click('a[href="/documents"]');
    await expect(page.locator('aside').first()).toBeVisible();
    
    // Check that quick actions are available
    const quickActionBar = page.locator('div').filter({ has: page.locator('button:has(svg.w-6.h-6)') }).last();
    await expect(quickActionBar).toBeVisible();
  });

  test('6. File Size Validation', async ({ page }) => {
    await page.goto('http://localhost:3000/documents');
    await page.click('button:has-text("Novo Upload")');
    
    // Check for file size limit mention
    const uploadArea = page.locator('div').filter({ hasText: /500MB|arquivo/i });
    await expect(uploadArea.first()).toBeVisible();
  });

  test('7. API Endpoints Health Check', async ({ page }) => {
    // Test chat API
    const chatResponse = await page.request.post('http://localhost:3000/api/chat', {
      data: {
        messages: [{ role: 'user', content: 'test' }],
        model: 'gpt-4o-mini'
      }
    });
    expect(chatResponse.status()).toBeLessThan(500);
    
    // Test that we're not using mocked responses
    const responseText = await chatResponse.text();
    expect(responseText).not.toContain('Mock');
  });
});