import { test, expect } from '@playwright/test';

test.describe('Authentication System - Complete Flow', () => {
  
  test.describe('Registration Flow', () => {
    test('should register new user successfully', async ({ page }) => {
      await page.goto('/signup');
      
      // Fill registration form
      await page.getByLabel('Nome completo').fill('João da Silva');
      await page.getByLabel('E-mail').fill(`test+${Date.now()}@freelaw.com.br`);
      await page.getByLabel('Senha').fill('senha123!@#');
      await page.getByLabel('Confirmar senha').fill('senha123!@#');
      await page.getByLabel('Aceito os termos').check();
      
      // Submit form
      await page.getByRole('button', { name: /Criar conta/i }).click();
      
      // Should redirect to verification page
      await expect(page).toHaveURL(/.*verificar-email/);
      await expect(page.getByText('Verifique seu e-mail')).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/signup');
      
      // Try to submit empty form
      await page.getByRole('button', { name: /Criar conta/i }).click();
      
      // Should show validation errors
      await expect(page.getByText('Nome é obrigatório')).toBeVisible();
      await expect(page.getByText('E-mail é obrigatório')).toBeVisible();
      await expect(page.getByText('Senha é obrigatória')).toBeVisible();
    });

    test('should validate password strength', async ({ page }) => {
      await page.goto('/signup');
      
      await page.getByLabel('Senha').fill('123');
      await page.getByLabel('Nome completo').click(); // Trigger validation
      
      await expect(page.getByText('Senha deve ter pelo menos 8 caracteres')).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/signup');
      
      await page.getByLabel('E-mail').fill('email-invalido');
      await page.getByLabel('Nome completo').click();
      
      await expect(page.getByText('E-mail inválido')).toBeVisible();
    });

    test('should validate password confirmation', async ({ page }) => {
      await page.goto('/signup');
      
      await page.getByLabel('Senha').fill('senha123');
      await page.getByLabel('Confirmar senha').fill('senha456');
      await page.getByLabel('Nome completo').click();
      
      await expect(page.getByText('Senhas não coincidem')).toBeVisible();
    });
  });

  test.describe('Login Flow', () => {
    test('should login with valid credentials', async ({ page }) => {
      await page.goto('/login');
      
      // Use test credentials
      await page.getByLabel('E-mail').fill('admin@freelaw.com.br');
      await page.getByLabel('Senha').fill('admin123');
      
      await page.getByRole('button', { name: /Entrar/i }).click();
      
      // Should redirect to dashboard
      await expect(page).toHaveURL(/.*\/$/);
      await expect(page.getByText('Dashboard')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');
      
      await page.getByLabel('E-mail').fill('invalid@test.com');
      await page.getByLabel('Senha').fill('wrongpassword');
      
      await page.getByRole('button', { name: /Entrar/i }).click();
      
      await expect(page.getByText('Credenciais inválidas')).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/login');
      
      await page.getByRole('button', { name: /Entrar/i }).click();
      
      await expect(page.getByText('E-mail é obrigatório')).toBeVisible();
      await expect(page.getByText('Senha é obrigatória')).toBeVisible();
    });

    test('should remember user session', async ({ page, context }) => {
      await page.goto('/login');
      
      await page.getByLabel('E-mail').fill('admin@freelaw.com.br');
      await page.getByLabel('Senha').fill('admin123');
      await page.getByLabel('Lembrar de mim').check();
      
      await page.getByRole('button', { name: /Entrar/i }).click();
      
      // Close and reopen browser
      await page.close();
      const newPage = await context.newPage();
      await newPage.goto('/');
      
      // Should still be logged in
      await expect(newPage.getByText('Dashboard')).toBeVisible();
    });
  });

  test.describe('Logout Flow', () => {
    test('should logout successfully', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.getByLabel('E-mail').fill('admin@freelaw.com.br');
      await page.getByLabel('Senha').fill('admin123');
      await page.getByRole('button', { name: /Entrar/i }).click();
      
      // Logout
      await page.getByRole('button', { name: /Sair/i }).click();
      
      // Should redirect to login
      await expect(page).toHaveURL(/.*login/);
    });
  });

  test.describe('Password Recovery', () => {
    test('should send recovery email', async ({ page }) => {
      await page.goto('/forgot-password');
      
      await page.getByLabel('E-mail').fill('test@freelaw.com.br');
      await page.getByRole('button', { name: /Enviar/i }).click();
      
      await expect(page.getByText('E-mail de recuperação enviado')).toBeVisible();
    });

    test('should validate email format in recovery', async ({ page }) => {
      await page.goto('/forgot-password');
      
      await page.getByLabel('E-mail').fill('invalid-email');
      await page.getByRole('button', { name: /Enviar/i }).click();
      
      await expect(page.getByText('E-mail inválido')).toBeVisible();
    });
  });

  test.describe('OAuth Integration', () => {
    test('should show Google OAuth button', async ({ page }) => {
      await page.goto('/login');
      
      await expect(page.getByRole('button', { name: /Continuar com Google/i })).toBeVisible();
    });

    test('should show Microsoft OAuth button', async ({ page }) => {
      await page.goto('/login');
      
      await expect(page.getByRole('button', { name: /Continuar com Microsoft/i })).toBeVisible();
    });
  });

  test.describe('Session Management', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.goto('/dashboard');
      
      await expect(page).toHaveURL(/.*login/);
    });

    test('should refresh session automatically', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.getByLabel('E-mail').fill('admin@freelaw.com.br');
      await page.getByLabel('Senha').fill('admin123');
      await page.getByRole('button', { name: /Entrar/i }).click();
      
      // Wait and check session is still valid
      await page.waitForTimeout(2000);
      await page.reload();
      
      await expect(page.getByText('Dashboard')).toBeVisible();
    });

    test('should handle session expiry gracefully', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.getByLabel('E-mail').fill('admin@freelaw.com.br');
      await page.getByLabel('Senha').fill('admin123');
      await page.getByRole('button', { name: /Entrar/i }).click();
      
      // Mock session expiry
      await page.evaluate(() => {
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
      });
      
      // Try to access protected route
      await page.goto('/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL(/.*login/);
    });
  });

  test.describe('Access Control', () => {
    test('should protect admin routes', async ({ page }) => {
      await page.goto('/admin');
      
      await expect(page).toHaveURL(/.*login/);
    });

    test('should protect provider routes', async ({ page }) => {
      await page.goto('/portal-prestador/dashboard');
      
      await expect(page).toHaveURL(/.*login/);
    });

    test('should allow access to public routes', async ({ page }) => {
      await page.goto('/');
      
      await expect(page.getByText('Freelaw AI Studio')).toBeVisible();
    });
  });
});



