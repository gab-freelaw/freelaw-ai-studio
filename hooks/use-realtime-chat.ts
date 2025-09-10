'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'
import { ChatMessage } from '@/lib/services/ChatService'

export function useRealtimeChat(delegationId: string, userId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (!delegationId || !userId) return

    // Criar canal do Realtime
    const chatChannel = supabase.channel(`chat:${delegationId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: userId }
      }
    })

    // Escutar novas mensagens
    chatChannel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `delegation_id=eq.${delegationId}`
      }, (payload) => {
        const newMessage = payload.new as any
        setMessages(prev => [
          ...prev,
          {
            id: newMessage.id,
            delegationId: newMessage.delegation_id,
            senderId: newMessage.sender_id,
            senderName: newMessage.sender_name,
            senderType: newMessage.sender_type,
            message: newMessage.message,
            messageType: newMessage.message_type,
            audioUrl: newMessage.audio_url,
            audioDuration: newMessage.audio_duration,
            transcription: newMessage.audio_transcription,
            transcriptionConfidence: newMessage.transcription_confidence,
            fileName: newMessage.file_name,
            fileUrl: newMessage.file_url,
            fileSize: newMessage.file_size,
            createdAt: newMessage.created_at,
            updatedAt: newMessage.updated_at
          }
        ])
      })

    // Escutar atualizações de mensagens (como marcar como lida)
    chatChannel
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
        filter: `delegation_id=eq.${delegationId}`
      }, (payload) => {
        const updatedMessage = payload.new as any
        setMessages(prev => 
          prev.map(m => m.id === updatedMessage.id ? {
            ...m,
            isRead: updatedMessage.is_read,
            content: updatedMessage.content
          } : m)
        )
      })

    // Escutar presença (usuários online)
    chatChannel
      .on('presence', { event: 'sync' }, () => {
        const state = chatChannel.presenceState()
        const users = Object.keys(state)
        setOnlineUsers(users)
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers(prev => [...prev.filter(u => u !== key), key])
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => prev.filter(u => u !== key))
      })

    // Conectar
    chatChannel.subscribe(async (status) => {
      setIsConnected(status === 'SUBSCRIBED')
      
      if (status === 'SUBSCRIBED') {
        // Enviar presença
        await chatChannel.track({
          user_id: userId,
          online_at: new Date().toISOString()
        })
      }
    })

    setChannel(chatChannel)

    return () => {
      chatChannel.unsubscribe()
      setChannel(null)
      setIsConnected(false)
    }
  }, [delegationId, userId])

  const sendRealtimeMessage = useCallback(async (
    content: string,
    messageType: 'text' | 'file' | 'audio' = 'text',
    attachments: any[] = []
  ) => {
    if (!channel || !userId) return false

    try {
      // Enviar via broadcast para feedback imediato
      await channel.send({
        type: 'broadcast',
        event: 'new_message',
        payload: {
          content,
          messageType,
          senderId: userId,
          timestamp: new Date().toISOString(),
          attachments
        }
      })

      return true
    } catch (error) {
      console.error('Erro ao enviar mensagem realtime:', error)
      return false
    }
  }, [channel, userId])

  const sendTypingIndicator = useCallback(async (isTyping: boolean) => {
    if (!channel || !userId) return

    try {
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: userId,
          is_typing: isTyping,
          timestamp: new Date().toISOString()
        }
      })
    } catch (error) {
      console.error('Erro ao enviar indicador de digitação:', error)
    }
  }, [channel, userId])

  return {
    messages,
    onlineUsers,
    isConnected,
    sendRealtimeMessage,
    sendTypingIndicator,
    setMessages // Para sincronização com API
  }
}
