import { NextResponse } from 'next/server'

export async function GET() {
  const apiToken = process.env.ESCAVADOR_API_TOKEN
  const apiUrl = process.env.ESCAVADOR_API_URL || 'https://api.escavador.com/v1'
  
  if (!apiToken) {
    return NextResponse.json({
      success: false,
      error: 'Token do Escavador não configurado',
      message: 'Configure ESCAVADOR_API_TOKEN no arquivo .env.local'
    })
  }

  try {
    // Tenta fazer uma chamada real para a API do Escavador
    const response = await fetch(`${apiUrl}/processos?numero_cnj=1234567-12.2024.8.26.0100`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      }
    })

    const responseText = await response.text()
    let data
    try {
      data = JSON.parse(responseText)
    } catch {
      data = responseText
    }

    return NextResponse.json({
      success: response.ok,
      statusCode: response.status,
      apiUrl,
      tokenConfigured: true,
      tokenPrefix: apiToken.substring(0, 10) + '...',
      response: {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: data
      },
      message: response.ok ? 
        'Conexão com API do Escavador funcionando!' : 
        `Erro na API do Escavador: ${response.status} - ${response.statusText}`,
      recommendation: !response.ok ? 
        'Verifique se o token está válido e se a API está acessível' : 
        'API funcionando corretamente. Para usar dados reais, modifique escavador.service.ts linha 104'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      apiUrl,
      tokenConfigured: true,
      message: 'Não foi possível conectar com a API do Escavador',
      recommendation: 'Verifique a conectividade de rede e as configurações da API'
    }, { status: 500 })
  }
}