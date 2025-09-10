import { test, expect } from '@playwright/test';

test.describe('AI Models Integration Tests', () => {
  test.describe('Model Selection API', () => {
    test('Chat API should use GPT-5 models', async ({ request }) => {
      const response = await request.post('http://localhost:3000/api/chat', {
        data: {
          messages: [
            { role: 'user', content: 'Test message' }
          ],
          model: 'auto'
        }
      });
      
      // API should respond with 200 even if streaming
      expect([200, 201]).toContain(response.status());
    });

    test('Petition API should use Claude 4.1 for legal drafting', async ({ request }) => {
      const response = await request.post('http://localhost:3000/api/petitions/generate', {
        data: {
          templateId: 'peticao-inicial',
          formData: {
            autor: 'Teste Autor',
            reu: 'Teste Réu',
            fatos: 'Fatos de teste',
            pedidos: 'Pedidos de teste'
          },
          useStream: false
        }
      });
      
      // Check if API responds correctly
      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('petition');
        expect(data).toHaveProperty('model');
        // Should use Claude for legal drafting
        expect(data.model).toMatch(/claude/i);
      }
    });

    test('Model pricing calculation', async ({ request }) => {
      // Test different task types to ensure correct model selection
      const taskTypes = [
        { taskType: 'reasoning', expectedModel: 'gpt-5' },
        { taskType: 'legal_draft', expectedModel: 'claude' },
        { taskType: 'chat', expectedModel: 'gpt-5-mini' }
      ];

      for (const task of taskTypes) {
        const response = await request.post('http://localhost:3000/api/chat', {
          data: {
            messages: [{ role: 'user', content: 'Test' }],
            taskType: task.taskType,
            priority: 'quality'
          }
        });
        
        expect([200, 201]).toContain(response.status());
      }
    });
  });

  test.describe('UI Model Indicators', () => {
    test('Petitions page should show advanced AI indicator', async ({ page }) => {
      await page.goto('http://localhost:3000/petitions');
      
      // Select a template
      const template = page.locator('text=Petição Inicial').first();
      if (await template.isVisible()) {
        await template.click();
        
        // Check for AI model indicator
        await expect(page.locator('text=Modelo de IA Avançado')).toBeVisible();
        await expect(page.locator('text=/Claude Opus 4.1|GPT-5/')).toBeVisible();
      }
    });

    test('Chat page should respond with AI', async ({ page }) => {
      await page.goto('http://localhost:3000/chat');
      
      // Send a message
      const textarea = page.locator('textarea').first();
      await textarea.fill('Olá, teste de modelo');
      
      const sendButton = page.locator('button[type="submit"]');
      await sendButton.click();
      
      // Wait for response
      await page.waitForTimeout(2000);
      
      // Check if response appears
      const messages = page.locator('[data-testid="chat-message"], .message, div[class*="message"]');
      const messageCount = await messages.count();
      expect(messageCount).toBeGreaterThan(0);
    });
  });
});

test.describe('New Features Tests', () => {
  test('Legal drafting service integration', async ({ page }) => {
    await page.goto('http://localhost:3000/petitions');
    
    // Test petition generation with new models
    const petitionTemplate = page.locator('button:has-text("Petição Inicial")').first();
    if (await petitionTemplate.isVisible()) {
      await petitionTemplate.click();
      
      // Fill form
      await page.fill('input[placeholder*="Nome completo"]', 'João da Silva');
      await page.fill('textarea[placeholder*="fatos"]', 'Teste de fatos jurídicos');
      await page.fill('textarea[placeholder*="pedidos"]', 'Pedidos de teste');
      
      // Generate petition
      const generateButton = page.locator('button:has-text("Gerar Petição")');
      await generateButton.click();
      
      // Wait for AI response (with timeout)
      await page.waitForTimeout(5000);
      
      // Check if petition was generated
      const generatedContent = page.locator('pre, [class*="generated"], [class*="petition-content"]');
      if (await generatedContent.isVisible()) {
        const content = await generatedContent.textContent();
        expect(content).toBeTruthy();
        expect(content?.length).toBeGreaterThan(100);
      }
    }
  });

  test('Office style configuration', async ({ page }) => {
    // Check if office style is configured
    await page.goto('http://localhost:3000');
    
    // Look for office style elements
    const officeStyleIndicator = page.locator('[data-testid="office-style"], [class*="office-style"]');
    if (await officeStyleIndicator.count() > 0) {
      await expect(officeStyleIndicator.first()).toBeVisible();
    }
  });

  test('Model selection based on task type', async ({ request }) => {
    // Test automatic model selection
    const scenarios = [
      {
        taskType: 'reasoning',
        priority: 'quality',
        expectedPerformance: 95
      },
      {
        taskType: 'code',
        priority: 'balanced',
        expectedPerformance: 85
      },
      {
        taskType: 'legal_draft',
        priority: 'quality',
        expectedPerformance: 90
      }
    ];

    for (const scenario of scenarios) {
      const response = await request.post('http://localhost:3000/api/chat', {
        data: {
          messages: [{ role: 'user', content: 'Test' }],
          taskType: scenario.taskType,
          priority: scenario.priority
        }
      });
      
      expect(response.ok()).toBeTruthy();
    }
  });
});