import { test, expect } from '@playwright/test'

test.describe('Melhorias Implementadas - Testes', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')
  })

  test('01 - Página Settings carrega corretamente', async ({ page }) => {
    // Navegar para Settings
    await page.goto('http://localhost:3000/settings')
    
    // Verifica título
    await expect(page.locator('h1')).toContainText('Configurações')
    
    // Verifica todas as abas
    await expect(page.getByRole('tab', { name: /Perfil/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Escritório/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Preferências/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Segurança/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Plano/i })).toBeVisible()
    
    // Testa navegação entre abas
    await page.getByRole('tab', { name: /Preferências/i }).click()
    await expect(page.getByText('Aparência')).toBeVisible()
    
    // Testa dark mode toggle
    const darkButton = page.getByRole('button', { name: /Escuro/i })
    if (await darkButton.isVisible()) {
      await darkButton.click()
      // Verifica se classe dark foi aplicada
      const htmlClass = await page.locator('html').getAttribute('class')
      expect(htmlClass).toContain('dark')
    }
  })

  test('02 - Página Team funciona corretamente', async ({ page }) => {
    // Navegar para Team
    await page.goto('http://localhost:3000/team')
    
    // Verifica título
    await expect(page.locator('h1')).toContainText('Equipe')
    
    // Verifica botão de convidar
    await expect(page.getByRole('button', { name: /Convidar Membro/i })).toBeVisible()
    
    // Verifica cards de estatísticas
    await expect(page.getByText('Total de Membros')).toBeVisible()
    await expect(page.getByText('Advogados')).toBeVisible()
    await expect(page.getByText('Casos Ativos')).toBeVisible()
    await expect(page.getByText('Tarefas Pendentes')).toBeVisible()
    
    // Verifica lista de membros
    const memberCards = page.locator('[class*="card"]').filter({ hasText: 'Dr.' })
    const count = await memberCards.count()
    expect(count).toBeGreaterThan(0)
    
    // Testa filtro de busca
    await page.getByPlaceholder(/Buscar por nome/i).fill('João')
    await page.waitForTimeout(500)
    
    // Testa modal de convite
    await page.getByRole('button', { name: /Convidar Membro/i }).click()
    await expect(page.getByText('Convidar Novo Membro')).toBeVisible()
    await page.getByRole('button', { name: /Cancelar/i }).click()
  })

  test('03 - Health Check API retorna status correto', async ({ page }) => {
    // Faz requisição direta para o health check
    const response = await page.request.get('http://localhost:3000/api/health')
    
    // Verifica status code (200 ou 503 dependendo do estado)
    expect([200, 503]).toContain(response.status())
    
    // Verifica estrutura da resposta
    const data = await response.json()
    expect(data).toHaveProperty('status')
    expect(data).toHaveProperty('timestamp')
    expect(data).toHaveProperty('services')
    expect(data).toHaveProperty('system')
    expect(data).toHaveProperty('features')
    expect(data).toHaveProperty('version')
    
    // Verifica serviços
    expect(data.services).toHaveProperty('database')
    expect(data.services).toHaveProperty('supabase')
    expect(data.services).toHaveProperty('openai')
    expect(data.services).toHaveProperty('escavador')
    expect(data.services).toHaveProperty('storage')
    
    // Verifica features
    expect(data.features.chat).toBeDefined()
    expect(data.features.petitions).toBe(true)
    expect(data.features.documents).toBe(true)
    expect(data.features.officeStyle).toBe(true)
  })

  test('04 - Feature Flags funcionam corretamente', async ({ page }) => {
    // Testa se dark mode está habilitado (sempre true por padrão)
    await page.goto('http://localhost:3000/settings')
    
    // Vai para aba de Preferências
    await page.getByRole('tab', { name: /Preferências/i }).click()
    
    // Se dark mode estiver habilitado via feature flag, deve mostrar os botões
    const darkModeButtons = page.locator('button').filter({ hasText: /Escuro|Claro|Sistema/i })
    const buttonsCount = await darkModeButtons.count()
    
    // Deve ter pelo menos um botão de tema se a feature estiver ativa
    expect(buttonsCount).toBeGreaterThan(0)
  })

  test('05 - Navegação sidebar inclui Settings e Team', async ({ page }) => {
    // Verifica links na sidebar
    const sidebar = page.locator('aside, [data-testid="sidebar"]').first()
    
    // Settings link
    const settingsLink = sidebar.locator('a[href="/settings"]')
    await expect(settingsLink).toBeVisible()
    
    // Team link  
    const teamLink = sidebar.locator('a[href="/team"]')
    await expect(teamLink).toBeVisible()
    
    // Testa navegação
    await settingsLink.click()
    await expect(page).toHaveURL(/.*\/settings/)
    
    await page.goBack()
    
    await teamLink.click()
    await expect(page).toHaveURL(/.*\/team/)
  })

  test('06 - Formulários em Settings salvam dados', async ({ page }) => {
    await page.goto('http://localhost:3000/settings')
    
    // Modifica um campo
    const nameInput = page.locator('input#name')
    await nameInput.clear()
    await nameInput.fill('Dr. Teste Silva')
    
    // Clica em salvar
    const saveButton = page.getByRole('button', { name: /Salvar Perfil/i })
    await saveButton.click()
    
    // Verifica toast de sucesso
    await expect(page.locator('[class*="toast"], [role="status"]')).toBeVisible({
      timeout: 5000
    })
  })

  test('07 - Team page mostra badges de roles corretamente', async ({ page }) => {
    await page.goto('http://localhost:3000/team')
    
    // Verifica badges de funções usando classes mais específicas
    await expect(page.locator('.bg-red-100').filter({ hasText: 'Administrador' })).toBeVisible()
    await expect(page.locator('.bg-blue-100').filter({ hasText: 'Advogado' }).first()).toBeVisible()
    
    // Verifica badges de status
    const activeBadges = page.locator('.bg-green-100').filter({ hasText: 'Ativo' })
    const count = await activeBadges.count()
    expect(count).toBeGreaterThan(0)
  })

  test('08 - Settings - Aba de Plano mostra informações corretas', async ({ page }) => {
    await page.goto('http://localhost:3000/settings')
    
    // Navega para aba Plano
    await page.getByRole('tab', { name: /Plano/i }).click()
    
    // Verifica informações do plano
    await expect(page.getByText('Plano Pro')).toBeVisible()
    await expect(page.getByText('R$ 199')).toBeVisible()
    await expect(page.getByText('/mês', { exact: true }).first()).toBeVisible()
    
    // Verifica recursos incluídos
    await expect(page.getByText('Petições ilimitadas')).toBeVisible()
    await expect(page.getByText('1000 consultas de IA/mês')).toBeVisible()
    await expect(page.getByText('10GB de armazenamento')).toBeVisible()
    
    // Verifica botões de ação
    await expect(page.getByRole('button', { name: /Alterar Plano/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Atualizar Pagamento/i })).toBeVisible()
  })

  test('09 - Settings - Notificações podem ser toggleadas', async ({ page }) => {
    await page.goto('http://localhost:3000/settings')
    
    // Vai para aba Preferências
    await page.getByRole('tab', { name: /Preferências/i }).click()
    
    // Testa toggles de notificação
    const emailSwitch = page.locator('button[role="switch"]#email-notif')
    if (await emailSwitch.isVisible()) {
      const initialState = await emailSwitch.getAttribute('data-state')
      await emailSwitch.click()
      const newState = await emailSwitch.getAttribute('data-state')
      expect(newState).not.toBe(initialState)
    }
  })

  test('10 - Health check retorna métricas de sistema', async ({ page }) => {
    const response = await page.request.get('http://localhost:3000/api/health')
    const data = await response.json()
    
    // Verifica métricas de sistema
    expect(data.system).toBeDefined()
    expect(data.system.memory).toBeDefined()
    expect(data.system.memory.used).toBeGreaterThan(0)
    expect(data.system.memory.total).toBeGreaterThan(0)
    expect(data.system.memory.percentage).toBeGreaterThanOrEqual(0)
    expect(data.system.memory.percentage).toBeLessThanOrEqual(100)
    
    // Verifica informações do ambiente
    expect(data.system.node).toMatch(/^v\d+/)
    expect(data.system.platform).toBeDefined()
    expect(data.system.environment).toBe('development')
  })
})

test.describe('Performance das Novas Páginas', () => {
  
  test('Settings page carrega em tempo aceitável', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('http://localhost:3000/settings', {
      waitUntil: 'networkidle'
    })
    
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(6000) // 6 segundos em dev
  })
  
  test('Team page carrega em tempo aceitável', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('http://localhost:3000/team', {
      waitUntil: 'networkidle'
    })
    
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(6000) // 6 segundos em dev
  })
  
  test('Health API responde em menos de 2 segundos', async ({ page }) => {
    const startTime = Date.now()
    
    await page.request.get('http://localhost:3000/api/health')
    
    const responseTime = Date.now() - startTime
    expect(responseTime).toBeLessThan(2000)
  })
})