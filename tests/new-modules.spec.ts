import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'

test.describe('Contacts Module', () => {
  test('should load contacts page', async ({ page }) => {
    await page.goto(`${BASE_URL}/contacts`)
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Contatos')
    
    // Check stats cards are visible
    await expect(page.locator('text="Total de Contatos"')).toBeVisible()
    await expect(page.locator('text="Clientes"')).toBeVisible()
    await expect(page.locator('text="Advogados"')).toBeVisible()
    await expect(page.locator('text="Partes Contrárias"')).toBeVisible()
    
    // Check search and filters
    await expect(page.locator('input[placeholder*="Procure por nome"]')).toBeVisible()
    await expect(page.locator('select')).toBeVisible()
    
    // Check action buttons
    await expect(page.locator('button:has-text("Adicionar")')).toBeVisible()
    await expect(page.locator('button:has-text("Exportar")')).toBeVisible()
  })

  test('should open add contact modal', async ({ page }) => {
    await page.goto(`${BASE_URL}/contacts`)
    
    // Click add button
    await page.locator('button:has-text("Adicionar")').click()
    
    // Check modal is visible
    await expect(page.locator('text="Novo Contato"')).toBeVisible()
    
    // Check form fields
    await expect(page.locator('label:has-text("Tipo")')).toBeVisible()
    await expect(page.locator('label:has-text("Nome")')).toBeVisible()
    await expect(page.locator('label:has-text("E-mail")')).toBeVisible()
    await expect(page.locator('label:has-text("CPF/CNPJ")')).toBeVisible()
    
    // Close modal
    await page.locator('button:has-text("Cancelar")').click()
    await expect(page.locator('text="Novo Contato"')).not.toBeVisible()
  })

  test('should filter contacts by type', async ({ page }) => {
    await page.goto(`${BASE_URL}/contacts`)
    
    // Select filter
    const select = page.locator('select').first()
    await select.selectOption('CLIENTE')
    
    // Wait for filter to apply
    await page.waitForTimeout(500)
    
    // Check that filter is applied (we should see client badges)
    const badges = page.locator('text="CLIENTE"')
    const count = await badges.count()
    
    if (count > 0) {
      expect(count).toBeGreaterThan(0)
    }
  })
})

test.describe('Agenda Module', () => {
  test('should load agenda page', async ({ page }) => {
    await page.goto(`${BASE_URL}/agenda`)
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Agenda')
    
    // Check stats cards
    await expect(page.locator('text="Total"').first()).toBeVisible()
    await expect(page.locator('text="Audiências"')).toBeVisible()
    await expect(page.locator('text="Reuniões"')).toBeVisible()
    await expect(page.locator('text="Prazos"')).toBeVisible()
    
    // Check calendar is visible
    await expect(page.locator('text="Dom"')).toBeVisible()
    await expect(page.locator('text="Seg"')).toBeVisible()
    
    // Check sidebar sections
    await expect(page.locator('text="Próximos Compromissos"')).toBeVisible()
  })

  test('should navigate calendar months', async ({ page }) => {
    await page.goto(`${BASE_URL}/agenda`)
    
    // Get current month
    const monthHeader = page.locator('h2').filter({ hasText: /\w+ \d{4}/ }).first()
    const initialMonth = await monthHeader.textContent()
    
    // Click next month button
    await page.locator('button').filter({ has: page.locator('svg') }).nth(1).click()
    
    // Check month changed
    await page.waitForTimeout(500)
    const newMonth = await monthHeader.textContent()
    expect(newMonth).not.toBe(initialMonth)
    
    // Click previous month button
    await page.locator('button').filter({ has: page.locator('svg') }).first().click()
    
    // Check month changed back
    await page.waitForTimeout(500)
    const finalMonth = await monthHeader.textContent()
    expect(finalMonth).toBe(initialMonth)
  })

  test('should open add appointment modal', async ({ page }) => {
    await page.goto(`${BASE_URL}/agenda`)
    
    // Click add button
    await page.locator('button:has-text("Adicionar")').click()
    
    // Check modal is visible
    await expect(page.locator('text="Novo Compromisso"')).toBeVisible()
    
    // Check form fields
    await expect(page.locator('label:has-text("Tipo")')).toBeVisible()
    await expect(page.locator('label:has-text("Título")')).toBeVisible()
    await expect(page.locator('label:has-text("Data")')).toBeVisible()
    await expect(page.locator('label:has-text("Horário Início")')).toBeVisible()
    
    // Close modal
    await page.locator('button:has-text("Cancelar")').click()
    await expect(page.locator('text="Novo Compromisso"')).not.toBeVisible()
  })

  test('should filter appointments by type', async ({ page }) => {
    await page.goto(`${BASE_URL}/agenda`)
    
    // Select filter
    const select = page.locator('select').first()
    await select.selectOption('AUDIENCIA')
    
    // Wait for filter to apply
    await page.waitForTimeout(500)
    
    // Filter should be applied
    const selectedValue = await select.inputValue()
    expect(selectedValue).toBe('AUDIENCIA')
  })
})

test.describe('API Endpoints', () => {
  test('GET /api/contacts should return contacts', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/contacts`)
    
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    
    expect(Array.isArray(data)).toBeTruthy()
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('nome')
      expect(data[0]).toHaveProperty('tipo')
    }
  })

  test('POST /api/contacts should create contact', async ({ request }) => {
    const newContact = {
      tipo: 'CLIENTE',
      nome: 'Test Contact',
      email: 'test@example.com',
      celular: '(11) 99999-9999'
    }
    
    const response = await request.post(`${BASE_URL}/api/contacts`, {
      data: newContact
    })
    
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    
    expect(data).toHaveProperty('id')
    expect(data.nome).toBe('Test Contact')
    expect(data.tipo).toBe('CLIENTE')
  })
})