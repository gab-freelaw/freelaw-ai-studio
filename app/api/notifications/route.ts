import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notificationService } from '@/lib/services/NotificationService'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unread_only') === 'true'

    if (unreadOnly) {
      const count = await notificationService.getUnreadCount(user.id)
      return NextResponse.json({ unread_count: count })
    }

    const notifications = await notificationService.getNotifications(user.id, limit)
    
    return NextResponse.json({
      success: true,
      data: notifications,
      count: notifications.length
    })

  } catch (error) {
    console.error('Erro ao buscar notificações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { notification_id, mark_all } = await request.json()

    if (mark_all) {
      await notificationService.markAllAsRead(user.id)
      return NextResponse.json({ success: true, message: 'Todas as notificações marcadas como lidas' })
    }

    if (notification_id) {
      await notificationService.markAsRead(notification_id)
      return NextResponse.json({ success: true, message: 'Notificação marcada como lida' })
    }

    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })

  } catch (error) {
    console.error('Erro ao atualizar notificação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar prazos próximos automaticamente
    const notifications = await notificationService.checkUpcomingDeadlines(user.id)
    
    return NextResponse.json({
      success: true,
      data: notifications,
      message: `${notifications.length} notificações de prazo criadas`
    })

  } catch (error) {
    console.error('Erro ao verificar prazos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}




