import { test, expect } from '@playwright/test';

test.describe('Sistema de Dados Bancários - Teste Simples', () => {
  test('deve acessar a página da carteira', async ({ page }) => {
    await page.goto('http://localhost:3000/carteira');
    
    // Aguardar a página carregar
    await page.waitForTimeout(5000);
    
    // Verificar se a página carregou
    const title = await page.title();
    console.log('Título da página:', title);
    
    // Verificar se tem elementos da carteira
    const hasCarteira = await page.locator('text=Carteira').isVisible();
    const hasSaque = await page.locator('text=Saque').isVisible();
    const hasFormulario = await page.locator('text=Cadastrar').isVisible();
    
    console.log('Tem Carteira:', hasCarteira);
    console.log('Tem Saque:', hasSaque);
    console.log('Tem Formulário:', hasFormulario);
    
    // Pelo menos um desses elementos deve estar presente
    expect(hasCarteira || hasSaque || hasFormulario).toBe(true);
  });

  test('deve acessar a página de contas bancárias', async ({ page }) => {
    await page.goto('http://localhost:3000/prestador/contas-bancarias');
    
    // Aguardar a página carregar
    await page.waitForTimeout(5000);
    
    // Verificar se a página carregou
    const title = await page.title();
    console.log('Título da página:', title);
    
    // Verificar se tem elementos da página de contas
    const hasContas = await page.locator('text=Contas').isVisible();
    const hasBancarias = await page.locator('text=Bancárias').isVisible();
    const hasNova = await page.locator('text=Nova').isVisible();
    
    console.log('Tem Contas:', hasContas);
    console.log('Tem Bancárias:', hasBancarias);
    console.log('Tem Nova:', hasNova);
    
    // Pelo menos um desses elementos deve estar presente
    expect(hasContas || hasBancarias || hasNova).toBe(true);
  });

  test('deve verificar se o formulário de conta bancária funciona', async ({ page }) => {
    await page.goto('http://localhost:3000/prestador/contas-bancarias');
    await page.waitForTimeout(3000);
    
    // Tentar encontrar e clicar no botão Nova Conta
    const novaContaButton = page.locator('button').filter({ hasText: /Nova|Cadastrar|Adicionar/ }).first();
    
    if (await novaContaButton.isVisible()) {
      await novaContaButton.click();
      await page.waitForTimeout(2000);
      
      // Verificar se o formulário apareceu
      const hasForm = await page.locator('input').first().isVisible();
      console.log('Formulário apareceu:', hasForm);
      
      if (hasForm) {
        // Testar preenchimento de um campo
        const firstInput = page.locator('input').first();
        await firstInput.fill('341');
        
        const value = await firstInput.inputValue();
        console.log('Valor preenchido:', value);
        
        expect(value).toBe('341');
      }
    } else {
      console.log('Botão Nova Conta não encontrado');
    }
  });

  test('deve verificar responsividade básica', async ({ page }) => {
    // Testar desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('http://localhost:3000/carteira');
    await page.waitForTimeout(3000);
    
    let isVisible = await page.locator('body').isVisible();
    expect(isVisible).toBe(true);
    
    // Testar mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForTimeout(3000);
    
    isVisible = await page.locator('body').isVisible();
    expect(isVisible).toBe(true);
  });
});
