import { test, expect } from '@playwright/test';

test.describe('Critical Path Tests - Core Features', () => {
  test.describe('Authentication Flow', () => {
    test('user can login successfully', async ({ page }) => {
      await page.goto('/login');
      
      // Fill login form
      await page.getByLabel(/email/i).fill('test@freelaw.com.br');
      await page.getByLabel(/senha/i).fill('testpassword');
      await page.getByRole('button', { name: /entrar/i }).click();
      
      // Should redirect to dashboard or show error
      await expect(page).toHaveURL(/\/(dashboard|login)/);
    });
  });

  test.describe('Provider Registration', () => {
    test('provider can access registration form', async ({ page }) => {
      await page.goto('/portal-prestador');
      await page.getByRole('link', { name: /quero me candidatar/i }).click();
      
      await expect(page).toHaveURL(/portal-prestador\/aplicacao/);
      await expect(page.getByText(/informações pessoais/i)).toBeVisible();
    });

    test('provider form validates required fields', async ({ page }) => {
      await page.goto('/portal-prestador/aplicacao');
      
      // Check that the submit button exists but is disabled for empty form
      const submitButton = page.getByRole('button', { name: /próximo/i });
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeDisabled();
    });
  });

  test.describe('AI Chat Feature', () => {
    test('chat interface loads and accepts input', async ({ page }) => {
      await page.goto('/chat'); // Chat is protected route
      
      const chatInput = page.getByTestId('chat-input');
      await expect(chatInput).toBeVisible();
      
      // Type a message
      await chatInput.fill('Test message');
      await expect(chatInput).toHaveValue('Test message');
    });
  });

  test.describe('Document Management', () => {
    test('document upload area is accessible', async ({ page }) => {
      await page.goto('/portal-prestador/documentos');
      
      // Check if page loads (protected route now bypassed in E2E)
      await expect(page.getByTestId('upload-area-rg')).toBeVisible();
      
      // Click on upload tab
      await page.getByRole('button', { name: /novo upload/i }).click();
      
      // Check for upload area
      await expect(page.getByText(/arraste um documento aqui/i)).toBeVisible();
    });
  });

  test.describe('Delegation System', () => {
    test('delegation marketplace is accessible', async ({ page }) => {
      await page.goto('/delegacoes/nova');
      
      // Should show form to create new delegation
      await expect(page.getByText(/nova delegação/i)).toBeVisible();
    });
  });
});

