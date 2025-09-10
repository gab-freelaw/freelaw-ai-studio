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

  const endpoints = [
    '/api/v2/busca/processos',
    '/api/v1/busca/processos', 
    '/v2/busca/processos',
    '/v1/busca/processos',
    '/api/processos',
    '/processos',
    '/api/v2/processos',
    '/api/v1/processos',
    '/api/v2/pessoas',
    '/api/v1/pessoas'
  ]

  const results = []

  for (const endpoint of endpoints) {
    try {
      const url = `${baseUrl}${endpoint}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      results.push({
        endpoint,
        url,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        contentType: response.headers.get('content-type')
      })
    } catch (error) {
      results.push({
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Tenta também a documentação para descobrir endpoints
  try {
    const docsResponse = await fetch('https://api.escavador.com', {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/json'
      }
    })
    
    results.push({
      endpoint: '/ (root)',
      status: docsResponse.status,
      ok: docsResponse.ok
    })
  } catch (error) {
    // ignore
  }

  return NextResponse.json({
    tokenPrefix: apiToken.substring(0, 30) + '...',
    testedEndpoints: results,
    workingEndpoints: results.filter(r => r.ok),
    recommendation: results.some(r => r.ok) ? 
      'Encontramos endpoints funcionando! Atualize o serviço com o endpoint correto.' :
      'Nenhum endpoint testado funcionou. Consulte a documentação da API do Escavador ou contate o suporte.'
  })
}