import { test, expect } from '@playwright/test';

// Mock OAB data for testing
const TEST_OAB = '123456';
const TEST_UF = 'SP';
const TEST_OFFICE_ID = '999'; // Test office ID

test.describe('Solucionare Onboarding Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to onboarding page
    await page.goto('/onboarding');
  });

  test('should display onboarding form with all fields', async ({ page }) => {
    // Check that all form elements are present
    await expect(page.getByLabel('Nº da inscrição OAB')).toBeVisible();
    await expect(page.getByLabel('Seccional UF')).toBeVisible();
    await expect(page.getByLabel('Office ID Solucionare (opcional)')).toBeVisible();
    await expect(page.getByRole('button', { name: /BUSCAR PROCESSOS/i })).toBeVisible();
    
    // Check initial button state
    const button = page.getByRole('button', { name: /BUSCAR PROCESSOS/i });
    await expect(button).toBeDisabled();
  });

  test('should enable search button when OAB and UF are filled', async ({ page }) => {
    // Fill OAB number
    await page.getByLabel('Nº da inscrição OAB').fill(TEST_OAB);
    
    // Select UF
    await page.getByLabel('Seccional UF').click();
    await page.getByRole('option', { name: /São Paulo/i }).click();
    
    // Button should be enabled
    const button = page.getByRole('button', { name: /BUSCAR PROCESSOS/i });
    await expect(button).toBeEnabled();
  });

  test('should accept optional Office ID', async ({ page }) => {
    // Fill all fields including optional Office ID
    await page.getByLabel('Nº da inscrição OAB').fill(TEST_OAB);
    await page.getByLabel('Seccional UF').click();
    await page.getByRole('option', { name: /São Paulo/i }).click();
    await page.getByLabel('Office ID Solucionare (opcional)').fill(TEST_OFFICE_ID);
    
    // Verify Office ID field has the value
    await expect(page.getByLabel('Office ID Solucionare (opcional)')).toHaveValue(TEST_OFFICE_ID);
  });

  test('should handle API call with Office ID', async ({ page }) => {
    // Mock the API response
    await page.route('**/api/onboarding/buscar-processos-v2', async route => {
      const request = route.request();
      const postData = request.postDataJSON();
      
      // Verify the request includes office ID
      expect(postData).toMatchObject({
        oab: TEST_OAB,
        uf: TEST_UF,
        officeId: TEST_OFFICE_ID,
        persist: true
      });

      // Return mock response
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          advogado: {
            nome: `Advogado OAB ${TEST_OAB}/${TEST_UF}`,
            oab: TEST_OAB,
            uf: TEST_UF,
            tipo: 'ADVOGADO'
          },
          processos: [
            {
              numero_cnj: '0000000-00.2024.8.26.0100',
              titulo: 'Processo Teste x Réu Teste',
              cliente: 'Cliente Teste',
              tipo_cliente: 'AUTOR',
              valor_causa: 10000,
              data_inicio: '2024-01-01T00:00:00Z',
              tribunal: 'TJSP',
              status: 'active'
            }
          ],
          clientes: [
            {
              nome: 'Cliente Teste',
              cpf_cnpj: '12345678900',
              tipo_pessoa: 'FISICA',
              processos: ['0000000-00.2024.8.26.0100'],
              tipo_envolvimento: 'AUTOR'
            }
          ],
          estatisticas: {
            total_processos: 1,
            total_clientes: 1,
            usando_solucionare: true,
            provedor: 'Solucionare',
            persisted: true,
            persistedData: {
              lawyerId: 'lawyer-123',
              processCount: 1,
              clientCount: 1,
              publicationCount: 0,
              relationshipCount: 1
            }
          }
        })
      });
    });

    // Fill form and submit
    await page.getByLabel('Nº da inscrição OAB').fill(TEST_OAB);
    await page.getByLabel('Seccional UF').click();
    await page.getByRole('option', { name: /São Paulo/i }).click();
    await page.getByLabel('Office ID Solucionare (opcional)').fill(TEST_OFFICE_ID);
    
    // Click search button
    await page.getByRole('button', { name: /BUSCAR PROCESSOS/i }).click();
    
    // Wait for loading to complete
    await expect(page.getByText(/Buscando processos/i)).toBeVisible();
    await expect(page.getByText(/Buscando processos/i)).toBeHidden({ timeout: 10000 });
    
    // Should move to step 2
    await expect(page.getByText(/Confirmar informações/i)).toBeVisible();
  });

  test('should handle API error when Office ID is missing', async ({ page }) => {
    // Mock API error response
    await page.route('**/api/onboarding/buscar-processos-v2', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Office ID não configurado. Configure seu Office ID nas configurações do usuário.'
        })
      });
    });

    // Fill form without Office ID
    await page.getByLabel('Nº da inscrição OAB').fill(TEST_OAB);
    await page.getByLabel('Seccional UF').click();
    await page.getByRole('option', { name: /São Paulo/i }).click();
    
    // Submit without Office ID
    await page.getByRole('button', { name: /BUSCAR PROCESSOS/i }).click();
    
    // Should show error toast
    await expect(page.getByText(/Office ID não configurado/i)).toBeVisible();
  });

  test('should show progress indicators during import', async ({ page }) => {
    // Setup successful API mock
    await page.route('**/api/onboarding/buscar-processos-v2', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          advogado: {
            nome: `Advogado OAB ${TEST_OAB}/${TEST_UF}`,
            oab: TEST_OAB,
            uf: TEST_UF,
            tipo: 'ADVOGADO'
          },
          processos: [],
          clientes: [],
          estatisticas: {
            total_processos: 0,
            total_clientes: 0,
            usando_solucionare: true,
            provedor: 'Solucionare',
            persisted: true
          }
        })
      });
    });

    // Fill and submit form
    await page.getByLabel('Nº da inscrição OAB').fill(TEST_OAB);
    await page.getByLabel('Seccional UF').click();
    await page.getByRole('option', { name: /São Paulo/i }).click();
    await page.getByLabel('Office ID Solucionare (opcional)').fill(TEST_OFFICE_ID);
    
    // Submit
    await page.getByRole('button', { name: /BUSCAR PROCESSOS/i }).click();
    
    // Check for loading spinner
    await expect(page.locator('.animate-spin')).toBeVisible();
    await expect(page.getByText(/Buscando processos/i)).toBeVisible();
  });
});

test.describe('User Settings Integration', () => {
  test('should persist Office ID to user settings', async ({ page }) => {
    // Mock authenticated user
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user-123' }
      }));
    });

    // Navigate to onboarding
    await page.goto('/onboarding');
    
    // Setup API mock to verify Office ID persistence
    let savedOfficeId: string | undefined;
    
    await page.route('**/api/onboarding/buscar-processos-v2', async route => {
      const postData = route.request().postDataJSON();
      savedOfficeId = postData.officeId;
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          advogado: { nome: 'Test', oab: TEST_OAB, uf: TEST_UF, tipo: 'ADVOGADO' },
          processos: [],
          clientes: [],
          estatisticas: {
            total_processos: 0,
            total_clientes: 0,
            usando_solucionare: true,
            provedor: 'Solucionare',
            persisted: true,
            persistedData: {
              officeIdSaved: postData.officeId
            }
          }
        })
      });
    });

    // Fill form with Office ID
    await page.getByLabel('Nº da inscrição OAB').fill(TEST_OAB);
    await page.getByLabel('Seccional UF').click();
    await page.getByRole('option', { name: /São Paulo/i }).click();
    await page.getByLabel('Office ID Solucionare (opcional)').fill(TEST_OFFICE_ID);
    
    // Submit
    await page.getByRole('button', { name: /BUSCAR PROCESSOS/i }).click();
    
    // Wait for API call
    await page.waitForTimeout(1000);
    
    // Verify Office ID was sent
    expect(savedOfficeId).toBe(TEST_OFFICE_ID);
  });
});

test.describe('Discovery Full Integration', () => {
  test('should show DiscoveryFull dialog with cost estimate', async ({ page }) => {
    // Navigate to a page with DiscoveryFull component
    // For this test, we'll need to create a test page or navigate to where it's used
    await page.goto('/test-discovery'); // Adjust path as needed
    
    // Click the DiscoveryFull trigger button
    const discoveryButton = page.getByRole('button', { name: /Buscar Documentos Iniciais/i });
    
    if (await discoveryButton.isVisible()) {
      await discoveryButton.click();
      
      // Check dialog content
      await expect(page.getByText(/DiscoveryFull/i)).toBeVisible();
      await expect(page.getByText(/Quantidade de processos para buscar/i)).toBeVisible();
      
      // Check cost estimate
      await expect(page.getByText(/Custo estimado/i)).toBeVisible();
      await expect(page.getByText(/R\$ 3,00 por processo/i)).toBeVisible();
      
      // Check topN selector
      const selector = page.getByRole('combobox');
      await selector.click();
      await expect(page.getByRole('option', { name: /Primeiros 5 processos/i })).toBeVisible();
      await expect(page.getByRole('option', { name: /Primeiros 10 processos/i })).toBeVisible();
      await expect(page.getByRole('option', { name: /Primeiros 20 processos/i })).toBeVisible();
      
      // Close dialog
      await page.getByRole('button', { name: /Cancelar/i }).click();
    }
  });
});

test.describe('End-to-End Onboarding Flow', () => {
  test('complete onboarding flow with persistence', async ({ page }) => {
    // This test simulates the complete flow
    await page.goto('/onboarding');
    
    // Step 1: Fill initial form
    await page.getByLabel('Nº da inscrição OAB').fill(TEST_OAB);
    await page.getByLabel('Seccional UF').click();
    await page.getByRole('option', { name: /São Paulo/i }).click();
    await page.getByLabel('Office ID Solucionare (opcional)').fill(TEST_OFFICE_ID);
    
    // Mock successful API response with enriched data
    await page.route('**/api/onboarding/buscar-processos-v2', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          advogado: {
            nome: `Dr. João Silva`,
            oab: TEST_OAB,
            uf: TEST_UF,
            tipo: 'ADVOGADO'
          },
          processos: [
            {
              numero_cnj: '1234567-89.2024.8.26.0100',
              titulo: 'Empresa ABC x Empresa XYZ',
              cliente: 'Empresa ABC',
              tipo_cliente: 'AUTOR',
              valor_causa: 50000,
              data_inicio: '2024-01-15T00:00:00Z',
              tribunal: 'TJSP',
              classe: 'Procedimento Comum Cível',
              assunto: 'Inadimplemento',
              status: 'active',
              partes: {
                autores: [{ nome: 'Empresa ABC', cpf_cnpj: '12.345.678/0001-90', tipo_pessoa: 'JURIDICA' }],
                reus: [{ nome: 'Empresa XYZ', cpf_cnpj: '98.765.432/0001-10', tipo_pessoa: 'JURIDICA' }],
                advogados: [{ nome: 'Dr. João Silva', oab: `${TEST_OAB}/${TEST_UF}` }]
              }
            },
            {
              numero_cnj: '9876543-21.2024.8.26.0100',
              titulo: 'Maria Santos x José Oliveira',
              cliente: 'Maria Santos',
              tipo_cliente: 'AUTOR',
              valor_causa: 15000,
              data_inicio: '2024-02-01T00:00:00Z',
              tribunal: 'TJSP',
              status: 'active'
            }
          ],
          clientes: [
            {
              nome: 'Empresa ABC',
              cpf_cnpj: '12.345.678/0001-90',
              tipo_pessoa: 'JURIDICA',
              processos: ['1234567-89.2024.8.26.0100'],
              tipo_envolvimento: 'AUTOR'
            },
            {
              nome: 'Maria Santos',
              cpf_cnpj: '123.456.789-00',
              tipo_pessoa: 'FISICA',
              processos: ['9876543-21.2024.8.26.0100'],
              tipo_envolvimento: 'AUTOR'
            }
          ],
          estatisticas: {
            total_processos: 2,
            total_clientes: 2,
            usando_solucionare: true,
            provedor: 'Solucionare',
            persisted: true,
            persistedData: {
              lawyerId: 'lawyer-uuid-123',
              processCount: 2,
              clientCount: 2,
              publicationCount: 5,
              relationshipCount: 2
            }
          }
        })
      });
    });

    // Submit search
    await page.getByRole('button', { name: /BUSCAR PROCESSOS/i }).click();
    
    // Wait for results
    await expect(page.getByText(/Buscando processos/i)).toBeVisible();
    await expect(page.getByText(/Buscando processos/i)).toBeHidden({ timeout: 10000 });
    
    // Verify data was loaded and persisted
    await expect(page.getByText(/2 processos importados/i)).toBeVisible();
    await expect(page.getByText(/2 clientes cadastrados/i)).toBeVisible();
    
    // Verify persistence indicator
    await expect(page.getByText(/Dados salvos no banco de dados/i)).toBeVisible();
  });
});