import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { AIEvaluationService } from '@/lib/services/AIEvaluationService'
import { z } from 'zod'

const submitPiecesSchema = z.object({
  evaluationId: z.string().uuid('ID de avaliação inválido'),
  pieces: z.array(z.object({
    testPieceId: z.string({ required_error: 'ID da peça de teste é obrigatório' }),
    content: z.string().min(100, 'Conteúdo deve ter pelo menos 100 caracteres'),
    submittedAt: z.string().optional()
  })).min(1, 'Pelo menos uma peça deve ser submetida')
})

// POST - Iniciar nova avaliação
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se é um prestador
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('id, status, registration_step')
      .eq('email', user.email)
      .single()
    
    if (providerError || !provider) {
      return NextResponse.json(
        { error: 'Prestador não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se pode fazer avaliação
    if (provider.status !== 'pending_evaluation' && provider.status !== 'in_evaluation') {
      return NextResponse.json(
        { error: 'Prestador não está elegível para avaliação' },
        { status: 400 }
      )
    }

    // Iniciar avaliação
    const evaluationService = new AIEvaluationService()
    const result = await evaluationService.startEvaluation(provider.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Atualizar status do prestador
    await supabase
      .from('providers')
      .update({ 
        status: 'in_evaluation',
        registration_step: 'test_pending'
      })
      .eq('id', provider.id)

    return NextResponse.json({
      message: 'Avaliação iniciada com sucesso',
      evaluation: {
        id: result.evaluationId,
        testPieces: result.testPieces,
        status: 'pending',
        instructions: 'Complete as 5 peças jurídicas abaixo. Você tem 7 dias para submeter todas as peças.'
      }
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Start evaluation error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Submeter peças para avaliação
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Parse e validar dados
    const body = await request.json()
    const { evaluationId, pieces } = submitPiecesSchema.parse(body)

    // Verificar se a avaliação pertence ao prestador
    const { data: evaluation, error: evalError } = await supabase
      .from('provider_evaluations')
      .select('provider_id, result')
      .eq('id', evaluationId)
      .single()

    if (evalError || !evaluation) {
      return NextResponse.json(
        { error: 'Avaliação não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se é o prestador correto
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('id')
      .eq('email', user.email)
      .single()
    
    if (providerError || !provider || provider.id !== evaluation.provider_id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    if (evaluation.result !== 'pending') {
      return NextResponse.json(
        { error: 'Avaliação já foi finalizada' },
        { status: 400 }
      )
    }

    // Adicionar timestamp se não fornecido
    const submittedPieces = pieces.map(piece => ({
      testPieceId: piece.testPieceId,
      content: piece.content,
      submittedAt: piece.submittedAt || new Date().toISOString()
    }))

    // Submeter para avaliação por IA
    const evaluationService = new AIEvaluationService()
    const result = await evaluationService.submitPieces(evaluationId, submittedPieces)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Peças submetidas e avaliadas com sucesso',
      result: result.result
    })
    
  } catch (error: any) {
    console.error('Submit evaluation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET - Buscar avaliações do prestador
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se é um prestador
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('id')
      .eq('email', user.email)
      .single()
    
    if (providerError || !provider) {
      return NextResponse.json(
        { error: 'Prestador não encontrado' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const evaluationId = searchParams.get('id')

    const evaluationService = new AIEvaluationService()

    if (evaluationId) {
      // Buscar avaliação específica
      const evaluation = await evaluationService.getEvaluation(evaluationId)
      
      if (!evaluation || evaluation.provider_id !== provider.id) {
        return NextResponse.json(
          { error: 'Avaliação não encontrada' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        evaluation: {
          id: evaluation.id,
          status: evaluation.result,
          testPieces: evaluation.test_pieces,
          scores: {
            technical: evaluation.technical_score,
            argumentation: evaluation.argumentation_score,
            formatting: evaluation.formatting_score,
            overall: evaluation.overall_score
          },
          feedback: evaluation.ai_feedback,
          suggestions: evaluation.ai_suggestions,
          createdAt: evaluation.created_at,
          updatedAt: evaluation.updated_at
        }
      })
    } else {
      // Listar todas as avaliações do prestador
      const evaluations = await evaluationService.getProviderEvaluations(provider.id)

      return NextResponse.json({
        evaluations: evaluations.map(evaluation => ({
          id: evaluation.id,
          type: evaluation.evaluation_type,
          status: evaluation.result,
          overallScore: evaluation.overall_score,
          createdAt: evaluation.created_at,
          updatedAt: evaluation.updated_at
        }))
      })
    }
    
  } catch (error: any) {
    console.error('Get evaluation error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
