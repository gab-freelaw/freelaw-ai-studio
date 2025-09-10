import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { comunicaApiService } from '@/lib/services/comunicaapi.service'

const oabExperienceSchema = z.object({
  oabNumber: z.string().min(3, 'Número da OAB deve ter pelo menos 3 dígitos'),
  oabState: z.string().length(2, 'UF deve ter 2 caracteres'),
  daysBack: z.number().optional().default(30)
})

interface ComunicacaoAnalysis {
  numero_processo: string
  tribunal: string
  data_publicacao: string
  tipo_movimento: string
  conteudo: string
  legalArea: string
  urgente: boolean
}

interface ExperienceAnalysis {
  totalPublications: number
  uniqueProcesses: number
  legalAreas: Array<{
    area: string
    count: number
    percentage: number
    recentActivity: boolean
  }>
  experienceLevel: 'iniciante' | 'intermediário' | 'experiente' | 'especialista'
  activeInLast30Days: boolean
  movementTypes: Array<{
    type: string
    count: number
  }>
  courts: Array<{
    court: string
    count: number
  }>
  reliability: 'alta' | 'média' | 'baixa'
  urgentCases: number
  averageActivityPerWeek: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { oabNumber, oabState, daysBack } = oabExperienceSchema.parse(body)

    console.log(`🔍 Validando experiência OAB: ${oabNumber}/${oabState} - Últimos ${daysBack} dias`)

    // Buscar publicações usando ComunicaAPI
    const publications = await searchPublicationsWithComunicaAPI(oabNumber, oabState, daysBack)

    // Analisar experiência baseada nas publicações
    const analysis = analyzeExperienceFromPublications(publications)

    return NextResponse.json({
      success: true,
      oab: `${oabNumber}/${oabState}`,
      searchPeriod: `${daysBack} dias`,
      publications: {
        total: publications.length,
        recent: publications.filter(p => isRecent(p.data_publicacao, daysBack)).length,
        list: publications.slice(0, 10) // Primeiros 10 para preview
      },
      analysis,
      extractedAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Erro ao validar experiência OAB:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

async function searchPublicationsWithComunicaAPI(oabNumber: string, oabState: string, daysBack: number): Promise<ComunicacaoAnalysis[]> {
  try {
    console.log(`📰 Buscando publicações ComunicaAPI para OAB ${oabNumber}/${oabState}`)
    
    // Calcular data de início
    const dataFim = new Date().toISOString().split('T')[0]
    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - daysBack)
    const dataInicioStr = dataInicio.toISOString().split('T')[0]
    
    // Buscar publicações usando ComunicaAPI
    const resultado = await comunicaApiService.buscarPublicacoes({
      oab_numero: oabNumber,
      oab_uf: oabState,
      data_inicio: dataInicioStr,
      data_fim: dataFim,
      limit: 1000 // Buscar até 1000 publicações
    })

    console.log(`✅ ComunicaAPI: ${resultado.comunicacoes.length} publicações encontradas`)

    // Processar e analisar publicações
    const publicacoesAnalisadas: ComunicacaoAnalysis[] = resultado.comunicacoes.map(comunicacao => {
      // Extrair área jurídica do conteúdo
      const legalArea = extractLegalAreaFromContent(comunicacao.conteudo || comunicacao.tipo_movimento || '')
      
      return {
        numero_processo: comunicacao.numero_processo || '',
        tribunal: comunicacao.tribunal || '',
        data_publicacao: comunicacao.data_publicacao || '',
        tipo_movimento: comunicacao.tipo_movimento || '',
        conteudo: comunicacao.conteudo || '',
        legalArea,
        urgente: comunicacao.urgente || false
      }
    })

    return publicacoesAnalisadas

  } catch (error) {
    console.error('Erro ao buscar publicações ComunicaAPI:', error)
    return []
  }
}

function extractLegalAreaFromContent(content: string): string {
  const legalAreas = [
    'Direito Civil', 'Direito Penal', 'Direito Trabalhista', 'Direito Tributário',
    'Direito Empresarial', 'Direito do Consumidor', 'Direito de Família',
    'Direito Imobiliário', 'Direito Previdenciário', 'Direito Ambiental',
    'Direito Digital', 'Direito Administrativo', 'Direito Constitucional',
    'Direito Processual Civil', 'Direito Processual Penal'
  ]

  const contentLower = content.toLowerCase()
  
  // Palavras-chave para identificar áreas jurídicas
  const keywords = {
    'Direito Civil': ['civil', 'contrato', 'responsabilidade civil', 'danos morais', 'indenização', 'obrigação'],
    'Direito Penal': ['penal', 'criminal', 'crime', 'delito', 'prisão', 'condenação'],
    'Direito Trabalhista': ['trabalhista', 'trabalho', 'clt', 'emprego', 'salário', 'rescisão', 'fgts'],
    'Direito Tributário': ['tributário', 'imposto', 'icms', 'ipi', 'ir', 'pis', 'cofins', 'fiscal'],
    'Direito Empresarial': ['empresarial', 'sociedade', 'falência', 'recuperação judicial', 'comercial'],
    'Direito do Consumidor': ['consumidor', 'cdc', 'produto', 'serviço', 'fornecedor'],
    'Direito de Família': ['família', 'divórcio', 'pensão alimentícia', 'guarda', 'adoção'],
    'Direito Previdenciário': ['previdenciário', 'inss', 'aposentadoria', 'benefício', 'auxílio'],
    'Direito Administrativo': ['administrativo', 'servidor público', 'licitação', 'concurso'],
    'Direito Processual Civil': ['processual civil', 'cpc', 'petição', 'sentença', 'recurso']
  }

  // Procurar por palavras-chave
  for (const [area, words] of Object.entries(keywords)) {
    for (const word of words) {
      if (contentLower.includes(word)) {
        return area
      }
    }
  }

  // Se não encontrou área específica, tentar identificar por tribunal
  if (contentLower.includes('trt') || contentLower.includes('trabalho')) {
    return 'Direito Trabalhista'
  }
  if (contentLower.includes('criminal') || contentLower.includes('vara criminal')) {
    return 'Direito Penal'
  }
  if (contentLower.includes('família') || contentLower.includes('vara de família')) {
    return 'Direito de Família'
  }

  return 'Direito Geral'
}


function analyzeExperienceFromPublications(publications: ComunicacaoAnalysis[]): ExperienceAnalysis {
  // Analisar áreas jurídicas
  const areaCount = new Map<string, number>()
  const recentAreas = new Set<string>()
  
  publications.forEach(pub => {
    const area = pub.legalArea
    areaCount.set(area, (areaCount.get(area) || 0) + 1)
    
    const isRecentPub = isRecent(pub.data_publicacao, 30)
    if (isRecentPub) {
      recentAreas.add(area)
    }
  })
  
  const totalPublications = publications.length
  const uniqueProcesses = new Set(publications.map(p => p.numero_processo)).size
  
  const legalAreas = Array.from(areaCount.entries())
    .map(([area, count]) => ({
      area,
      count,
      percentage: Math.round((count / totalPublications) * 100),
      recentActivity: recentAreas.has(area)
    }))
    .sort((a, b) => b.count - a.count)
  
  // Determinar nível de experiência baseado em publicações
  let experienceLevel: 'iniciante' | 'intermediário' | 'experiente' | 'especialista'
  if (totalPublications >= 100) experienceLevel = 'especialista'
  else if (totalPublications >= 50) experienceLevel = 'experiente'
  else if (totalPublications >= 20) experienceLevel = 'intermediário'
  else experienceLevel = 'iniciante'
  
  // Verificar atividade recente
  const recentPublications = publications.filter(p => isRecent(p.data_publicacao, 30))
  const activeInLast30Days = recentPublications.length > 0
  
  // Analisar tipos de movimento
  const movementTypes = publications.reduce((acc, pub) => {
    const type = pub.tipo_movimento || 'Outros'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // Analisar tribunais
  const courts = publications.reduce((acc, pub) => {
    const court = pub.tribunal || 'Não informado'
    acc[court] = (acc[court] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // Contar casos urgentes
  const urgentCases = publications.filter(p => p.urgente).length
  
  // Calcular atividade média por semana
  const averageActivityPerWeek = Math.round((totalPublications / 4.3)) // 30 dias ≈ 4.3 semanas
  
  // Determinar confiabilidade
  let reliability: 'alta' | 'média' | 'baixa'
  if (totalPublications >= 30 && activeInLast30Days && legalAreas.length >= 2 && uniqueProcesses >= 10) {
    reliability = 'alta'
  } else if (totalPublications >= 15 && (activeInLast30Days || legalAreas.length >= 2) && uniqueProcesses >= 5) {
    reliability = 'média'
  } else {
    reliability = 'baixa'
  }
  
  return {
    totalPublications,
    uniqueProcesses,
    legalAreas,
    experienceLevel,
    activeInLast30Days,
    movementTypes: Object.entries(movementTypes).map(([type, count]) => ({ type, count })),
    courts: Object.entries(courts).map(([court, count]) => ({ court, count })),
    reliability,
    urgentCases,
    averageActivityPerWeek
  }
}

function isRecent(dateString: string, daysBack: number): boolean {
  const date = new Date(dateString)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - daysBack)
  return date >= cutoff
}
