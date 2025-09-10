import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { DelegationService } from '@/lib/services/DelegationService'
import type { CreateDelegationData } from '@/lib/services/DelegationService'
import { z } from 'zod'

const createDelegationSchema = z.object({
  title: z.string().min(5, 'Título deve ter pelo menos 5 caracteres'),
  description: z.string().min(20, 'Descrição deve ter pelo menos 20 caracteres'),
  legalArea: z.string().min(1, 'Área jurídica é obrigatória'),
  urgency: z.enum(['low', 'medium', 'high', 'urgent'], { message: 'Urgência inválida' }),
  serviceType: z.enum(['petition', 'appeal', 'defense', 'contract', 'opinion', 'research', 'other'], { message: 'Tipo de serviço inválido' }),
  processNumber: z.string().optional(),
  clientName: z.string().optional(),
  court: z.string().optional(),
  deadline: z.string().optional(),
  estimatedHours: z.number().min(1).max(200).optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  requirements: z.array(z.string()).optional(),
  requiredExperience: z.enum(['junior', 'pleno', 'senior', 'especialista']).optional(),
  responseDeadline: z.string().optional(),
  deliveryDeadline: z.string().optional(),
  complexity: z.enum(['simple', 'medium', 'complex', 'very_complex']).optional()
})

// POST - Criar nova delegação
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

    // Verificar se é um usuário de escritório
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, metadata')
      .eq('id', user.id)
      .single()
    
    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    const officeId = userData.metadata?.organization_id
    if (!officeId) {
      return NextResponse.json(
        { error: 'Usuário não está associado a um escritório' },
        { status: 400 }
      )
    }

    // Parse e validar dados
    const body = await request.json()
    const validatedData = createDelegationSchema.parse(body) as CreateDelegationData

    // Validar orçamento
    if (validatedData.budgetMin && validatedData.budgetMax && validatedData.budgetMin > validatedData.budgetMax) {
      return NextResponse.json(
        { error: 'Orçamento mínimo não pode ser maior que o máximo' },
        { status: 400 }
      )
    }

    // Criar delegação
    const delegationService = new DelegationService()
    const result = await delegationService.createDelegation(
      officeId,
      user.id,
      validatedData
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Delegação criada com sucesso',
      delegation: {
        id: result.delegationId,
        status: 'open'
      }
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Create delegation error:', error)
    
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

// GET - Listar delegações
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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'office' // 'office', 'open', 'provider'
    const legalArea = searchParams.get('legalArea')
    const urgency = searchParams.get('urgency')
    const serviceType = searchParams.get('serviceType')
    const budgetMin = searchParams.get('budgetMin')
    const budgetMax = searchParams.get('budgetMax')

    const delegationService = new DelegationService()

    if (type === 'open') {
      // Listar delegações abertas (para prestadores)
      const filters: any = {}
      if (legalArea) filters.legalArea = legalArea
      if (urgency) filters.urgency = urgency
      if (serviceType) filters.serviceType = serviceType
      if (budgetMin) filters.budgetMin = parseFloat(budgetMin)
      if (budgetMax) filters.budgetMax = parseFloat(budgetMax)

      const delegations = await delegationService.getOpenDelegations(user.id, filters)

      return NextResponse.json({
        delegations,
        total: delegations.length,
        type: 'open'
      })

    } else if (type === 'provider') {
      // Listar delegações do prestador
      const { data: provider } = await supabase
        .from('providers')
        .select('id')
        .eq('email', user.email)
        .single()

      if (!provider) {
        return NextResponse.json(
          { error: 'Prestador não encontrado' },
          { status: 404 }
        )
      }

      const delegations = await delegationService.getProviderDelegations(provider.id)

      return NextResponse.json({
        delegations,
        total: delegations.length,
        type: 'provider'
      })

    } else {
      // Listar delegações do escritório (padrão)
      const { data: userData } = await supabase
        .from('users')
        .select('metadata')
        .eq('id', user.id)
        .single()

      const officeId = userData?.metadata?.organization_id
      if (!officeId) {
        return NextResponse.json(
          { error: 'Usuário não está associado a um escritório' },
          { status: 400 }
        )
      }

      const delegations = await delegationService.getOfficeDelegations(officeId)

      return NextResponse.json({
        delegations,
        total: delegations.length,
        type: 'office'
      })
    }
    
  } catch (error: any) {
    console.error('Get delegations error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}


