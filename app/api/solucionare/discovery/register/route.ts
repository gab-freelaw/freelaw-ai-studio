import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      officeId,
      processNumbers,
      topN = 20,
      entregarPublicacoes = true,
      entregarDocIniciais = true,
      instancia = 4,
    } = body

    const token = process.env.SOLUCIONARE_API_TOKEN
    const relationalName = process.env.SOLUCIONARE_RELATIONAL_NAME || 'Freelaw'
    const base = process.env.SOLUCIONARE_DISCOVERY_BASE_URL || 'http://online.solucionarelj.com.br:9090/WebApiDiscoveryFull'
    const registerPath = process.env.SOLUCIONARE_DISCOVERY_REGISTER_PATH || '/api/DiscoveryFull/CadastraPesquisa_NumProcessos'

    if (!token || !officeId || !Array.isArray(processNumbers) || processNumbers.length === 0) {
      return NextResponse.json({ error: 'Parâmetros inválidos (token, officeId, processNumbers)' }, { status: 400 })
    }

    const lista = processNumbers.slice(0, Math.max(1, Number(topN)))

    const payload = {
      nomeRelacional: relationalName,
      token,
      instancia,
      listaNumProcessos: lista,
      entregarPublicacoes,
      entregarDocIniciais,
      codEscritorio: officeId,
    }

    const url = `${base.replace(/\/$/, '')}${registerPath}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `Falha ao registrar DiscoveryFull: ${res.status}`, info: text }, { status: 500 })
    }
    const json = await res.json()
    return NextResponse.json({ success: true, data: json })
  } catch (error) {
    console.error('DiscoveryFull register error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

