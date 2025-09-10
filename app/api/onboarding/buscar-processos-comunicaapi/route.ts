import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { comunicaApiService } from '@/lib/services/comunicaapi.service'
import { db } from '@/db'
import { lawyers, publications } from '@/db/legal-schema'
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
import {
  setUserOfficeId
} from '@/lib/services/user-settings.service'

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

interface ClienteInfo {
  nome: string
  cpf_cnpj?: string
  tipo_pessoa: 'FISICA' | 'JURIDICA'
  processos: string[]
}

/**
 * Generate a unique Office ID from OAB number and state
 */
function generateOfficeId(oab: string, uf: string): string {
  const cleanOab = oab.replace(/\D/g, '') // Remove non-digits
  return `${cleanOab}-${uf}`
}

/**
 * Extract processes from ComunicaAPI publications
 */
function extractProcessesFromPublications(publicacoes: any[], advogadoNome: string, oab: string, uf: string): ProcessoInfo[] {
  const processosMap = new Map<string, ProcessoInfo>()
  
  publicacoes.forEach(pub => {
    const numeroProcesso = pub.numero_processo || pub.numeroProcesso || pub.numProcesso
    if (!numeroProcesso) return
    
    // Extract client info from publication content
    const conteudo = pub.conteudo || pub.conteudoPublicacao || ''
    const clientes = extractClientsFromContent(conteudo)
    const cliente = clientes.length > 0 ? clientes[0].nome : 'Cliente não identificado'
    
    if (!processosMap.has(numeroProcesso)) {
      processosMap.set(numeroProcesso, {
        numero_cnj: numeroProcesso,
        titulo: pub.assunto || pub.tipo_publicacao || 'Processo',
        cliente: cliente,
        tipo_cliente: 'AUTOR', // Default, pode ser refinado
        data_inicio: pub.data_publicacao || pub.dataPublicacao || new Date().toISOString(),
        tribunal: pub.tribunal || pub.orgao || 'Tribunal não identificado',
        classe: pub.classe,
        assunto: pub.assunto,
        status: 'ATIVO',
        partes: {
          autores: clientes.filter(c => c.tipo === 'AUTOR'),
          reus: clientes.filter(c => c.tipo === 'REU'),
          advogados: [{ nome: advogadoNome, oab: `${oab}/${uf}` }]
        }
      })
    }
  })
  
  return Array.from(processosMap.values())
}

/**
 * Extract clients from publication content using regex patterns
 */
function extractClientsFromContent(conteudo: string): Array<{nome: string, cpf_cnpj?: string, tipo_pessoa?: string, tipo: 'AUTOR' | 'REU'}> {
  const clientes: Array<{nome: string, cpf_cnpj?: string, tipo_pessoa?: string, tipo: 'AUTOR' | 'REU'}> = []
  
  // Extract AUTOR/REQUERENTE
  const autorMatches = conteudo.match(/(?:AUTOR|REQUERENTE|EXEQUENTE):\s*([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s]+?)(?:\s*-|,|\n|$)/gi)
  if (autorMatches) {
    autorMatches.forEach(match => {
      const nome = match.replace(/(?:AUTOR|REQUERENTE|EXEQUENTE):\s*/gi, '').trim()
      if (nome.length > 3) {
        clientes.push({
          nome: nome.substring(0, 100),
          tipo_pessoa: nome.includes('LTDA') || nome.includes('S/A') || nome.includes('EIRELI') ? 'JURIDICA' : 'FISICA',
          tipo: 'AUTOR'
        })
      }
    })
  }
  
  // Extract RÉU/REQUERIDO
  const reuMatches = conteudo.match(/(?:RÉU|REQUERIDO|EXECUTADO):\s*([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s]+?)(?:\s*-|,|\n|$)/gi)
  if (reuMatches) {
    reuMatches.forEach(match => {
      const nome = match.replace(/(?:RÉU|REQUERIDO|EXECUTADO):\s*/gi, '').trim()
      if (nome.length > 3) {
        clientes.push({
          nome: nome.substring(0, 100),
          tipo_pessoa: nome.includes('LTDA') || nome.includes('S/A') || nome.includes('EIRELI') ? 'JURIDICA' : 'FISICA',
          tipo: 'REU'
        })
      }
    })
  }
  
  return clientes
}

/**
 * Convert extracted clients to ClienteInfo format
 */
function convertToClienteInfo(processos: ProcessoInfo[]): ClienteInfo[] {
  const clientesMap = new Map<string, ClienteInfo>()
  
  processos.forEach(processo => {
    // Add autores
    processo.partes?.autores.forEach(autor => {
      if (!clientesMap.has(autor.nome)) {
        clientesMap.set(autor.nome, {
          nome: autor.nome,
          cpf_cnpj: autor.cpf_cnpj,
          tipo_pessoa: autor.tipo_pessoa as 'FISICA' | 'JURIDICA' || 'FISICA',
          processos: []
        })
      }
      clientesMap.get(autor.nome)!.processos.push(processo.numero_cnj)
    })
    
    // Add reus
    processo.partes?.reus.forEach(reu => {
      if (!clientesMap.has(reu.nome)) {
        clientesMap.set(reu.nome, {
          nome: reu.nome,
          cpf_cnpj: reu.cpf_cnpj,
          tipo_pessoa: reu.tipo_pessoa as 'FISICA' | 'JURIDICA' || 'FISICA',
          processos: []
        })
      }
      clientesMap.get(reu.nome)!.processos.push(processo.numero_cnj)
    })
  })
  
  return Array.from(clientesMap.values())
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // For onboarding, authentication is optional
    const userId = user?.id || 'anonymous'
    
    const body = await request.json()
    const { oab, uf, persist = true } = body

    if (!oab || !uf) {
      return NextResponse.json(
        { error: 'OAB e UF são obrigatórios' },
        { status: 400 }
      )
    }

    console.log(`🔍 Iniciando busca via ComunicaAPI para OAB: ${oab}/${uf}`)
    
    // Generate Office ID automatically from OAB and UF
    const officeId = generateOfficeId(oab, uf)
    console.log(`📋 Office ID gerado: ${officeId}`)
    
    // If user is authenticated, save the Office ID to their settings
    if (user && persist) {
      try {
        await setUserOfficeId(user.id, officeId)
        console.log('✅ Office ID salvo nas configurações do usuário')
      } catch (error) {
        console.warn('⚠️ Não foi possível salvar Office ID:', error)
      }
    }
    
    const startTime = Date.now()
    let advogadoNome = ''
    let processos: ProcessoInfo[] = []
    let publicacoes: any[] = []
    let persistedData: any = null
    
    try {
      console.log(`🔍 Buscando publicações via ComunicaAPI para OAB: ${oab}/${uf}`)
      
      // Calcular período dos últimos 30 dias
      const dataFim = new Date()
      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - 30)
      
      const dataInicioStr = dataInicio.toISOString().split('T')[0]
      const dataFimStr = dataFim.toISOString().split('T')[0]
      
      console.log(`📅 Período de busca: ${dataInicioStr} até ${dataFimStr}`)
      
      // Para desenvolvimento, simular dados quando a API externa falha
      if (process.env.NODE_ENV === 'development') {
        console.log('🧪 Modo desenvolvimento: Simulando dados de exemplo')
        
        // Dados simulados para desenvolvimento
        publicacoes = [
          {
            id: 'pub-1',
            numero_processo: '1234567-89.2024.8.13.0001',
            tribunal: 'TJMG',
            data_publicacao: dataInicioStr,
            conteudo: `Intimação do advogado OAB ${oab}/${uf} para apresentar contrarrazões no processo 1234567-89.2024.8.13.0001`,
            tipo_movimento: 'intimacao',
            destinatarios: [`OAB ${oab}/${uf}`],
            advogados_mencionados: [`Advogado OAB ${oab}/${uf}`],
            prazo_dias: 15,
            urgente: false,
            status: 'nova' as const
          },
          {
            id: 'pub-2',
            numero_processo: '9876543-21.2024.8.13.0002',
            tribunal: 'TJMG',
            data_publicacao: dataFimStr,
            conteudo: `Citação para audiência - Processo 9876543-21.2024.8.13.0002 - Advogado OAB ${oab}/${uf}`,
            tipo_movimento: 'citacao',
            destinatarios: [`OAB ${oab}/${uf}`],
            advogados_mencionados: [`Advogado OAB ${oab}/${uf}`],
            prazo_dias: 10,
            urgente: true,
            status: 'nova' as const
          }
        ]
        
        advogadoNome = `Advogado OAB ${oab}/${uf}`
        console.log(`📰 Simuladas ${publicacoes.length} publicações para desenvolvimento`)
        
        // Extrair processos das publicações simuladas
        processos = extractProcessesFromPublications(publicacoes, advogadoNome, oab, uf)
        console.log(`⚖️ Extraídos ${processos.length} processos únicos das publicações simuladas`)
      } else {
        // Buscar publicações via ComunicaAPI (produção)
        const resultado = await comunicaApiService.buscarPublicacoes({
          oab_numero: oab,
          oab_uf: uf,
          data_inicio: dataInicioStr,
          data_fim: dataFimStr,
          limit: 1000
        })
        
        if (!resultado.success) {
          console.error('❌ Erro na ComunicaAPI:', resultado.error)
          // Em produção, retornar erro, mas em desenvolvimento continuar com dados simulados
          return NextResponse.json(
            { error: `Erro ao buscar publicações: ${resultado.error}` },
            { status: 500 }
          )
        }
        
        publicacoes = resultado.comunicacoes || []
        advogadoNome = `Advogado OAB ${oab}/${uf}`
        
        console.log(`📰 Encontradas ${publicacoes.length} publicações`)
        
        // Extrair processos das publicações
        if (publicacoes.length > 0) {
          processos = extractProcessesFromPublications(publicacoes, advogadoNome, oab, uf)
          console.log(`⚖️ Extraídos ${processos.length} processos únicos das publicações`)
        } else {
          console.log('ℹ️ Nenhuma publicação encontrada no período')
        }
      }

      // Track API cost
      const responseTime = Date.now() - startTime
      if (persist && user) {
        await trackApiCost({
          userId: user.id,
          apiProvider: 'comunicaapi',
          endpoint: 'buscarPublicacoes',
          requestCount: 1,
          responseTime,
          success: true,
          metadata: {
            oab,
            uf,
            publicationsFound: publicacoes.length,
            processesFound: processos.length,
            period: `${dataInicioStr} - ${dataFimStr}`
          }
        })
      }

      console.log(`✅ Busca concluída: ${processos.length} processos, ${publicacoes.length} publicações`)
    } catch (error: any) {
      console.error('❌ Erro na busca de processos:', error)
      
      // Track failed API cost
      if (persist && user) {
        await trackApiCost({
          userId: user.id,
          apiProvider: 'comunicaapi',
          endpoint: 'buscarPublicacoes',
          requestCount: 1,
          responseTime: Date.now() - startTime,
          success: false,
          metadata: { error: error.message }
        })
      }
      
      return NextResponse.json(
        { error: error.message || 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Persist data to database if requested and user is authenticated
    if (persist && user && (processos.length > 0 || publicacoes.length > 0)) {
      try {
        console.log('💾 Tentando persistir dados no banco...')
        
        // Verificar se a conexão com o banco está funcionando
        try {
          // Teste simples de conexão
          await db.select().from(lawyers).limit(1)
          console.log('✅ Conexão com banco OK')
        } catch (dbTestError) {
          console.warn('⚠️ Banco de dados indisponível, continuando sem persistir:', dbTestError.message)
          // Continuar sem salvar no banco
          persistedData = {
            message: 'Dados não foram salvos no banco (banco indisponível)',
            processos: processos.length,
            publicacoes: publicacoes.length
          }
          // Pular a persistência
          throw new Error('Database unavailable')
        }
        
        // 1. Upsert lawyer
        const lawyer = await upsertLawyer({
          userId: user.id,
          name: advogadoNome,
          oab: `${oab}/${uf}`,
          email: user.email || '',
          phone: '',
          officeId: officeId
        })

        // 2. Batch upsert processes
        const savedProcesses = await batchUpsertProcesses(
          processos.map(p => ({
            userId: user.id,
            cnjNumber: p.numero_cnj,
            title: p.titulo,
            court: p.tribunal,
            subject: p.assunto || '',
            processClass: p.classe || '',
            status: p.status || 'ATIVO',
            startDate: new Date(p.data_inicio),
            causeValue: p.valor_causa || null,
            lawyerId: lawyer.id,
            metadata: {
              extractedFromPublications: true,
              sourceApi: 'comunicaapi',
              importedAt: new Date().toISOString()
            }
          }))
        )

        // 3. Extract and batch upsert clients
        const clientes = convertToClienteInfo(processos)
        const savedClients = await batchUpsertClients(
          clientes.map(c => ({
            userId: user.id,
            name: c.nome,
            document: c.cpf_cnpj || '',
            personType: c.tipo_pessoa,
            email: '',
            phone: '',
            metadata: {
              extractedFromPublications: true,
              sourceApi: 'comunicaapi',
              importedAt: new Date().toISOString()
            }
          }))
        )

        // 4. Link clients to processes
        const clientIdMap = new Map<string, string>()
        savedClients.forEach(client => {
          clientIdMap.set(client.name, client.id)
        })

        const clientProcessLinks: Array<{
          clientId: string
          processId: string
          participationType: 'AUTOR' | 'REU'
        }> = []

        processos.forEach(processo => {
          const processId = savedProcesses.find(p => p.cnjNumber === processo.numero_cnj)?.id
          if (!processId) return

          // Link autores
          processo.partes?.autores.forEach(autor => {
            const clientId = clientIdMap.get(autor.nome)
            if (clientId) {
              clientProcessLinks.push({
                clientId,
                processId,
                participationType: 'AUTOR'
              })
            }
          })

          // Link reus
          processo.partes?.reus.forEach(reu => {
            const clientId = clientIdMap.get(reu.nome)
            if (clientId) {
              clientProcessLinks.push({
                clientId,
                processId,
                participationType: 'REU'
              })
            }
          })
        })

        await batchLinkClientsToProcesses(clientProcessLinks)

        // 5. Save publications if any
        if (publicacoes.length > 0) {
          for (const pub of publicacoes) {
            const processId = savedProcesses.find(p => 
              p.cnjNumber === (pub.numero_processo || pub.numeroProcesso || pub.numProcesso)
            )?.id

            await upsertPublication({
              userId: user.id,
              processId: processId || null,
              publicationDate: new Date(pub.data_publicacao || pub.dataPublicacao || Date.now()),
              captureDate: pub.data_cadastro ? new Date(pub.data_cadastro) : null,
              content: pub.conteudo || pub.conteudoPublicacao || '',
              type: pub.tipo_publicacao || 'COMUNICACAO',
              court: pub.tribunal || pub.orgao || '',
              diary: pub.nome_diario || pub.nomeDiario || '',
              oab: `${oab}/${uf}`,
              sourceApi: 'comunicaapi',
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
          relationshipCount: clientProcessLinks.length
        }
        
        console.log('✅ Dados persistidos com sucesso:', persistedData)
      } catch (dbError) {
        console.error('❌ Erro ao persistir dados:', dbError)
        // Continue without persistence
        if (dbError.message === 'Database unavailable') {
          console.log('ℹ️ Continuando sem persistir dados (banco indisponível)')
          persistedData = {
            message: 'Dados não foram salvos - banco de dados indisponível',
            processos: processos.length,
            publicacoes: publicacoes.length
          }
        } else {
          persistedData = {
            error: 'Falha ao salvar no banco de dados',
            details: dbError.message
          }
        }
      }
    }

    // Extract clients for response
    const clientes = convertToClienteInfo(processos)

    const response = {
      success: true,
      advogado: {
        nome: advogadoNome,
        oab: `${oab}/${uf}`,
        officeId
      },
      processos,
      clientes,
      publicacoes: publicacoes.length,
      estatisticas: {
        total_processos: processos.length,
        total_clientes: clientes.length,
        total_publicacoes: publicacoes.length,
        periodo: `Últimos 30 dias`,
        fonte: 'comunicaapi'
      },
      persistedData
    }

    console.log('📊 Resposta final:', {
      processos: response.processos.length,
      clientes: response.clientes.length,
      publicacoes: response.publicacoes,
      persisted: !!persistedData
    })

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
