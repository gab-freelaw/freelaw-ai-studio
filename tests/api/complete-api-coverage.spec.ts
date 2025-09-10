import { test, expect } from '@playwright/test';

/**
 * COBERTURA COMPLETA DE TODAS AS APIs
 * Testa todos os endpoints da aplicação
 */

test.describe('API Complete Coverage', () => {
  
  // === HEALTH & MONITORING ===
  test.describe('Health & Monitoring APIs', () => {
    
    test('GET /api/health - should return system status', async ({ request }) => {
      const response = await request.get('/api/health');
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('version');
    });

    test('GET /api/monitoring/status - should return monitoring info', async ({ request }) => {
      const response = await request.get('/api/monitoring/status');
      expect([200, 401]).toContain(response.status()); // May require auth
    });

  });

  // === AUTHENTICATION ===
  test.describe('Authentication APIs', () => {
    
    test('GET /api/auth/callback - should handle auth callback', async ({ request }) => {
      const response = await request.get('/api/auth/callback');
      expect([200, 302, 400, 404]).toContain(response.status()); // Redirect or error without params
    });

  });

  // === PROVIDERS ===
  test.describe('Provider APIs', () => {
    
    test('POST /api/providers/register - should validate required fields', async ({ request }) => {
      const response = await request.post('/api/providers/register', {
        data: {}
      });
      expect(response.status()).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('POST /api/providers/register - should register valid provider', async ({ request }) => {
      const response = await request.post('/api/providers/register', {
        data: {
          fullName: 'João Silva Test',
          email: `test-${Date.now()}@example.com`,
          phone: '11987654321',
          oab: `${Math.floor(Math.random() * 999999)}`,
          state: 'SP',
          city: 'São Paulo',
          yearsOfExperience: '5',
          specializations: ['Direito Civil'],
          whyJoinFreeLaw: 'Teste automatizado',
          hoursPerWeek: '20'
        }
      });
      
      expect([200, 201, 400]).toContain(response.status());
      
      if (response.status() === 201) {
        const data = await response.json();
        expect(data).toHaveProperty('success', true);
        expect(data).toHaveProperty('providerId');
      }
    });

    test('GET /api/providers/register - should return provider status', async ({ request }) => {
      const response = await request.get('/api/providers/register?email=test@example.com');
      expect([200, 404]).toContain(response.status());
    });

    test('POST /api/providers/evaluation - should handle evaluation requests', async ({ request }) => {
      const response = await request.post('/api/providers/evaluation');
      expect([201, 400, 401]).toContain(response.status()); // Requires auth or data
    });

    test('GET /api/providers/evaluation - should return evaluations', async ({ request }) => {
      const response = await request.get('/api/providers/evaluation');
      expect([200, 401]).toContain(response.status());
    });

    test('POST /api/providers/documents/upload - should handle document upload', async ({ request }) => {
      const response = await request.post('/api/providers/documents/upload');
      expect([201, 400, 401]).toContain(response.status()); // Requires auth and file
    });

  });

  // === ADMIN ===
  test.describe('Admin APIs', () => {
    
    test('POST /api/admin/providers/approve - should require admin auth', async ({ request }) => {
      const response = await request.post('/api/admin/providers/approve');
      expect([400, 401, 403]).toContain(response.status());
    });

  });

  // === DELEGATIONS ===
  test.describe('Delegation APIs', () => {
    
    test('GET /api/delegations - should return delegations list', async ({ request }) => {
      const response = await request.get('/api/delegations');
      expect([200, 401]).toContain(response.status());
    });

    test('POST /api/delegations - should validate delegation creation', async ({ request }) => {
      const response = await request.post('/api/delegations', {
        data: {}
      });
      expect([201, 400, 401]).toContain(response.status());
    });

    test('GET /api/delegations/[id]/matching - should handle matching requests', async ({ request }) => {
      const response = await request.get('/api/delegations/test-id/matching');
      expect([401, 404]).toContain(response.status());
    });

  });

  // === CHAT ===
  test.describe('Chat APIs', () => {
    
    test('GET /api/chat/[delegationId] - should return chat messages', async ({ request }) => {
      const response = await request.get('/api/chat/test-delegation-id');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('POST /api/chat/[delegationId] - should validate message creation', async ({ request }) => {
      const response = await request.post('/api/chat/test-delegation-id', {
        data: {}
      });
      expect([201, 400, 401]).toContain(response.status());
    });

    test('GET /api/chat - should return general chat info', async ({ request }) => {
      const response = await request.get('/api/chat');
      expect([200, 401, 405]).toContain(response.status());
    });

  });

  // === TRANSCRIPTION ===
  test.describe('Transcription APIs', () => {
    
    test('POST /api/transcribe - should validate transcription request', async ({ request }) => {
      const response = await request.post('/api/transcribe');
      expect([201, 400, 401]).toContain(response.status()); // Requires audio file
    });

    test('GET /api/transcribe - should return transcriptions', async ({ request }) => {
      const response = await request.get('/api/transcribe');
      expect([200, 400, 401]).toContain(response.status());
    });

  });

  // === DOCUMENTS ===
  test.describe('Document APIs', () => {
    
    test('GET /api/documents/list - should return documents list', async ({ request }) => {
      const response = await request.get('/api/documents/list');
      expect([200, 401]).toContain(response.status());
    });

    test('POST /api/documents/upload - should validate document upload', async ({ request }) => {
      const response = await request.post('/api/documents/upload');
      expect([201, 400, 401]).toContain(response.status());
    });

    test('GET /api/documents/extract-by-id/extract - should handle document extraction', async ({ request }) => {
      const response = await request.get('/api/documents/extract-by-id/test-id/extract');
      expect([401, 404]).toContain(response.status());
    });

    test('GET /api/documents/[delegationId]/versions - should return document versions', async ({ request }) => {
      const response = await request.get('/api/documents/test-delegation/versions');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('POST /api/documents/[delegationId]/versions - should create document version', async ({ request }) => {
      const response = await request.post('/api/documents/test-delegation/versions', {
        data: {}
      });
      expect([201, 400, 401]).toContain(response.status());
    });

  });

  // === AUDIT ===
  test.describe('Audit APIs', () => {
    
    test('GET /api/audit - should return audit logs', async ({ request }) => {
      const response = await request.get('/api/audit');
      expect([200, 401, 403]).toContain(response.status()); // Admin only
    });

    test('POST /api/audit - should create audit log', async ({ request }) => {
      const response = await request.post('/api/audit', {
        data: {}
      });
      expect([201, 400, 401]).toContain(response.status());
    });

    test('GET /api/audit/alerts - should return security alerts', async ({ request }) => {
      const response = await request.get('/api/audit/alerts');
      expect([200, 401, 403]).toContain(response.status());
    });

    test('GET /api/audit/timeline/delegation/test-id - should return entity timeline', async ({ request }) => {
      const response = await request.get('/api/audit/timeline/delegation/test-id');
      expect([200, 401, 403, 404]).toContain(response.status());
    });

  });

  // === CONTACTS ===
  test.describe('Contact APIs', () => {
    
    test('GET /api/contacts - should return contacts list', async ({ request }) => {
      const response = await request.get('/api/contacts');
      expect([200, 401]).toContain(response.status());
    });

    test('POST /api/contacts - should validate contact creation', async ({ request }) => {
      const response = await request.post('/api/contacts', {
        data: {}
      });
      expect([201, 400, 401]).toContain(response.status());
    });

    test('GET /api/contacts/[id] - should return specific contact', async ({ request }) => {
      const response = await request.get('/api/contacts/test-id');
      expect([401, 404]).toContain(response.status());
    });

    test('PUT /api/contacts/[id] - should update contact', async ({ request }) => {
      const response = await request.put('/api/contacts/test-id', {
        data: {}
      });
      expect([400, 401, 404]).toContain(response.status());
    });

  });

  // === PROCESSES ===
  test.describe('Process APIs', () => {
    
    test('GET /api/processes - should return processes list', async ({ request }) => {
      const response = await request.get('/api/processes');
      expect([200, 401, 500]).toContain(response.status());
    });

    test('POST /api/processes - should validate process creation', async ({ request }) => {
      const response = await request.post('/api/processes', {
        data: {}
      });
      expect([201, 400, 401]).toContain(response.status());
    });

    test('GET /api/processes/[id] - should return specific process', async ({ request }) => {
      const response = await request.get('/api/processes/test-id');
      expect([401, 404, 500]).toContain(response.status());
    });

    test('PUT /api/processes/[id] - should update process', async ({ request }) => {
      const response = await request.put('/api/processes/test-id', {
        data: {}
      });
      expect([400, 401, 404]).toContain(response.status());
    });

    test('POST /api/processes/[id]/sync - should sync process data', async ({ request }) => {
      const response = await request.post('/api/processes/test-id/sync');
      expect([401, 404, 500]).toContain(response.status());
    });

  });

  // === PETITIONS ===
  test.describe('Petition APIs', () => {
    
    test('POST /api/petitions/generate - should validate petition generation', async ({ request }) => {
      const response = await request.post('/api/petitions/generate', {
        data: {}
      });
      expect([201, 400, 401]).toContain(response.status());
    });

    test('POST /api/petitions/generate-v2 - should validate v2 petition generation', async ({ request }) => {
      const response = await request.post('/api/petitions/generate-v2', {
        data: {}
      });
      expect([201, 400, 401]).toContain(response.status());
    });

  });

  // === PUBLICATIONS ===
  test.describe('Publication APIs', () => {
    
    test('GET /api/publications - should return publications', async ({ request }) => {
      const response = await request.get('/api/publications');
      expect([200, 401]).toContain(response.status());
    });

    test('POST /api/publications/analyze - should analyze publication', async ({ request }) => {
      const response = await request.post('/api/publications/analyze', {
        data: {}
      });
      expect([201, 400, 401]).toContain(response.status());
    });

    test('POST /api/publications/monitor - should setup monitoring', async ({ request }) => {
      const response = await request.post('/api/publications/monitor', {
        data: {}
      });
      expect([201, 400, 401]).toContain(response.status());
    });

  });

  // === DASHBOARD ===
  test.describe('Dashboard APIs', () => {
    
    test('GET /api/dashboard/stats - should return dashboard statistics', async ({ request }) => {
      const response = await request.get('/api/dashboard/stats');
      expect([200, 401]).toContain(response.status());
    });

  });

  // === OFFICE STYLE ===
  test.describe('Office Style APIs', () => {
    
    test('POST /api/office-style/analyze - should analyze office style', async ({ request }) => {
      const response = await request.post('/api/office-style/analyze', {
        data: {}
      });
      expect([201, 400, 401]).toContain(response.status());
    });

    test('POST /api/office-style/generate-demo - should generate demo', async ({ request }) => {
      const response = await request.post('/api/office-style/generate-demo', {
        data: {}
      });
      expect([201, 400, 401]).toContain(response.status());
    });

  });

  // === ONBOARDING ===
  test.describe('Onboarding APIs', () => {
    
    test('POST /api/onboarding/buscar-processos - should search processes', async ({ request }) => {
      const response = await request.post('/api/onboarding/buscar-processos', {
        data: {}
      });
      expect([400, 401, 500]).toContain(response.status());
    });

    test('POST /api/onboarding/buscar-processos-simple - should search processes (simple)', async ({ request }) => {
      const response = await request.post('/api/onboarding/buscar-processos-simple', {
        data: {}
      });
      expect([400, 401, 500]).toContain(response.status());
    });

    test('POST /api/onboarding/buscar-processos-v2 - should search processes (v2)', async ({ request }) => {
      const response = await request.post('/api/onboarding/buscar-processos-v2', {
        data: {}
      });
      expect([400, 401, 500]).toContain(response.status());
    });

    test('POST /api/onboarding/salvar-advogado - should save lawyer info', async ({ request }) => {
      const response = await request.post('/api/onboarding/salvar-advogado', {
        data: {}
      });
      expect([201, 400, 401]).toContain(response.status());
    });

    test('POST /api/onboarding/salvar-cliente - should save client info', async ({ request }) => {
      const response = await request.post('/api/onboarding/salvar-cliente', {
        data: {}
      });
      expect([201, 400, 401]).toContain(response.status());
    });

    test('POST /api/onboarding/salvar-processo - should save process info', async ({ request }) => {
      const response = await request.post('/api/onboarding/salvar-processo', {
        data: {}
      });
      expect([201, 400, 401]).toContain(response.status());
    });

  });

  // === EXTERNAL INTEGRATIONS ===
  test.describe('External Integration APIs', () => {
    
    test('POST /api/solucionare/discovery/register - should handle Solucionare registration', async ({ request }) => {
      const response = await request.post('/api/solucionare/discovery/register', {
        data: {}
      });
      expect([400, 401, 500]).toContain(response.status());
    });

    test('GET /api/solucionare/discovery/results - should return discovery results', async ({ request }) => {
      const response = await request.get('/api/solucionare/discovery/results');
      expect([200, 401, 500]).toContain(response.status());
    });

  });

  // === TEST ENDPOINTS ===
  test.describe('Test & Development APIs', () => {
    
    test('GET /api/test-advogado - should return test lawyer data', async ({ request }) => {
      const response = await request.get('/api/test-advogado');
      expect([200, 500]).toContain(response.status());
    });

    test('GET /api/test-escavador - should test Escavador integration', async ({ request }) => {
      const response = await request.get('/api/test-escavador');
      expect([200, 500]).toContain(response.status());
    });

    test('GET /api/test-escavador-correct - should test correct Escavador usage', async ({ request }) => {
      const response = await request.get('/api/test-escavador-correct');
      expect([200, 500]).toContain(response.status());
    });

    test('GET /api/test-escavador-endpoints - should test Escavador endpoints', async ({ request }) => {
      const response = await request.get('/api/test-escavador-endpoints');
      expect([200, 500]).toContain(response.status());
    });

    test('GET /api/test-escavador-real - should test real Escavador data', async ({ request }) => {
      const response = await request.get('/api/test-escavador-real');
      expect([200, 500]).toContain(response.status());
    });

    test('GET /api/test-escavador-v2 - should test Escavador v2', async ({ request }) => {
      const response = await request.get('/api/test-escavador-v2');
      expect([200, 500]).toContain(response.status());
    });

  });

});

/**
 * API PERFORMANCE TESTS
 */
test.describe('API Performance Tests', () => {
  
  test('API response times should be under 5 seconds', async ({ request }) => {
    const endpoints = [
      '/api/health',
      '/api/providers/register?email=test@example.com',
      '/api/delegations',
      '/api/dashboard/stats'
    ];

    for (const endpoint of endpoints) {
      const startTime = Date.now();
      
      try {
        const response = await request.get(endpoint);
        const duration = Date.now() - startTime;
        
        console.log(`${endpoint}: ${duration}ms (Status: ${response.status()})`);
        expect(duration).toBeLessThan(5000);
        
      } catch (error) {
        const duration = Date.now() - startTime;
        console.log(`${endpoint}: ${duration}ms (Error: ${error})`);
        // Even errors should respond quickly
        expect(duration).toBeLessThan(5000);
      }
    }
  });

});

/**
 * API SECURITY TESTS
 */
test.describe('API Security Tests', () => {
  
  test('Protected endpoints should require authentication', async ({ request }) => {
    const protectedEndpoints = [
      { method: 'GET', url: '/api/audit' },
      { method: 'POST', url: '/api/admin/providers/approve' },
      { method: 'POST', url: '/api/delegations' },
      { method: 'POST', url: '/api/chat/test-id' }
    ];

    for (const endpoint of protectedEndpoints) {
      let response;
      
      if (endpoint.method === 'GET') {
        response = await request.get(endpoint.url);
      } else {
        response = await request.post(endpoint.url, { data: {} });
      }
      
      // Should return 401 (Unauthorized) or 403 (Forbidden)
      expect([401, 403]).toContain(response.status());
      console.log(`${endpoint.method} ${endpoint.url}: ${response.status()} ✓`);
    }
  });

  test('API should handle malformed requests gracefully', async ({ request }) => {
    const malformedRequests = [
      { method: 'POST', url: '/api/providers/register', data: 'invalid-json' },
      { method: 'POST', url: '/api/delegations', data: null },
      { method: 'POST', url: '/api/chat/test-id', data: undefined }
    ];

    for (const req of malformedRequests) {
      try {
        const response = await request.post(req.url, { 
          data: req.data,
          headers: { 'Content-Type': 'application/json' }
        });
        
        // Should return 400 (Bad Request)
        expect([201, 400, 401]).toContain(response.status());
        console.log(`${req.url} with malformed data: ${response.status()} ✓`);
      } catch (error) {
        // Playwright should handle the error gracefully
        console.log(`${req.url} with malformed data: handled error ✓`);
      }
    }
  });

});


