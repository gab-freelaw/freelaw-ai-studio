import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { AuditService } from '@/lib/services/AuditService'

// GET - Timeline de auditoria de uma entidade específica
export async function GET(
  request: Request, 
  { params }: { params: Promise<{ entityType: string; entityId: string }> }
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

    const { entityType, entityId } = await params

    // Verificar permissões específicas baseado no tipo de entidade
    let hasAccess = false

    if (entityType === 'delegation') {
      // Verificar se usuário tem acesso à delegação
      const { data: delegation } = await supabase
        .from('delegations')
        .select('office_id, provider_id')
        .eq('id', entityId)
        .single()

      if (delegation) {
        const { data: userData } = await supabase
          .from('users')
          .select('metadata')
          .eq('id', user.id)
          .single()

        const userOfficeId = userData?.metadata?.organization_id
        hasAccess = userOfficeId === delegation.office_id || 
                   user.id === delegation.provider_id ||
                   userData?.metadata?.role === 'admin'
      }
    } else if (entityType === 'provider') {
      // Prestador pode ver apenas seus próprios logs
      hasAccess = user.id === entityId
      
      // Admin pode ver logs de qualquer prestador
      const { data: userData } = await supabase
        .from('users')
        .select('metadata')
        .eq('id', user.id)
        .single()
      
      if (userData?.metadata?.role === 'admin') {
        hasAccess = true
      }
    } else {
      // Para outros tipos, apenas admin
      const { data: userData } = await supabase
        .from('users')
        .select('metadata')
        .eq('id', user.id)
        .single()
      
      hasAccess = userData?.metadata?.role === 'admin'
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const auditService = new AuditService()
    const timeline = await auditService.getEntityTimeline(entityType, entityId)

    // Agrupar eventos por data para melhor visualização
    const timelineGrouped = timeline.reduce((acc, log) => {
      const date = new Date(log.created_at).toDateString()
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(log)
      return acc
    }, {} as Record<string, any[]>)

    // Estatísticas do timeline
    const stats = {
      totalEvents: timeline.length,
      actionCounts: timeline.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      severityCounts: timeline.reduce((acc, log) => {
        acc[log.severity] = (acc[log.severity] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      dateRange: timeline.length > 0 ? {
        start: timeline[timeline.length - 1].created_at,
        end: timeline[0].created_at
      } : null
    }

    return NextResponse.json({
      timeline,
      timelineGrouped,
      stats
    })
    
  } catch (error: any) {
    console.error('Audit timeline API error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}


