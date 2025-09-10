import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { AuditService } from '@/lib/services/AuditService'

// GET - Buscar logs de auditoria
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

    // Verificar se é admin ou tem permissões
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

    const { searchParams } = new URL(request.url)
    
    // Parâmetros de consulta
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const actionCategory = searchParams.get('actionCategory')
    const severity = searchParams.get('severity')
    const startDate = searchParams.get('startDate') 
      ? new Date(searchParams.get('startDate')!) 
      : undefined
    const endDate = searchParams.get('endDate') 
      ? new Date(searchParams.get('endDate')!) 
      : undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const format = searchParams.get('format') as 'summary' | 'detailed' || 'detailed'

    const auditService = new AuditService()

    // Buscar logs
    const result = await auditService.generateAuditReport({
      entityType: entityType || undefined,
      entityId: entityId || undefined,
      userId: userId || undefined,
      action: action || undefined,
      actionCategory: actionCategory as any || undefined,
      severity: severity || undefined,
      startDate,
      endDate,
      limit,
      offset,
      format
    })

    return NextResponse.json(result)
    
  } catch (error: any) {
    console.error('Audit API error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Registrar evento de auditoria manual
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

    const body = await request.json()
    const { 
      entityType, 
      entityId, 
      action, 
      actionCategory, 
      description,
      changes,
      metadata,
      severity,
      isSensitive
    } = body

    // Validação básica
    if (!entityType || !entityId || !action || !actionCategory || !description) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: entityType, entityId, action, actionCategory, description' },
        { status: 400 }
      )
    }

    // Contexto da requisição
    const userAgent = request.headers.get('user-agent') || undefined
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0] || realIp || undefined

    const auditService = new AuditService()

    await auditService.log({
      entityType,
      entityId,
      action,
      actionCategory,
      description,
      changes,
      metadata,
      severity: severity || 'info',
      isSensitive: isSensitive || false
    }, {
      userId: user.id,
      userType: 'admin', // Manual log geralmente é de admin
      userName: user.user_metadata?.full_name,
      userEmail: user.email,
      ipAddress,
      userAgent
    })

    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    console.error('Audit manual log error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}



