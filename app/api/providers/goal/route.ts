import { NextRequest, NextResponse } from 'next/server'
import { ProviderAnalyticsService } from '@/lib/services/ProviderAnalyticsService'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const UpdateGoalSchema = z.object({
  monthlyGoal: z.number().min(1).max(100, 'Meta deve ser entre 1 e 100 serviços por mês')
})

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Buscar provider associado ao usuário
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('id')
      .eq('email', user.email)
      .single()

    if (providerError || !provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    // Validar dados da requisição
    const body = await request.json()
    const { monthlyGoal } = UpdateGoalSchema.parse(body)

    // Atualizar meta mensal
    await ProviderAnalyticsService.updateMonthlyGoal(provider.id, monthlyGoal)

    return NextResponse.json({
      success: true,
      message: 'Meta mensal atualizada com sucesso',
      data: { monthlyGoal }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating provider goal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}




