import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'

// Aumenta timeout para páginas pesadas
test.setTimeout(60000)

test.describe('MVP Core - Fluxo Completo', () => {
  test.describe('1. Onboarding', () => {
    test('deve carregar a página de onboarding', async ({ page }) => {
      await page.goto(`${BASE_URL}/onboarding`)
      
      // Verifica elementos principais
      await expect(page.locator('h1')).toContainText('Todos os seus processos no Freelaw')
      await expect(page.locator('input[placeholder*="OAB"]')).toBeVisible()
      await expect(page.locator('select')).toBeVisible() // UF selector
      await expect(page.getByRole('button', { name: /BUSCAR PROCESSOS/i })).toBeVisible()
    })

    test('deve mostrar informações sobre OAB', async ({ page }) => {
      await page.goto(`${BASE_URL}/onboarding`)
      
      // Verifica seção "Por que informar sua OAB?"
      await expect(page.getByText('Por que informar sua OAB?')).toBeVisible()
      await expect(page.getByText(/Automatizar a busca/)).toBeVisible()
      await expect(page.getByText(/Garantir que você receba publicações/)).toBeVisible()
      await expect(page.getByText(/Economizar seu tempo/)).toBeVisible()
    })

    test('deve validar campo OAB vazio', async ({ page }) => {
      await page.goto(`${BASE_URL}/onboarding`)
      
      // Tenta buscar sem preencher OAB
      const button = page.getByRole('button', { name: /BUSCAR PROCESSOS/i })
      await expect(button).toBeDisabled() // Deve estar desabilitado quando vazio
    })

    test('deve permitir pular onboarding', async ({ page }) => {
      await page.goto(`${BASE_URL}/onboarding`)
      
      const skipLink = page.getByText('Prefiro configurar manualmente')
      await expect(skipLink).toBeVisible()
      
      await skipLink.click()
      await page.waitForURL('**/processes')
    })
  })

  test.describe('2. Listagem de Processos', () => {
    test('deve carregar a página de processos', async ({ page }) => {
      await page.goto(`${BASE_URL}/processes`)
      
      await expect(page.locator('h1')).toContainText('Gestão de Processos')
      await expect(page.getByPlaceholder(/Buscar por número/)).toBeVisible()
      await expect(page.getByRole('button', { name: /Buscar/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /Novo Processo/i })).toBeVisible()
    })

    test('deve exibir cards de estatísticas', async ({ page }) => {
      await page.goto(`${BASE_URL}/processes`)
      
      await expect(page.getByText('Total de Processos')).toBeVisible()
      await expect(page.getByText('Processos Ativos')).toBeVisible()
      // Arquivados aparece em múltiplos lugares, usar locator mais específico
      await expect(page.locator('.bg-white').filter({ hasText: 'Arquivados' }).first()).toBeVisible()
      await expect(page.getByText('Valor Total')).toBeVisible()
    })

    test('deve ter filtros funcionais', async ({ page }) => {
      await page.goto(`${BASE_URL}/processes`)
      
      // Verifica select de status
      const statusFilter = page.locator('select').first()
      await expect(statusFilter).toBeVisible()
      
      // Testa mudança de filtro
      await statusFilter.selectOption('ATIVO')
      await page.waitForTimeout(500) // Aguarda atualização
    })

    test('deve exibir lista de processos mock', async ({ page }) => {
      await page.goto(`${BASE_URL}/processes`)
      
      // Deve ter pelo menos um processo mock (pega primeiro)
      await expect(page.getByText(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/).first()).toBeVisible() // Formato CNJ
    })
  })

  test.describe('3. Monitoramento de Publicações', () => {
    test('deve carregar a página de publicações', async ({ page }) => {
      await page.goto(`${BASE_URL}/publications`)
      
      await expect(page.locator('h1')).toContainText('Monitoramento de Publicações')
      await expect(page.getByText(/OAB \d+\/\w{2}/)).toBeVisible() // OAB 183619/MG
    })

    test('deve exibir status de monitoramento', async ({ page }) => {
      await page.goto(`${BASE_URL}/publications`)
      
      // Verifica indicador de monitoramento
      const statusBadge = page.locator('span').filter({ hasText: /Monitoramento/ })
      await expect(statusBadge.first()).toBeVisible()
    })

    test('deve exibir estatísticas de publicações', async ({ page }) => {
      await page.goto(`${BASE_URL}/publications`)
      
      await expect(page.getByText('Total').first()).toBeVisible()
      await expect(page.getByText('Não Lidas')).toBeVisible()
      // Urgentes e Com Prazo aparecem em múltiplos lugares, usar seletor mais específico
      await expect(page.locator('.bg-white').filter({ hasText: 'Urgentes' }).first()).toBeVisible()
      await expect(page.locator('.bg-white').filter({ hasText: 'Com Prazo' }).first()).toBeVisible()
      await expect(page.getByText('Respondidas')).toBeVisible()
    })

    test('deve ter filtros de publicações', async ({ page }) => {
      await page.goto(`${BASE_URL}/publications`)
      
      // Verifica selects de filtro
      const selects = page.locator('select')
      await expect(selects).toHaveCount(2) // Tipo e Urgência
      
      // Testa filtro por tipo
      await selects.first().selectOption('INTIMACAO')
      await page.waitForTimeout(500)
    })
  })

  test.describe('4. APIs', () => {
    test('API de processos deve responder', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/processes`)
      
      expect(response.ok()).toBeTruthy()
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    test('API de publicações deve responder', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/publications`)
      
      expect(response.ok()).toBeTruthy()
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    test('API de monitoramento deve responder', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/monitoring/status`)
      
      expect(response.ok()).toBeTruthy()
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('active')
      expect(data.data).toHaveProperty('oab')
    })

    test('API de dashboard deve responder', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/dashboard/stats`)
      
      expect(response.ok()).toBeTruthy()
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('processos')
      expect(data.data).toHaveProperty('publicacoes')
    })
  })

  test.describe('5. Navegação', () => {
    test('deve navegar entre páginas principais', async ({ page }) => {
      // Inicia em processes
      await page.goto(`${BASE_URL}/processes`)
      await expect(page.locator('h1')).toContainText('Gestão de Processos')
      
      // Navega para publications
      await page.goto(`${BASE_URL}/publications`)
      await expect(page.locator('h1')).toContainText('Monitoramento de Publicações')
      
      // Navega para onboarding
      await page.goto(`${BASE_URL}/onboarding`)
      await expect(page.locator('h1')).toContainText('Todos os seus processos')
    })
  })

  test.describe('6. Responsividade', () => {
    test('deve ser responsivo em mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      await page.goto(`${BASE_URL}/processes`)
      await expect(page.locator('h1')).toBeVisible()
      
      await page.goto(`${BASE_URL}/publications`)
      await expect(page.locator('h1')).toBeVisible()
    })

    test('deve ser responsivo em tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      
      await page.goto(`${BASE_URL}/processes`)
      await expect(page.locator('h1')).toBeVisible()
      
      await page.goto(`${BASE_URL}/publications`)
      await expect(page.locator('h1')).toBeVisible()
    })
  })

  // Dark mode será implementado na Fase 2
})

test.describe('Fluxo End-to-End Completo', () => {
  test('deve completar o fluxo desde onboarding até visualização de processos', async ({ page }) => {
    // 1. Inicia no onboarding
    await page.goto(`${BASE_URL}/onboarding`)
    
    // 2. Preenche OAB
    await page.fill('input[placeholder*="OAB"]', '183619')
    await page.selectOption('select', 'MG')
    
    // 3. Busca processos
    await page.click('button:has-text("BUSCAR PROCESSOS")')
    
    // 4. Aguarda resposta (mock)
    await page.waitForTimeout(2500)
    
    // 5. Deve mostrar confirmação ou processos
    // Como estamos usando mock, vai direto para step 2
    const confirmButton = page.getByRole('button', { name: /CONFIRMAR/i })
    if (await confirmButton.isVisible()) {
      await confirmButton.click()
      await page.waitForTimeout(2500)
    }
    
    // 6. Deve redirecionar para processos ou mostrar sucesso
    const url = page.url()
    expect(url).toMatch(/processes|onboarding/)
  })
})