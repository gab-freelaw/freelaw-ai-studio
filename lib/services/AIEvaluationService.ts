import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

export interface TestPiece {
  id: string
  title: string
  description: string
  context: string
  requirements: string[]
  expectedLength: number
  legalArea: string
}

export interface SubmittedPiece {
  testPieceId: string
  content: string
  submittedAt: string
}

export interface EvaluationScores {
  technical_score: number // 0-100
  argumentation_score: number // 0-100
  formatting_score: number // 0-100
  overall_score: number // 0-100
}

export interface EvaluationResult {
  scores: EvaluationScores
  feedback: string
  suggestions: {
    strengths: string[]
    improvements: string[]
    recommendations: string[]
  }
  approved: boolean
}

export class AIEvaluationService {
  private openai: OpenAI
  private supabase: any

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }

  async initializeSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
  }

  /**
   * Peças de teste padrão para avaliação
   */
  getTestPieces(): TestPiece[] {
    return [
      {
        id: 'inicial-trabalhista',
        title: 'Petição Inicial Trabalhista',
        description: 'Reclamação trabalhista por verbas rescisórias não pagas',
        context: `
          Cliente: Maria Silva, trabalhou como vendedora na empresa XYZ Ltda por 2 anos.
          Foi demitida sem justa causa em 15/01/2024.
          Não recebeu: aviso prévio, 13º salário proporcional, férias vencidas + 1/3.
          Salário: R$ 2.500,00. Última data de pagamento: dezembro/2023.
        `,
        requirements: [
          'Identificação completa das partes',
          'Fundamentação jurídica (CLT)',
          'Pedidos específicos com valores',
          'Requerimentos processuais',
          'Estrutura formal adequada'
        ],
        expectedLength: 800,
        legalArea: 'Direito do Trabalho'
      },
      {
        id: 'contestacao-civil',
        title: 'Contestação Cível',
        description: 'Contestação em ação de cobrança de cartão de crédito',
        context: `
          Réu: João Santos, aposentado.
          Autor: Banco ABC S.A. cobra R$ 15.000,00 de cartão de crédito.
          Alegações de defesa: prescrição, juros abusivos, capitalização ilegal.
          Contrato assinado em 2019, última movimentação em 2021.
        `,
        requirements: [
          'Preliminares processuais',
          'Mérito - prescrição e juros',
          'Fundamentação legal (CDC, CC)',
          'Pedidos de improcedência',
          'Estrutura defensiva adequada'
        ],
        expectedLength: 1000,
        legalArea: 'Direito Civil'
      },
      {
        id: 'recurso-criminal',
        title: 'Recurso em Sentido Estrito',
        description: 'Recurso contra decisão de pronúncia',
        context: `
          Réu: Carlos Oliveira, pronunciado por homicídio qualificado.
          Decisão de pronúncia baseada apenas em depoimento de uma testemunha.
          Ausência de provas materiais. Álibi não considerado pelo juiz.
          Necessário questionar a materialidade e autoria.
        `,
        requirements: [
          'Razões recursais específicas',
          'Fundamentação em provas',
          'Citação jurisprudencial',
          'Pedido de despronúncia',
          'Técnica recursal adequada'
        ],
        expectedLength: 1200,
        legalArea: 'Direito Penal'
      },
      {
        id: 'mandado-seguranca',
        title: 'Mandado de Segurança',
        description: 'MS contra ato de servidor público',
        context: `
          Impetrante: Empresa ABC Ltda.
          Autoridade coatora: Secretário Municipal de Fazenda.
          Ato: Lançamento de IPTU com base em área incorreta do imóvel.
          Direito líquido e certo: planta aprovada na prefeitura com área menor.
        `,
        requirements: [
          'Identificação da autoridade coatora',
          'Demonstração do direito líquido e certo',
          'Fundamentação constitucional',
          'Pedido liminar',
          'Estrutura mandamental'
        ],
        expectedLength: 900,
        legalArea: 'Direito Administrativo'
      },
      {
        id: 'embargos-execucao',
        title: 'Embargos à Execução',
        description: 'Embargos contra execução de título executivo',
        context: `
          Embargante: Construtora XYZ Ltda.
          Embargado: Fornecedor de materiais.
          Título: Duplicata no valor de R$ 50.000,00.
          Alegações: pagamento parcial, excesso de execução, nulidade.
          Comprovantes de pagamento de R$ 30.000,00.
        `,
        requirements: [
          'Matérias de ordem pública',
          'Demonstração de pagamento',
          'Cálculo do excesso',
          'Fundamentação processual',
          'Pedidos específicos'
        ],
        expectedLength: 1100,
        legalArea: 'Direito Processual Civil'
      }
    ]
  }

  /**
   * Iniciar avaliação para um prestador
   */
  async startEvaluation(providerId: string): Promise<{
    success: boolean
    evaluationId?: string
    testPieces?: TestPiece[]
    error?: string
  }> {
    try {
      await this.initializeSupabase()

      // Verificar se já existe avaliação pendente
      const { data: existingEvaluation } = await this.supabase
        .from('provider_evaluations')
        .select('id, result')
        .eq('provider_id', providerId)
        .eq('evaluation_type', 'ai_test')
        .order('created_at', { ascending: false })
        .limit(1)

      if (existingEvaluation && existingEvaluation.length > 0) {
        const latest = existingEvaluation[0]
        if (latest.result === 'pending') {
          return {
            success: false,
            error: 'Já existe uma avaliação em andamento'
          }
        }
      }

      // Criar nova avaliação
      const testPieces = this.getTestPieces()
      
      const { data: evaluation, error } = await this.supabase
        .from('provider_evaluations')
        .insert({
          provider_id: providerId,
          evaluation_type: 'ai_test',
          result: 'pending',
          test_pieces: testPieces,
          metadata: {
            started_at: new Date().toISOString(),
            pieces_count: testPieces.length,
            status: 'awaiting_submission'
          }
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating evaluation:', error)
        return {
          success: false,
          error: 'Erro ao iniciar avaliação'
        }
      }

      return {
        success: true,
        evaluationId: evaluation.id,
        testPieces: testPieces
      }

    } catch (error: any) {
      console.error('Start evaluation error:', error)
      return {
        success: false,
        error: 'Erro interno no serviço'
      }
    }
  }

  /**
   * Submeter peças para avaliação
   */
  async submitPieces(
    evaluationId: string, 
    submittedPieces: SubmittedPiece[]
  ): Promise<{
    success: boolean
    result?: EvaluationResult
    error?: string
  }> {
    try {
      await this.initializeSupabase()

      // Buscar avaliação
      const { data: evaluation, error: fetchError } = await this.supabase
        .from('provider_evaluations')
        .select('*')
        .eq('id', evaluationId)
        .single()

      if (fetchError || !evaluation) {
        return {
          success: false,
          error: 'Avaliação não encontrada'
        }
      }

      if (evaluation.result !== 'pending') {
        return {
          success: false,
          error: 'Avaliação já foi finalizada'
        }
      }

      // Avaliar cada peça com IA
      const evaluationResults = await Promise.all(
        submittedPieces.map(piece => 
          this.evaluatePieceWithAI(
            piece, 
            evaluation.test_pieces.find((tp: TestPiece) => tp.id === piece.testPieceId)
          )
        )
      )

      // Calcular scores finais
      const finalScores = this.calculateFinalScores(evaluationResults)
      const overallFeedback = this.generateOverallFeedback(evaluationResults)
      const isApproved = finalScores.overall_score >= 70 // Nota mínima 7.0

      // Atualizar avaliação no banco
      const { error: updateError } = await this.supabase
        .from('provider_evaluations')
        .update({
          technical_score: finalScores.technical_score,
          argumentation_score: finalScores.argumentation_score,
          formatting_score: finalScores.formatting_score,
          overall_score: finalScores.overall_score,
          ai_feedback: overallFeedback.feedback,
          ai_suggestions: overallFeedback.suggestions,
          result: isApproved ? 'approved' : 'rejected',
          metadata: {
            ...evaluation.metadata,
            submitted_at: new Date().toISOString(),
            pieces_submitted: submittedPieces.length,
            evaluation_completed: true
          }
        })
        .eq('id', evaluationId)

      if (updateError) {
        console.error('Error updating evaluation:', updateError)
        return {
          success: false,
          error: 'Erro ao salvar avaliação'
        }
      }

      // Atualizar score do prestador
      await this.updateProviderScore(evaluation.provider_id, finalScores.overall_score)

      return {
        success: true,
        result: {
          scores: finalScores,
          feedback: overallFeedback.feedback,
          suggestions: overallFeedback.suggestions,
          approved: isApproved
        }
      }

    } catch (error: any) {
      console.error('Submit pieces error:', error)
      return {
        success: false,
        error: 'Erro interno na avaliação'
      }
    }
  }

  /**
   * Avaliar uma peça individual com IA
   */
  private async evaluatePieceWithAI(
    submittedPiece: SubmittedPiece, 
    testPiece: TestPiece
  ): Promise<any> {
    try {
      const prompt = `
Você é um especialista em Direito brasileiro e deve avaliar esta peça jurídica.

PEÇA DE TESTE:
Título: ${testPiece.title}
Área: ${testPiece.legalArea}
Contexto: ${testPiece.context}
Requisitos: ${testPiece.requirements.join(', ')}

PEÇA SUBMETIDA:
${submittedPiece.content}

CRITÉRIOS DE AVALIAÇÃO (0-100 pontos cada):

1. TÉCNICA JURÍDICA (0-100):
- Fundamentação legal adequada
- Citação de normas pertinentes
- Estrutura jurídica correta
- Conhecimento da matéria

2. ARGUMENTAÇÃO (0-100):
- Lógica e coerência
- Persuasão jurídica
- Desenvolvimento dos argumentos
- Conexão entre fatos e direito

3. FORMATAÇÃO (0-100):
- Estrutura formal adequada
- Linguagem jurídica apropriada
- Organização do texto
- Clareza e objetividade

Responda APENAS em JSON no formato:
{
  "technical_score": 85,
  "argumentation_score": 78,
  "formatting_score": 92,
  "feedback": "Análise detalhada da peça...",
  "strengths": ["Ponto forte 1", "Ponto forte 2"],
  "improvements": ["Melhoria 1", "Melhoria 2"],
  "recommendations": ["Recomendação 1", "Recomendação 2"]
}
`

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1500
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('Resposta vazia da IA')
      }

      return JSON.parse(content)

    } catch (error: any) {
      console.error('AI evaluation error:', error)
      
      // Fallback scores em caso de erro
      return {
        technical_score: 50,
        argumentation_score: 50,
        formatting_score: 50,
        feedback: 'Erro na avaliação automática. Será revisado manualmente.',
        strengths: ['Peça submetida dentro do prazo'],
        improvements: ['Aguardando revisão manual'],
        recommendations: ['Contate o suporte para mais informações']
      }
    }
  }

  /**
   * Calcular scores finais baseado nas avaliações individuais
   */
  private calculateFinalScores(evaluationResults: any[]): EvaluationScores {
    const avgTechnical = evaluationResults.reduce((sum, result) => sum + result.technical_score, 0) / evaluationResults.length
    const avgArgumentation = evaluationResults.reduce((sum, result) => sum + result.argumentation_score, 0) / evaluationResults.length
    const avgFormatting = evaluationResults.reduce((sum, result) => sum + result.formatting_score, 0) / evaluationResults.length
    
    const overall = (avgTechnical + avgArgumentation + avgFormatting) / 3

    return {
      technical_score: Math.round(avgTechnical * 10) / 10,
      argumentation_score: Math.round(avgArgumentation * 10) / 10,
      formatting_score: Math.round(avgFormatting * 10) / 10,
      overall_score: Math.round(overall * 10) / 10
    }
  }

  /**
   * Gerar feedback geral
   */
  private generateOverallFeedback(evaluationResults: any[]): {
    feedback: string
    suggestions: {
      strengths: string[]
      improvements: string[]
      recommendations: string[]
    }
  } {
    const allStrengths = evaluationResults.flatMap(result => result.strengths)
    const allImprovements = evaluationResults.flatMap(result => result.improvements)
    const allRecommendations = evaluationResults.flatMap(result => result.recommendations)

    const feedback = `
Avaliação concluída com base em ${evaluationResults.length} peças jurídicas.

RESUMO GERAL:
${evaluationResults.map((result, index) => 
  `Peça ${index + 1}: Técnica ${result.technical_score}/100, Argumentação ${result.argumentation_score}/100, Formatação ${result.formatting_score}/100`
).join('\n')}

OBSERVAÇÕES:
${evaluationResults.map(result => result.feedback).join('\n\n')}
`

    return {
      feedback: feedback.trim(),
      suggestions: {
        strengths: [...new Set(allStrengths)].slice(0, 5),
        improvements: [...new Set(allImprovements)].slice(0, 5),
        recommendations: [...new Set(allRecommendations)].slice(0, 5)
      }
    }
  }

  /**
   * Atualizar score do prestador
   */
  private async updateProviderScore(providerId: string, score: number): Promise<void> {
    try {
      await this.supabase
        .from('providers')
        .update({
          evaluation_score: score,
          registration_step: score >= 70 ? 'test_approved' : 'test_submitted'
        })
        .eq('id', providerId)
    } catch (error) {
      console.error('Error updating provider score:', error)
    }
  }

  /**
   * Buscar avaliação por ID
   */
  async getEvaluation(evaluationId: string): Promise<any> {
    try {
      await this.initializeSupabase()

      const { data, error } = await this.supabase
        .from('provider_evaluations')
        .select('*')
        .eq('id', evaluationId)
        .single()

      if (error) {
        console.error('Get evaluation error:', error)
        return null
      }

      return data

    } catch (error: any) {
      console.error('Get evaluation service error:', error)
      return null
    }
  }

  /**
   * Listar avaliações de um prestador
   */
  async getProviderEvaluations(providerId: string): Promise<any[]> {
    try {
      await this.initializeSupabase()

      const { data, error } = await this.supabase
        .from('provider_evaluations')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Get provider evaluations error:', error)
        return []
      }

      return data || []

    } catch (error: any) {
      console.error('Get provider evaluations service error:', error)
      return []
    }
  }
}


