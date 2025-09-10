import { test, expect } from '@playwright/test'

test.describe('Navigation and Page Access', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should navigate to homepage', async ({ page }) => {
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: /Freelaw AI/i })).toBeVisible()
  })

  test('should have working navigation menu', async ({ page }) => {
    // Check if navigation exists
    const nav = page.locator('header')
    await expect(nav).toBeVisible()
    
    // Check logo
    await expect(page.getByText('Freelaw').first()).toBeVisible()
  })

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL('/login')
    await expect(page.getByRole('heading', { name: /Entrar/i })).toBeVisible()
  })

  test('should access dashboard with navigation', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/dashboard')
    
    // Check if navigation is present
    const nav = page.locator('header')
    await expect(nav).toBeVisible()
    
    // Check dashboard content
    await expect(page.getByText(/Dashboard/i).first()).toBeVisible()
  })

  test('should navigate to all main pages', async ({ page }) => {
    const pages = [
      { path: '/chat', text: 'Chat' },
      { path: '/documents', text: 'Documentos' },
      { path: '/petitions', text: 'Petições' },
      { path: '/processes', text: 'Processos' },
      { path: '/contacts', text: 'Contatos' },
      { path: '/agenda', text: 'Agenda' },
      { path: '/tarefas', text: 'Tarefas' },
      { path: '/settings', text: 'Configurações' },
      { path: '/team', text: 'Equipe' }
    ]

    for (const pageInfo of pages) {
      await page.goto(pageInfo.path)
      await expect(page).toHaveURL(pageInfo.path)
      
      // Check if navigation is present
      const nav = page.locator('header')
      await expect(nav).toBeVisible()
      
      // Check page content loads
      const pageContent = page.locator('main')
      await expect(pageContent).toBeVisible()
    }
  })
})

test.describe('Provider Portal', () => {
  test('should access provider portal landing page', async ({ page }) => {
    await page.goto('/portal-prestador')
    await expect(page).toHaveURL('/portal-prestador')
    await expect(page.getByRole('heading', { name: /Seja um Advogado Freelaw/i })).toBeVisible()
    
    // Check main CTA buttons
    await expect(page.getByRole('button', { name: /Começar Agora/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Já sou cadastrado/i })).toBeVisible()
  })

  test('should navigate to provider registration', async ({ page }) => {
    await page.goto('/portal-prestador/cadastro')
    await expect(page).toHaveURL('/portal-prestador/cadastro')
    await expect(page.getByRole('heading', { name: /Cadastro Inteligente/i })).toBeVisible()
    
    // Check OAB field
    await expect(page.getByLabel(/Número da OAB/i)).toBeVisible()
  })

  test('should navigate to provider login', async ({ page }) => {
    await page.goto('/portal-prestador/login')
    await expect(page).toHaveURL('/portal-prestador/login')
    await expect(page.getByRole('heading', { name: /Portal do Prestador/i })).toBeVisible()
    
    // Check login form
    await expect(page.getByLabel(/Número da OAB/i)).toBeVisible()
    await expect(page.getByLabel(/Senha/i)).toBeVisible()
  })

  test('should navigate to provider assessment', async ({ page }) => {
    await page.goto('/portal-prestador/avaliacao')
    await expect(page).toHaveURL('/portal-prestador/avaliacao')
    await expect(page.getByRole('heading', { name: /Avaliação de Qualificação/i })).toBeVisible()
    
    // Check if question is displayed
    await expect(page.getByText(/Questão 1/i)).toBeVisible()
  })

  test('should navigate to provider dashboard', async ({ page }) => {
    await page.goto('/portal-prestador/dashboard')
    await expect(page).toHaveURL('/portal-prestador/dashboard')
    
    // Check dashboard elements
    await expect(page.getByText(/Olá/i)).toBeVisible()
    await expect(page.getByText(/Trabalhos Disponíveis/i)).toBeVisible()
  })
})

test.describe('User Interactions', () => {
  test('should complete login flow', async ({ page }) => {
    await page.goto('/login')
    
    // Fill login form
    await page.getByLabel(/E-mail/i).fill('test@example.com')
    await page.getByLabel(/Senha/i).fill('password123')
    
    // Submit form
    await page.getByRole('button', { name: /Entrar/i }).click()
    
    // Should redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 5000 })
    await expect(page).toHaveURL('/dashboard')
  })

  test('should interact with chat page', async ({ page }) => {
    await page.goto('/chat')
    
    // Check chat interface
    await expect(page.getByPlaceholder(/Digite sua mensagem/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Enviar/i })).toBeVisible()
    
    // Type a message
    await page.getByPlaceholder(/Digite sua mensagem/i).fill('Teste de mensagem')
    await page.getByRole('button', { name: /Enviar/i }).click()
    
    // Check if message appears
    await expect(page.getByText('Teste de mensagem')).toBeVisible()
  })

  test('should interact with tasks page', async ({ page }) => {
    await page.goto('/tarefas')
    
    // Check task list
    await expect(page.getByText(/Tarefas Inteligentes/i)).toBeVisible()
    
    // Check if AI features are present
    await expect(page.getByText(/Score IA/i)).toBeVisible()
  })
})

test.describe('Responsive Design', () => {
  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Freelaw AI/i })).toBeVisible()
    
    // Navigation should still work
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/dashboard')
  })

  test('should be responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Freelaw AI/i })).toBeVisible()
    
    await page.goto('/portal-prestador')
    await expect(page.getByRole('heading', { name: /Seja um Advogado Freelaw/i })).toBeVisible()
  })
})

test.describe('Error Handling', () => {
  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/non-existent-page')
    
    // Should show 404 or redirect
    const isNotFound = await page.getByText(/404/i).isVisible().catch(() => false)
    const isRedirected = page.url().includes('/') && !page.url().includes('/non-existent-page')
    
    expect(isNotFound || isRedirected).toBeTruthy()
  })

  test('should handle provider portal 404', async ({ page }) => {
    await page.goto('/portal-prestador/non-existent')
    
    // Should show 404 or redirect
    const isNotFound = await page.getByText(/404/i).isVisible().catch(() => false)
    const isRedirected = page.url().includes('/portal-prestador') && !page.url().includes('/non-existent')
    
    expect(isNotFound || isRedirected).toBeTruthy()
  })
})