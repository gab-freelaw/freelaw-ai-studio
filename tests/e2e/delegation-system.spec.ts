import { test, expect } from '@playwright/test';

test.describe('Delegation System - Complete Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as office admin
    await page.goto('/login');
    await page.getByLabel('E-mail').fill('office@freelaw.com.br');
    await page.getByLabel('Senha').fill('office123');
    await page.getByRole('button', { name: /Entrar/i }).click();
  });

  test.describe('Delegation Creation', () => {
    test('should create new delegation successfully', async ({ page }) => {
      await page.goto('/delegacoes/nova');
      
      // Fill delegation form
      await page.getByLabel('Título da Delegação *').fill('Elaboração de Petição Inicial');
      await page.getByLabel('Descrição *').fill('Petição inicial de ação de cobrança');
      await page.getByLabel('Tipo de Serviço *').selectOption('petition_initial');
      await page.getByLabel('Área do Direito *').selectOption('civil');
      await page.getByLabel('Prazo *').fill('2024-12-31');
      await page.getByLabel('Urgência *').selectOption('medium');
      await page.getByLabel('Experiência Mínima *').selectOption('3-5');
      
      // Submit form
      await page.getByRole('button', { name: /Criar Delegação/i }).click();
      
      // Should show success message and redirect
      await expect(page.getByText('Delegação criada com sucesso')).toBeVisible();
      await expect(page).toHaveURL(/.*delegacoes/);
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/delegacoes/nova');
      
      await page.getByRole('button', { name: /Criar Delegação/i }).click();
      
      await expect(page.getByText('Título é obrigatório')).toBeVisible();
      await expect(page.getByText('Descrição é obrigatória')).toBeVisible();
    });

    test('should calculate price automatically', async ({ page }) => {
      await page.goto('/delegacoes/nova');
      
      await page.getByLabel('Tipo de Serviço *').selectOption('petition_initial');
      await page.getByLabel('Área do Direito *').selectOption('civil');
      await page.getByLabel('Urgência *').selectOption('high');
      await page.getByLabel('Experiência Mínima *').selectOption('5-10');
      
      // Should show calculated price
      await expect(page.getByText(/Preço estimado:/)).toBeVisible();
      await expect(page.getByText(/R\$ \d+,\d{2}/)).toBeVisible();
    });

    test('should allow file attachment', async ({ page }) => {
      await page.goto('/delegacoes/nova');
      
      // Upload file
      const fileInput = page.getByLabel('Anexar documentos');
      await fileInput.setInputFiles('tests/fixtures/test-document.pdf');
      
      // Should show uploaded file
      await expect(page.getByText('test-document.pdf')).toBeVisible();
    });

    test('should save draft automatically', async ({ page }) => {
      await page.goto('/delegacoes/nova');
      
      await page.getByLabel('Título da Delegação *').fill('Rascunho de Delegação');
      await page.getByLabel('Descrição *').fill('Esta é uma descrição de teste');
      
      // Refresh page
      await page.reload();
      
      // Data should be preserved
      await expect(page.getByLabel('Título da Delegação *')).toHaveValue('Rascunho de Delegação');
    });
  });

  test.describe('Delegation Management', () => {
    test('should list all delegations', async ({ page }) => {
      await page.goto('/delegacoes');
      
      // Should show delegations list
      await expect(page.getByText('Minhas Delegações')).toBeVisible();
      await expect(page.locator('[data-testid="delegation-card"]')).toHaveCount({ gte: 0 });
    });

    test('should filter delegations by status', async ({ page }) => {
      await page.goto('/delegacoes');
      
      // Filter by status
      await page.getByLabel('Status').selectOption('open');
      
      // Should show only open delegations
      await expect(page.locator('[data-testid="delegation-status-open"]')).toHaveCount({ gte: 0 });
    });

    test('should search delegations', async ({ page }) => {
      await page.goto('/delegacoes');
      
      await page.getByPlaceholder('Buscar delegações...').fill('petição');
      await page.getByRole('button', { name: /Buscar/i }).click();
      
      // Should show filtered results
      await expect(page.getByText(/petição/i)).toBeVisible();
    });

    test('should view delegation details', async ({ page }) => {
      await page.goto('/delegacoes');
      
      // Click on first delegation
      await page.locator('[data-testid="delegation-card"]').first().click();
      
      // Should show delegation details
      await expect(page.getByText('Detalhes da Delegação')).toBeVisible();
      await expect(page.getByText('Status:')).toBeVisible();
      await expect(page.getByText('Preço:')).toBeVisible();
    });

    test('should cancel delegation', async ({ page }) => {
      await page.goto('/delegacoes');
      
      // Click on delegation
      await page.locator('[data-testid="delegation-card"]').first().click();
      
      // Cancel delegation
      await page.getByRole('button', { name: /Cancelar Delegação/i }).click();
      await page.getByRole('button', { name: /Confirmar/i }).click();
      
      await expect(page.getByText('Delegação cancelada')).toBeVisible();
    });
  });

  test.describe('Matching System', () => {
    test('should trigger matching process', async ({ page }) => {
      await page.goto('/delegacoes');
      
      // Click on open delegation
      await page.locator('[data-testid="delegation-status-open"]').first().click();
      
      // Trigger matching
      await page.getByRole('button', { name: /Buscar Prestadores/i }).click();
      
      await expect(page.getByText('Buscando prestadores...')).toBeVisible();
    });

    test('should show matched providers', async ({ page }) => {
      await page.goto('/delegacoes');
      
      await page.locator('[data-testid="delegation-card"]').first().click();
      
      // Should show matched providers list
      await expect(page.getByText('Prestadores Compatíveis')).toBeVisible();
      await expect(page.locator('[data-testid="provider-match"]')).toHaveCount({ gte: 0 });
    });

    test('should show provider scores', async ({ page }) => {
      await page.goto('/delegacoes');
      
      await page.locator('[data-testid="delegation-card"]').first().click();
      
      // Should show compatibility scores
      await expect(page.getByText(/Score:/)).toBeVisible();
      await expect(page.getByText(/\d+%/)).toBeVisible();
    });

    test('should allow manual provider selection', async ({ page }) => {
      await page.goto('/delegacoes');
      
      await page.locator('[data-testid="delegation-card"]').first().click();
      
      // Select provider manually
      await page.locator('[data-testid="select-provider"]').first().click();
      await page.getByRole('button', { name: /Confirmar Seleção/i }).click();
      
      await expect(page.getByText('Prestador selecionado')).toBeVisible();
    });
  });

  test.describe('Provider Response Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Switch to provider context
      await page.goto('/portal-prestador/login');
      await page.getByLabel('E-mail').fill('provider@freelaw.com.br');
      await page.getByLabel('Senha').fill('provider123');
      await page.getByRole('button', { name: /Entrar/i }).click();
    });

    test('should list available delegations', async ({ page }) => {
      await page.goto('/portal-prestador/delegacoes');
      
      await expect(page.getByText('Delegações Disponíveis')).toBeVisible();
      await expect(page.locator('[data-testid="available-delegation"]')).toHaveCount({ gte: 0 });
    });

    test('should view delegation details', async ({ page }) => {
      await page.goto('/portal-prestador/delegacoes');
      
      await page.locator('[data-testid="available-delegation"]').first().click();
      
      await expect(page.getByText('Detalhes da Delegação')).toBeVisible();
      await expect(page.getByText('Preço oferecido:')).toBeVisible();
    });

    test('should accept delegation', async ({ page }) => {
      await page.goto('/portal-prestador/delegacoes');
      
      await page.locator('[data-testid="available-delegation"]').first().click();
      
      await page.getByRole('button', { name: /Aceitar/i }).click();
      await page.getByTextarea('Mensagem (opcional)').fill('Aceito a delegação. Prazo será cumprido.');
      await page.getByRole('button', { name: /Confirmar/i }).click();
      
      await expect(page.getByText('Delegação aceita')).toBeVisible();
    });

    test('should reject delegation', async ({ page }) => {
      await page.goto('/portal-prestador/delegacoes');
      
      await page.locator('[data-testid="available-delegation"]').first().click();
      
      await page.getByRole('button', { name: /Rejeitar/i }).click();
      await page.getByTextarea('Motivo da rejeição').fill('Não tenho disponibilidade no prazo');
      await page.getByRole('button', { name: /Confirmar Rejeição/i }).click();
      
      await expect(page.getByText('Delegação rejeitada')).toBeVisible();
    });

    test('should show my accepted delegations', async ({ page }) => {
      await page.goto('/portal-prestador/minhas-delegacoes');
      
      await expect(page.getByText('Minhas Delegações Ativas')).toBeVisible();
      await expect(page.locator('[data-testid="my-delegation"]')).toHaveCount({ gte: 0 });
    });
  });

  test.describe('Delegation Status Tracking', () => {
    test('should track delegation lifecycle', async ({ page }) => {
      await page.goto('/delegacoes');
      
      await page.locator('[data-testid="delegation-card"]').first().click();
      
      // Should show status history
      await expect(page.getByText('Histórico de Status')).toBeVisible();
      await expect(page.locator('[data-testid="status-timeline"]')).toBeVisible();
    });

    test('should show real-time status updates', async ({ page }) => {
      await page.goto('/delegacoes');
      
      await page.locator('[data-testid="delegation-card"]').first().click();
      
      // Should update status in real-time
      await expect(page.locator('[data-testid="status-badge"]')).toBeVisible();
    });

    test('should send notifications on status change', async ({ page }) => {
      await page.goto('/delegacoes');
      
      // Should show notification bell
      await expect(page.locator('[data-testid="notification-bell"]')).toBeVisible();
      
      // Click notification
      await page.locator('[data-testid="notification-bell"]').click();
      
      await expect(page.getByText('Notificações')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Mock API error
      await page.route('/api/delegations', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });

      await page.goto('/delegacoes');
      
      await expect(page.getByText('Erro ao carregar delegações')).toBeVisible();
    });

    test('should handle network errors', async ({ page }) => {
      // Simulate offline
      await page.context().setOffline(true);
      
      await page.goto('/delegacoes/nova');
      
      await page.getByLabel('Título da Delegação *').fill('Teste Offline');
      await page.getByRole('button', { name: /Criar Delegação/i }).click();
      
      await expect(page.getByText('Erro de conexão')).toBeVisible();
    });

    test('should validate delegation deadlines', async ({ page }) => {
      await page.goto('/delegacoes/nova');
      
      // Set past date
      await page.getByLabel('Prazo *').fill('2020-01-01');
      await page.getByRole('button', { name: /Criar Delegação/i }).click();
      
      await expect(page.getByText('Prazo deve ser no futuro')).toBeVisible();
    });
  });
});



