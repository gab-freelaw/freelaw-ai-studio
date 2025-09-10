import { test, expect } from '@playwright/test';

test.describe('Real-time Chat System - Complete Flow', () => {
  
  test.describe('Chat Interface', () => {
    test.beforeEach(async ({ page }) => {
      // Login as office user
      await page.goto('/login');
      await page.getByLabel('E-mail').fill('office@freelaw.com.br');
      await page.getByLabel('Senha').fill('office123');
      await page.getByRole('button', { name: /Entrar/i }).click();
    });

    test('should open chat from delegation', async ({ page }) => {
      await page.goto('/delegacoes');
      
      // Click on delegation with assigned provider
      await page.locator('[data-testid="delegation-matched"]').first().click();
      
      // Open chat
      await page.getByRole('button', { name: /Chat/i }).click();
      
      await expect(page.getByText('Chat com')).toBeVisible();
      await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
    });

    test('should send text message', async ({ page }) => {
      await page.goto('/delegacoes/123/chat'); // Mock delegation ID
      
      const message = 'Olá, preciso de esclarecimentos sobre o caso.';
      await page.getByPlaceholder('Digite sua mensagem...').fill(message);
      await page.getByRole('button', { name: /Enviar/i }).click();
      
      // Should show message in chat
      await expect(page.getByText(message)).toBeVisible();
      await expect(page.locator('[data-testid="message-sent"]')).toBeVisible();
    });

    test('should receive messages in real-time', async ({ page, context }) => {
      // Open two browser contexts (office and provider)
      const officePage = page;
      const providerPage = await context.newPage();
      
      // Office user
      await officePage.goto('/delegacoes/123/chat');
      
      // Provider user
      await providerPage.goto('/portal-prestador/login');
      await providerPage.getByLabel('E-mail').fill('provider@freelaw.com.br');
      await providerPage.getByLabel('Senha').fill('provider123');
      await providerPage.getByRole('button', { name: /Entrar/i }).click();
      await providerPage.goto('/portal-prestador/delegacoes/123/chat');
      
      // Provider sends message
      const message = 'Mensagem do prestador para o escritório';
      await providerPage.getByPlaceholder('Digite sua mensagem...').fill(message);
      await providerPage.getByRole('button', { name: /Enviar/i }).click();
      
      // Office should receive message in real-time
      await expect(officePage.getByText(message)).toBeVisible();
    });

    test('should show online/offline status', async ({ page }) => {
      await page.goto('/delegacoes/123/chat');
      
      // Should show connection status
      await expect(page.locator('[data-testid="connection-status"]')).toBeVisible();
      await expect(page.getByText('Online')).toBeVisible();
    });

    test('should show typing indicator', async ({ page, context }) => {
      const officePage = page;
      const providerPage = await context.newPage();
      
      // Setup both users
      await officePage.goto('/delegacoes/123/chat');
      
      await providerPage.goto('/portal-prestador/login');
      await providerPage.getByLabel('E-mail').fill('provider@freelaw.com.br');
      await providerPage.getByLabel('Senha').fill('provider123');
      await providerPage.getByRole('button', { name: /Entrar/i }).click();
      await providerPage.goto('/portal-prestador/delegacoes/123/chat');
      
      // Provider starts typing
      await providerPage.getByPlaceholder('Digite sua mensagem...').type('Digitando...');
      
      // Office should see typing indicator
      await expect(officePage.getByText('está digitando...')).toBeVisible();
    });

    test('should show message timestamps', async ({ page }) => {
      await page.goto('/delegacoes/123/chat');
      
      await page.getByPlaceholder('Digite sua mensagem...').fill('Mensagem com timestamp');
      await page.getByRole('button', { name: /Enviar/i }).click();
      
      // Should show timestamp
      await expect(page.locator('[data-testid="message-timestamp"]')).toBeVisible();
    });

    test('should mark messages as read', async ({ page }) => {
      await page.goto('/delegacoes/123/chat');
      
      // Should show read indicators
      await expect(page.locator('[data-testid="message-read"]')).toBeVisible();
    });

    test('should show unread count', async ({ page }) => {
      await page.goto('/delegacoes');
      
      // Should show unread badge
      await expect(page.locator('[data-testid="unread-count"]')).toBeVisible();
    });
  });

  test.describe('File Attachments', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('E-mail').fill('office@freelaw.com.br');
      await page.getByLabel('Senha').fill('office123');
      await page.getByRole('button', { name: /Entrar/i }).click();
      await page.goto('/delegacoes/123/chat');
    });

    test('should upload and send file', async ({ page }) => {
      // Click attach button
      await page.getByRole('button', { name: /Anexar/i }).click();
      
      // Upload file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('tests/fixtures/test-document.pdf');
      
      // Should show file preview
      await expect(page.getByText('test-document.pdf')).toBeVisible();
      
      // Send file
      await page.getByRole('button', { name: /Enviar Arquivo/i }).click();
      
      // Should show file in chat
      await expect(page.locator('[data-testid="file-message"]')).toBeVisible();
    });

    test('should preview images', async ({ page }) => {
      await page.getByRole('button', { name: /Anexar/i }).click();
      
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('tests/fixtures/test-image.jpg');
      
      // Should show image preview
      await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
    });

    test('should validate file size', async ({ page }) => {
      await page.getByRole('button', { name: /Anexar/i }).click();
      
      // Mock large file
      await page.route('/api/chat/*/upload', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Arquivo muito grande' })
        });
      });
      
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('tests/fixtures/large-file.pdf');
      
      await expect(page.getByText('Arquivo muito grande')).toBeVisible();
    });

    test('should validate file type', async ({ page }) => {
      await page.getByRole('button', { name: /Anexar/i }).click();
      
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('tests/fixtures/test-file.exe');
      
      await expect(page.getByText('Tipo de arquivo não permitido')).toBeVisible();
    });

    test('should download attached file', async ({ page }) => {
      // Assume there's a file message in chat
      await expect(page.locator('[data-testid="file-message"]')).toBeVisible();
      
      // Click download
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: /Download/i }).click();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBeTruthy();
    });
  });

  test.describe('Audio Messages', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('E-mail').fill('office@freelaw.com.br');
      await page.getByLabel('Senha').fill('office123');
      await page.getByRole('button', { name: /Entrar/i }).click();
      await page.goto('/delegacoes/123/chat');
    });

    test('should record audio message', async ({ page }) => {
      // Grant microphone permission
      await page.context().grantPermissions(['microphone']);
      
      // Click audio button
      await page.getByRole('button', { name: /Áudio/i }).click();
      
      // Should show recording interface
      await expect(page.locator('[data-testid="audio-recorder"]')).toBeVisible();
      
      // Start recording
      await page.getByRole('button', { name: /Gravar/i }).click();
      
      // Should show recording indicator
      await expect(page.getByText('Gravando...')).toBeVisible();
      
      // Stop recording
      await page.waitForTimeout(2000);
      await page.getByRole('button', { name: /Parar/i }).click();
      
      // Should show preview
      await expect(page.locator('[data-testid="audio-preview"]')).toBeVisible();
    });

    test('should send audio message', async ({ page }) => {
      await page.context().grantPermissions(['microphone']);
      
      await page.getByRole('button', { name: /Áudio/i }).click();
      await page.getByRole('button', { name: /Gravar/i }).click();
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: /Parar/i }).click();
      
      // Send audio
      await page.getByRole('button', { name: /Enviar Áudio/i }).click();
      
      // Should show audio message in chat
      await expect(page.locator('[data-testid="audio-message"]')).toBeVisible();
    });

    test('should play audio message', async ({ page }) => {
      // Assume there's an audio message in chat
      await expect(page.locator('[data-testid="audio-message"]')).toBeVisible();
      
      // Click play
      await page.getByRole('button', { name: /Play/i }).click();
      
      // Should show playing state
      await expect(page.getByRole('button', { name: /Pause/i })).toBeVisible();
    });

    test('should show audio waveform', async ({ page }) => {
      await expect(page.locator('[data-testid="audio-message"]')).toBeVisible();
      
      // Should show waveform visualization
      await expect(page.locator('[data-testid="audio-waveform"]')).toBeVisible();
    });

    test('should control playback speed', async ({ page }) => {
      await expect(page.locator('[data-testid="audio-message"]')).toBeVisible();
      
      // Should have speed controls
      await expect(page.getByRole('button', { name: /1x/i })).toBeVisible();
      
      // Change speed
      await page.getByRole('button', { name: /1x/i }).click();
      await page.getByRole('button', { name: /2x/i }).click();
      
      await expect(page.getByRole('button', { name: /2x/i })).toBeVisible();
    });
  });

  test.describe('Audio Transcription', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('E-mail').fill('office@freelaw.com.br');
      await page.getByLabel('Senha').fill('office123');
      await page.getByRole('button', { name: /Entrar/i }).click();
      await page.goto('/delegacoes/123/chat');
    });

    test('should transcribe audio automatically', async ({ page }) => {
      // Assume audio message with auto-transcription enabled
      await expect(page.locator('[data-testid="audio-message"]')).toBeVisible();
      
      // Should show transcription text
      await expect(page.locator('[data-testid="audio-transcription"]')).toBeVisible();
      await expect(page.getByText('Transcrição:')).toBeVisible();
    });

    test('should request transcription manually', async ({ page }) => {
      await expect(page.locator('[data-testid="audio-message"]')).toBeVisible();
      
      // Click transcribe button
      await page.getByRole('button', { name: /Transcrever/i }).click();
      
      // Should show loading state
      await expect(page.getByText('Transcrevendo...')).toBeVisible();
      
      // Should show transcription when complete
      await expect(page.locator('[data-testid="audio-transcription"]')).toBeVisible();
    });

    test('should show transcription confidence', async ({ page }) => {
      await expect(page.locator('[data-testid="audio-transcription"]')).toBeVisible();
      
      // Should show confidence score
      await expect(page.getByText(/\d+% confiança/)).toBeVisible();
    });

    test('should allow transcription toggle', async ({ page }) => {
      // Go to settings
      await page.getByRole('button', { name: /Configurações/i }).click();
      
      // Toggle auto-transcription
      await page.getByLabel('Transcrição automática').click();
      
      await expect(page.getByText('Configuração salva')).toBeVisible();
    });

    test('should handle transcription errors', async ({ page }) => {
      // Mock transcription error
      await page.route('/api/transcribe', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Erro na transcrição' })
        });
      });
      
      await page.getByRole('button', { name: /Transcrever/i }).click();
      
      await expect(page.getByText('Erro na transcrição')).toBeVisible();
    });
  });

  test.describe('Chat History', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('E-mail').fill('office@freelaw.com.br');
      await page.getByLabel('Senha').fill('office123');
      await page.getByRole('button', { name: /Entrar/i }).click();
      await page.goto('/delegacoes/123/chat');
    });

    test('should load chat history', async ({ page }) => {
      // Should show previous messages
      await expect(page.locator('[data-testid="message"]')).toHaveCount({ gte: 0 });
    });

    test('should scroll to load more messages', async ({ page }) => {
      // Scroll to top
      await page.locator('[data-testid="chat-messages"]').hover();
      await page.mouse.wheel(0, -1000);
      
      // Should load more messages
      await expect(page.getByText('Carregando...')).toBeVisible();
    });

    test('should search in chat history', async ({ page }) => {
      await page.getByRole('button', { name: /Buscar/i }).click();
      await page.getByPlaceholder('Buscar mensagens...').fill('contrato');
      
      // Should highlight search results
      await expect(page.locator('[data-testid="search-highlight"]')).toBeVisible();
    });

    test('should export chat history', async ({ page }) => {
      await page.getByRole('button', { name: /Exportar/i }).click();
      
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: /Baixar PDF/i }).click();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.pdf');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle connection failures', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('E-mail').fill('office@freelaw.com.br');
      await page.getByLabel('Senha').fill('office123');
      await page.getByRole('button', { name: /Entrar/i }).click();
      await page.goto('/delegacoes/123/chat');
      
      // Simulate network failure
      await page.context().setOffline(true);
      
      // Try to send message
      await page.getByPlaceholder('Digite sua mensagem...').fill('Mensagem offline');
      await page.getByRole('button', { name: /Enviar/i }).click();
      
      // Should show error
      await expect(page.getByText('Erro de conexão')).toBeVisible();
      await expect(page.locator('[data-testid="connection-status"]')).toHaveText('Offline');
    });

    test('should retry failed messages', async ({ page }) => {
      await page.goto('/delegacoes/123/chat');
      
      // Should show retry button for failed messages
      await expect(page.locator('[data-testid="retry-message"]')).toBeVisible();
      
      // Click retry
      await page.locator('[data-testid="retry-message"]').click();
      
      await expect(page.getByText('Reenviando...')).toBeVisible();
    });

    test('should handle large message volumes', async ({ page }) => {
      await page.goto('/delegacoes/123/chat');
      
      // Send multiple messages quickly
      for (let i = 0; i < 10; i++) {
        await page.getByPlaceholder('Digite sua mensagem...').fill(`Mensagem ${i}`);
        await page.getByRole('button', { name: /Enviar/i }).click();
      }
      
      // Should handle gracefully without errors
      await expect(page.locator('[data-testid="message"]')).toHaveCount({ gte: 10 });
    });
  });
});



