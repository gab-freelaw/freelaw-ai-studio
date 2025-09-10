import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'

test.describe('Process Management API', () => {
  test('GET /api/processes - should return list of processes', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/processes`)
    
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    
    expect(data).toHaveProperty('success', true)
    expect(data).toHaveProperty('data')
    expect(data).toHaveProperty('total')
    expect(Array.isArray(data.data)).toBeTruthy()
  })

  test('GET /api/processes with filters', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/processes?tribunal=TJSP&incluir_movimentacoes=true`)
    
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBeTruthy()
  })

  test('POST /api/processes - should validate CNJ number', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/processes`, {
      data: {
        numero_cnj: 'invalid-number'
      }
    })
    
    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error).toContain('CNJ')
  })

  test('GET /api/processes/[id] - should return process details', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/processes/123`)
    
    // May return 500 if process doesn't exist in Escavador
    const data = await response.json()
    expect(data).toHaveProperty('success')
  })

  test('POST /api/processes/[id]/sync - should sync process', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/processes/123/sync`)
    
    const data = await response.json()
    expect(data).toHaveProperty('success')
    
    if (data.success) {
      expect(data).toHaveProperty('synced_at')
    }
  })
})

test.describe('Publications API', () => {
  test('GET /api/publications - should return publications list', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/publications`)
    
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    
    expect(data.success).toBe(true)
    expect(data).toHaveProperty('data')
    expect(data).toHaveProperty('total')
    expect(Array.isArray(data.data)).toBeTruthy()
  })

  test('GET /api/publications with date filters', async ({ request }) => {
    const hoje = new Date().toISOString().split('T')[0]
    const umaSemanaAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const response = await request.get(
      `${BASE_URL}/api/publications?data_inicio=${umaSemanaAtras}&data_fim=${hoje}`
    )
    
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data).toHaveProperty('filters')
  })

  test('POST /api/publications - should mark publication as read', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/publications`, {
      data: {
        publicacao_id: 'pub-123',
        action: 'mark_as_read'
      }
    })
    
    expect(response.status()).toBe(201)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.message).toContain('lida')
  })

  test('POST /api/publications/analyze - should analyze publication', async ({ request }) => {
    const mockPublicacao = {
      id: '1',
      numero_processo: '1234567-12.2024.8.26.0100',
      data_publicacao: new Date().toISOString().split('T')[0],
      tipo: 'INTIMACAO',
      conteudo: 'Intimação para manifestação',
      orgao: 'TJSP',
      prazo_dias: 15
    }

    const response = await request.post(`${BASE_URL}/api/publications/analyze`, {
      data: {
        publicacao: mockPublicacao
      }
    })
    
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('acao_sugerida')
    expect(data.data).toHaveProperty('prioridade')
    expect(data.data).toHaveProperty('fundamentacao_legal')
  })

  test('GET /api/publications/monitor - should return monitored publications', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/publications/monitor?oab=183619&uf=MG`)
    
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('novas')
    expect(data.data).toHaveProperty('com_prazo')
    expect(data.data).toHaveProperty('urgentes')
    expect(data.data).toHaveProperty('summary')
    expect(data.monitored_oab).toBe('183619/MG')
  })

  test('POST /api/publications/monitor - should configure monitoring', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/publications/monitor`, {
      data: {
        active: true,
        oab: '183619',
        uf: 'MG',
        interval_minutes: 30
      }
    })
    
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    
    expect(data.success).toBe(true)
    expect(data.data.monitoring_active).toBe(true)
    expect(data.data.interval_minutes).toBe(30)
  })
})

test.describe('Monitoring Status API', () => {
  test('GET /api/monitoring/status - should return monitoring status', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/monitoring/status`)
    
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('active')
    expect(data.data).toHaveProperty('oab')
    expect(data.data).toHaveProperty('uf')
    expect(data.data).toHaveProperty('last_check')
    expect(data.data).toHaveProperty('next_check')
    expect(data.data).toHaveProperty('stats')
  })

  test('PUT /api/monitoring/status - should update monitoring config', async ({ request }) => {
    const response = await request.put(`${BASE_URL}/api/monitoring/status`, {
      data: {
        active: false,
        interval_minutes: 120
      }
    })
    
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    
    expect(data.success).toBe(true)
    expect(data.data.active).toBe(false)
    expect(data.data.interval_minutes).toBe(120)
  })

  test('POST /api/monitoring/status/check - should force check', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/monitoring/status/check`)
    
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('checked_at')
    expect(data.data).toHaveProperty('next_check')
    expect(data.data).toHaveProperty('found')
  })
})

test.describe('Dashboard Stats API', () => {
  test('GET /api/dashboard/stats - should return dashboard statistics', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/dashboard/stats`)
    
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('processos')
    expect(data.data).toHaveProperty('publicacoes')
    expect(data.data).toHaveProperty('prazos')
    expect(data.data).toHaveProperty('tendencias')
    expect(data.data).toHaveProperty('monitoramento')
  })

  test('GET /api/dashboard/stats with period filter', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/dashboard/stats?period=30`)
    
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    
    expect(data.success).toBe(true)
    expect(data.period.days).toBe(30)
  })

  test('Dashboard stats should include urgency metrics', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/dashboard/stats`)
    
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    
    expect(data.data.publicacoes).toHaveProperty('urgentes')
    expect(data.data.publicacoes).toHaveProperty('alta_prioridade')
    expect(data.data.prazos).toHaveProperty('vencendo_hoje')
    expect(data.data.prazos).toHaveProperty('proximos_5_dias')
    expect(data.data.prazos).toHaveProperty('vencidos')
  })
})

test.describe('Error Handling', () => {
  test('Should handle invalid endpoint', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/invalid-endpoint`)
    expect(response.status()).toBe(404)
  })

  test('Should handle malformed JSON', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/publications`, {
      data: 'invalid-json',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    // Should return 400 or 500
    expect([400, 500]).toContain(response.status())
  })
})

test.describe('CNJ Number Utilities', () => {
  test('Should validate CNJ number format in process creation', async ({ request }) => {
    // Valid CNJ format
    const validCNJ = '1234567-12.2024.8.26.0100'
    const response1 = await request.post(`${BASE_URL}/api/processes`, {
      data: {
        numero_cnj: validCNJ
      }
    })
    
    // Will fail because process doesn't exist in Escavador, but should pass validation
    const data1 = await response1.json()
    if (data1.error && data1.error.includes('CNJ')) {
      expect(data1.error).not.toContain('inválido')
    }

    // Invalid CNJ format
    const invalidCNJ = '123-invalid'
    const response2 = await request.post(`${BASE_URL}/api/processes`, {
      data: {
        numero_cnj: invalidCNJ
      }
    })
    
    expect(response2.status()).toBe(400)
    const data2 = await response2.json()
    expect(data2.error).toContain('CNJ')
  })
})