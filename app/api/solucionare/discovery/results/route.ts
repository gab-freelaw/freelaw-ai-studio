import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { searchCode } = body
    const token = process.env.SOLUCIONARE_API_TOKEN
    const relationalName = process.env.SOLUCIONARE_RELATIONAL_NAME || 'Freelaw'
    const base = process.env.SOLUCIONARE_DISCOVERY_BASE_URL || 'http://online.solucionarelj.com.br:9090/WebApiDiscoveryFull'
    const resultsPath = process.env.SOLUCIONARE_DISCOVERY_RESULTS_PATH || '/api/DiscoveryFull/buscaDadosResultadoPesquisa'
    const docsPath = process.env.SOLUCIONARE_DISCOVERY_DOCS_PATH || '/api/DiscoveryFull/buscaDadosDocIniciaisPesquisa'

    if (!token || !searchCode) {
      return NextResponse.json({ error: 'Parâmetros inválidos (token, searchCode)' }, { status: 400 })
    }

    const payload = { nomeRelacional: relationalName, token, codPesquisa: searchCode }
    const headers = { 'Content-Type': 'application/json; charset=utf-8' }

    const [resDados, resDocs] = await Promise.all([
      fetch(`${base.replace(/\/$/, '')}${resultsPath}`, { method: 'POST', headers, body: JSON.stringify(payload) }),
      fetch(`${base.replace(/\/$/, '')}${docsPath}`, { method: 'POST', headers, body: JSON.stringify(payload) }),
    ])

    const out: any = { success: true }
    out.dados = resDados.ok ? await resDados.json() : { error: `status ${resDados.status}`, text: await resDados.text() }
    out.docs = resDocs.ok ? await resDocs.json() : { error: `status ${resDocs.status}`, text: await resDocs.text() }

    return NextResponse.json(out)
  } catch (error) {
    console.error('DiscoveryFull results error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

