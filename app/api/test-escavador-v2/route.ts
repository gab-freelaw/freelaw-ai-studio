import { NextResponse } from 'next/server'

export async function GET() {
  const apiToken = process.env.ESCAVADOR_API_TOKEN
  const apiUrl = process.env.ESCAVADOR_API_URL || 'https://api.escavador.com/v2'
  
  if (!apiToken) {
    return NextResponse.json({
      success: false,
      error: 'Token não configurado'
    })
  }

  const tests = []

  // Teste 1: Buscar pessoas
  try {
    const pessoasUrl = `${apiUrl}/busca/pessoas?q=João&limit=1`
    const pessoasResponse = await fetch(pessoasUrl, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/json'
      }
    })
    
    const pessoasData = await pessoasResponse.text()
    let pessoasJson
    try {
      pessoasJson = JSON.parse(pessoasData)
    } catch {
      pessoasJson = pessoasData
    }
    
    tests.push({
      test: 'Busca de Pessoas',
      endpoint: '/busca/pessoas',
      status: pessoasResponse.status,
      ok: pessoasResponse.ok,
      data: pessoasJson
    })
  } catch (error) {
    tests.push({
      test: 'Busca de Pessoas',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    })
  }

  // Teste 2: Buscar processos
  try {
    const processosUrl = `${apiUrl}/busca/processos?q=1234567&limit=1`
    const processosResponse = await fetch(processosUrl, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/json'
      }
    })
    
    const processosData = await processosResponse.text()
    let processosJson
    try {
      processosJson = JSON.parse(processosData)
    } catch {
      processosJson = processosData
    }
    
    tests.push({
      test: 'Busca de Processos',
      endpoint: '/busca/processos',
      status: processosResponse.status,
      ok: processosResponse.ok,
      data: processosJson
    })
  } catch (error) {
    tests.push({
      test: 'Busca de Processos',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    })
  }

  // Teste 3: Buscar publicações
  try {
    const publicacoesUrl = `${apiUrl}/busca/publicacoes?q=intimacao&limit=1`
    const publicacoesResponse = await fetch(publicacoesUrl, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/json'
      }
    })
    
    const publicacoesData = await publicacoesResponse.text()
    let publicacoesJson
    try {
      publicacoesJson = JSON.parse(publicacoesData)
    } catch {
      publicacoesJson = publicacoesData
    }
    
    tests.push({
      test: 'Busca de Publicações',
      endpoint: '/busca/publicacoes',
      status: publicacoesResponse.status,
      ok: publicacoesResponse.ok,
      data: publicacoesJson
    })
  } catch (error) {
    tests.push({
      test: 'Busca de Publicações',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    })
  }

  const workingTests = tests.filter(t => t.ok)
  const failedTests = tests.filter(t => !t.ok)

  return NextResponse.json({
    success: workingTests.length > 0,
    apiUrl,
    tokenValid: true,
    tokenPrefix: apiToken.substring(0, 40) + '...',
    summary: {
      total: tests.length,
      working: workingTests.length,
      failed: failedTests.length
    },
    tests,
    recommendation: workingTests.length > 0 ?
      `✅ API v2 funcionando! ${workingTests.length} de ${tests.length} testes passaram. Para usar dados reais, adicione USE_REAL_API=true no .env.local` :
      '❌ Nenhum teste passou. Verifique o token e consulte https://api.escavador.com/v2/docs/'
  })
}