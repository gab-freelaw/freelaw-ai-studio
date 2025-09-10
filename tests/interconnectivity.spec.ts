import { test, expect } from '@playwright/test';

test.describe('Feature Interconnectivity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002');
  });

  test('Unified layout persists across all pages', async ({ page }) => {
    // Check home page layout
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    await expect(page.locator('text=Freelaw AI')).toBeVisible();
    
    // Navigate to Chat - check layout persists
    await page.goto('http://localhost:3002/chat');
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    await expect(page.locator('text=Freelaw AI')).toBeVisible();
    await expect(page.locator('text=Chat IA')).toBeVisible();
    
    // Navigate to Documents - check layout persists
    await page.goto('http://localhost:3002/documents');
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    await expect(page.locator('text=Freelaw AI')).toBeVisible();
    await expect(page.locator('text=Documentos')).toBeVisible();
    
    // Check consistent header/navigation structure
    const navElements = page.locator('nav');
    await expect(navElements).toBeVisible();
  });

  test('Navigation state maintained across pages', async ({ page }) => {
    // Start on home page
    await expect(page).toHaveURL('http://localhost:3002/');
    
    // Navigate to chat
    await page.locator('text=Chat IA').click();
    await expect(page).toHaveURL(/.*\/chat/);
    
    // Check if navigation item is still highlighted
    const chatNavItem = page.locator('text=Chat IA').locator('..');
    await expect(chatNavItem).toHaveClass(/active|selected|current/);
    
    // Navigate to documents
    await page.locator('text=Documentos').click();
    await expect(page).toHaveURL(/.*\/documents/);
    
    // Check if documents navigation item is now highlighted
    const docsNavItem = page.locator('text=Documentos').locator('..');
    await expect(docsNavItem).toHaveClass(/active|selected|current/);
    
    // Navigate back to home
    await page.locator('text=Freelaw AI').first().click();
    await expect(page).toHaveURL('http://localhost:3002/');
  });

  test('Quick actions work from any page', async ({ page }) => {
    // Test quick actions from home page
    const chatQuickAction = page.locator('text=Experimentar Chat IA');
    if (await chatQuickAction.isVisible()) {
      await chatQuickAction.click();
      await expect(page).toHaveURL(/.*\/chat/);
      
      // Go back to test from another page
      await page.goto('http://localhost:3002/documents');
      
      // Check if quick actions are available from documents page
      const quickActions = page.locator('[data-testid="quick-actions"]');
      if (await quickActions.isVisible()) {
        const quickChatBtn = quickActions.locator('text=Chat');
        if (await quickChatBtn.isVisible()) {
          await quickChatBtn.click();
          await expect(page).toHaveURL(/.*\/chat/);
        }
      }
    }
    
    // Test petition quick action from different pages
    await page.goto('http://localhost:3002/documents');
    const createPetitionBtn = page.locator('text=Criar Petição');
    if (await createPetitionBtn.isVisible()) {
      await createPetitionBtn.click();
      // Should either navigate to petition page or open modal
      await page.waitForTimeout(2000);
      
      const petitionModal = page.locator('[role="dialog"]');
      const currentUrl = page.url();
      
      if (await petitionModal.isVisible()) {
        console.log('Petition modal opened from documents page');
      } else if (currentUrl.includes('petition')) {
        console.log('Navigated to petition page from documents page');
      }
    }
  });

  test('Sidebar state is maintained', async ({ page }) => {
    // Check initial sidebar state
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();
    
    // Navigate between pages and check sidebar consistency
    const pages = ['/chat', '/documents', '/'];
    
    for (const pagePath of pages) {
      await page.goto(`http://localhost:3002${pagePath}`);
      await expect(sidebar).toBeVisible();
      
      // Check sidebar content is consistent
      await expect(page.locator('text=Chat IA')).toBeVisible();
      await expect(page.locator('text=Documentos')).toBeVisible();
      
      // Test sidebar collapse/expand if available
      const toggleButton = page.locator('[data-testid="sidebar-toggle"]');
      if (await toggleButton.isVisible()) {
        await toggleButton.click();
        await page.waitForTimeout(500);
        await toggleButton.click();
        await page.waitForTimeout(500);
        await expect(sidebar).toBeVisible();
      }
    }
  });

  test('Cross-feature functionality - Chat to Documents', async ({ page }) => {
    // Go to chat and ask about document analysis
    await page.goto('http://localhost:3002/chat');
    
    const documentQuery = 'Como posso analisar um documento jurídico usando a plataforma?';
    
    const textarea = page.locator('textarea[placeholder*="Digite sua pergunta"]');
    await textarea.fill(documentQuery);
    await page.locator('button:has(.lucide-send)').click();
    
    // Wait for AI response
    await expect(page.locator('text=Pensando...')).toBeHidden({ timeout: 15000 });
    
    // Look for navigation suggestion in AI response
    const aiResponse = page.locator('[data-testid="ai-message"]').last();
    const responseText = await aiResponse.textContent();
    
    // AI might suggest going to documents page
    if (responseText?.includes('documentos') || responseText?.includes('upload')) {
      // Test if there's a link to documents in the response
      const documentLink = aiResponse.locator('a[href*="documents"]');
      if (await documentLink.isVisible()) {
        await documentLink.click();
        await expect(page).toHaveURL(/.*\/documents/);
      }
    }
    
    // Alternatively, use navigation to go to documents
    await page.locator('text=Documentos').click();
    await expect(page).toHaveURL(/.*\/documents/);
    
    // Check if context is maintained (e.g., suggestion about document analysis)
    console.log('Cross-feature navigation from Chat to Documents works');
  });

  test('Cross-feature functionality - Documents to Chat', async ({ page }) => {
    // Start at documents page
    await page.goto('http://localhost:3002/documents');
    
    // Look for help or ask question functionality
    const helpBtn = page.locator('button:has-text("Ajuda")');
    const askBtn = page.locator('button:has-text("Perguntar")');
    
    if (await helpBtn.isVisible()) {
      await helpBtn.click();
      // Should navigate to chat or open chat modal
      await page.waitForTimeout(2000);
      
      if (page.url().includes('chat')) {
        await expect(page).toHaveURL(/.*\/chat/);
        // Check if context about documents is provided
        const textarea = page.locator('textarea[placeholder*="Digite sua pergunta"]');
        const placeholderValue = await textarea.getAttribute('placeholder');
        console.log('Chat opened with context:', placeholderValue);
      }
    } else if (await askBtn.isVisible()) {
      await askBtn.click();
      await page.waitForTimeout(2000);
    } else {
      // Manually navigate to chat from documents
      await page.locator('text=Chat IA').click();
      await expect(page).toHaveURL(/.*\/chat/);
      
      // Test asking a document-related question
      const docQuestion = 'Preciso de ajuda com upload de documentos';
      const textarea = page.locator('textarea[placeholder*="Digite sua pergunta"]');
      await textarea.fill(docQuestion);
      await page.locator('button:has(.lucide-send)').click();
      
      await expect(page.locator(`text=${docQuestion}`)).toBeVisible();
    }
  });

  test('Global search functionality (if exists)', async ({ page }) => {
    // Look for global search input
    const globalSearch = page.locator('input[placeholder*="Buscar"]').first();
    
    if (await globalSearch.isVisible()) {
      await globalSearch.fill('contrato');
      await page.keyboard.press('Enter');
      
      // Should search across all features (documents, chat history, etc.)
      await page.waitForTimeout(2000);
      
      // Check search results
      const searchResults = page.locator('[data-testid="search-results"]');
      if (await searchResults.isVisible()) {
        await expect(searchResults).toBeVisible();
        console.log('Global search functionality working');
      }
    } else {
      console.log('Global search not found - testing individual page searches');
      
      // Test documents page search
      await page.goto('http://localhost:3002/documents');
      const docSearch = page.locator('input[placeholder*="Buscar"]');
      if (await docSearch.isVisible()) {
        await docSearch.fill('test');
        await page.waitForTimeout(1000);
      }
    }
  });

  test('Shared user context across features', async ({ page }) => {
    // Test if user preferences/settings are maintained across pages
    
    // Check theme consistency
    const isDarkMode = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });
    
    await page.goto('http://localhost:3002/chat');
    const chatDarkMode = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });
    
    expect(isDarkMode).toBe(chatDarkMode);
    
    await page.goto('http://localhost:3002/documents');
    const docsDarkMode = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });
    
    expect(isDarkMode).toBe(docsDarkMode);
    
    // Test language consistency (if multi-language)
    const htmlLang = await page.getAttribute('html', 'lang');
    await page.goto('http://localhost:3002/chat');
    const chatHtmlLang = await page.getAttribute('html', 'lang');
    expect(htmlLang).toBe(chatHtmlLang);
  });

  test('Consistent error handling across features', async ({ page }) => {
    // Test network error handling consistency
    
    // Go to chat and try to trigger an error
    await page.goto('http://localhost:3002/chat');
    
    // Block network requests to simulate error
    await page.route('**/api/chat**', route => route.abort());
    
    const textarea = page.locator('textarea[placeholder*="Digite sua pergunta"]');
    await textarea.fill('Test error handling');
    await page.locator('button:has(.lucide-send)').click();
    
    // Check for error message
    const errorMessage = page.locator('text=erro');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    
    // Check error styling is consistent
    const errorElement = page.locator('[data-testid="error-message"]');
    if (await errorElement.isVisible()) {
      const errorClass = await errorElement.getAttribute('class');
      console.log('Error styling:', errorClass);
    }
    
    // Test documents page error handling
    await page.goto('http://localhost:3002/documents');
    
    // Block document API
    await page.route('**/api/documents/**', route => route.abort());
    
    // Try to load documents
    await page.reload();
    await page.waitForTimeout(3000);
    
    // Should show consistent error styling
    const docError = page.locator('text=erro');
    if (await docError.isVisible()) {
      const docErrorElement = page.locator('[data-testid="error-message"]');
      if (await docErrorElement.isVisible()) {
        const docErrorClass = await docErrorElement.getAttribute('class');
        console.log('Documents error styling:', docErrorClass);
      }
    }
  });

  test('Breadcrumb and history navigation', async ({ page }) => {
    // Test browser back/forward functionality
    await expect(page).toHaveURL('http://localhost:3002/');
    
    await page.locator('text=Chat IA').click();
    await expect(page).toHaveURL(/.*\/chat/);
    
    await page.locator('text=Documentos').click();
    await expect(page).toHaveURL(/.*\/documents/);
    
    // Test browser back button
    await page.goBack();
    await expect(page).toHaveURL(/.*\/chat/);
    
    await page.goBack();
    await expect(page).toHaveURL('http://localhost:3002/');
    
    // Test browser forward button
    await page.goForward();
    await expect(page).toHaveURL(/.*\/chat/);
    
    // Check if navigation state is maintained after browser navigation
    const chatNavItem = page.locator('text=Chat IA').locator('..');
    await expect(chatNavItem).toHaveClass(/active|selected|current/);
  });

  test('Mobile responsiveness consistency', async ({ page }) => {
    // Test mobile layout consistency across pages
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check home page mobile layout
    await expect(page.locator('h1')).toBeVisible();
    const mobileMenu = page.locator('[data-testid="mobile-menu-toggle"]');
    
    // Navigate to different pages and check mobile consistency
    const pages = ['/chat', '/documents'];
    
    for (const pagePath of pages) {
      await page.goto(`http://localhost:3002${pagePath}`);
      
      // Check if mobile navigation is available
      if (await mobileMenu.isVisible()) {
        await mobileMenu.click();
        await page.waitForTimeout(500);
        
        // Check if navigation items are accessible
        await expect(page.locator('text=Chat IA')).toBeVisible();
        await expect(page.locator('text=Documentos')).toBeVisible();
        
        // Close menu
        await mobileMenu.click();
        await page.waitForTimeout(500);
      }
      
      // Check if content is properly displayed on mobile
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();
      
      console.log(`Mobile layout verified for ${pagePath}`);
    }
    
    // Reset to desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});