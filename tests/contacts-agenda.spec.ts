import { test, expect } from '@playwright/test'

test.describe('Contacts Module Tests', () => {
  test('should display contacts page with all elements', async ({ page }) => {
    await page.goto('http://localhost:3000/contacts')
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Contatos')
    
    // Check stats cards
    await expect(page.locator('text="Total de Contatos"')).toBeVisible()
    await expect(page.locator('p.text-sm:text("Clientes")').first()).toBeVisible()
    await expect(page.locator('p.text-sm:text("Advogados")').first()).toBeVisible()
    await expect(page.locator('p.text-sm:text("Partes Contrárias")').first()).toBeVisible()
    
    // Check search and filter elements
    const searchInput = page.locator('input[placeholder*="Procure por nome"]')
    await expect(searchInput).toBeVisible()
    
    const filterSelect = page.locator('select').first()
    await expect(filterSelect).toBeVisible()
    
    // Check action buttons
    await expect(page.locator('button:has-text("Adicionar")')).toBeVisible()
    await expect(page.locator('button:has-text("Exportar")')).toBeVisible()
    
    // Check table headers
    await expect(page.locator('th:has-text("Tipo")')).toBeVisible()
    await expect(page.locator('th:has-text("Nome")')).toBeVisible()
    await expect(page.locator('th:has-text("Contato")')).toBeVisible()
  })

  test('should open and close add contact modal', async ({ page }) => {
    await page.goto('http://localhost:3000/contacts')
    
    // Open modal
    await page.locator('button:has-text("Adicionar")').click()
    await expect(page.locator('text="Novo Contato"')).toBeVisible()
    
    // Check form fields
    await expect(page.locator('label:has-text("Tipo")')).toBeVisible()
    await expect(page.locator('label:has-text("Nome")')).toBeVisible()
    await expect(page.locator('label:has-text("E-mail")')).toBeVisible()
    
    // Close modal
    await page.locator('button:has-text("Cancelar")').click()
    await expect(page.locator('text="Novo Contato"')).not.toBeVisible()
  })

  test('should filter contacts by type', async ({ page }) => {
    await page.goto('http://localhost:3000/contacts')
    
    // Select a filter
    const select = page.locator('select').first()
    await select.selectOption('CLIENTE')
    
    // Verify filter is applied
    const selectedValue = await select.inputValue()
    expect(selectedValue).toBe('CLIENTE')
  })
})

test.describe('Agenda Module Tests', () => {
  test('should display agenda page with calendar', async ({ page }) => {
    await page.goto('http://localhost:3000/agenda')
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Agenda')
    
    // Check stats cards
    await expect(page.locator('p.text-sm:text("Audiências")').first()).toBeVisible()
    await expect(page.locator('p.text-sm:text("Reuniões")').first()).toBeVisible()
    await expect(page.locator('p.text-sm:text("Prazos")').first()).toBeVisible()
    
    // Check calendar weekday headers
    await expect(page.locator('text="Dom"')).toBeVisible()
    await expect(page.locator('text="Seg"')).toBeVisible()
    await expect(page.locator('text="Ter"')).toBeVisible()
    
    // Check sidebar
    await expect(page.locator('text="Próximos Compromissos"')).toBeVisible()
    
    // Check action buttons
    await expect(page.locator('button:has-text("Adicionar")')).toBeVisible()
  })

  test('should navigate between months', async ({ page }) => {
    await page.goto('http://localhost:3000/agenda')
    
    // Get initial month
    const monthHeader = page.locator('h2').filter({ hasText: /\w+ \d{4}/ }).first()
    const initialMonth = await monthHeader.textContent()
    
    // Navigate to next month
    const nextButton = page.locator('button').filter({ has: page.locator('svg') }).nth(1)
    await nextButton.click()
    
    // Verify month changed
    await page.waitForTimeout(500)
    const newMonth = await monthHeader.textContent()
    expect(newMonth).not.toBe(initialMonth)
  })

  test('should open and close appointment modal', async ({ page }) => {
    await page.goto('http://localhost:3000/agenda')
    
    // Open modal
    await page.locator('button:has-text("Adicionar")').click()
    await expect(page.locator('text="Novo Compromisso"')).toBeVisible()
    
    // Check form fields
    await expect(page.locator('label:has-text("Tipo")')).toBeVisible()
    await expect(page.locator('label:has-text("Título")')).toBeVisible()
    await expect(page.locator('label:has-text("Data")').first()).toBeVisible()
    
    // Close modal
    await page.locator('button:has-text("Cancelar")').click()
    await expect(page.locator('text="Novo Compromisso"')).not.toBeVisible()
  })
})

test.describe('API Tests', () => {
  test('GET /api/contacts should return contacts list', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/contacts')
    
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    
    expect(Array.isArray(data)).toBeTruthy()
    expect(data.length).toBeGreaterThan(0)
    
    // Verify contact structure
    const contact = data[0]
    expect(contact).toHaveProperty('id')
    expect(contact).toHaveProperty('nome')
    expect(contact).toHaveProperty('tipo')
    expect(contact).toHaveProperty('created_at')
    expect(contact).toHaveProperty('updated_at')
  })

  test('POST /api/contacts should create new contact', async ({ request }) => {
    const newContact = {
      tipo: 'CLIENTE',
      nome: 'Test User ' + Date.now(),
      email: 'test@example.com',
      celular: '(11) 99999-9999'
    }
    
    const response = await request.post('http://localhost:3000/api/contacts', {
      data: newContact
    })
    
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    
    expect(data).toHaveProperty('id')
    expect(data.nome).toBe(newContact.nome)
    expect(data.tipo).toBe('CLIENTE')
    expect(data.email).toBe('test@example.com')
  })

  test('GET /api/contacts with filters should work', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/contacts?tipo=CLIENTE')
    
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    
    expect(Array.isArray(data)).toBeTruthy()
    
    // All returned contacts should be of type CLIENTE
    for (const contact of data) {
      expect(contact.tipo).toBe('CLIENTE')
    }
  })
})