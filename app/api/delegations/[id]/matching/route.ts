import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { MatchingService } from '@/lib/services/MatchingService'

// GET - Encontrar prestadores compatíveis para uma delegação
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: delegationId } = await params

    // Buscar delegação
    const { data: delegation, error: delegationError } = await supabase
      .from('delegations')
      .select(`
        *,
        office:organizations(id, name)
      `)
      .eq('id', delegationId)
      .single()

    if (delegationError || !delegation) {
      return NextResponse.json(
        { error: 'Delegação não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se o usuário tem acesso à delegação
    const { data: userData } = await supabase
      .from('users')
      .select('metadata')
      .eq('id', user.id)
      .single()

    const userOfficeId = userData?.metadata?.organization_id
    
    if (userOfficeId !== delegation.office_id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Preparar critérios de matching
    const criteria = {
      legalArea: delegation.legal_area,
      serviceType: delegation.service_type,
      urgency: delegation.urgency,
      requiredExperience: delegation.required_experience || 'pleno',
      estimatedHours: delegation.estimated_hours,
      deadline: delegation.deadline,
      complexity: delegation.metadata?.complexity,
      preferredProviders: delegation.metadata?.preferred_providers
    }

    // Executar matching
    const matchingService = new MatchingService()
    const result = await matchingService.findMatches(criteria)

    // Registrar métricas
    await matchingService.logMatchingMetrics(delegationId, criteria, result)

    return NextResponse.json({
      delegation: {
        id: delegation.id,
        title: delegation.title,
        legalArea: delegation.legal_area,
        serviceType: delegation.service_type,
        urgency: delegation.urgency,
        calculatedPrice: delegation.calculated_price
      },
      matching: {
        totalCandidates: result.totalCandidates,
        matchesFound: result.matches.length,
        averageScore: result.averageScore,
        bestMatch: result.bestMatch,
        matches: result.matches.map(match => ({
          providerId: match.providerId,
          providerName: match.providerName,
          experience: match.experience,
          specialties: match.specialties,
          qualityRating: match.qualityRating,
          totalJobs: match.totalJobs,
          completedJobs: match.completedJobs,
          matchScore: Math.round(match.matchScore * 100), // Converter para percentual
          estimatedPrice: match.estimatedPrice,
          reasons: match.reasons,
          warnings: match.warnings,
          availability: match.availability
        }))
      }
    })
    
  } catch (error: any) {
    console.error('Delegation matching error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Atribuir prestador à delegação
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: delegationId } = await params
    const body = await request.json()
    const { providerId, autoAssign } = body

    // Buscar delegação
    const { data: delegation, error: delegationError } = await supabase
      .from('delegations')
      .select('*')
      .eq('id', delegationId)
      .single()

    if (delegationError || !delegation) {
      return NextResponse.json(
        { error: 'Delegação não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se o usuário tem acesso
    const { data: userData } = await supabase
      .from('users')
      .select('metadata')
      .eq('id', user.id)
      .single()

    const userOfficeId = userData?.metadata?.organization_id
    
    if (userOfficeId !== delegation.office_id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    if (delegation.status !== 'open') {
      return NextResponse.json(
        { error: 'Delegação não está mais disponível' },
        { status: 400 }
      )
    }

    const matchingService = new MatchingService()

    if (autoAssign) {
      // Atribuição automática
      const criteria = {
        legalArea: delegation.legal_area,
        serviceType: delegation.service_type,
        urgency: delegation.urgency,
        requiredExperience: delegation.required_experience || 'pleno',
        estimatedHours: delegation.estimated_hours,
        deadline: delegation.deadline,
        complexity: delegation.metadata?.complexity
      }

      const result = await matchingService.autoAssignBestMatch(delegationId, criteria)

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        )
      }

      return NextResponse.json({
        message: 'Prestador atribuído automaticamente',
        assignment: {
          providerId: result.assignedProvider?.providerId,
          providerName: result.assignedProvider?.providerName,
          matchScore: result.assignedProvider?.matchScore,
          reasons: result.assignedProvider?.reasons
        }
      })

    } else if (providerId) {
      // Atribuição manual
      const { error: assignError } = await supabase
        .from('delegations')
        .update({
          provider_id: providerId,
          status: 'matched',
          metadata: {
            ...delegation.metadata,
            manually_assigned: true,
            assigned_by: user.id,
            assigned_at: new Date().toISOString()
          }
        })
        .eq('id', delegationId)

      if (assignError) {
        console.error('Manual assign error:', assignError)
        return NextResponse.json(
          { error: 'Erro ao atribuir prestador' },
          { status: 500 }
        )
      }

      // Buscar dados do prestador
      const { data: provider } = await supabase
        .from('providers')
        .select('full_name, experience_level')
        .eq('id', providerId)
        .single()

      return NextResponse.json({
        message: 'Prestador atribuído manualmente',
        assignment: {
          providerId,
          providerName: provider?.full_name || 'Prestador',
          experience: provider?.experience_level || 'pleno'
        }
      })

    } else {
      return NextResponse.json(
        { error: 'providerId ou autoAssign deve ser fornecido' },
        { status: 400 }
      )
    }
    
  } catch (error: any) {
    console.error('Assign provider error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}


