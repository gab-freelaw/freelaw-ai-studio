import { NextResponse } from 'next/server'

export async function GET() {
  const apiToken = process.env.ESCAVADOR_API_TOKEN
  const baseUrl = 'https://api.escavador.com'
  
  if (!apiToken) {
    return NextResponse.json({
      success: false,
      error: 'Token não configurado'
    })
  }

  const tests = []

  // Teste 1: Buscar processos por nome/CPF de envolvido
  try {
    const url = `${baseUrl}/api/v2/envolvido/processos?nome=João Silva&limite=1`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/json'
      }
    })
    
    const data = await response.text()
    let json
    try {
      json = JSON.parse(data)
    } catch {
      json = data
    }
    
    tests.push({
      test: 'Busca Processos por Envolvido',
      endpoint: '/api/v2/envolvido/processos',
      status: response.status,
      ok: response.ok,
      hasData: json && (json.data || json.items || json.processos) ? true : false,
      sample: json
    })
  } catch (error) {
    tests.push({
      test: 'Busca Processos por Envolvido',
      error: error instanceof Error ? error.message : 'Erro'
    })
  }

  // Teste 2: Buscar processos por advogado
  try {
    const url = `${baseUrl}/api/v2/advogado/processos?oab=183619&uf=MG&limite=1`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/json'
      }
    })
    
    const data = await response.text()
    let json
    try {
      json = JSON.parse(data)
    } catch {
      json = data
    }
    
    tests.push({
      test: 'Busca Processos por Advogado',
      endpoint: '/api/v2/advogado/processos',
      status: response.status,
      ok: response.ok,
      hasData: json && (json.data || json.items || json.processos) ? true : false,
      sample: json
    })
  } catch (error) {
    tests.push({
      test: 'Busca Processos por Advogado',
      error: error instanceof Error ? error.message : 'Erro'
    })
  }

  // Teste 3: Buscar processo por número CNJ
  try {
    const url = `${baseUrl}/api/v2/processos/numero_cnj/1234567-89.2024.8.26.0100`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/json'
      }
    })
    
    const data = await response.text()
    let json
    try {
      json = JSON.parse(data)
    } catch {
      json = data
    }
    
    tests.push({
      test: 'Busca Processo por CNJ',
      endpoint: '/api/v2/processos/numero_cnj/{numero}',
      status: response.status,
      ok: response.ok,
      hasData: json && json.numero_cnj ? true : false,
      sample: json
    })
  } catch (error) {
    tests.push({
      test: 'Busca Processo por CNJ',
      error: error instanceof Error ? error.message : 'Erro'
    })
  }

  // Teste 4: Buscar resumo de envolvido
  try {
    const url = `${baseUrl}/api/v2/envolvido/resumo?nome=Maria Santos`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/json'
      }
    })
    
    const data = await response.text()
    let json
    try {
      json = JSON.parse(data)
    } catch {
      json = data
    }
    
    tests.push({
      test: 'Resumo de Envolvido',
      endpoint: '/api/v2/envolvido/resumo',
      status: response.status,
      ok: response.ok,
      hasData: json && (json.total || json.resumo) ? true : false,
      sample: json
    })
  } catch (error) {
    tests.push({
      test: 'Resumo de Envolvido',
      error: error instanceof Error ? error.message : 'Erro'
    })
  }

  const workingTests = tests.filter(t => t.ok)
  const testsWithData = tests.filter(t => t.hasData)

  return NextResponse.json({
    success: workingTests.length > 0,
    tokenValid: workingTests.length > 0 || tests.some(t => t.status === 401) === false,
    tokenPrefix: apiToken.substring(0, 40) + '...',
    summary: {
      total: tests.length,
      working: workingTests.length,
      withData: testsWithData.length,
      failed: tests.filter(t => !t.ok).length
    },
    tests,
    recommendation: workingTests.length > 0 ?
      `✅ API Escavador v2 funcionando! ${workingTests.length}/${tests.length} endpoints OK. Para usar dados reais, adicione USE_REAL_API=true no .env.local` :
      tests.some(t => t.status === 401) ?
        '❌ Token inválido ou expirado. Verifique suas credenciais.' :
        tests.some(t => t.status === 403) ?
          '⚠️ Token válido mas sem permissões. Verifique seu plano na Escavador.' :
          '⚠️ API não está respondendo como esperado. Consulte https://api.escavador.com/v2/docs/'
  })
}