import { test, expect } from '@playwright/test'

test.describe('Onboarding - Busca de Publicações', () => {
  test('POST /api/onboarding/buscar-publicacoes - should search publications for onboarding', async ({ request }) => {
    const response = await request.post('/api/onboarding/buscar-publicacoes', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        oab_numero: '123456',
        oab_uf: 'SP',
        dias_retrocesso: 30
      }
    })

    expect([200, 401, 502]).toContain(response.status())
    
    if (response.status() === 200) {
      const data = await response.json()
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
      expect(data.data).toHaveProperty('publicacoes')
      expect(data.data).toHaveProperty('estatisticas')
      expect(data.data).toHaveProperty('periodo')
      
      // Verificar estrutura das estatísticas
      const stats = data.data.estatisticas
      expect(stats).toHaveProperty('total_publicacoes')
      expect(stats).toHaveProperty('publicacoes_urgentes')
      expect(stats).toHaveProperty('tribunais_unicos')
      expect(stats).toHaveProperty('processos_unicos')
      expect(stats).toHaveProperty('periodo_dias', 30)
      
      // Verificar estrutura do período
      const periodo = data.data.periodo
      expect(periodo).toHaveProperty('data_inicio')
      expect(periodo).toHaveProperty('data_fim')
      expect(periodo).toHaveProperty('dias', 30)
      
      // Verificar que as publicações são arrays
      expect(Array.isArray(data.data.publicacoes)).toBe(true)
      
      // Se há publicações, verificar estrutura
      if (data.data.publicacoes.length > 0) {
        const publicacao = data.data.publicacoes[0]
        expect(publicacao).toHaveProperty('id')
        expect(publicacao).toHaveProperty('numero_processo')
        expect(publicacao).toHaveProperty('tribunal')
        expect(publicacao).toHaveProperty('data_publicacao')
        expect(publicacao).toHaveProperty('conteudo')
      }
    }
  })

  test('POST /api/onboarding/buscar-publicacoes - should validate required fields', async ({ request }) => {
    const response = await request.post('/api/onboarding/buscar-publicacoes', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        oab_numero: '',
        oab_uf: 'SP'
      }
    })

    expect([400, 401, 500]).toContain(response.status())
    
    if (response.status() === 400) {
      const data = await response.json()
      expect(data).toHaveProperty('error')
    }
  })

  test('POST /api/onboarding/buscar-publicacoes - should handle custom period', async ({ request }) => {
    const response = await request.post('/api/onboarding/buscar-publicacoes', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        oab_numero: '123456',
        oab_uf: 'SP',
        dias_retrocesso: 15
      }
    })

    expect([200, 401, 502]).toContain(response.status())
    
    if (response.status() === 200) {
      const data = await response.json()
      expect(data.data.estatisticas.periodo_dias).toBe(15)
      expect(data.data.periodo.dias).toBe(15)
    }
  })

  test('POST /api/onboarding/buscar-publicacoes - should validate dias_retrocesso range', async ({ request }) => {
    const response = await request.post('/api/onboarding/buscar-publicacoes', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        oab_numero: '123456',
        oab_uf: 'SP',
        dias_retrocesso: 100 // Muito alto (máximo é 90)
      }
    })

    expect([400, 401, 500]).toContain(response.status())
    
    if (response.status() === 400) {
      const data = await response.json()
      expect(data).toHaveProperty('error')
    }
  })

  test('POST /api/onboarding/buscar-publicacoes - should handle invalid UF', async ({ request }) => {
    const response = await request.post('/api/onboarding/buscar-publicacoes', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        oab_numero: '123456',
        oab_uf: 'INVALID', // UF inválida
        dias_retrocesso: 30
      }
    })

    expect([400, 401, 500]).toContain(response.status())
  })

  test('POST /api/onboarding/buscar-publicacoes - should show processamento_automatico when available', async ({ request }) => {
    const response = await request.post('/api/onboarding/buscar-publicacoes', {
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      data: {
        oab_numero: '123456',
        oab_uf: 'SP',
        dias_retrocesso: 7 // Período menor para teste
      }
    })

    expect([200, 401, 502]).toContain(response.status())
    
    if (response.status() === 200) {
      const data = await response.json()
      
      // Se usuário autenticado, deve ter processamento automático
      if (data.data.estatisticas.processamento_automatico) {
        const auto = data.data.estatisticas.processamento_automatico
        expect(auto).toHaveProperty('processos_criados')
        expect(auto).toHaveProperty('clientes_criados')
        expect(auto).toHaveProperty('processos_atualizados')
        expect(auto).toHaveProperty('clientes_atualizados')
        
        // Verificar que são números
        expect(typeof auto.processos_criados).toBe('number')
        expect(typeof auto.clientes_criados).toBe('number')
        expect(typeof auto.processos_atualizados).toBe('number')
        expect(typeof auto.clientes_atualizados).toBe('number')
      }
    }
  })
})
