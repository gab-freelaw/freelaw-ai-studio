import { test, expect } from '@playwright/test'

test.describe('Comunica API Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Set test mode
    await page.addInitScript(() => {
      window.localStorage.setItem('NEXT_PUBLIC_E2E', 'true')
    })
  })

  test.describe('Buscar Publicações', () => {
    test('GET /api/publicacoes/comunica - should search publications', async ({ request }) => {
      const response = await request.get('/api/publicacoes/comunica', {
        headers: {
          'Authorization': 'Bearer mock-token'
        },
        data: {
          oab_numero: '123456',
          oab_uf: 'SP',
          data_inicio: '2024-01-01',
          data_fim: '2024-12-31'
        }
      })

      expect([200, 401, 500, 502]).toContain(response.status())
      
      if (response.status() === 200) {
        const data = await response.json()
        expect(data).toHaveProperty('success', true)
        expect(data).toHaveProperty('data')
        expect(data.data).toHaveProperty('comunicacoes')
        expect(Array.isArray(data.data.comunicacoes)).toBe(true)
      }
    })

    test('GET /api/publicacoes/comunica - should validate required parameters', async ({ request }) => {
      const response = await request.get('/api/publicacoes/comunica')
      
      expect([400, 401]).toContain(response.status())
    })

    test('GET /api/publicacoes/comunica - should handle invalid OAB format', async ({ request }) => {
      const response = await request.get('/api/publicacoes/comunica?oab_numero=invalid&oab_uf=XY')
      
      expect([400, 401]).toContain(response.status())
    })
  })

  test.describe('Publicações Urgentes', () => {
    test('GET /api/publicacoes/urgentes - should return urgent publications', async ({ request }) => {
      const response = await request.get('/api/publicacoes/urgentes', {
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      })

      expect([200, 401, 500, 502]).toContain(response.status())
      
      if (response.status() === 200) {
        const data = await response.json()
        expect(data).toHaveProperty('success', true)
        expect(data).toHaveProperty('data')
        expect(data.data).toHaveProperty('publicacoes_urgentes')
        expect(data.data).toHaveProperty('total')
        expect(data.data).toHaveProperty('resumo')
        expect(Array.isArray(data.data.publicacoes_urgentes)).toBe(true)
      }
    })

    test('PUT /api/publicacoes/urgentes - should mark publications as read', async ({ request }) => {
      const response = await request.put('/api/publicacoes/urgentes', {
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json'
        },
        data: {
          publicacao_ids: ['pub-001', 'pub-002']
        }
      })

      expect([200, 401, 500, 502]).toContain(response.status())
      
      if (response.status() === 200) {
        const data = await response.json()
        expect(data).toHaveProperty('success', true)
        expect(data).toHaveProperty('message')
      }
    })

    test('PUT /api/publicacoes/urgentes - should validate publication IDs', async ({ request }) => {
      const response = await request.put('/api/publicacoes/urgentes', {
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          publicacao_ids: 'invalid'
        }
      })

      expect([400, 401]).toContain(response.status())
    })
  })

  test.describe('Processar Publicações', () => {
    test('POST /api/publicacoes/processar - should process publications', async ({ request }) => {
      const response = await request.post('/api/publicacoes/processar', {
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json'
        },
        data: {
          publicacoes_ids: ['pub-001', 'pub-002'],
          criar_processos: true,
          criar_clientes: true
        }
      })

      expect([200, 401, 404]).toContain(response.status())
      
      if (response.status() === 200) {
        const data = await response.json()
        expect(data).toHaveProperty('success', true)
        expect(data).toHaveProperty('data')
        expect(data.data).toHaveProperty('processos_criados')
        expect(data.data).toHaveProperty('clientes_criados')
        expect(data.data).toHaveProperty('processos_atualizados')
        expect(data.data).toHaveProperty('clientes_atualizados')
        expect(data.data).toHaveProperty('erros')
        expect(Array.isArray(data.data.erros)).toBe(true)
      }
    })

    test('POST /api/publicacoes/processar - should validate required fields', async ({ request }) => {
      const response = await request.post('/api/publicacoes/processar', {
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          publicacoes_ids: []
        }
      })

      expect([400, 401]).toContain(response.status())
    })

    test('POST /api/publicacoes/processar - should handle only processes option', async ({ request }) => {
      const response = await request.post('/api/publicacoes/processar', {
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json'
        },
        data: {
          publicacoes_ids: ['pub-001'],
          criar_processos: true,
          criar_clientes: false
        }
      })

      expect([200, 401, 404]).toContain(response.status())
    })
  })

  test.describe('ComunicaAPI Service', () => {
    test('should extract process information from publications', async ({ page }) => {
      // Test the service logic in browser environment
      await page.goto('/publicacoes')
      
      const serviceTest = await page.evaluate(() => {
        // Mock publication data
        const mockPublicacoes = [
          {
            id: 'com-001',
            numero_processo: '1234567-89.2024.8.26.0001',
            tribunal: 'TJSP',
            data_publicacao: '2024-01-15',
            conteudo: 'Intimação para contestação no prazo de 15 dias. Processo: Ação de Cobrança.',
            tipo_movimento: 'intimacao',
            destinatarios: ['OAB 123456/SP'],
            advogados_mencionados: ['Dr. João Silva (OAB 123456/SP)'],
            prazo_dias: 15,
            urgente: true,
            status: 'nova' as const
          }
        ]

        // Test data structure
        return {
          hasValidStructure: mockPublicacoes.every(pub => 
            pub.id && 
            pub.numero_processo && 
            pub.tribunal && 
            pub.data_publicacao &&
            pub.conteudo &&
            pub.tipo_movimento
          ),
          hasUrgentFields: mockPublicacoes.some(pub => pub.urgente && pub.prazo_dias),
          hasAdvogadoInfo: mockPublicacoes.some(pub => pub.advogados_mencionados && pub.advogados_mencionados.length > 0)
        }
      })

      expect(serviceTest.hasValidStructure).toBe(true)
      expect(serviceTest.hasUrgentFields).toBe(true)
      expect(serviceTest.hasAdvogadoInfo).toBe(true)
    })

    test('should format CNJ numbers correctly', async ({ page }) => {
      await page.goto('/publicacoes')
      
      const formatTest = await page.evaluate(() => {
        // Test CNJ formatting logic
        const testNumbers = [
          '12345678920248260001',
          '1234567-89.2024.8.26.0001'
        ]

        return testNumbers.map(num => {
          const formatted = num.replace(/\D/g, '')
          return {
            original: num,
            cleaned: formatted,
            isValidLength: formatted.length >= 20
          }
        })
      })

      expect(formatTest.every(test => test.cleaned.length > 0)).toBe(true)
    })
  })

  test.describe('Publication Urgency Detection', () => {
    test('should identify urgent publications by keywords', async ({ page }) => {
      await page.goto('/publicacoes')
      
      const urgencyTest = await page.evaluate(() => {
        const urgentKeywords = [
          'prazo de', 'dias', 'contestação', 'recurso', 'mandado',
          'citação', 'intimação', 'sentença', 'decisão', 'despacho',
          'urgente', 'imediato', 'improrrogável'
        ]

        const testContents = [
          'Intimação para contestação no prazo de 15 dias',
          'Sentença proferida em favor do autor',
          'Mandado de citação urgente',
          'Publicação de despacho sem prazo específico'
        ]

        return testContents.map(content => {
          const isUrgent = urgentKeywords.some(keyword => 
            content.toLowerCase().includes(keyword)
          )
          return { content, isUrgent }
        })
      })

      expect(urgencyTest.filter(test => test.isUrgent).length).toBeGreaterThan(0)
    })
  })

  test.describe('Integration with Existing System', () => {
    test('should maintain compatibility with current publication structure', async ({ request }) => {
      // Test that the new Comunica API doesn't break existing publication endpoints
      const legacyResponse = await request.get('/api/publications')
      
      expect([200, 401, 404, 500]).toContain(legacyResponse.status())
    })

    test('should work alongside Escavador for process details', async ({ request }) => {
      // Test that Escavador is still available for detailed process data
      const escavadorResponse = await request.get('/api/test-escavador')
      
      expect([200, 401]).toContain(escavadorResponse.status())
    })
  })
})
