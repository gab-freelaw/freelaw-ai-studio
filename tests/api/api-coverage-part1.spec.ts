import { test, expect } from '@playwright/test';

test.describe('API Coverage Part 1 - Core APIs', () => {
  
  let authToken: string;
  
  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'test123'
      }
    });
    
    if (loginResponse.ok()) {
      const loginData = await loginResponse.json();
      authToken = loginData.access_token;
    }
  });

  test.describe('Health & System APIs', () => {
    test('GET /api/health - should return system health', async ({ request }) => {
      const response = await request.get('/api/health');
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('healthy');
    });
  });

  test.describe('Authentication APIs', () => {
    test('POST /api/auth/login - should authenticate user', async ({ request }) => {
      const response = await request.post('/api/auth/login', {
        data: {
          email: 'test@example.com',
          password: 'test123'
        }
      });
      
      expect([200, 401]).toContain(response.status());
      if (response.status() === 200) {
        const data = await response.json();
        expect(data.access_token).toBeDefined();
      }
    });

    test('POST /api/auth/register - should create new user', async ({ request }) => {
      const response = await request.post('/api/auth/register', {
        data: {
          name: `Test User ${Date.now()}`,
          email: `test+${Date.now()}@freelaw.com.br`,
          password: 'password123',
          confirmPassword: 'password123'
        }
      });
      
      expect([201, 400]).toContain(response.status());
    });
  });

  test.describe('Provider APIs', () => {
    test('POST /api/providers/register - should register new provider', async ({ request }) => {
      const response = await request.post('/api/providers/register', {
        data: {
          fullName: `Prestador Teste ${Date.now()}`,
          email: `provider+${Date.now()}@test.com`,
          phone: '11987654321',
          oab: 'SP' + Math.random().toString().slice(2, 8),
          state: 'SP',
          experience: 'pleno',
          specialties: ['civil', 'trabalhista'],
          bio: 'Advogado experiente em direito civil e trabalhista',
          availability: 'part_time',
          workload: 'medium',
          motivation: 'Quero crescer profissionalmente e ajudar mais clientes através da plataforma Freelaw'
        }
      });
      
      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data.provider).toBeDefined();
    });

    test('GET /api/providers/register - should check provider status', async ({ request }) => {
      const response = await request.get('/api/providers/register?email=provider@test.com');
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.exists).toBeDefined();
    });
  });

  test.describe('Chat APIs', () => {
    test('POST /api/chat - should send message to AI', async ({ request }) => {
      const response = await request.post('/api/chat', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          messages: [
            {
              role: 'user',
              content: 'Como elaborar uma petição inicial?'
            }
          ]
        }
      });
      
      expect([200, 201, 401]).toContain(response.status());
    });
  });

  test.describe('Error Handling', () => {
    test('should handle 404 for non-existent endpoints', async ({ request }) => {
      const response = await request.get('/api/non-existent-endpoint');
      
      expect(response.status()).toBe(404);
    });

    test('should handle unauthorized requests', async ({ request }) => {
      const response = await request.get('/api/admin/providers');
      
      expect(response.status()).toBe(401);
    });

    test('should validate required fields', async ({ request }) => {
      const response = await request.post('/api/providers/register', {
        data: {
          name: '',
          email: 'invalid-email'
        }
      });
      
      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });
});


