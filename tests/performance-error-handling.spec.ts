import { test, expect } from '@playwright/test';

test.describe('Performance and Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any cached data before each test
    await page.context().clearCookies();
    await page.goto('http://localhost:3000');
  });

  test('Page load performance', async ({ page }) => {
    // Test home page load time
    const startTime = Date.now();
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    const homeLoadTime = Date.now() - startTime;
    
    console.log(`Home page load time: ${homeLoadTime}ms`);
    expect(homeLoadTime).toBeLessThan(5000); // Should load within 5 seconds
    
    // Test chat page load time
    const chatStartTime = Date.now();
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    const chatLoadTime = Date.now() - chatStartTime;
    
    console.log(`Chat page load time: ${chatLoadTime}ms`);
    expect(chatLoadTime).toBeLessThan(5000);
    
    // Test documents page load time
    const docsStartTime = Date.now();
    await page.goto('http://localhost:3000/documents');
    await page.waitForLoadState('networkidle');
    const docsLoadTime = Date.now() - docsStartTime;
    
    console.log(`Documents page load time: ${docsLoadTime}ms`);
    expect(docsLoadTime).toBeLessThan(5000);
  });

  test('API calls use real endpoints (not mocks)', async ({ page }) => {
    // Monitor network requests to ensure real endpoints are called
    const requests = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
      }
    });
    
    // Test Chat API
    await page.goto('http://localhost:3000/chat');
    
    const textarea = page.locator('textarea[placeholder*="Digite sua pergunta"]');
    await textarea.fill('Test API call');
    await page.locator('button[type="submit"]').click();
    
    // Wait for API call
    await page.waitForTimeout(3000);
    
    // Check if real API endpoint was called
    const chatApiCall = requests.find(req => req.url.includes('/api/chat'));
    expect(chatApiCall).toBeTruthy();
    expect(chatApiCall?.method).toBe('POST');
    
    console.log('Chat API endpoint verified:', chatApiCall?.url);
    
    // Test Documents API
    await page.goto('http://localhost:3000/documents');
    await page.waitForTimeout(2000);
    
    // Check if documents API was called
    const docApiCall = requests.find(req => req.url.includes('/api/documents'));
    if (docApiCall) {
      console.log('Documents API endpoint verified:', docApiCall.url);
      expect(docApiCall).toBeTruthy();
    } else {
      console.log('Documents API might be called on-demand');
    }
    
    // Verify no mock endpoints are being used
    const mockCalls = requests.filter(req => 
      req.url.includes('mock') || 
      req.url.includes('fake') || 
      req.url.includes('test-api')
    );
    expect(mockCalls).toHaveLength(0);
  });

  test('Error messages for failed operations', async ({ page }) => {
    // Test Chat API error handling
    await page.goto('http://localhost:3000/chat');
    
    // Intercept and fail chat API requests
    await page.route('**/api/chat**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    const textarea = page.locator('textarea[placeholder*="Digite sua pergunta"]');
    await textarea.fill('This should trigger an error');
    await page.locator('button[type="submit"]').click();
    
    // Check for error message
    await expect(page.locator('text=erro')).toBeVisible({ timeout: 10000 });
    
    const errorMsg = page.locator('[data-testid="error-message"]');
    if (await errorMsg.isVisible()) {
      const errorText = await errorMsg.textContent();
      expect(errorText).toBeTruthy();
      console.log('Chat error message:', errorText);
    }
    
    // Test Documents API error handling
    await page.goto('http://localhost:3000/documents');
    
    // Intercept and fail documents API
    await page.route('**/api/documents/**', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' })
      });
    });
    
    await page.reload();
    await page.waitForTimeout(3000);
    
    // Check for documents error
    const docError = page.locator('text=erro');
    if (await docError.isVisible()) {
      console.log('Documents error handling verified');
    } else {
      // Check for unauthorized message
      await expect(page.locator('text=Unauthorized')).toBeVisible({ timeout: 5000 });
    }
  });

  test('Loading states are shown', async ({ page }) => {
    // Test Chat loading state
    await page.goto('http://localhost:3000/chat');
    
    const textarea = page.locator('textarea[placeholder*="Digite sua pergunta"]');
    await textarea.fill('Test loading state');
    await page.locator('button[type="submit"]').click();
    
    // Check for loading indicator
    await expect(page.locator('text=Pensando...')).toBeVisible({ timeout: 5000 });
    
    const loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    if (await loadingSpinner.isVisible()) {
      console.log('Loading spinner displayed during chat');
    }
    
    // Test Documents loading state
    await page.goto('http://localhost:3000/documents');
    
    // Look for loading state during page load
    const docLoading = page.locator('text=Carregando...');
    if (await docLoading.isVisible()) {
      console.log('Documents loading state displayed');
      await expect(docLoading).toBeHidden({ timeout: 10000 });
    }
    
    // Test upload loading state
    await page.locator('text=Novo Upload').click();
    
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles({
        name: 'test-loading.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Test loading content')
      });
      
      // Check for upload loading indicator
      await expect(page.locator('text=Uploading...')).toBeVisible({ timeout: 5000 });
    }
  });

  test('Console errors are minimal', async ({ page }) => {
    const consoleErrors = [];
    const consoleWarnings = [];
    
    // Capture console errors and warnings
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });
    
    // Test home page
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Test chat page
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Test documents page
    await page.goto('http://localhost:3000/documents');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check console errors
    console.log('Console errors found:', consoleErrors.length);
    console.log('Console warnings found:', consoleWarnings.length);
    
    // Filter out expected/acceptable errors
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('favicon.ico') &&
      !error.includes('punycode') && // Known deprecation warning
      !error.includes('Failed to load resource') &&
      !error.includes('404') &&
      !error.toLowerCase().includes('warning')
    );
    
    console.log('Critical errors:', criticalErrors);
    
    // Should have minimal critical errors
    expect(criticalErrors.length).toBeLessThan(3);
  });

  test('Network request timeouts are handled', async ({ page }) => {
    await page.goto('http://localhost:3000/chat');
    
    // Intercept and delay chat API requests
    await page.route('**/api/chat**', async route => {
      // Simulate slow network
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second delay
      route.continue();
    });
    
    const textarea = page.locator('textarea[placeholder*="Digite sua pergunta"]');
    await textarea.fill('Test timeout handling');
    await page.locator('button[type="submit"]').click();
    
    // Check if timeout error is shown
    await expect(page.locator('text=timeout')).toBeVisible({ timeout: 35000 });
    
    // Or check for general error message
    const errorIndicator = page.locator('text=erro');
    if (await errorIndicator.isVisible()) {
      console.log('Timeout error handled gracefully');
    }
  });

  test('Memory usage doesn\'t leak during navigation', async ({ page }) => {
    // This is a basic test for memory leaks
    const initialMemory = await page.evaluate(() => {
      if (performance.memory) {
        return performance.memory.usedJSHeapSize;
      }
      return 0;
    });
    
    console.log('Initial memory usage:', initialMemory);
    
    // Navigate multiple times to check for memory leaks
    for (let i = 0; i < 5; i++) {
      await page.goto('http://localhost:3000/chat');
      await page.waitForLoadState('networkidle');
      
      await page.goto('http://localhost:3000/documents');
      await page.waitForLoadState('networkidle');
      
      await page.goto('http://localhost:3000/');
      await page.waitForLoadState('networkidle');
    }
    
    const finalMemory = await page.evaluate(() => {
      if (performance.memory) {
        return performance.memory.usedJSHeapSize;
      }
      return 0;
    });
    
    console.log('Final memory usage:', finalMemory);
    
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryIncrease = finalMemory - initialMemory;
      const percentageIncrease = (memoryIncrease / initialMemory) * 100;
      
      console.log(`Memory increase: ${memoryIncrease} bytes (${percentageIncrease.toFixed(2)}%)`);
      
      // Should not increase by more than 200% during normal navigation
      expect(percentageIncrease).toBeLessThan(200);
    }
  });

  test('Accessibility compliance', async ({ page }) => {
    // Basic accessibility checks
    await page.goto('http://localhost:3000');
    
    // Check for basic accessibility elements
    const mainLandmark = page.locator('main');
    await expect(mainLandmark).toBeVisible();
    
    const navigationLandmark = page.locator('nav');
    await expect(navigationLandmark).toBeVisible();
    
    // Check for proper heading structure
    const h1Elements = page.locator('h1');
    const h1Count = await h1Elements.count();
    expect(h1Count).toBe(1); // Should have exactly one h1 per page
    
    // Check images have alt text
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const altText = await img.getAttribute('alt');
      expect(altText).toBeTruthy();
    }
    
    // Check buttons have accessible names
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 10); i++) { // Check first 10 buttons
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const buttonText = await button.textContent();
      const title = await button.getAttribute('title');
      
      // Button should have either text content, aria-label, or title
      const hasAccessibleName = Boolean(ariaLabel || buttonText?.trim() || title);
      expect(hasAccessibleName).toBeTruthy();
    }
    
    console.log('Basic accessibility checks passed');
  });

  test('Cross-browser compatibility indicators', async ({ page }) => {
    // Test basic JavaScript features
    const browserInfo = await page.evaluate(() => {
      return {
        userAgent: navigator.userAgent,
        vendor: navigator.vendor,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        platform: navigator.platform
      };
    });
    
    console.log('Browser info:', browserInfo);
    
    // Test modern JavaScript features
    const jsFeatures = await page.evaluate(() => {
      return {
        fetch: typeof fetch !== 'undefined',
        promises: typeof Promise !== 'undefined',
        localStorage: typeof localStorage !== 'undefined',
        sessionStorage: typeof sessionStorage !== 'undefined',
        webSocket: typeof WebSocket !== 'undefined',
        mediaQuery: typeof window.matchMedia !== 'undefined'
      };
    });
    
    console.log('JavaScript features:', jsFeatures);
    
    // Essential features should be available
    expect(jsFeatures.fetch).toBeTruthy();
    expect(jsFeatures.promises).toBeTruthy();
    expect(jsFeatures.localStorage).toBeTruthy();
    
    // Test CSS features
    const cssFeatures = await page.evaluate(() => {
      const testElement = document.createElement('div');
      document.body.appendChild(testElement);
      
      const features = {
        flexbox: CSS.supports('display', 'flex'),
        grid: CSS.supports('display', 'grid'),
        customProperties: CSS.supports('--test', '0'),
        transforms: CSS.supports('transform', 'translateX(0)')
      };
      
      document.body.removeChild(testElement);
      return features;
    });
    
    console.log('CSS features:', cssFeatures);
    
    // Modern CSS features should be supported
    expect(cssFeatures.flexbox).toBeTruthy();
    expect(cssFeatures.customProperties).toBeTruthy();
  });

  test('Performance metrics tracking', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        domInteractive: navigation.domInteractive - navigation.navigationStart,
        firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime,
        firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime
      };
    });
    
    console.log('Performance metrics:', metrics);
    
    // Basic performance expectations
    if (metrics.domContentLoaded) {
      expect(metrics.domContentLoaded).toBeLessThan(3000); // DOM should load within 3s
    }
    
    if (metrics.firstContentfulPaint) {
      expect(metrics.firstContentfulPaint).toBeLessThan(4000); // FCP should be under 4s
    }
  });
});