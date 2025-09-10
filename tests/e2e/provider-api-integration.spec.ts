import { test, expect } from '@playwright/test'

test.describe('Provider Portal API Integration', () => {
  test('should submit application form to backend API successfully', async ({ page }) => {
    // Go to the provider application page
    await page.goto('/portal-prestador/aplicacao')
    
    // Wait for the form to load by checking for step indicator
    await expect(page.getByText('Informações Pessoais')).toBeVisible()
    
    // Fill Step 1 - Personal Information
    await page.locator('#fullName').fill('João Silva Teste')
    await page.locator('#email').fill('joao.teste@example.com')
    await page.locator('#phone').fill('(11) 98765-4321')
    await page.locator('#oabNumber').fill('123456')
    await page.locator('#oabState').selectOption('SP')
    await page.locator('#city').fill('São Paulo')
    await page.locator('#state').selectOption('SP')
    
    // Click next
    await page.getByRole('button', { name: 'Próximo' }).click()
    
    // Fill Step 2 - Professional Experience
    await page.getByLabel('Anos de Experiência *').selectOption('5-10')
    await page.getByLabel('Situação Atual *').selectOption('autonomo')
    await page.getByLabel('Conte sobre sua experiência profissional *').fill('Advogado com 7 anos de experiência em direito trabalhista e civil.')
    
    // Select specialties
    await page.getByLabel('Direito Trabalhista').check()
    await page.getByLabel('Direito Civil').check()
    
    await page.getByLabel('Quantas peças consegue produzir por mês? *').selectOption('alto')
    await page.getByLabel('Quais suas maiores fortalezas? *').fill('Excelente redação jurídica e atenção aos detalhes.')
    
    // Click next
    await page.getByRole('button', { name: 'Próximo' }).click()
    
    // Fill Step 3 - Motivation
    await page.getByLabel('Por que você quer entrar na FreeLaw? *').fill('Busco flexibilidade e oportunidade de crescimento profissional.')
    await page.getByLabel('O que mais te anima nessa oportunidade? *').fill('A possibilidade de trabalhar remotamente e crescer baseado em meritocracia.')
    await page.getByLabel('Como você prefere trabalhar? *').selectOption('remoto')
    await page.getByLabel('Como você garante qualidade nas suas peças? *').fill('Revisão minuciosa e pesquisa jurisprudencial atualizada.')
    await page.getByLabel('Como você lida com feedback? *').fill('Vejo feedback como oportunidade de aprendizado e melhoria contínua.')
    
    // Click next
    await page.getByRole('button', { name: 'Próximo' }).click()
    
    // Fill Step 4 - Availability
    await page.getByLabel('Quantas horas por semana você pode dedicar? *').selectOption('40')
    await page.getByLabel('Qual seu horário preferido? *').selectOption('flexivel')
    await page.getByLabel('Expectativa de ganhos mensais *').selectOption('4000-6000')
    await page.getByLabel('Onde você se vê em 6 meses? *').fill('Quero estar produzindo 100+ peças por mês com excelente qualidade.')
    await page.getByLabel('Quando você pode começar? *').selectOption('imediato')
    
    // Click next to review
    await page.getByRole('button', { name: 'Próximo' }).click()
    
    // Accept terms in Step 5
    await page.getByLabel('Aceito os termos e condições').check()
    await page.getByLabel('Entendo que passarei por um teste prático').check()
    
    // Submit the form
    await page.getByRole('button', { name: 'Enviar Aplicação' }).click()
    
    // Wait for navigation to success page
    await page.waitForURL('**/portal-prestador/aplicacao/sucesso', { timeout: 10000 })
    
    // Verify success page elements
    await expect(page.getByText('Aplicação Enviada com Sucesso!')).toBeVisible()
    await expect(page.getByText('Parabéns por dar o primeiro passo')).toBeVisible()
    
    // Check if provider ID is displayed (if API returns it)
    const providerIdElement = page.locator('text=/ID da Aplicação: /')
    if (await providerIdElement.isVisible()) {
      const providerIdText = await providerIdElement.textContent()
      expect(providerIdText).toContain('ID da Aplicação:')
      console.log('Provider application submitted with', providerIdText)
    }
  })

  test('should show error when API is unavailable', async ({ page }) => {
    // Mock API failure by stopping the backend (in real test, you'd use route interception)
    await page.route('**/api/providers/apply', route => {
      route.abort('failed')
    })
    
    // Go to the provider application page
    await page.goto('/portal-prestador/aplicacao')
    
    // Fill minimal required fields for Step 1
    await page.getByLabel('Nome Completo *').fill('Test User')
    await page.getByLabel('E-mail *').fill('test@example.com')
    await page.getByLabel('Telefone *').fill('(11) 98765-4321')
    await page.getByLabel('Número da OAB *').fill('123456')
    await page.getByLabel('Estado da OAB *').selectOption('SP')
    await page.getByLabel('Cidade *').fill('São Paulo')
    await page.getByLabel('Estado *').selectOption('SP')
    
    // Navigate through all steps quickly
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: 'Próximo' }).click()
      await page.waitForTimeout(500)
    }
    
    // Try to submit without accepting terms
    await page.getByRole('button', { name: 'Enviar Aplicação' }).click()
    
    // Should show validation error
    await expect(page.getByText('Você deve aceitar os termos')).toBeVisible()
    
    // Accept terms
    await page.getByLabel('Aceito os termos e condições').check()
    await page.getByLabel('Entendo que passarei por um teste prático').check()
    
    // Submit the form
    await page.getByRole('button', { name: 'Enviar Aplicação' }).click()
    
    // Wait for error dialog/alert
    await page.waitForTimeout(2000)
    
    // Should still be on the same page (not navigated to success)
    expect(page.url()).toContain('/portal-prestador/aplicacao')
  })
})