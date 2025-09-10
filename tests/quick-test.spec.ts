import { test, expect } from '@playwright/test'

test.describe('Quick Module Tests', () => {
  test('Contacts API should return data', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/contacts')
    expect(response.ok()).toBeTruthy()
    
    const data = await response.json()
    expect(Array.isArray(data)).toBeTruthy()
    expect(data.length).toBeGreaterThan(0)
    expect(data[0]).toHaveProperty('nome')
  })

  test('Contacts page should load', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/contacts', {
      waitUntil: 'networkidle',
      timeout: 10000
    })
    
    // Check if page loads without error
    expect(response?.status()).toBeLessThan(400)
  })

  test('Agenda page should load', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/agenda', {
      waitUntil: 'networkidle',
      timeout: 10000
    })
    
    // Check if page loads without error
    expect(response?.status()).toBeLessThan(400)
  })
})