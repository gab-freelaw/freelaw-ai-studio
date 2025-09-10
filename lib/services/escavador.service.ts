import { z } from 'zod'

// Escavador API Types
export const ProcessoSchema = z.object({
  id: z.string(),
  numero_cnj: z.string(),
  numero_processo: z.string().optional(),
  classe: z.string(),
  assunto: z.string(),
  valor_causa: z.number().optional(),
  tribunal: z.string(),
  vara: z.string(),
  comarca: z.string().optional(),
  status: z.enum(['ATIVO', 'ARQUIVADO', 'SUSPENSO']),
  data_distribuicao: z.string(),
  data_ultima_movimentacao: z.string().optional(),
  partes: z.array(z.object({
    tipo: z.enum(['AUTOR', 'REU', 'TERCEIRO']),
    nome: z.string(),
    cpf_cnpj: z.string().optional(),
    advogados: z.array(z.object({
      nome: z.string(),
      oab: z.string(),
    })).optional(),
  })),
  movimentacoes: z.array(z.object({
    id: z.string(),
    data: z.string(),
    tipo: z.string(),
    descricao: z.string(),
    documento_url: z.string().optional(),
  })).optional(),
})

export const PublicacaoSchema = z.object({
  id: z.string(),
  numero_processo: z.string(),
  data_publicacao: z.string(),
  tipo: z.enum(['INTIMACAO', 'SENTENCA', 'DECISAO', 'DESPACHO', 'ACORDAO', 'EDITAL']),
  conteudo: z.string(),
  orgao: z.string(),
  diario: z.string().optional(),
  pagina: z.number().optional(),
  prazo_dias: z.number().optional(),
  data_limite: z.string().optional(),
  advogados_intimados: z.array(z.string()).optional(),
})

export type Processo = z.infer<typeof ProcessoSchema>
export type Publicacao = z.infer<typeof PublicacaoSchema>

export interface BuscarProcessoParams {
  numero_cnj?: string
  numero_processo?: string
  cpf_cnpj?: string
  nome_parte?: string
  tribunal?: string
  incluir_movimentacoes?: boolean
}

export interface BuscarPublicacoesParams {
  data_inicio?: string
  data_fim?: string
  numero_processo?: string
  oab?: string
  uf?: string
  tipo?: string
  tribunal?: string
}

export interface ProcessoDetalhado extends Processo {
  documentos?: Array<{
    id: string
    tipo: string
    nome: string
    data: string
    url: string
  }>
  prazos?: Array<{
    id: string
    tipo: string
    descricao: string
    data_limite: string
    status: 'PENDENTE' | 'CUMPRIDO' | 'VENCIDO'
  }>
  audiencias?: Array<{
    id: string
    tipo: string
    data: string
    local: string
    observacoes?: string
  }>
}

class EscavadorService {
  private apiUrl: string
  private apiToken: string
  private useMockData: boolean

  constructor() {
    this.apiUrl = process.env.ESCAVADOR_API_URL || 'https://api.escavador.com/v2'
    this.apiToken = process.env.ESCAVADOR_API_TOKEN || ''
    // Use mock data in development or when API token is not set
    // Para testar com API real, defina USE_REAL_API=true no .env.local
    this.useMockData = process.env.USE_REAL_API === 'true' ? false : (process.env.NODE_ENV === 'development' || !this.apiToken)
  }

  private async makeRequest<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    // Se estamos em modo de teste, retornar dados mock
    if (process.env.NEXT_PUBLIC_E2E === 'true' || process.env.NODE_ENV === 'test') {
      if (endpoint.includes('/processos')) {
        return {
          items: [{
            id: 'mock-process-123',
            numero_cnj: '1234567-89.2023.8.26.0001',
            titulo: 'Processo de Teste',
            status: 'Em andamento',
            tribunal: 'TJSP',
            classe: 'Ação Civil',
            valor_causa: 50000,
            partes: [{
              tipo: 'AUTOR',
              nome: 'João da Silva',
              cpf_cnpj: '123.456.789-00'
            }]
          }],
          total: 1
        } as T
      }
      
      if (endpoint.includes('/publicacoes')) {
        return { 
          publicacoes: [],
          total: 0 
        } as T
      }
      
      return { 
        items: [], 
        publicacoes: [],
        data: [], 
        total: 0 
      } as T
    }
    
    const url = `${this.apiUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(
        `Escavador API error: ${response.status} - ${error.message || response.statusText}`
      )
    }

    return response.json()
  }

  /**
   * Retorna dados mock para desenvolvimento
   */
  private getMockProcessos(): Processo[] {
    return [
      {
        id: '1',
        numero_cnj: '1234567-12.2024.8.26.0100',
        numero_processo: '1234567/2024',
        classe: 'Procedimento Comum Cível',
        assunto: 'Indenização por Danos Morais',
        valor_causa: 50000,
        tribunal: 'TJSP',
        vara: '12ª Vara Cível',
        comarca: 'São Paulo',
        status: 'ATIVO',
        data_distribuicao: '2024-01-15',
        data_ultima_movimentacao: '2024-01-20',
        partes: [
          {
            tipo: 'AUTOR',
            nome: 'João Silva',
            cpf_cnpj: '123.456.789-00',
            advogados: [
              { nome: 'Dr. Gabriel Magalhães', oab: '183.619/MG' }
            ]
          },
          {
            tipo: 'REU',
            nome: 'Empresa ABC Ltda',
            cpf_cnpj: '12.345.678/0001-00'
          }
        ],
        movimentacoes: [
          {
            id: '1',
            data: '2024-01-20',
            tipo: 'Despacho',
            descricao: 'Cite-se o réu para apresentar defesa no prazo legal.'
          }
        ]
      }
    ]
  }

  private getMockPublicacoes(): Publicacao[] {
    const hoje = new Date()
    return [
      {
        id: '1',
        numero_processo: '1234567-12.2024.8.26.0100',
        data_publicacao: hoje.toISOString().split('T')[0],
        tipo: 'INTIMACAO',
        conteudo: 'Intimação da parte autora para manifestação sobre os documentos juntados.',
        orgao: 'TJSP - 12ª Vara Cível',
        diario: 'DJE-SP',
        pagina: 1234,
        prazo_dias: 15,
        data_limite: new Date(hoje.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        advogados_intimados: ['Dr. Gabriel Magalhães - OAB 183.619/MG']
      },
      {
        id: '2',
        numero_processo: '9876543-21.2023.5.02.0011',
        data_publicacao: new Date(hoje.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tipo: 'SENTENCA',
        conteudo: 'Sentença procedente. Condeno a reclamada ao pagamento das verbas rescisórias.',
        orgao: 'TRT-2 - 11ª Vara do Trabalho',
        diario: 'DEJT',
        pagina: 567,
        prazo_dias: 8,
        data_limite: new Date(hoje.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ]
  }

  /**
   * Busca processos na base do Escavador
   */
  async buscarProcessos(params: BuscarProcessoParams): Promise<Processo[]> {
    if (this.useMockData) {
      // Filtra mock data baseado nos parâmetros
      const mockData = this.getMockProcessos()
      return mockData.filter(p => {
        if (params.numero_cnj && !p.numero_cnj.includes(params.numero_cnj)) return false
        if (params.numero_processo && !p.numero_processo?.includes(params.numero_processo)) return false
        if (params.tribunal && p.tribunal !== params.tribunal) return false
        return true
      })
    }
    
    // API v2 usa endpoints diferentes
    if (params.numero_cnj) {
      // Busca específica por CNJ
      try {
        const data = await this.makeRequest<any>(
          `/api/v2/processos/numero_cnj/${params.numero_cnj}`
        )
        return [ProcessoSchema.parse(data)]
      } catch (error) {
        return []
      }
    }
    
    // Busca por nome ou CPF/CNPJ de envolvido
    const queryParams = new URLSearchParams()
    if (params.nome_parte) queryParams.append('nome', params.nome_parte)
    if (params.cpf_cnpj) queryParams.append('cpf_cnpj', params.cpf_cnpj)
    queryParams.append('limite', '10')

    const data = await this.makeRequest<{ items: any[] }>(
      `/api/v2/envolvido/processos?${queryParams.toString()}`
    )

    // Mapeia os dados da v2 para o formato esperado
    return data.items.map(item => ({
      id: item.numero_cnj,
      numero_cnj: item.numero_cnj,
      numero_processo: item.numero_cnj,
      classe: item.fontes?.[0]?.capa?.classe || 'Não informado',
      assunto: item.fontes?.[0]?.capa?.assunto || 'Não informado',
      valor_causa: item.fontes?.[0]?.capa?.valor_causa?.valor || 0,
      tribunal: item.fontes?.[0]?.tribunal?.sigla || item.unidade_origem?.tribunal_sigla || 'Não informado',
      vara: item.fontes?.[0]?.capa?.orgao_julgador || 'Não informado',
      comarca: item.unidade_origem?.cidade || 'Não informado',
      status: item.fontes?.[0]?.status_predito || 'ATIVO',
      data_distribuicao: item.data_inicio || '',
      data_ultima_movimentacao: item.data_ultima_movimentacao || '',
      partes: item.fontes?.[0]?.envolvidos?.map((env: any) => ({
        tipo: env.polo === 'ATIVO' ? 'AUTOR' : 'REU',
        nome: env.nome,
        cpf_cnpj: env.cpf || env.cnpj || '',
        advogados: env.advogados?.map((adv: any) => ({
          nome: adv.nome,
          oab: adv.oabs?.[0] ? `${adv.oabs[0].numero}/${adv.oabs[0].uf}` : ''
        })) || []
      })) || [],
      movimentacoes: []
    }))
  }

  /**
   * Busca um processo específico pelo ID
   */
  async buscarProcessoPorId(id: string): Promise<ProcessoDetalhado> {
    if (this.useMockData) {
      const processo = this.getMockProcessos().find(p => p.id === id) || this.getMockProcessos()[0]
      return {
        ...processo,
        documentos: [
          {
            id: '1',
            tipo: 'Petição Inicial',
            nome: 'peticao_inicial.pdf',
            data: '2024-01-15',
            url: '#'
          }
        ],
        prazos: [
          {
            id: '1',
            tipo: 'Contestação',
            descricao: 'Prazo para apresentar contestação',
            data_limite: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'PENDENTE'
          }
        ]
      }
    }
    const data = await this.makeRequest<any>(`/busca/processos/${id}`)
    return data as ProcessoDetalhado
  }

  /**
   * Busca publicações em diários oficiais
   */
  async buscarPublicacoes(params: BuscarPublicacoesParams): Promise<Publicacao[]> {
    if (this.useMockData) {
      const mockData = this.getMockPublicacoes()
      return mockData.filter(p => {
        if (params.numero_processo && !p.numero_processo.includes(params.numero_processo)) return false
        if (params.tipo && p.tipo !== params.tipo) return false
        // Adicionar mais filtros conforme necessário
        return true
      })
    }
    const queryParams = new URLSearchParams()
    
    if (params.data_inicio) queryParams.append('data_inicio', params.data_inicio)
    if (params.data_fim) queryParams.append('data_fim', params.data_fim)
    if (params.numero_processo) queryParams.append('numero_processo', params.numero_processo)
    if (params.oab) queryParams.append('oab', params.oab)
    if (params.uf) queryParams.append('uf', params.uf)
    if (params.tipo) queryParams.append('tipo', params.tipo)
    if (params.tribunal) queryParams.append('tribunal', params.tribunal)

    const data = await this.makeRequest<{ publicacoes: any[] }>(
      `/busca/publicacoes?${queryParams.toString()}`
    )

    return data.publicacoes.map(p => PublicacaoSchema.parse(p))
  }

  /**
   * Monitora publicações para um advogado específico
   */
  async monitorarPublicacoes(oab: string, uf: string): Promise<{
    novas: Publicacao[]
    com_prazo: Publicacao[]
    urgentes: Publicacao[]
  }> {
    const hoje = new Date()
    const umaSemanaAtras = new Date(hoje)
    umaSemanaAtras.setDate(hoje.getDate() - 7)

    const publicacoes = await this.buscarPublicacoes({
      oab,
      uf,
      data_inicio: umaSemanaAtras.toISOString().split('T')[0],
      data_fim: hoje.toISOString().split('T')[0],
    })

    const novas = publicacoes.filter(p => {
      const dataPublicacao = new Date(p.data_publicacao)
      const diffDays = Math.floor((hoje.getTime() - dataPublicacao.getTime()) / (1000 * 60 * 60 * 24))
      return diffDays <= 2
    })

    const com_prazo = publicacoes.filter(p => p.prazo_dias && p.prazo_dias > 0)

    const urgentes = com_prazo.filter(p => {
      if (!p.data_limite) return false
      const dataLimite = new Date(p.data_limite)
      const diffDays = Math.floor((dataLimite.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
      return diffDays <= 5 && diffDays >= 0
    })

    return { novas, com_prazo, urgentes }
  }

  /**
   * Analisa uma publicação e sugere ações
   */
  async analisarPublicacao(publicacao: Publicacao): Promise<{
    prazo_calculado: string | null
    acao_sugerida: string
    prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE'
    fundamentacao_legal: string
    template_peca?: string
  }> {
    // Análise baseada no tipo de publicação
    const analises: Record<string, any> = {
      'INTIMACAO': {
        prazo_dias: 15,
        acao_sugerida: 'Analisar intimação e preparar manifestação',
        fundamentacao_legal: 'Art. 231 do CPC/2015',
        template_peca: 'manifestacao',
      },
      'SENTENCA': {
        prazo_dias: 15,
        acao_sugerida: 'Avaliar cabimento de recurso de apelação',
        fundamentacao_legal: 'Art. 1.003 do CPC/2015',
        template_peca: 'apelacao',
      },
      'DECISAO': {
        prazo_dias: 15,
        acao_sugerida: 'Verificar cabimento de agravo de instrumento',
        fundamentacao_legal: 'Art. 1.015 do CPC/2015',
        template_peca: 'agravo_instrumento',
      },
      'DESPACHO': {
        prazo_dias: 5,
        acao_sugerida: 'Cumprir determinação judicial',
        fundamentacao_legal: 'Art. 218 do CPC/2015',
      },
      'ACORDAO': {
        prazo_dias: 15,
        acao_sugerida: 'Avaliar cabimento de recursos especial/extraordinário',
        fundamentacao_legal: 'Art. 102, III e Art. 105, III da CF/88',
        template_peca: 'recurso_especial',
      },
      'EDITAL': {
        prazo_dias: 30,
        acao_sugerida: 'Verificar necessidade de resposta ao edital',
        fundamentacao_legal: 'Art. 256 do CPC/2015',
      },
    }

    const analise = analises[publicacao.tipo] || {
      prazo_dias: 10,
      acao_sugerida: 'Analisar publicação e determinar ação necessária',
      fundamentacao_legal: 'CPC/2015',
    }

    const dataPublicacao = new Date(publicacao.data_publicacao)
    const prazoCalculado = new Date(dataPublicacao)
    prazoCalculado.setDate(prazoCalculado.getDate() + (publicacao.prazo_dias || analise.prazo_dias))

    const hoje = new Date()
    const diasRestantes = Math.floor((prazoCalculado.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

    let prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE' = 'MEDIA'
    if (diasRestantes <= 2) prioridade = 'URGENTE'
    else if (diasRestantes <= 5) prioridade = 'ALTA'
    else if (diasRestantes > 15) prioridade = 'BAIXA'

    return {
      prazo_calculado: prazoCalculado.toISOString().split('T')[0],
      acao_sugerida: analise.acao_sugerida,
      prioridade,
      fundamentacao_legal: analise.fundamentacao_legal,
      template_peca: analise.template_peca,
    }
  }

  /**
   * Formata número CNJ
   */
  formatarNumeroCNJ(numero: string): string {
    const digits = numero.replace(/\D/g, '')
    if (digits.length !== 20) return numero
    
    return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9, 13)}.${digits.slice(13, 14)}.${digits.slice(14, 16)}.${digits.slice(16, 20)}`
  }

  /**
   * Valida número CNJ
   */
  validarNumeroCNJ(numero: string): boolean {
    const digits = numero.replace(/\D/g, '')
    return digits.length === 20
  }
}

export const escavadorService = new EscavadorService()