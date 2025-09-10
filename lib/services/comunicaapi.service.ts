/**
 * Serviço para integração com a Comunica API do PJE
 * API oficial e opensource para busca de publicações judiciais
 * Documentação: https://comunicaapi.pje.jus.br/swagger/index.html
 */

export interface ComunicacaoResponse {
  id: string
  numero_processo: string
  tribunal: string
  data_publicacao: string
  conteudo: string
  tipo_movimento: string
  destinatarios: string[]
  advogados_mencionados?: string[]
  prazo_dias?: number
  urgente: boolean
  status: 'nova' | 'lida' | 'processada'
}

export interface BuscaPublicacoesParams {
  oab_numero: string
  oab_uf: string
  data_inicio?: string  // YYYY-MM-DD
  data_fim?: string     // YYYY-MM-DD
  tribunal?: string
  numero_processo?: string
  tipo_movimento?: string
  limit?: number
  offset?: number
}

export interface ProcessoExtraido {
  numero_cnj: string
  numero_processo: string
  tribunal: string
  classe: string
  assunto: string
  valor_causa?: number
  data_distribuicao: string
  vara: string
  partes: {
    autores: Array<{
      nome: string
      cpf_cnpj?: string
      tipo_pessoa: 'fisica' | 'juridica'
    }>
    reus: Array<{
      nome: string
      cpf_cnpj?: string
      tipo_pessoa: 'fisica' | 'juridica'
    }>
    advogados: Array<{
      nome: string
      oab_numero: string
      oab_uf: string
    }>
  }
  ultima_movimentacao: string
  status: string
}

export interface ClienteExtraido {
  nome: string
  cpf_cnpj: string
  tipo_pessoa: 'fisica' | 'juridica'
  email?: string
  telefone?: string
  endereco?: {
    logradouro: string
    numero: string
    complemento?: string
    bairro: string
    cidade: string
    uf: string
    cep: string
  }
  processos_relacionados: string[]
}

class ComunicaApiService {
  private baseUrl = 'https://comunicaapi.pje.jus.br/api/v1'

  /**
   * Buscar publicações por OAB
   */
  async buscarPublicacoes(params: BuscaPublicacoesParams): Promise<{
    success: boolean
    comunicacoes?: ComunicacaoResponse[]
    total?: number
    has_more?: boolean
    error?: string
  }> {
    try {
      const queryParams = new URLSearchParams({
        numeroOab: params.oab_numero,
        siglaUfOab: params.oab_uf,
        ...(params.data_inicio && { dataInicio: params.data_inicio }),
        ...(params.data_fim && { dataFim: params.data_fim }),
        ...(params.tribunal && { tribunal: params.tribunal }),
        ...(params.numero_processo && { numeroProcesso: params.numero_processo }),
        ...(params.tipo_movimento && { tipoMovimento: params.tipo_movimento }),
        tamanho: String(params.limit || 100),
        pagina: String(Math.floor((params.offset || 0) / (params.limit || 100))),
      })

      const response = await fetch(`${this.baseUrl}/comunicacao?${queryParams}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Freelaw-AI-Studio/1.0',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Comunica API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      // A resposta da Comunica API retorna diretamente um array de comunicações
      const comunicacoesArray = Array.isArray(data) ? data : []
      
      const comunicacoes = comunicacoesArray.map((item: any) => {
        // Extrair nomes dos advogados
        const advogadosNomes = (item.destinatarioadvogados || []).map((dadv: any) => 
          dadv.advogado?.nome || ''
        ).filter(Boolean)
        
        // Extrair nomes dos destinatários
        const destinatariosNomes = (item.destinatarios || []).map((dest: any) => 
          dest.nome || ''
        ).filter(Boolean)
        
        const conteudo = item.texto || ''
        
        return {
          id: String(item.id || `com-${Date.now()}-${Math.random()}`),
          numero_processo: item.numeroprocessocommascara || item.numero_processo || '',
          tribunal: item.siglaTribunal || '',
          data_publicacao: item.data_disponibilizacao || item.datadisponibilizacao || new Date().toISOString().split('T')[0],
          conteudo: conteudo,
          tipo_movimento: item.tipoComunicacao || item.tipoDocumento || 'comunicacao',
          destinatarios: destinatariosNomes,
          advogados_mencionados: advogadosNomes,
          prazo_dias: this.extrairPrazoDias(conteudo),
          urgente: this.isUrgente(conteudo),
          status: 'nova' as const
        }
      })
      
      return {
        success: true,
        comunicacoes,
        total: comunicacoes.length,
        has_more: false // A API parece retornar todos os resultados de uma vez
      }

    } catch (error) {
      console.error('Erro ao buscar publicações na Comunica API:', error)
      return {
        success: false,
        error: `Falha na integração com Comunica API: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }
    }
  }

  /**
   * Extrair informações de processos a partir das publicações
   */
  extrairProcessos(comunicacoes: ComunicacaoResponse[]): ProcessoExtraido[] {
    const processosMap = new Map<string, ProcessoExtraido>()

    comunicacoes.forEach(comunicacao => {
      if (!processosMap.has(comunicacao.numero_processo)) {
        // Extrair informações básicas do processo
        const processo: ProcessoExtraido = {
          numero_cnj: this.formatarNumeroCNJ(comunicacao.numero_processo),
          numero_processo: comunicacao.numero_processo,
          tribunal: comunicacao.tribunal,
          classe: this.extrairClasse(comunicacao.conteudo),
          assunto: this.extrairAssunto(comunicacao.conteudo),
          valor_causa: this.extrairValorCausa(comunicacao.conteudo),
          data_distribuicao: this.extrairDataDistribuicao(comunicacao.conteudo),
          vara: this.extrairVara(comunicacao.conteudo),
          partes: this.extrairPartes(comunicacao),
          ultima_movimentacao: comunicacao.data_publicacao,
          status: 'ativo'
        }

        processosMap.set(comunicacao.numero_processo, processo)
      } else {
        // Atualizar processo existente com nova movimentação
        const processo = processosMap.get(comunicacao.numero_processo)!
        if (new Date(comunicacao.data_publicacao) > new Date(processo.ultima_movimentacao)) {
          processo.ultima_movimentacao = comunicacao.data_publicacao
        }
        
        // Merge advogados mencionados
        if (comunicacao.advogados_mencionados) {
          comunicacao.advogados_mencionados.forEach(advogado => {
            const advogadoInfo = this.parseAdvogadoInfo(advogado)
            if (advogadoInfo && !processo.partes.advogados.find(a => a.oab_numero === advogadoInfo.oab_numero)) {
              processo.partes.advogados.push(advogadoInfo)
            }
          })
        }
      }
    })

    return Array.from(processosMap.values())
  }

  /**
   * Extrair informações de clientes a partir dos processos
   */
  extrairClientes(processos: ProcessoExtraido[]): ClienteExtraido[] {
    const clientesMap = new Map<string, ClienteExtraido>()

    processos.forEach(processo => {
      // Extrair autores como clientes
      processo.partes.autores.forEach(autor => {
        const key = autor.cpf_cnpj || autor.nome
        if (!clientesMap.has(key)) {
          clientesMap.set(key, {
            nome: autor.nome,
            cpf_cnpj: autor.cpf_cnpj || '',
            tipo_pessoa: autor.tipo_pessoa,
            processos_relacionados: [processo.numero_cnj]
          })
        } else {
          const cliente = clientesMap.get(key)!
          if (!cliente.processos_relacionados.includes(processo.numero_cnj)) {
            cliente.processos_relacionados.push(processo.numero_cnj)
          }
        }
      })
    })

    return Array.from(clientesMap.values())
  }

  /**
   * Identificar publicações que exigem ação urgente
   */
  identificarPublicacoesUrgentes(comunicacoes: ComunicacaoResponse[]): ComunicacaoResponse[] {
    return comunicacoes.filter(comunicacao => {
      const conteudo = comunicacao.conteudo.toLowerCase()
      
      // Palavras-chave que indicam urgência
      const palavrasUrgentes = [
        'prazo de', 'dias', 'contestação', 'recurso', 'mandado',
        'citação', 'intimação', 'sentença', 'decisão', 'despacho',
        'urgente', 'imediato', 'improrrogável'
      ]

      const temPrazo = comunicacao.prazo_dias && comunicacao.prazo_dias <= 15
      const temPalavraUrgente = palavrasUrgentes.some(palavra => conteudo.includes(palavra))
      
      return temPrazo || temPalavraUrgente || comunicacao.urgente
    })
  }

  // Métodos auxiliares privados
  private formatarNumeroCNJ(numeroProcesso: string): string {
    // Tentar extrair ou formatar número CNJ
    const numeros = numeroProcesso.replace(/\D/g, '')
    if (numeros.length >= 20) {
      // Formato CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO
      const sequencial = numeros.substring(0, 7)
      const dv = numeros.substring(7, 9)
      const ano = numeros.substring(9, 13)
      const segmento = numeros.substring(13, 14)
      const tribunal = numeros.substring(14, 16)
      const origem = numeros.substring(16, 20)
      
      return `${sequencial}-${dv}.${ano}.${segmento}.${tribunal}.${origem}`
    }
    return numeroProcesso
  }

  private extrairPartes(comunicacao: ComunicacaoResponse): ProcessoExtraido['partes'] {
    // Implementar lógica para extrair partes do conteúdo
    return {
      autores: [],
      reus: [],
      advogados: comunicacao.advogados_mencionados?.map(adv => this.parseAdvogadoInfo(adv)).filter(Boolean) as any[] || []
    }
  }

  private parseAdvogadoInfo(advogadoStr: string): { nome: string; oab_numero: string; oab_uf: string } | null {
    // Regex para extrair OAB/UF do formato "Nome do Advogado (OAB 12345/SP)"
    const match = advogadoStr.match(/(.+?)\s*\(OAB\s*(\d+)\/([A-Z]{2})\)/)
    if (match) {
      return {
        nome: match[1].trim(),
        oab_numero: match[2],
        oab_uf: match[3]
      }
    }
    return null
  }

  private extrairClasse(conteudo: string): string {
    // Implementar extração de classe processual
    return 'Não identificada'
  }

  private extrairAssunto(conteudo: string): string {
    // Implementar extração de assunto
    return 'Não identificado'
  }

  private extrairValorCausa(conteudo: string): number | undefined {
    // Implementar extração de valor da causa
    const match = conteudo.match(/R\$\s*([\d.,]+)/)
    if (match) {
      return parseFloat(match[1].replace(/[.,]/g, ''))
    }
    return undefined
  }

  private extrairDataDistribuicao(conteudo: string): string {
    // Implementar extração da data de distribuição
    return new Date().toISOString().split('T')[0]
  }

  private extrairVara(conteudo: string): string {
    // Implementar extração da vara
    return 'Não identificada'
  }

  private extrairPrazoDias(conteudo: string): number | undefined {
    // Extrair prazo em dias do conteúdo
    const patterns = [
      /(\d+)\s*dias?/i,
      /prazo\s+de\s+(\d+)/i,
      /no\s+prazo\s+de\s+(\d+)/i
    ]
    
    for (const pattern of patterns) {
      const match = conteudo.match(pattern)
      if (match) {
        return parseInt(match[1])
      }
    }
    return undefined
  }

  private isUrgente(conteudo: string): boolean {
    const conteudoLower = conteudo.toLowerCase()
    const palavrasUrgentes = [
      'urgente', 'imediato', 'improrrogável', 'mandado', 'citação',
      'contestação', 'recurso', 'prazo de 5 dias', 'prazo de 15 dias'
    ]
    
    return palavrasUrgentes.some(palavra => conteudoLower.includes(palavra))
  }

}

export const comunicaApiService = new ComunicaApiService()
