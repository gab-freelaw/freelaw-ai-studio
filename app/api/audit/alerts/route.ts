import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { AuditService } from '@/lib/services/AuditService'

// GET - Detectar atividades suspeitas
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

    // Verificar se é admin
    const { data: userData } = await supabase
      .from('users')
      .select('metadata')
      .eq('id', user.id)
      .single()

    const isAdmin = userData?.metadata?.role === 'admin'
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado - Apenas administradores' },
        { status: 403 }
      )
    }

    const auditService = new AuditService()
    const suspiciousActivity = await auditService.detectSuspiciousActivity()

    // Buscar alertas recentes críticos
    const { logs: criticalLogs } = await auditService.getLogs({
      severity: 'critical',
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // últimas 24h
      limit: 10
    })

    // Buscar eventos de segurança
    const { logs: securityEvents } = await auditService.getLogs({
      actionCategory: 'auth',
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // últimas 24h
      limit: 20
    })

    // Estatísticas de segurança
    const securityStats = {
      criticalEventsLast24h: criticalLogs.length,
      authEventsLast24h: securityEvents.length,
      failedLogins: securityEvents.filter(e => e.action === 'login_failed').length,
      suspiciousIPs: [...new Set(
        securityEvents
          .filter(e => e.severity === 'warning' || e.severity === 'high')
          .map(e => e.ip_address)
          .filter(Boolean)
      )],
      suspiciousUsers: [...new Set(
        criticalLogs
          .map(e => e.user_id)
          .filter(Boolean)
      )]
    }

    return NextResponse.json({
      alerts: suspiciousActivity.alerts,
      criticalEvents: criticalLogs,
      securityStats,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Audit alerts API error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}



