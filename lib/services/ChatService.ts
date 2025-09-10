import { createClient } from '@/lib/supabase/server'

export interface ChatMessage {
  id: string
  delegationId: string
  senderId: string
  senderName: string
  senderType: 'office' | 'provider'
  message: string
  messageType: 'text' | 'audio' | 'file'
  audioUrl?: string
  audioDuration?: number
  transcription?: string
  transcriptionConfidence?: number
  fileName?: string
  fileUrl?: string
  fileSize?: string
  createdAt: string
  updatedAt: string
}

export class ChatService {
  private supabase: any
  private realtime: boolean

  constructor(enableRealtime: boolean = false) {
    this.realtime = enableRealtime
    this.initializeSupabase()
  }

  private async initializeSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
  }

  /**
   * Enviar mensagem de chat
   */
  async sendMessage(
    delegationId: string,
    senderId: string,
    senderType: 'office' | 'provider',
    message: string,
    messageType: 'text' | 'audio' | 'file' = 'text',
    metadata?: {
      audioUrl?: string
      duration?: number
      fileName?: string
      fileUrl?: string
      fileSize?: string
    }
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      await this.initializeSupabase()

      // Buscar nome do remetente
      const { data: userData } = await this.supabase
        .from('users')
        .select('full_name')
        .eq('id', senderId)
        .single()

      const senderName = userData?.full_name || 'Usuário'

      const messageData = {
        delegation_id: delegationId,
        sender_id: senderId,
        sender_name: senderName,
        sender_type: senderType,
        message,
        message_type: messageType,
        audio_url: metadata?.audioUrl,
        audio_duration: metadata?.duration,
        file_name: metadata?.fileName,
        file_url: metadata?.fileUrl,
        file_size: metadata?.fileSize,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from('chat_messages')
        .insert([messageData])
        .select()
        .single()

      if (error) {
        throw error
      }

      return {
        success: true,
        messageId: data.id
      }

    } catch (error: any) {
      console.error('Send message error:', error)
      return {
        success: false,
        error: error.message || 'Erro ao enviar mensagem'
      }
    }
  }

  /**
   * Buscar mensagens de uma delegação
   */
  async getMessages(delegationId: string): Promise<ChatMessage[]> {
    try {
      await this.initializeSupabase()

      const { data, error } = await this.supabase
        .from('chat_messages')
        .select('*')
        .eq('delegation_id', delegationId)
        .order('created_at', { ascending: true })

      if (error) {
        throw error
      }

      return (data || []).map((msg: any) => ({
        id: msg.id,
        delegationId: msg.delegation_id,
        senderId: msg.sender_id,
        senderName: msg.sender_name,
        senderType: msg.sender_type,
        message: msg.message,
        messageType: msg.message_type,
        audioUrl: msg.audio_url,
        audioDuration: msg.audio_duration,
        transcription: msg.audio_transcription,
        transcriptionConfidence: msg.transcription_confidence,
        fileName: msg.file_name,
        fileUrl: msg.file_url,
        fileSize: msg.file_size,
        createdAt: msg.created_at,
        updatedAt: msg.updated_at
      }))

    } catch (error: any) {
      console.error('Get messages error:', error)
      return []
    }
  }

  /**
   * Marcar mensagens como lidas
   */
  async markAsRead(messageIds: string[], userId: string): Promise<boolean> {
    try {
      await this.initializeSupabase()

      // Implementar lógica de marcar como lida se necessário
      // Por enquanto apenas log
      console.log('Marking messages as read:', messageIds, 'by user:', userId)
      
      return true
    } catch (error) {
      console.error('Mark as read error:', error)
      return false
    }
  }

  /**
   * Subscrever a mudanças em tempo real
   */
  subscribeToMessages(
    delegationId: string,
    onMessage: (message: ChatMessage) => void,
    onError?: (error: any) => void
  ): (() => void) | null {
    if (!this.realtime) {
      return null
    }

    try {
      const subscription = this.supabase
        .channel(`chat:${delegationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `delegation_id=eq.${delegationId}`
          },
          (payload: any) => {
            const newMessage: ChatMessage = {
              id: payload.new.id,
              delegationId: payload.new.delegation_id,
              senderId: payload.new.sender_id,
              senderName: payload.new.sender_name,
              senderType: payload.new.sender_type,
              message: payload.new.message,
              messageType: payload.new.message_type,
              audioUrl: payload.new.audio_url,
              audioDuration: payload.new.audio_duration,
              transcription: payload.new.audio_transcription,
              transcriptionConfidence: payload.new.transcription_confidence,
              fileName: payload.new.file_name,
              fileUrl: payload.new.file_url,
              fileSize: payload.new.file_size,
              createdAt: payload.new.created_at,
              updatedAt: payload.new.updated_at
            }

            onMessage(newMessage)
          }
        )
        .subscribe()

      // Retornar função de cleanup
      return () => {
        subscription.unsubscribe()
      }

    } catch (error) {
      console.error('Subscribe to messages error:', error)
      onError?.(error)
      return null
    }
  }
}


