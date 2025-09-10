import { NextResponse } from 'next/server'

interface ProcessoInfo {
  numero_cnj: string
  titulo: string
  cliente: string
  tipo_cliente: 'AUTOR' | 'REU'
  valor_causa?: number
  data_inicio: string
  tribunal: string
  classe?: string
  assunto?: string
  status?: string
  partes?: {
    autores: Array<{ nome: string; cpf_cnpj?: string; tipo_pessoa?: string }>
    reus: Array<{ nome: string; cpf_cnpj?: string; tipo_pessoa?: string }>
    advogados: Array<{ nome: string; oab?: string }>
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { oab, uf, officeId: officeIdFromBody, office, persist = false } = body

    if (!oab || !uf) {
      return NextResponse.json(
        { error: 'OAB e UF são obrigatórios' },
        { status: 400 }
      )
    }

    console.log(`Iniciando busca de processos para OAB: ${oab}/${uf}`)
    
    let advogadoNome = ''
    let processos: ProcessoInfo[] = []
    let publicacoes: any[] = []
    let usouSolucionare = false
    
    try {
      // Get office ID from request or environment
      const officeId = officeIdFromBody || process.env.SOLUCIONARE_PUBLICATIONS_OFFICE_ID || ''
      
      // Check Solucionare configuration
      const token = process.env.SOLUCIONARE_API_TOKEN
      const relationalName = process.env.SOLUCIONARE_RELATIONAL_NAME || 'Freelaw'

      if (!token) {
        return NextResponse.json(
          { error: 'Solucionare não configurado. Defina SOLUCIONARE_API_TOKEN.' },
          { status: 500 }
        )
      }
      
      if (!officeId) {
        // Return mock data if no office ID
        console.log('No Office ID provided, returning mock data')
        advogadoNome = `Dr. João Silva`
        processos = [
          {
            numero_cnj: '1234567-89.2024.8.26.0100',
            titulo: 'Empresa ABC x Empresa XYZ',
            cliente: 'Empresa ABC',
            tipo_cliente: 'AUTOR',
            valor_causa: 50000,
            data_inicio: '2024-01-15T00:00:00Z',
            tribunal: 'TJSP',
            classe: 'Procedimento Comum Cível',
            assunto: 'Inadimplemento',
            status: 'active',
            partes: {
              autores: [{ nome: 'Empresa ABC', cpf_cnpj: '12.345.678/0001-90', tipo_pessoa: 'JURIDICA' }],
              reus: [{ nome: 'Empresa XYZ', cpf_cnpj: '98.765.432/0001-10', tipo_pessoa: 'JURIDICA' }],
              advogados: [{ nome: 'Dr. João Silva', oab: `${oab}/${uf}` }]
            }
          },
          {
            numero_cnj: '9876543-21.2024.8.26.0100',
            titulo: 'Maria Santos x José Oliveira',
            cliente: 'Maria Santos',
            tipo_cliente: 'AUTOR',
            valor_causa: 15000,
            data_inicio: '2024-02-01T00:00:00Z',
            tribunal: 'TJSP',
            status: 'active',
            partes: {
              autores: [{ nome: 'Maria Santos', cpf_cnpj: '123.456.789-00', tipo_pessoa: 'FISICA' }],
              reus: [{ nome: 'José Oliveira', cpf_cnpj: '987.654.321-00', tipo_pessoa: 'FISICA' }],
              advogados: [{ nome: 'Dr. João Silva', oab: `${oab}/${uf}` }]
            }
          }
        ]
      } else {
        // Real Solucionare integration
        console.log('Buscando publicações na Solucionare...')
        const pubs = await buscarPublicacoesSolucionare({ token, officeId, relationalName })
        usouSolucionare = true
        advogadoNome = `Advogado OAB ${oab}/${uf}`
        
        publicacoes = filtrarPublicacoesPorOAB(pubs, oab)
        processos = mapearPublicacoesParaProcessos(publicacoes.length > 0 ? publicacoes : pubs, advogadoNome, oab, uf)
        
        // Enrich with Andamentos if enabled
        const andamentosEnabled = process.env.SOLUCIONARE_ANDAMENTOS_ENABLED === 'true'
        const andamentosTemplate = process.env.SOLUCIONARE_ANDAMENTOS_URL_TEMPLATE || ''
        
        if (andamentosEnabled && andamentosTemplate && processos.length > 0) {
          console.log('Enriquecendo via Andamentos V3...')
          await enrichProcessesWithAndamentos(processos, {
            token,
            relationalName,
            urlTemplate: andamentosTemplate,
            concurrency: 5,
            ttl: 3600,
          })
        }
      }
    } catch (apiError: any) {
      console.error('Erro na API Solucionare:', apiError)
      const status = apiError?.response?.status
      const message = status === 401 || status === 403
        ? 'Falha de autenticação na Solucionare. Verifique seu token.'
        : 'Falha ao consultar a Solucionare.'
      return NextResponse.json({ error: message }, { status: status || 500 })
    }

    // Extract clients from processes
    const clientesMap = new Map<string, any>()
    processos.forEach(processo => {
      processo.partes?.autores.forEach(parte => {
        const chave = parte.cpf_cnpj || parte.nome
        if (!clientesMap.has(chave)) {
          clientesMap.set(chave, {
            nome: parte.nome,
            cpf_cnpj: parte.cpf_cnpj || '',
            tipo_pessoa: parte.tipo_pessoa || 'FISICA',
            processos: [],
            tipo_envolvimento: 'AUTOR'
          })
        }
        const cliente = clientesMap.get(chave)
        if (!cliente.processos.includes(processo.numero_cnj)) {
          cliente.processos.push(processo.numero_cnj)
        }
      })
      
      processo.partes?.reus.forEach(parte => {
        const chave = parte.cpf_cnpj || parte.nome
        if (!clientesMap.has(chave)) {
          clientesMap.set(chave, {
            nome: parte.nome,
            cpf_cnpj: parte.cpf_cnpj || '',
            tipo_pessoa: parte.tipo_pessoa || 'FISICA',
            processos: [],
            tipo_envolvimento: 'REU'
          })
        }
        const cliente = clientesMap.get(chave)
        if (!cliente.processos.includes(processo.numero_cnj)) {
          cliente.processos.push(processo.numero_cnj)
        }
      })
    })

    // Prepare response
    const resposta = {
      advogado: {
        nome: advogadoNome,
        oab: oab,
        uf: uf,
        tipo: 'ADVOGADO'
      },
      processos: processos,
      clientes: Array.from(clientesMap.values()),
      estatisticas: {
        total_processos: processos.length,
        total_clientes: clientesMap.size,
        usando_solucionare: usouSolucionare,
        provedor: usouSolucionare ? 'Solucionare' : 'Mock',
        persisted: false
      }
    }

    return NextResponse.json(resposta)

  } catch (error) {
    console.error('Erro ao buscar processos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar processos. Tente novamente.' },
      { status: 500 }
    )
  }
}

// Helper functions
async function buscarPublicacoesSolucionare({ token, officeId, relationalName }: { token: string; officeId: string; relationalName: string }) {
  const baseUrl = 'http://online.solucionarelj.com.br:9090'
  const url = `${baseUrl}/WebApiPublicacoes/api/ControllerApi/Publicacoes/getPublicacoesCodigo?nomeRelacional=${encodeURIComponent(relationalName)}&token=${encodeURIComponent(token)}&codEscritorio=${encodeURIComponent(officeId)}`
  const res = await fetch(url, { method: 'GET' })
  if (!res.ok) {
    throw new Error(`Falha ao buscar publicações: ${res.status}`)
  }
  const data = await res.json()
  if (!Array.isArray(data)) return []
  return data
}

function filtrarPublicacoesPorOAB(publicacoes: any[], oabNumero: string) {
  const numeroLimpo = String(oabNumero).replace(/\D/g, '')
  return publicacoes.filter((p: any) => {
    const pOab = (p.oab ?? '').toString()
    if (!pOab) return false
    const pNumLimpo = pOab.replace(/\D/g, '')
    return pNumLimpo === numeroLimpo
  })
}

function mapearPublicacoesParaProcessos(publicacoes: any[], nomeAdvogado: string, oab: string, uf: string): ProcessoInfo[] {
  const porProcesso = new Map<string, any>()
  for (const pub of publicacoes) {
    const numero = pub.numProcesso || pub.numeroProcesso || ''
    if (!numero) continue
    if (!porProcesso.has(numero)) porProcesso.set(numero, pub)
  }

  const processos: ProcessoInfo[] = []
  for (const [numero, pub] of porProcesso) {
    const dataPub = pub.dataPublicacao || pub.dataDisponibilizacao || new Date().toISOString()
    const tribunal = pub.tribunal || pub.orgao || pub.uf || 'Não informado'

    processos.push({
      numero_cnj: numero,
      titulo: pub.conteudoPublicacao ? `Pub: ${String(pub.conteudoPublicacao).slice(0, 80)}...` : `Processo ${numero}`,
      cliente: 'Não identificado',
      tipo_cliente: 'AUTOR',
      data_inicio: typeof dataPub === 'string' ? dataPub : new Date(dataPub).toISOString(),
      tribunal,
      status: 'active',
      partes: {
        autores: [],
        reus: [],
        advogados: [{ nome: nomeAdvogado, oab: `${oab}/${uf}` }],
      },
    })
  }
  return processos
}

// Simple Andamentos enrichment
async function enrichProcessesWithAndamentos(processos: ProcessoInfo[], opts: any) {
  // Simple implementation without concurrency control for now
  for (const proc of processos) {
    try {
      const url = opts.urlTemplate
        .replace('{rel}', encodeURIComponent(opts.relationalName))
        .replace('{token}', encodeURIComponent(opts.token))
        .replace('{num}', encodeURIComponent(proc.numero_cnj))
      
      const res = await fetch(url, { method: 'GET' })
      if (res.ok) {
        const data = await res.json()
        const first = Array.isArray(data) ? data[0] : data
        
        if (first?.dadosCapa?.[0]) {
          proc.tribunal = first.dadosCapa[0].tribunal || proc.tribunal
          proc.classe = first.dadosCapa[0].tipoAcao || proc.classe
          proc.assunto = first.dadosCapa[0].assunto || proc.assunto
        }
        
        if (first?.autor?.length || first?.reu?.length) {
          const autores = (first.autor || []).map((a: any) => ({ nome: a.nome, tipo_pessoa: 'FISICA' }))
          const reus = (first.reu || []).map((r: any) => ({ nome: r.nome, tipo_pessoa: 'FISICA' }))
          proc.partes = { 
            autores, 
            reus, 
            advogados: proc.partes?.advogados || []
          }
          
          if (autores.length || reus.length) {
            proc.titulo = `${autores[0]?.nome || 'Autor'} x ${reus[0]?.nome || 'Réu'}`
            proc.cliente = autores[0]?.nome || reus[0]?.nome || proc.cliente
            proc.tipo_cliente = autores.length > 0 ? 'AUTOR' : 'REU'
          }
        }
      }
    } catch (e) {
      console.error(`Error enriching process ${proc.numero_cnj}:`, e)
    }
  }
}