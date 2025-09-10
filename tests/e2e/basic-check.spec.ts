import { test, expect } from '@playwright/test'

test.describe('Basic Functionality Check', () => {
  test('Homepage loads correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    
    // Check if page loads
    await expect(page).toHaveURL('http://localhost:3000/')
    
    // Check for main heading with Freelaw AI
    const heading = page.locator('h1').filter({ hasText: 'Freelaw AI' })
    await expect(heading).toBeVisible()
  })

  test('Login page is accessible', async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    
    // Check URL
    await expect(page).toHaveURL('http://localhost:3000/login')
    
    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button').filter({ hasText: 'Entrar' })).toBeVisible()
  })

  test('Provider portal landing page works', async ({ page }) => {
    await page.goto('http://localhost:3000/portal-prestador')
    
    // Check URL
    await expect(page).toHaveURL('http://localhost:3000/portal-prestador')
    
    // Check for main content
    const heading = page.locator('h1').filter({ hasText: 'Seja um Advogado Freelaw' })
    await expect(heading).toBeVisible()
    
    // Check for CTA buttons
    await expect(page.locator('text=Começar Agora')).toBeVisible()
    await expect(page.locator('text=Já sou cadastrado')).toBeVisible()
  })

  test('Provider registration page works', async ({ page }) => {
    await page.goto('http://localhost:3000/portal-prestador/cadastro')
    
    // Check URL
    await expect(page).toHaveURL('http://localhost:3000/portal-prestador/cadastro')
    
    // Check for onboarding elements
    await expect(page.locator('h1').filter({ hasText: 'Cadastro Inteligente' })).toBeVisible()
    await expect(page.locator('text=Verificação OAB')).toBeVisible()
  })

  test('Provider login page works', async ({ page }) => {
    await page.goto('http://localhost:3000/portal-prestador/login')
    
    // Check URL
    await expect(page).toHaveURL('http://localhost:3000/portal-prestador/login')
    
    // Check for login elements
    await expect(page.locator('h1').filter({ hasText: 'Portal do Prestador' })).toBeVisible()
    await expect(page.locator('input[placeholder*="SP123456"]')).toBeVisible()
  })

  test('Main navigation menu exists', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard')
    
    // Will redirect to login if not authenticated
    const url = page.url()
    expect(url).toContain('http://localhost:3000/')
    
    // Check if navigation exists on homepage
    await page.goto('http://localhost:3000/')
    const sidebar = page.locator('aside[data-testid="sidebar"]')
    await expect(sidebar).toBeVisible()
  })
})