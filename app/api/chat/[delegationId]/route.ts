import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ChatService } from '@/lib/services/ChatService'
import { z } from 'zod'

const sendMessageSchema = z.object({
  message: z.string().min(1, 'Mensagem não pode estar vazia').max(2000, 'Mensagem muito longa'),
  messageType: z.enum(['text', 'file', 'audio']).optional(),
  attachments: z.array(z.any()).optional()
})

// GET - Buscar mensagens da delegação
export async function GET(
  request: Request,
  { params }: { params: Promise<{ delegationId: string }> }
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

    const { delegationId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Verificar acesso à delegação
    const { data: delegation, error: delegationError } = await supabase
      .from('delegations')
      .select('id, office_id, provider_id')
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
    const hasAccess = userOfficeId === delegation.office_id || user.id === delegation.provider_id

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Buscar mensagens
    const chatService = new ChatService()
    const messages = await chatService.getMessages(delegationId)

    // Marcar mensagens como lidas (buscar IDs das mensagens primeiro)
    const messageIds = messages.map(m => m.id)
    if (messageIds.length > 0) {
      await chatService.markAsRead(messageIds, user.id)
    }

    return NextResponse.json({
      messages,
      pagination: {
        limit,
        offset,
        total: messages.length
      }
    })
    
  } catch (error: any) {
    console.error('Get chat messages error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Enviar mensagem
export async function POST(
  request: Request,
  { params }: { params: Promise<{ delegationId: string }> }
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

    const { delegationId } = await params

    // Parse e validar dados
    const body = await request.json()
    const { message, messageType, attachments } = sendMessageSchema.parse(body)

    // Verificar acesso à delegação
    const { data: delegation, error: delegationError } = await supabase
      .from('delegations')
      .select('id, office_id, provider_id, status')
      .eq('id', delegationId)
      .single()

    if (delegationError || !delegation) {
      return NextResponse.json(
        { error: 'Delegação não encontrada' },
        { status: 404 }
      )
    }

    // Determinar tipo de usuário e verificar acesso
    let senderType: 'office' | 'provider'
    let hasAccess = false

    // Verificar se é prestador
    if (user.id === delegation.provider_id) {
      senderType = 'provider'
      hasAccess = true
    } else {
      // Verificar se é membro do escritório
      const { data: userData } = await supabase
        .from('users')
        .select('metadata')
        .eq('id', user.id)
        .single()

      const userOfficeId = userData?.metadata?.organization_id
      if (userOfficeId === delegation.office_id) {
        senderType = 'office'
        hasAccess = true
      }
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Verificar se a delegação permite chat
    if (delegation.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Não é possível enviar mensagens para delegações canceladas' },
        { status: 400 }
      )
    }

    // Enviar mensagem
    const chatService = new ChatService()
    const result = await chatService.sendMessage(
      delegationId,
      user.id,
      senderType!,
      message,
      messageType,
      attachments && attachments.length > 0 ? {
        fileName: attachments[0]?.name,
        fileUrl: attachments[0]?.url,
        fileSize: attachments[0]?.size
      } : undefined
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Mensagem enviada com sucesso',
      messageId: result.messageId
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Send chat message error:', error)
    
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

// PUT - Marcar mensagens como lidas
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ delegationId: string }> }
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

    const { delegationId } = await params
    const body = await request.json()
    const { messageIds } = body

    // Verificar acesso à delegação
    const { data: delegation, error: delegationError } = await supabase
      .from('delegations')
      .select('id, office_id, provider_id')
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
    const hasAccess = userOfficeId === delegation.office_id || user.id === delegation.provider_id

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Marcar como lidas
    const chatService = new ChatService()
    const result = await chatService.markAsRead(messageIds, user.id)

    if (!result) {
      return NextResponse.json(
        { error: 'Erro ao marcar mensagens como lidas' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Mensagens marcadas como lidas'
    })
    
  } catch (error: any) {
    console.error('Mark messages as read error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}


