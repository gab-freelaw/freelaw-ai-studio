import { NextResponse } from 'next/server'

export async function GET() {
  const ESCAVADOR_TOKEN = process.env.ESCAVADOR_API_TOKEN
  
  if (!ESCAVADOR_TOKEN) {
    return NextResponse.json({ 
      error: 'Token do Escavador não configurado',
      env: 'ESCAVADOR_API_TOKEN não encontrado' 
    }, { status: 500 })
  }

  // Teste 1: Buscar processos por nome
  const tests = []
  
  try {
    // Teste com busca simples por nome (com parâmetro correto)
    const response1 = await fetch(
      'https://api.escavador.com/api/v2/envolvido/processos?nome=João%20Silva&limite=2',
      {
        headers: {
          'Authorization': `Bearer ${ESCAVADOR_TOKEN}`,
          'Accept': 'application/json'
        }
      }
    )
    
    const data1 = response1.ok ? await response1.json() : await response1.text()
    
    tests.push({
      test: 'Busca por nome (João Silva)',
      endpoint: '/api/v2/envolvido/processos',
      status: response1.status,
      ok: response1.ok,
      data: data1
    })
    
    // Teste 2: Buscar processos por nome de advogado específico
    const response2 = await fetch(
      'https://api.escavador.com/api/v2/envolvido/processos?nome=Gabriel%20Ribeiro%20França%20Guerra%20Magalhães&limite=5',
      {
        headers: {
          'Authorization': `Bearer ${ESCAVADOR_TOKEN}`,
          'Accept': 'application/json'
        }
      }
    )
    
    const data2 = response2.ok ? await response2.json() : await response2.text()
    
    tests.push({
      test: 'Busca processos por nome do advogado',
      endpoint: '/api/v2/envolvido/processos',
      status: response2.status,
      ok: response2.ok,
      data: data2
    })
    
    // Teste 3: Buscar processos por CPF
    const response3 = await fetch(
      'https://api.escavador.com/api/v2/envolvido/processos?cpf_cnpj=12345678900&limite=2',
      {
        headers: {
          'Authorization': `Bearer ${ESCAVADOR_TOKEN}`,
          'Accept': 'application/json'
        }
      }
    )
    
    const data3 = response3.ok ? await response3.json() : await response3.text()
    
    tests.push({
      test: 'Busca processos por CPF',
      endpoint: '/api/v2/envolvido/processos',
      status: response3.status,
      ok: response3.ok,
      data: data3
    })
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Erro ao testar API',
      message: error instanceof Error ? error.message : 'Unknown error',
      tests 
    }, { status: 500 })
  }
  
  return NextResponse.json({
    token_configured: true,
    token_preview: ESCAVADOR_TOKEN.substring(0, 20) + '...',
    tests,
    summary: {
      total: tests.length,
      successful: tests.filter(t => t.ok).length,
      failed: tests.filter(t => !t.ok).length
    }
  })
}
