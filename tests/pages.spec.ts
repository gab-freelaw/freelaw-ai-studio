import { test, expect } from '@playwright/test'

test.describe('All Pages Load Test', () => {
  test('Home page loads', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    await expect(page.locator('h1')).toBeVisible()
    await expect(page).toHaveTitle(/Freelaw/i)
  })

  test('Chat page loads', async ({ page }) => {
    await page.goto('http://localhost:3000/chat')
    await expect(page.locator('h1')).toContainText('Assistente Jurídico')
  })

  test('Documents page loads', async ({ page }) => {
    await page.goto('http://localhost:3000/documents')
    await expect(page.locator('h1')).toContainText('Documentos')
  })

  test('Petitions page loads', async ({ page }) => {
    await page.goto('http://localhost:3000/petitions')
    await expect(page.locator('h1')).toContainText('Gerador de Petições')
  })

  test('Contracts page loads', async ({ page }) => {
    await page.goto('http://localhost:3000/contracts')
    await expect(page.locator('h1')).toContainText('Contratos')
    await expect(page.getByText('Total de Contratos')).toBeVisible()
  })

  test('Search page loads', async ({ page }) => {
    await page.goto('http://localhost:3000/search')
    await expect(page.locator('h1')).toContainText('Pesquisa Jurídica')
    await expect(page.locator('input[placeholder*="Digite sua busca"]')).toBeVisible()
  })

  test('Deadlines page loads', async ({ page }) => {
    await page.goto('http://localhost:3000/deadlines')
    await expect(page.locator('h1')).toContainText('Prazos e Compromissos')
    await expect(page.getByText('Calendário')).toBeVisible()
  })

  test('Knowledge page loads', async ({ page }) => {
    await page.goto('http://localhost:3000/knowledge')
    await expect(page.locator('h1')).toContainText('Base de Conhecimento')
    await expect(page.getByText('Legislação').first()).toBeVisible()
  })

  test('Office Style page loads', async ({ page }) => {
    await page.goto('http://localhost:3000/office-style')
    await expect(page.locator('h1')).toContainText('Estilo do Escritório')
    // Check if the upload component exists
    await expect(page.locator('[role="presentation"]').first()).toBeVisible()
  })
})

test.describe('Office Style Functionality', () => {
  test('Upload area is visible and functional', async ({ page }) => {
    await page.goto('http://localhost:3000/office-style')
    
    // Check upload area
    const uploadArea = page.locator('[role="presentation"]').first()
    await expect(uploadArea).toBeVisible()
  })
})

test.describe('Page Content Verification', () => {
  test('Contracts page has all sections', async ({ page }) => {
    await page.goto('http://localhost:3000/contracts')
    
    // Stats cards
    await expect(page.getByText('Total de Contratos')).toBeVisible()
    await expect(page.getByText('Valor Total')).toBeVisible()
    await expect(page.getByText('Clientes').first()).toBeVisible()
    
    // Sample contract
    await expect(page.getByText('Contrato de Prestação de Serviços Advocatícios')).toBeVisible()
  })

  test('Search page has search input', async ({ page }) => {
    await page.goto('http://localhost:3000/search')
    
    const searchInput = page.locator('input[placeholder*="Digite sua busca"]')
    await expect(searchInput).toBeVisible()
    await searchInput.fill('teste')
    await expect(searchInput).toHaveValue('teste')
  })

  test('Deadlines page has calendar', async ({ page }) => {
    await page.goto('http://localhost:3000/deadlines')
    
    // Calendar section
    await expect(page.getByText('Calendário')).toBeVisible()
    
    // Stats
    await expect(page.getByText('Próximos 7 dias')).toBeVisible()
    await expect(page.getByText('Urgentes')).toBeVisible()
  })

  test('Knowledge page has categories', async ({ page }) => {
    await page.goto('http://localhost:3000/knowledge')
    
    // Categories
    await expect(page.getByText('Legislação').first()).toBeVisible()
    await expect(page.getByText('Jurisprudência').first()).toBeVisible()
    await expect(page.getByText('Doutrina').first()).toBeVisible()
  })
})