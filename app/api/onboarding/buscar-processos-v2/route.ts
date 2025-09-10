import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  upsertClient,
  upsertProcess,
  upsertPublication,
  upsertLawyer,
  linkClientToProcess,
  trackApiCost,
  batchUpsertProcesses,
  batchUpsertClients,
  batchLinkClientsToProcesses
} from '@/lib/services/legal-data.service'

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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { oab, uf, officeId: officeIdFromBody, office, persist = true } = body
    
    // Import user settings service
    const { getUserOfficeId, getUserApiPreferences, setUserOfficeId } = await import('@/lib/services/user-settings.service')

    if (!oab || !uf) {
      return NextResponse.json(
        { error: 'OAB e UF são obrigatórios' },
        { status: 400 }
      )
    }

    console.log(`Iniciando busca de processos para OAB: ${oab}/${uf}`)
    const startTime = Date.now()
    
    let advogadoNome = ''
    let processos: ProcessoInfo[] = []
    let publicacoes: any[] = []
    let usouSolucionare = false
    
    try {
      // Get user's API preferences
      const apiPrefs = await getUserApiPreferences(user.id)
      
      // Determine office ID: from request body, user settings, or fallback
      let officeId = officeIdFromBody || apiPrefs.officeId || await getUserOfficeId(user.id)
      
      // If officeId provided in body and different from stored, update user settings
      if (officeIdFromBody && officeIdFromBody !== apiPrefs.officeId) {
        await setUserOfficeId(user.id, officeIdFromBody)
        officeId = officeIdFromBody
      }
      
      // Integração real com Solucionare
      const token = process.env.SOLUCIONARE_API_TOKEN
      const relationalName = process.env.SOLUCIONARE_RELATIONAL_NAME || 'Freelaw'

      if (!token) {
        return NextResponse.json(
          { error: 'Solucionare não configurado. Defina SOLUCIONARE_API_TOKEN.' },
          { status: 500 }
        )
      }
      
      if (!officeId) {
        return NextResponse.json(
          { error: 'Office ID não configurado. Configure seu Office ID nas configurações do usuário.' },
          { status: 400 }
        )
      }

      // Registrar Escritório (se habilitado)
      const shouldRegisterOffice = (process.env.SOLUCIONARE_REGISTER_OFFICE || 'false').toLowerCase() === 'true'
      if (shouldRegisterOffice) {
        console.log('Registrando escritório na Solucionare...')
        try {
          await registrarEscritorioSolucionare({
            token,
            relationalName,
            officeId,
            office: office || {},
          })
          console.log('Escritório registrado/validado com sucesso.')
        } catch (e) {
          console.warn('Falha ao registrar escritório na Solucionare:', e)
        }
      }

      // Registrar termo OAB
      console.log('Registrando termo de OAB na Solucionare...')
      try {
        await registrarTermoSolucionare({
          token,
          relationalName,
          officeId,
          oab,
          uf,
        })
        console.log('Termo registrado (ou já existente).')
      } catch (e) {
        console.warn('Falha ao registrar termo na Solucionare:', e)
      }

      // Buscar publicações
      console.log('Buscando publicações na Solucionare...')
      const pubs = await buscarPublicacoesSolucionare({ token, officeId, relationalName })
      usouSolucionare = true
      advogadoNome = `Advogado OAB ${oab}/${uf}`
      
      // Filtrar publicações pela OAB
      const pubsFiltradas = filtrarPublicacoesPorOAB(pubs, oab)
      publicacoes = pubsFiltradas.length > 0 ? pubsFiltradas : pubs
      processos = mapearPublicacoesParaProcessos(publicacoes, advogadoNome, oab, uf)
      
      // Enriquecimento via Andamentos V3 (check user preference)
      const andamentosEnabled = apiPrefs.andamentosEnrichEnabled && 
        (process.env.SOLUCIONARE_ANDAMENTOS_ENABLED || 'false').toLowerCase() === 'true'
      const andamentosTemplate = process.env.SOLUCIONARE_ANDAMENTOS_URL_TEMPLATE || ''
      
      if (andamentosEnabled && andamentosTemplate) {
        console.log('Enriquecendo via Andamentos V3...')
        const concurrency = parseInt(process.env.SOLUCIONARE_ANDAMENTOS_CONCURRENCY || '5', 10)
        const ttl = parseInt(process.env.SOLUCIONARE_ANDAMENTOS_TTL || '3600', 10)
        await enrichProcessesWithAndamentos(processos, {
          token,
          relationalName,
          urlTemplate: andamentosTemplate,
          concurrency,
          ttl,
        })
      }

      // Track API cost
      const responseTime = Date.now() - startTime
      if (persist) {
        await trackApiCost({
          userId: user.id,
          provider: 'solucionare',
          operation: 'processSearch',
          cost: '0.00', // Solucionare is subscription-based
          responseStatus: 200,
          responseTime,
          metadata: {
            processCount: processos.length,
            publicationCount: publicacoes.length,
            oab,
            uf,
            officeId
          }
        })
      }

    } catch (apiError: any) {
      console.error('Erro na API Solucionare:', apiError)
      const status = apiError?.response?.status
      const message = status === 401 || status === 403
        ? 'Falha de autenticação na Solucionare. Verifique seu token.'
        : 'Falha ao consultar a Solucionare.'
      return NextResponse.json({ error: message }, { status: status || 500 })
    }

    // Persistence logic
    let persistedData = null
    if (persist) {
      console.log('Persistindo dados no banco...')
      
      // 1. Save lawyer
      const lawyer = await upsertLawyer({
        userId: user.id,
        name: advogadoNome,
        oab,
        state: uf,
        active: true
      })

      // 2. Save processes
      const processesToSave = processos.map(p => ({
        cnjNumber: p.numero_cnj,
        title: p.titulo,
        court: p.tribunal,
        courtClass: p.classe,
        subject: p.assunto,
        status: p.status || 'active',
        value: p.valor_causa?.toString(),
        startDate: p.data_inicio ? new Date(p.data_inicio) : null,
        parties: p.partes,
        sourceApi: 'solucionare',
        sourceData: { originalProcess: p },
        metadata: {
          lawyerId: lawyer.id,
          importedAt: new Date().toISOString()
        }
      }))

      const savedProcesses = await batchUpsertProcesses(user.id, processesToSave)

      // 3. Save clients and create relationships
      const clientsMap = new Map<string, any>()
      const clientProcessLinks: Array<{
        clientKey: string
        processId: string
        participationType: string
      }> = []

      savedProcesses.forEach((savedProcess, index) => {
        const originalProcess = processos[index]
        
        // Process autores
        originalProcess.partes?.autores.forEach(parte => {
          const key = parte.cpf_cnpj || parte.nome
          if (!clientsMap.has(key)) {
            clientsMap.set(key, {
              name: parte.nome,
              cpfCnpj: parte.cpf_cnpj,
              personType: parte.tipo_pessoa || 'FISICA',
              metadata: { source: 'solucionare_import' }
            })
          }
          clientProcessLinks.push({
            clientKey: key,
            processId: savedProcess.id,
            participationType: 'AUTOR'
          })
        })
        
        // Process réus
        originalProcess.partes?.reus.forEach(parte => {
          const key = parte.cpf_cnpj || parte.nome
          if (!clientsMap.has(key)) {
            clientsMap.set(key, {
              name: parte.nome,
              cpfCnpj: parte.cpf_cnpj,
              personType: parte.tipo_pessoa || 'FISICA',
              metadata: { source: 'solucionare_import' }
            })
          }
          clientProcessLinks.push({
            clientKey: key,
            processId: savedProcess.id,
            participationType: 'REU'
          })
        })
      })

      // Save clients
      const clientsToSave = Array.from(clientsMap.values())
      const savedClients = await batchUpsertClients(user.id, clientsToSave)

      // Create client-process relationships
      const clientIdMap = new Map<string, string>()
      savedClients.forEach(client => {
        const key = client.cpfCnpj || client.name
        clientIdMap.set(key, client.id)
      })

      const linksToCreate = clientProcessLinks
        .filter(link => clientIdMap.has(link.clientKey))
        .map(link => ({
          clientId: clientIdMap.get(link.clientKey)!,
          processId: link.processId,
          participationType: link.participationType
        }))

      await batchLinkClientsToProcesses(linksToCreate)

      // 4. Save publications if any
      if (publicacoes.length > 0) {
        for (const pub of publicacoes) {
          const processId = savedProcesses.find(p => 
            p.cnjNumber === (pub.numProcesso || pub.numeroProcesso)
          )?.id

          await upsertPublication({
            userId: user.id,
            processId: processId || null,
            publicationDate: new Date(pub.dataPublicacao || pub.dataDisponibilizacao || Date.now()),
            captureDate: pub.dataCadastro ? new Date(pub.dataCadastro) : null,
            content: pub.conteudoPublicacao || '',
            type: pub.tipoPublicacao,
            court: pub.tribunal || pub.orgao,
            diary: pub.nomeDiario,
            oab: pub.oab,
            sourceApi: 'solucionare',
            sourceData: pub,
            metadata: {
              lawyerId: lawyer.id,
              importedAt: new Date().toISOString()
            }
          })
        }
      }

      persistedData = {
        lawyerId: lawyer.id,
        processCount: savedProcesses.length,
        clientCount: savedClients.length,
        publicationCount: publicacoes.length,
        relationshipCount: linksToCreate.length
      }
    }

    // Extract clients for response
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
        provedor: 'Solucionare',
        persisted: persist,
        persistedData
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

// Helper functions (same as before)
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

async function registrarEscritorioSolucionare(params: { token: string; relationalName: string; officeId: string; office?: any }) {
  const { token, relationalName, officeId } = params
  const office = params.office || {}
  const soapUrl = process.env.SOLUCIONARE_OFFICE_SOAP_URL || 'http://online.solucionarelj.com.br:9191/recorte/webservice/20181220/service/escritorio.php'
  const soapAction = process.env.SOLUCIONARE_OFFICE_SOAP_ACTION_CADASTRAR || 'http://online.solucionarelj.com.br:9191/recorte/webservice/20181220/service/escritorio.php#cadastrar'

  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const dataCadastro = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

  const payload = {
    codEscritorio: officeId,
    area: office.area ?? 2,
    nome: office.nome || office.name || `Escritório ${officeId}`,
    senha: office.senha || '',
    endereco: office.endereco || office.address || '',
    cidade: office.cidade || office.city || '',
    estado: office.estado || office.state || '',
    cep: office.cep || office.zip || office.zip_code || '',
    perfilContratante: office.perfilContratante || '',
    telefone: office.telefone || office.phone || '',
    dataCadastro,
    bloqueado: false,
  }

  const xml = criarEnvelopeCadastrarEscritorio({ relationalName, token, escritorio: payload })
  const res = await fetch(soapUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': soapAction,
    },
    body: xml,
  })

  if (!res.ok) {
    throw new Error(`Falha SOAP cadastrar escritório: ${res.status}`)
  }
  const text = await res.text()
  const ok = parseSoapCadastrarEscritorioResponse(text)
  if (!ok) {
    console.warn('Resposta SOAP sem confirmação de cadastro do escritório.')
  }
}

async function registrarTermoSolucionare(params: { token: string; relationalName: string; officeId: string; oab: string; uf: string; nome?: string }) {
  const { token, relationalName, officeId, oab, uf, nome } = params
  const soapUrl = 'http://online.solucionarelj.com.br:9191/recorte/webservice/20181220/service/nomes.php'
  const soapAction = 'http://online.solucionarelj.com.br:9191/recorte/webservice/20181220/service/nomes.php#cadastrar'
  const oabPipe = `${oab}|${uf}`
  const displayName = nome || `Advogado OAB ${oab}/${uf}`

  const xml = criarEnvelopeCadastrarTermo({ relationalName, token, officeId, nome: displayName, oabPipe })
  const res = await fetch(soapUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': soapAction,
    },
    body: xml,
  })
  if (!res.ok) {
    throw new Error(`Falha SOAP cadastrar termo: ${res.status}`)
  }
  const text = await res.text()
  const ok = parseSoapCadastrarResponse(text)
  if (!ok) {
    console.warn('Resposta SOAP sem confirmação de cadastro do termo.')
  }
}

function criarEnvelopeCadastrarTermo(input: { relationalName: string; token: string; officeId: string; nome: string; oabPipe: string }) {
  const { relationalName, token, officeId, nome, oabPipe } = input
  return `<?xml version="1.0" encoding="UTF-8"?>
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://online.solucionarelj.com.br:9191/recorte/webservice/20181220/service/nomes.php">
    <soapenv:Header/>
    <soapenv:Body>
      <ser:cadastrar>
        <nomeRelacional>${escapeXml(relationalName)}</nomeRelacional>
        <token>${escapeXml(token)}</token>
        <nome>
          <codEscritorio>${escapeXml(String(officeId))}</codEscritorio>
          <nome>${escapeXml(nome)}</nome>
          <oab>${escapeXml(oabPipe)}</oab>
          <termosBloqueio/>
          <termosValidacao/>
          <variacoes/>
        </nome>
      </ser:cadastrar>
    </soapenv:Body>
  </soapenv:Envelope>`
}

function criarEnvelopeCadastrarEscritorio(input: { relationalName: string; token: string; escritorio: Record<string, any> }) {
  const { relationalName, token, escritorio } = input
  return `<?xml version="1.0" encoding="UTF-8"?>
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://online.solucionarelj.com.br:9191/recorte/webservice/20181220/service/escritorio.php">
    <soapenv:Header/>
    <soapenv:Body>
      <ser:cadastrar>
        <nomeRelacional>${escapeXml(relationalName)}</nomeRelacional>
        <token>${escapeXml(token)}</token>
        <escritorio>
          <codEscritorio>${escapeXml(String(escritorio.codEscritorio || ''))}</codEscritorio>
          <area>${escapeXml(String(escritorio.area || ''))}</area>
          <nome>${escapeXml(String(escritorio.nome || ''))}</nome>
          <senha>${escapeXml(String(escritorio.senha || ''))}</senha>
          <endereco>${escapeXml(String(escritorio.endereco || ''))}</endereco>
          <cidade>${escapeXml(String(escritorio.cidade || ''))}</cidade>
          <estado>${escapeXml(String(escritorio.estado || ''))}</estado>
          <cep>${escapeXml(String(escritorio.cep || ''))}</cep>
          <perfilContratante>${escapeXml(String(escritorio.perfilContratante || ''))}</perfilContratante>
          <telefone>${escapeXml(String(escritorio.telefone || ''))}</telefone>
          <dataCadastro>${escapeXml(String(escritorio.dataCadastro || ''))}</dataCadastro>
          <bloqueado>${String(escritorio.bloqueado) === 'true' ? 'true' : 'false'}</bloqueado>
        </escritorio>
      </ser:cadastrar>
    </soapenv:Body>
  </soapenv:Envelope>`
}

function parseSoapCadastrarResponse(xml: string): boolean {
  const lowered = xml.toLowerCase()
  return lowered.includes('nome de pesquisa adicionado com codigo') || lowered.includes('adicionado com codigo')
}

function parseSoapCadastrarEscritorioResponse(xml: string): boolean {
  const lowered = xml.toLowerCase()
  return lowered.includes('escrit') && (lowered.includes('cadastrado') || lowered.includes('adicionado') || lowered.includes('sucesso'))
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
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

// Enrich via Andamentos V3 com concorrência e cache
const andamentoCache: Map<string, { data: any; expires: number }> = new Map()

async function enrichProcessesWithAndamentos(processos: ProcessoInfo[], opts: {
  token: string
  relationalName: string
  urlTemplate: string
  concurrency: number
  ttl: number
}) {
  const nums = [...new Set(processos.map(p => p.numero_cnj).filter(Boolean))]
  const limiter = createLimiter(opts.concurrency)
  const results = await Promise.all(nums.map(num => limiter(() => getAndamento(num, opts))))
  const byNum = new Map(results.filter(Boolean).map((r: any) => [r.numProcesso || r.numeroProcesso, r]))

  for (const proc of processos) {
    const r: any = byNum.get(proc.numero_cnj)
    if (!r) continue
    const capas = Array.isArray(r.dadosCapa) ? r.dadosCapa : []
    if (capas[0]) {
      proc.tribunal = capas[0].tribunal || proc.tribunal
      proc.classe = capas[0].tipoAcao || proc.classe
      proc.assunto = capas[0].assunto || proc.assunto
      proc.data_inicio = capas[0].dataDistribuicao || proc.data_inicio
      proc.valor_causa = toNumber(capas[0].valor) ?? proc.valor_causa
    }
    proc.status = r.status || proc.status

    const autores = (Array.isArray(r.autor) ? r.autor : []).map((a: any) => a.nome).filter(Boolean)
    const reus = (Array.isArray(r.reu) ? r.reu : []).map((a: any) => a.nome).filter(Boolean)
    proc.partes = proc.partes || { autores: [], reus: [], advogados: [] }
    proc.partes.autores = autores.map((nome: string) => ({ nome, tipo_pessoa: 'FISICA' }))
    proc.partes.reus = reus.map((nome: string) => ({ nome, tipo_pessoa: 'FISICA' }))
    const advs = (Array.isArray(r.advogadoProcesso) ? r.advogadoProcesso : []).map((a: any) => ({ nome: a.nome, oab: a.oab }))
    proc.partes.advogados = [...(proc.partes.advogados || []), ...advs]
    if (autores.length || reus.length) {
      proc.titulo = `${autores.join(', ') || 'Autor'} x ${reus.join(', ') || 'Réu'}`
      proc.cliente = autores[0] || reus[0] || proc.cliente
      proc.tipo_cliente = autores.length > 0 ? 'AUTOR' : 'REU'
    }
  }
}

function createLimiter(concurrency: number) {
  const queue: Array<() => void> = []
  let active = 0
  const next = () => {
    if (active >= concurrency) return
    const fn = queue.shift()
    if (!fn) return
    active++
    fn()
  }
  return function <T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const run = () => {
        task().then(resolve).catch(reject).finally(() => {
          active--
          next()
        })
      }
      queue.push(run)
      next()
    })
  }
}

async function getAndamento(numProcesso: string, opts: { token: string; relationalName: string; urlTemplate: string; ttl: number }) {
  const key = `and:${numProcesso}`
  const cached = andamentoCache.get(key)
  const now = Date.now()
  if (cached && cached.expires > now) return cached.data
  const url = opts.urlTemplate
    .replace('{rel}', encodeURIComponent(opts.relationalName))
    .replace('{token}', encodeURIComponent(opts.token))
    .replace('{num}', encodeURIComponent(numProcesso))
  const res = await fetch(url, { method: 'GET' })
  if (!res.ok) throw new Error(`Falha Andamentos para ${numProcesso}: ${res.status}`)
  const data = await res.json()
  const first = Array.isArray(data) ? data[0] : data
  andamentoCache.set(key, { data: first, expires: now + opts.ttl * 1000 })
  return first
}

function toNumber(v: any): number | undefined {
  if (v == null) return undefined
  if (typeof v === 'number') return v
  const cleaned = String(v).replace(/[^\d.,-]/g, '').replace('.', '').replace(',', '.')
  const n = Number(cleaned)
  return isNaN(n) ? undefined : n
}