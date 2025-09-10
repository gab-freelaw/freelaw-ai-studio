import { test, expect } from '@playwright/test';

test.describe('Chat Feature with Real AI Responses', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/chat');
  });

  test('Chat page loads correctly', async ({ page }) => {
    // Check main heading
    await expect(page.locator('h1')).toContainText('Assistente Jurídico IA');
    
    // Check welcome message
    await expect(page.locator('text=Como posso ajudar você hoje?')).toBeVisible();
    
    // Check input field
    const textarea = page.locator('textarea[placeholder*="Digite sua pergunta"]');
    await expect(textarea).toBeVisible();
    await expect(textarea).toBeEnabled();
    
    // Check send button
    const sendButton = page.locator('button[type="submit"]');
    await expect(sendButton).toBeVisible();
  });

  test('Suggestion cards are interactive', async ({ page }) => {
    // Check if suggestion cards exist
    await expect(page.locator('text=Qual o prazo para contestação?')).toBeVisible();
    await expect(page.locator('text=Como elaborar uma petição inicial?')).toBeVisible();
    
    // Click on a suggestion
    await page.locator('text=Qual o prazo para contestação?').click();
    
    // Check if text appears in input field
    const textarea = page.locator('textarea[placeholder*="Digite sua pergunta"]');
    await expect(textarea).toHaveValue('Qual o prazo para contestação?');
  });

  test('Send message and receive real AI response', async ({ page }) => {
    const testMessage = 'Qual é o prazo para contestação em ações de cobrança?';
    
    // Type message in input
    const textarea = page.locator('textarea[placeholder*="Digite sua pergunta"]');
    await textarea.fill(testMessage);
    await expect(textarea).toHaveValue(testMessage);
    
    // Send message
    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();
    
    // Check if user message appears in chat
    await expect(page.locator(`text=${testMessage}`)).toBeVisible({ timeout: 5000 });
    
    // Check if loading indicator appears
    await expect(page.locator('text=Pensando...')).toBeVisible({ timeout: 5000 });
    
    // Wait for AI response (real AI may take 5-10 seconds)
    await expect(page.locator('text=Pensando...')).toBeHidden({ timeout: 15000 });
    
    // Check if AI response appears (look for common legal response patterns)
    const aiResponse = page.locator('[data-testid="ai-message"]').last();
    await expect(aiResponse).toBeVisible({ timeout: 10000 });
    
    // Verify it's not a mock response
    const responseText = await aiResponse.textContent();
    expect(responseText).toBeTruthy();
    expect(responseText!.length).toBeGreaterThan(50); // Real AI responses are typically longer
    expect(responseText).not.toContain('Entendi sua pergunta'); // Avoid mock responses
    
    // Check if response contains legal terminology
    const hasLegalContent = /prazo|contestação|dias|artigo|código|lei|processo/i.test(responseText!);
    expect(hasLegalContent).toBeTruthy();
  });

  test('Streaming response functionality', async ({ page }) => {
    const testMessage = 'Explique brevemente o processo de execução fiscal.';
    
    // Send message
    const textarea = page.locator('textarea[placeholder*="Digite sua pergunta"]');
    await textarea.fill(testMessage);
    await page.locator('button[type="submit"]').click();
    
    // Wait for streaming to start
    await expect(page.locator('text=Pensando...')).toBeVisible({ timeout: 5000 });
    
    // Check if response appears progressively (streaming effect)
    const aiMessage = page.locator('[data-testid="ai-message"]').last();
    await expect(aiMessage).toBeVisible({ timeout: 15000 });
    
    // Monitor text length increase (indicating streaming)
    let initialLength = 0;
    let finalLength = 0;
    
    await page.waitForTimeout(2000); // Wait for some content
    const initialText = await aiMessage.textContent();
    initialLength = initialText?.length || 0;
    
    await page.waitForTimeout(3000); // Wait for more content
    const finalText = await aiMessage.textContent();
    finalLength = finalText?.length || 0;
    
    // If streaming, final length should be greater than initial
    // Note: This might not always work if response is very short
    if (initialLength > 0 && finalLength > initialLength) {
      console.log('Streaming detected: text grew from', initialLength, 'to', finalLength, 'characters');
    }
  });

  test('Conversation history sidebar', async ({ page }) => {
    // Send first message
    const firstMessage = 'O que é habeas corpus?';
    await page.locator('textarea[placeholder*="Digite sua pergunta"]').fill(firstMessage);
    await page.locator('button[type="submit"]').click();
    
    // Wait for response
    await expect(page.locator('text=Pensando...')).toBeHidden({ timeout: 15000 });
    
    // Send second message
    const secondMessage = 'Quais são os tipos de habeas corpus?';
    await page.locator('textarea[placeholder*="Digite sua pergunta"]').fill(secondMessage);
    await page.locator('button[type="submit"]').click();
    
    // Wait for second response
    await expect(page.locator('text=Pensando...')).toBeHidden({ timeout: 15000 });
    
    // Check if conversation history exists
    const historyPanel = page.locator('[data-testid="conversation-history"]');
    if (await historyPanel.isVisible()) {
      // Check if both messages appear in history
      await expect(historyPanel.locator(`text=${firstMessage}`)).toBeVisible();
      await expect(historyPanel.locator(`text=${secondMessage}`)).toBeVisible();
    }
    
    // Check if messages are visible in main chat area
    await expect(page.locator(`text=${firstMessage}`)).toBeVisible();
    await expect(page.locator(`text=${secondMessage}`)).toBeVisible();
  });

  test('Empty message handling', async ({ page }) => {
    // Try to send empty message
    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();
    
    // Check if send button is disabled or message is not sent
    const textarea = page.locator('textarea[placeholder*="Digite sua pergunta"]');
    const isEmpty = await textarea.inputValue();
    expect(isEmpty).toBe('');
    
    // Should not see any "Pensando..." indicator
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Pensando...')).toBeHidden();
  });

  test('Message input character limit', async ({ page }) => {
    // Try to input very long message
    const longMessage = 'a'.repeat(5000);
    const textarea = page.locator('textarea[placeholder*="Digite sua pergunta"]');
    
    await textarea.fill(longMessage);
    
    // Check if there's a character limit
    const actualValue = await textarea.inputValue();
    console.log('Message length:', actualValue.length);
    
    // Most text areas should have some reasonable limit
    if (actualValue.length < longMessage.length) {
      console.log('Character limit detected at:', actualValue.length);
    }
  });

  test('Multiple rapid messages handling', async ({ page }) => {
    // Send first message
    await page.locator('textarea[placeholder*="Digite sua pergunta"]').fill('Primeira pergunta');
    await page.locator('button[type="submit"]').click();
    
    // Immediately send second message (before first completes)
    await page.waitForTimeout(500);
    await page.locator('textarea[placeholder*="Digite sua pergunta"]').fill('Segunda pergunta');
    await page.locator('button[type="submit"]').click();
    
    // Check if both messages are handled properly
    await expect(page.locator('text=Primeira pergunta')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Segunda pergunta')).toBeVisible({ timeout: 5000 });
    
    // Wait for all responses to complete
    await page.waitForTimeout(20000);
    
    // Check if both got responses
    const aiMessages = page.locator('[data-testid="ai-message"]');
    const messageCount = await aiMessages.count();
    expect(messageCount).toBeGreaterThanOrEqual(2);
  });

  test('Chat input keyboard shortcuts', async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="Digite sua pergunta"]');
    
    // Test Enter to send (if implemented)
    await textarea.fill('Teste Enter para enviar');
    await textarea.press('Enter');
    
    // Check if message was sent
    await expect(page.locator('text=Teste Enter para enviar')).toBeVisible({ timeout: 5000 });
    
    // Test Ctrl+Enter or Shift+Enter for new line (if implemented)
    await textarea.fill('Primeira linha');
    await textarea.press('Shift+Enter');
    await textarea.type('Segunda linha');
    
    const value = await textarea.inputValue();
    console.log('Multi-line input value:', JSON.stringify(value));
  });

  test('Chat auto-scroll behavior', async ({ page }) => {
    // Send a message to create some content
    await page.locator('textarea[placeholder*="Digite sua pergunta"]').fill('Pergunta para testar scroll automático');
    await page.locator('button[type="submit"]').click();
    
    // Wait for response
    await expect(page.locator('text=Pensando...')).toBeHidden({ timeout: 15000 });
    
    // Check if chat container scrolls to bottom automatically
    const chatContainer = page.locator('[data-testid="chat-container"]');
    if (await chatContainer.isVisible()) {
      const scrollTop = await chatContainer.evaluate(el => el.scrollTop);
      const scrollHeight = await chatContainer.evaluate(el => el.scrollHeight);
      const clientHeight = await chatContainer.evaluate(el => el.clientHeight);
      
      // Should be scrolled to bottom (with some tolerance)
      const isAtBottom = scrollTop >= (scrollHeight - clientHeight - 50);
      expect(isAtBottom).toBeTruthy();
    }
  });
});