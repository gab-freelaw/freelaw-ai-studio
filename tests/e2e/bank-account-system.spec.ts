import { test, expect } from '@playwright/test';

test.describe('Sistema de Dados Bancários', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página inicial
    await page.goto('/');
    
    // Aguardar a página carregar
    await page.waitForLoadState('networkidle');
  });

  test('deve mostrar formulário de cadastro de conta bancária quando não há contas', async ({ page }) => {
    // Navegar para a carteira
    await page.goto('/carteira');
    
    // Aguardar a página carregar
    await page.waitForLoadState('networkidle');
    
    // Verificar se mostra o aviso de nenhuma conta cadastrada
    await expect(page.locator('text=Nenhuma conta cadastrada')).toBeVisible();
    
    // Verificar se tem o botão para cadastrar primeira conta
    const cadastrarButton = page.locator('button:has-text("Cadastrar Primeira Conta")');
    await expect(cadastrarButton).toBeVisible();
    
    // Clicar no botão para cadastrar
    await cadastrarButton.click();
    
    // Verificar se o formulário de cadastro apareceu
    await expect(page.locator('text=Cadastrar Conta Bancária')).toBeVisible();
    await expect(page.locator('text=Dados Seguros')).toBeVisible();
  });

  test('deve validar máscaras no formulário de conta bancária', async ({ page }) => {
    // Navegar para a carteira e abrir formulário
    await page.goto('/carteira');
    await page.waitForLoadState('networkidle');
    
    const cadastrarButton = page.locator('button:has-text("Cadastrar Primeira Conta")');
    if (await cadastrarButton.isVisible()) {
      await cadastrarButton.click();
    }
    
    // Testar máscara de CPF
    const documentTypeSelect = page.locator('[data-testid="document-type-select"], select:has(option[value="cpf"])').first();
    if (await documentTypeSelect.isVisible()) {
      await documentTypeSelect.selectOption('cpf');
    }
    
    const documentInput = page.locator('input[placeholder*="000.000.000-00"], input[id="holderDocument"]').first();
    if (await documentInput.isVisible()) {
      await documentInput.fill('12345678901');
      
      // Verificar se a máscara foi aplicada
      const value = await documentInput.inputValue();
      expect(value).toMatch(/\d{3}\.\d{3}\.\d{3}-\d{2}/);
    }
    
    // Testar campos obrigatórios
    const bankCodeInput = page.locator('input[id="bankCode"], input[placeholder*="341"]').first();
    if (await bankCodeInput.isVisible()) {
      await bankCodeInput.fill('341');
    }
    
    const agencyInput = page.locator('input[id="agency"], input[placeholder*="1234"]').first();
    if (await agencyInput.isVisible()) {
      await agencyInput.fill('1234');
    }
    
    const accountInput = page.locator('input[id="accountNumber"], input[placeholder*="12345678"]').first();
    if (await accountInput.isVisible()) {
      await accountInput.fill('12345678');
    }
    
    const digitInput = page.locator('input[id="accountDigit"], input[placeholder*="9"]').first();
    if (await digitInput.isVisible()) {
      await digitInput.fill('9');
    }
    
    const holderNameInput = page.locator('input[id="holderName"], input[placeholder*="Nome"]').first();
    if (await holderNameInput.isVisible()) {
      await holderNameInput.fill('João da Silva');
    }
  });

  test('deve navegar para página de gerenciamento de contas bancárias', async ({ page }) => {
    // Navegar para a página de contas bancárias do prestador
    await page.goto('/prestador/contas-bancarias');
    
    // Aguardar a página carregar
    await page.waitForLoadState('networkidle');
    
    // Verificar se a página carregou corretamente
    await expect(page.locator('text=Contas Bancárias')).toBeVisible();
    await expect(page.locator('text=Gerencie suas contas para receber pagamentos')).toBeVisible();
    
    // Verificar se tem informações de segurança
    await expect(page.locator('text=Segurança dos Dados')).toBeVisible();
    
    // Verificar se tem o botão para nova conta
    await expect(page.locator('button:has-text("Nova Conta")')).toBeVisible();
  });

  test('deve mostrar formulário quando clicar em Nova Conta', async ({ page }) => {
    // Navegar para a página de contas bancárias
    await page.goto('/prestador/contas-bancarias');
    await page.waitForLoadState('networkidle');
    
    // Clicar no botão Nova Conta
    const novaContaButton = page.locator('button:has-text("Nova Conta")');
    await expect(novaContaButton).toBeVisible();
    await novaContaButton.click();
    
    // Verificar se o formulário apareceu
    await expect(page.locator('text=Cadastrar Conta Bancária')).toBeVisible();
    
    // Verificar campos do formulário
    await expect(page.locator('input[id="bankCode"], input[placeholder*="341"]')).toBeVisible();
    await expect(page.locator('input[id="agency"], input[placeholder*="1234"]')).toBeVisible();
    await expect(page.locator('input[id="accountNumber"], input[placeholder*="12345678"]')).toBeVisible();
    await expect(page.locator('input[id="holderName"], input[placeholder*="Nome"]')).toBeVisible();
    
    // Verificar botões
    await expect(page.locator('button:has-text("Cancelar")')).toBeVisible();
    await expect(page.locator('button:has-text("Cadastrar Conta")')).toBeVisible();
  });

  test('deve cancelar cadastro e voltar para lista', async ({ page }) => {
    // Navegar para a página de contas bancárias
    await page.goto('/prestador/contas-bancarias');
    await page.waitForLoadState('networkidle');
    
    // Abrir formulário
    await page.locator('button:has-text("Nova Conta")').click();
    await expect(page.locator('text=Cadastrar Conta Bancária')).toBeVisible();
    
    // Cancelar
    const cancelarButton = page.locator('button:has-text("Cancelar")');
    if (await cancelarButton.isVisible()) {
      await cancelarButton.click();
      
      // Verificar se voltou para a lista
      await expect(page.locator('text=Contas Bancárias')).toBeVisible();
      await expect(page.locator('button:has-text("Nova Conta")')).toBeVisible();
    }
  });

  test('deve validar campos obrigatórios no formulário', async ({ page }) => {
    // Navegar e abrir formulário
    await page.goto('/prestador/contas-bancarias');
    await page.waitForLoadState('networkidle');
    await page.locator('button:has-text("Nova Conta")').click();
    
    // Tentar submeter formulário vazio
    const submitButton = page.locator('button:has-text("Cadastrar Conta")');
    await expect(submitButton).toBeVisible();
    await submitButton.click();
    
    // Verificar se mostra erro de validação
    await expect(page.locator('text=Preencha todos os campos obrigatórios')).toBeVisible();
  });

  test('deve mostrar informações sobre métodos de saque', async ({ page }) => {
    // Navegar para carteira
    await page.goto('/carteira');
    await page.waitForLoadState('networkidle');
    
    // Verificar informações sobre como funciona
    await expect(page.locator('text=Como funciona')).toBeVisible();
    await expect(page.locator('text=PIX e Boleto: R$ 1,75')).toBeVisible();
    await expect(page.locator('text=Cartão: 2,30%')).toBeVisible();
    await expect(page.locator('text=Prestadores Elite ganham 20% a mais')).toBeVisible();
  });

  test('deve ter navegação consistente entre páginas', async ({ page }) => {
    // Testar navegação da carteira para contas bancárias
    await page.goto('/carteira');
    await page.waitForLoadState('networkidle');
    
    // Verificar se a página da carteira carregou
    await expect(page.locator('text=Carteira Digital')).toBeVisible();
    
    // Navegar para contas bancárias
    await page.goto('/prestador/contas-bancarias');
    await page.waitForLoadState('networkidle');
    
    // Verificar se a página de contas carregou
    await expect(page.locator('text=Contas Bancárias')).toBeVisible();
    
    // Voltar para carteira
    await page.goto('/carteira');
    await page.waitForLoadState('networkidle');
    
    // Verificar se voltou corretamente
    await expect(page.locator('text=Carteira Digital')).toBeVisible();
  });

  test('deve mostrar calculadora de preços na carteira', async ({ page }) => {
    await page.goto('/carteira');
    await page.waitForLoadState('networkidle');
    
    // Verificar se tem a calculadora de preços
    await expect(page.locator('text=Calculadora de Preços')).toBeVisible();
    
    // Verificar se tem o resumo financeiro
    await expect(page.locator('text=Resumo Financeiro')).toBeVisible();
  });

  test('deve ter design responsivo', async ({ page }) => {
    // Testar em diferentes tamanhos de tela
    
    // Desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/prestador/contas-bancarias');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Contas Bancárias')).toBeVisible();
    
    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Contas Bancárias')).toBeVisible();
    
    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Contas Bancárias')).toBeVisible();
  });
});
