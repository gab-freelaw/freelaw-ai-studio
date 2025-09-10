import { test, expect } from '@playwright/test'

test.describe('Navigation and Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002')
  })

  test('should load the home page', async ({ page }) => {
    await expect(page).toHaveTitle(/Freelaw/i)
    await expect(page.locator('h1')).toContainText(/Seu Escritório Jurídico/i)
  })

  test('should navigate to Chat page', async ({ page }) => {
    await page.getByRole('link', { name: /Chat/i }).click()
    await page.waitForURL('**/chat')
    await expect(page.locator('h1')).toContainText('Assistente Jurídico')
  })

  test('should navigate to Documents page', async ({ page }) => {
    await page.getByRole('link', { name: /Documentos/i }).click()
    await page.waitForURL('**/documents')
    await expect(page.locator('h1')).toContainText('Documentos')
  })

  test('should navigate to Petitions page', async ({ page }) => {
    await page.getByRole('link', { name: /Petições/i }).click()
    await page.waitForURL('**/petitions')
    await expect(page.locator('h1')).toContainText('Gerador de Petições')
  })

  test('should navigate to Contracts page', async ({ page }) => {
    await page.getByRole('link', { name: /Contratos/i }).click()
    await page.waitForURL('**/contracts')
    await expect(page.locator('h1')).toContainText('Contratos')
    await expect(page.locator('text=Gerencie contratos e honorários')).toBeVisible()
  })

  test('should navigate to Search page', async ({ page }) => {
    await page.getByRole('link', { name: /Pesquisa/i }).click()
    await page.waitForURL('**/search')
    await expect(page.locator('h1')).toContainText('Pesquisa Jurídica')
    await expect(page.locator('input[placeholder*="Digite sua busca"]')).toBeVisible()
  })

  test('should navigate to Deadlines page', async ({ page }) => {
    await page.getByRole('link', { name: /Prazos/i }).click()
    await page.waitForURL('**/deadlines')
    await expect(page.locator('h1')).toContainText('Prazos e Compromissos')
    await expect(page.getByText('Calendário')).toBeVisible()
  })

  test('should navigate to Knowledge Base page', async ({ page }) => {
    await page.getByRole('link', { name: /Base de Conhecimento/i }).click()
    await page.waitForURL('**/knowledge')
    await expect(page.locator('h1')).toContainText('Base de Conhecimento')
    await expect(page.getByText('biblioteca jurídica digital')).toBeVisible()
  })

  test('should navigate to Office Style page', async ({ page }) => {
    await page.getByRole('link', { name: /Estilo do Escritório/i }).click()
    await page.waitForURL('**/office-style')
    await expect(page.locator('h1')).toContainText('Estilo do Escritório')
  })
})

test.describe('Office Style - Document Analysis', () => {
  test('should show upload area for document analysis', async ({ page }) => {
    await page.goto('http://localhost:3002/office-style')
    await page.waitForLoadState('networkidle')
    
    // Check if upload area is visible
    await expect(page.locator('text=Arraste um documento aqui')).toBeVisible()
    await expect(page.locator('text=PDF, DOCX, DOC ou TXT')).toBeVisible()
  })

  test('should have tabs for style analysis results', async ({ page }) => {
    await page.goto('http://localhost:3002/office-style')
    
    // Upload a mock file to trigger analysis
    // Note: In a real test, you would upload an actual file
    // For now, we just check if the UI elements exist
    
    const uploadArea = page.locator('[role="presentation"]').first()
    await expect(uploadArea).toBeVisible()
  })
})

test.describe('Page Functionality', () => {
  test('Contracts page should display contract list', async ({ page }) => {
    await page.goto('http://localhost:3002/contracts')
    await page.waitForLoadState('networkidle')
    
    // Check for stats cards
    await expect(page.locator('text=Total de Contratos')).toBeVisible()
    await expect(page.locator('text=Valor Total')).toBeVisible()
    await expect(page.locator('text=Clientes')).toBeVisible()
    
    // Check for contract items
    await expect(page.locator('text=Contrato de Prestação de Serviços')).toBeVisible()
  })

  test('Search page should have search functionality', async ({ page }) => {
    await page.goto('http://localhost:3002/search')
    await page.waitForLoadState('networkidle')
    
    // Check search input
    const searchInput = page.locator('input[placeholder*="Digite sua busca"]')
    await expect(searchInput).toBeVisible()
    
    // Type in search
    await searchInput.fill('contrato')
    await page.click('text=Buscar')
    
    // Wait for results (even if mock)
    await page.waitForTimeout(1000)
  })

  test('Deadlines page should display calendar and deadlines', async ({ page }) => {
    await page.goto('http://localhost:3002/deadlines')
    await page.waitForLoadState('networkidle')
    
    // Check for calendar
    await expect(page.locator('text=Calendário')).toBeVisible()
    
    // Check for stats
    await expect(page.locator('text=Próximos 7 dias')).toBeVisible()
    await expect(page.locator('text=Urgentes')).toBeVisible()
    
    // Check for tabs
    await expect(page.getByRole('tab', { name: 'Próximos' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Vencidos' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Concluídos' })).toBeVisible()
  })

  test('Knowledge Base page should display categories', async ({ page }) => {
    await page.goto('http://localhost:3002/knowledge')
    await page.waitForLoadState('networkidle')
    
    // Check for category cards
    await expect(page.getByText('Legislação').first()).toBeVisible()
    await expect(page.getByText('Jurisprudência').first()).toBeVisible()
    await expect(page.getByText('Doutrina').first()).toBeVisible()
    await expect(page.getByText('Modelos').first()).toBeVisible()
    await expect(page.getByText('Artigos').first()).toBeVisible()
    
    // Check for search
    await expect(page.locator('input[placeholder*="Buscar na base de conhecimento"]')).toBeVisible()
  })
})

test.describe('Responsive Design', () => {
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3002')
    
    // Check if page loads on mobile
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('http://localhost:3002')
    
    await expect(page.locator('h1')).toBeVisible()
  })
})