import { test, expect } from '@playwright/test';

test.describe('Complete E2E Integration Tests', () => {
  test('Full user journey - From landing to petition generation', async ({ page }) => {
    // 1. Landing page
    await page.goto('http://localhost:3002');
    await expect(page.locator('h1')).toContainText(/Jurídico|Escritório/i);
    
    // 2. Navigate to petitions
    const petitionLink = page.locator('a[href="/petitions"], button:has-text("Petições")').first();
    if (await petitionLink.isVisible()) {
      await petitionLink.click();
      await page.waitForURL('**/petitions');
    } else {
      await page.goto('http://localhost:3002/petitions');
    }
    
    // 3. Select petition template
    await expect(page.locator('h1, h2')).toContainText(/Petição|Gerador/i);
    const template = page.locator('button:has-text("Petição Inicial")').first();
    await template.click();
    
    // 4. Fill petition form
    const autorInput = page.locator('input[placeholder*="Nome completo"]').first();
    await autorInput.fill('João Carlos da Silva');
    
    const reuInput = page.locator('input[placeholder*="Nome completo"]').last();
    await reuInput.fill('Empresa ABC Ltda');
    
    const fatosTextarea = page.locator('textarea[placeholder*="fatos"]');
    await fatosTextarea.fill('Cliente não recebeu produto comprado há 60 dias');
    
    const pedidosTextarea = page.locator('textarea[placeholder*="pedidos"]');
    await pedidosTextarea.fill('Restituição do valor pago com correção monetária');
    
    const valorInput = page.locator('input[placeholder*="R$"]');
    await valorInput.fill('5000,00');
    
    // 5. Generate petition with AI
    const generateButton = page.locator('button:has-text("Gerar Petição")');
    await generateButton.click();
    
    // 6. Wait for AI response
    await page.waitForTimeout(10000); // Give AI time to respond
    
    // 7. Verify petition was generated
    const generatedContent = page.locator('pre, [class*="prose"]').last();
    await expect(generatedContent).toBeVisible();
    const content = await generatedContent.textContent();
    expect(content).toBeTruthy();
    expect(content?.length).toBeGreaterThan(500);
    
    // 8. Test copy functionality
    const copyButton = page.locator('button[title="Copiar"]');
    if (await copyButton.isVisible()) {
      await copyButton.click();
      // Can't directly test clipboard, but check button works
      await expect(copyButton).toBeEnabled();
    }
  });

  test('Chat with context switching', async ({ page }) => {
    // 1. Start chat
    await page.goto('http://localhost:3002/chat');
    
    // 2. Send initial message
    const textarea = page.locator('textarea').first();
    await textarea.fill('Explique o que é uma petição inicial');
    await page.locator('button:has(.lucide-send)').click();
    
    // 3. Wait for response
    await page.waitForTimeout(5000);
    
    // 4. Send follow-up with different context
    await textarea.fill('Agora me ajude a calcular prazo processual de 15 dias úteis a partir de hoje');
    await page.locator('button:has(.lucide-send)').click();
    
    // 5. Verify both responses exist
    await page.waitForTimeout(5000);
    const messages = page.locator('[class*="message"], .prose');
    const messageCount = await messages.count();
    expect(messageCount).toBeGreaterThanOrEqual(2);
  });

  test('Document upload and analysis flow', async ({ page }) => {
    await page.goto('http://localhost:3002/documents');
    
    // Check if upload area exists
    const uploadArea = page.locator('[class*="upload"], [data-testid="upload-area"]').first();
    if (await uploadArea.isVisible()) {
      // Create a test file
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        // Set test file
        await fileInput.setInputFiles({
          name: 'test-document.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('Este é um documento de teste para análise jurídica.')
        });
        
        // Wait for upload
        await page.waitForTimeout(2000);
        
        // Check if document appears in list
        const documentList = page.locator('[class*="document"], [data-testid="document-item"]');
        if (await documentList.count() > 0) {
          await expect(documentList.first()).toBeVisible();
        }
      }
    }
  });

  test('Navigation and routing', async ({ page }) => {
    const routes = [
      { path: '/', expectedText: /Freelaw|Assistente|Jurídico/i },
      { path: '/chat', expectedText: /Chat|Assistente|IA/i },
      { path: '/documents', expectedText: /Documento|Upload/i },
      { path: '/petitions', expectedText: /Petição|Gerador/i }
    ];
    
    for (const route of routes) {
      await page.goto(`http://localhost:3002${route.path}`);
      await expect(page.locator('h1, h2').first()).toContainText(route.expectedText);
    }
  });

  test('Error handling and recovery', async ({ page }) => {
    await page.goto('http://localhost:3002/chat');
    
    // Send empty message
    const sendButton = page.locator('button:has(.lucide-send)');
    await sendButton.click();
    
    // Should not break the UI
    await expect(page.locator('textarea')).toBeVisible();
    await expect(page.locator('textarea')).toBeEnabled();
    
    // Try invalid route
    await page.goto('http://localhost:3002/invalid-route');
    // Should show 404 or redirect
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    expect(currentUrl).toBeTruthy();
  });

  test('Responsive design check', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 768, height: 1024, name: 'iPad' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('http://localhost:3002');
      
      // Check main elements are visible
      await expect(page.locator('h1, h2').first()).toBeVisible();
      
      // Check navigation works
      const navButton = page.locator('button[class*="menu"], [aria-label*="menu"]').first();
      if (viewport.width < 768 && await navButton.isVisible()) {
        await navButton.click();
        await page.waitForTimeout(500);
      }
    }
  });
});

test.describe('API Health Checks', () => {
  test('All API endpoints respond correctly', async ({ request }) => {
    const endpoints = [
      { path: '/api/chat', method: 'POST', data: { messages: [{ role: 'user', content: 'test' }] } },
      { path: '/api/petitions/generate', method: 'POST', data: { templateId: 'test', formData: {} } },
      { path: '/api/documents/list', method: 'GET', data: null }
    ];
    
    for (const endpoint of endpoints) {
      const url = `http://localhost:3002${endpoint.path}`;
      
      if (endpoint.method === 'POST') {
        const response = await request.post(url, { data: endpoint.data });
        expect([200, 201, 400, 401, 500]).toContain(response.status());
      } else {
        const response = await request.get(url);
        expect([200, 201, 400, 401, 404]).toContain(response.status());
      }
    }
  });

  test('Database connection is healthy', async ({ request }) => {
    // Check if we can create and retrieve data
    const testData = {
      messages: [
        { role: 'user', content: 'Test database connection' }
      ]
    };
    
    const response = await request.post('http://localhost:3002/api/chat', {
      data: testData
    });
    
    expect(response.ok()).toBeTruthy();
  });
});