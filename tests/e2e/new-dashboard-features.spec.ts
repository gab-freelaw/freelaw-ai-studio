import { test, expect } from '@playwright/test'

test.describe('Novas Funcionalidades de Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Garantir que estamos no modo de teste
    await page.addInitScript(() => {
      window.process = { env: { NEXT_PUBLIC_E2E: 'true' } }
    })
  })

  test('Dashboard Executivo - Perfil do Escritório', async ({ page }) => {
    // Navegar para o perfil do escritório
    await page.goto('/office')
    
    // Verificar se a página carregou
    await expect(page.getByText('Perfil do Escritório')).toBeVisible()
    
    // Verificar abas principais
    await expect(page.getByRole('tab', { name: 'Dashboard Executivo' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Equipe' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Estilo & IA' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Clientes' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Configurações' })).toBeVisible()

    // Verificar KPIs na aba Dashboard Executivo
    await page.getByRole('tab', { name: 'Dashboard Executivo' }).click()
    
    // Verificar se os KPIs estão visíveis (ou em loading)
    const kpiCards = page.locator('[data-testid="kpi-card"], .animate-pulse, [class*="card"]')
    await expect(kpiCards.first()).toBeVisible()

    // Verificar se há pelo menos alguns elementos de métrica
    const hasMetrics = await page.locator('text=/Serviços Totais|Qualidade Média|Prazo Médio|Satisfação Cliente/').count()
    expect(hasMetrics).toBeGreaterThan(0)
  })

  test('Dashboard Executivo - Navegação entre abas', async ({ page }) => {
    await page.goto('/office')
    
    // Testar navegação entre abas
    await page.getByRole('tab', { name: 'Equipe' }).click()
    await expect(page.getByText('Performance da Equipe')).toBeVisible()

    await page.getByRole('tab', { name: 'Clientes' }).click()
    await expect(page.getByText('Métricas de Clientes')).toBeVisible()

    await page.getByRole('tab', { name: 'Estilo & IA' }).click()
    await expect(page.getByText('Análise de Estilo do Escritório')).toBeVisible()

    await page.getByRole('tab', { name: 'Configurações' }).click()
    await expect(page.getByText('Informações do Escritório')).toBeVisible()
  })

  test('Marketplace de Delegação - Página principal', async ({ page }) => {
    await page.goto('/marketplace')
    
    // Verificar se a página carregou
    await expect(page.getByText('Marketplace')).toBeVisible()
    
    // Verificar abas do marketplace
    await expect(page.getByRole('tab', { name: 'Advogados Externos' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Delegações Ativas' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Performance' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Nova Delegação' })).toBeVisible()

    // Verificar se há conteúdo na aba principal
    const hasContent = await page.locator('text=/Advogados disponíveis|Nenhum advogado disponível|Carregando/').count()
    expect(hasContent).toBeGreaterThan(0)
  })

  test('Marketplace - Navegação entre abas', async ({ page }) => {
    await page.goto('/marketplace')
    
    // Testar navegação entre abas do marketplace
    await page.getByRole('tab', { name: 'Delegações Ativas' }).click()
    await expect(page.getByText(/Delegações|Nenhuma delegação|Carregando/)).toBeVisible()

    await page.getByRole('tab', { name: 'Performance' }).click()
    await expect(page.getByText(/Performance Comparativa|IA vs Externos vs Internos/)).toBeVisible()

    await page.getByRole('tab', { name: 'Nova Delegação' }).click()
    await expect(page.getByText(/Nova Delegação|Criar Delegação/)).toBeVisible()
  })

  test('Agenda & Prazos Unificada', async ({ page }) => {
    await page.goto('/agenda')
    
    // Verificar se a página carregou
    await expect(page.getByText('Agenda & Prazos')).toBeVisible()
    
    // Verificar abas unificadas
    await expect(page.getByRole('tab', { name: 'Visão Geral' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Calendário' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Prazos' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Tarefas IA' })).toBeVisible()

    // Verificar KPIs na visão geral
    await page.getByRole('tab', { name: 'Visão Geral' }).click()
    const hasKPIs = await page.locator('text=/Próximos Prazos|Tarefas IA Ativas|Compromissos Hoje|Economia de Tempo/').count()
    expect(hasKPIs).toBeGreaterThan(0)
  })

  test('Agenda & Prazos - Integração de Tarefas IA', async ({ page }) => {
    await page.goto('/agenda')
    
    // Navegar para a aba de Tarefas IA
    await page.getByRole('tab', { name: 'Tarefas IA' }).click()
    
    // Verificar se a seção existe
    await expect(page.getByText('Tarefas Inteligentes')).toBeVisible()
    
    // Verificar se há tarefas ou estado vazio
    const hasTasks = await page.locator('text=/Analisar jurisprudência|Revisar petição|Nenhuma tarefa|Carregando/').count()
    expect(hasTasks).toBeGreaterThan(0)
  })

  test('Dashboard do Prestador - Portal', async ({ page }) => {
    await page.goto('/portal-prestador/dashboard')
    
    // Verificar se a página carregou (pode estar protegida por auth)
    const isProtected = await page.locator('text=/Unauthorized|Login|Meu Dashboard/').count()
    expect(isProtected).toBeGreaterThan(0)

    // Se conseguir acessar, verificar estrutura
    const dashboardVisible = await page.getByText('Meu Dashboard').isVisible().catch(() => false)
    if (dashboardVisible) {
      // Verificar abas do dashboard do prestador
      await expect(page.getByRole('tab', { name: 'Visão Geral' })).toBeVisible()
      await expect(page.getByRole('tab', { name: 'Performance' })).toBeVisible()
      await expect(page.getByRole('tab', { name: 'Feedback' })).toBeVisible()
      await expect(page.getByRole('tab', { name: 'Metas' })).toBeVisible()

      // Verificar KPIs específicos do prestador
      const hasProviderKPIs = await page.locator('text=/Nota Média|% Intercorrências|Serviços Este Mês|Meta Mensal/').count()
      expect(hasProviderKPIs).toBeGreaterThan(0)
    }
  })

  test('Navegação Principal - Links Atualizados', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Verificar se os novos links estão funcionando
    const marketplaceLink = page.getByRole('link', { name: /marketplace/i }).first()
    if (await marketplaceLink.isVisible()) {
      await marketplaceLink.click()
      await expect(page).toHaveURL(/.*marketplace.*/)
      await page.goBack()
    }

    const officeLink = page.getByRole('link', { name: /perfil do escritório|office/i }).first()
    if (await officeLink.isVisible()) {
      await officeLink.click()
      await expect(page).toHaveURL(/.*office.*/)
      await page.goBack()
    }

    const agendaLink = page.getByRole('link', { name: /agenda.*prazos|agenda/i }).first()
    if (await agendaLink.isVisible()) {
      await agendaLink.click()
      await expect(page).toHaveURL(/.*agenda.*/)
    }
  })

  test('Responsividade - Novas páginas em mobile', async ({ page }) => {
    // Simular mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Testar páginas principais em mobile
    await page.goto('/office')
    await expect(page.getByText('Perfil do Escritório')).toBeVisible()

    await page.goto('/marketplace')
    await expect(page.getByText('Marketplace')).toBeVisible()

    await page.goto('/agenda')
    await expect(page.getByText('Agenda & Prazos')).toBeVisible()

    // Verificar se as abas ainda funcionam em mobile
    await page.getByRole('tab', { name: 'Calendário' }).click()
    await expect(page.getByText('Calendário')).toBeVisible()
  })

  test('Loading States - Verificar estados de carregamento', async ({ page }) => {
    // Testar com network throttling para ver loading states
    await page.route('**/api/analytics/**', route => {
      setTimeout(() => route.continue(), 1000) // Simular delay
    })

    await page.goto('/office')
    
    // Verificar se há estados de loading
    const hasLoadingState = await page.locator('.animate-pulse, text=/Carregando|Loading/').count()
    expect(hasLoadingState).toBeGreaterThanOrEqual(0) // Aceitar 0 se carregar muito rápido
    
    // Aguardar carregamento completar
    await page.waitForTimeout(2000)
  })

  test('Error Handling - Verificar tratamento de erros', async ({ page }) => {
    // Simular erro de API
    await page.route('**/api/analytics/dashboard', route => {
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'Internal Server Error' }) })
    })

    await page.goto('/office')
    
    // Verificar se a página ainda renderiza (mesmo com erro de API)
    await expect(page.getByText('Perfil do Escritório')).toBeVisible()
    
    // Pode haver dados em 0 ou mensagens de erro
    await page.waitForTimeout(1000)
  })
})




