'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Send,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
  Info,
  Loader2,
  Mic,
  X,
  Image,
  FileText
} from 'lucide-react'
import { ChatService, type ChatMessage } from '@/lib/services/ChatService'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import AudioRecorder from './AudioRecorder'
import AudioPlayer from './AudioPlayer'

interface ChatInterfaceProps {
  delegationId: string
  delegationTitle: string
  otherPartyName: string
  currentUserId: string
  currentUserType: 'office' | 'provider'
}

export default function ChatInterface({
  delegationId,
  delegationTitle,
  otherPartyName,
  currentUserId,
  currentUserType
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showAudioRecorder, setShowAudioRecorder] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatService = useRef(new ChatService(true))
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Scroll para o final das mensagens
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Carregar mensagens iniciais
  useEffect(() => {
    loadMessages()
    setupRealtimeSubscription()

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [delegationId])

  // Scroll automático quando novas mensagens chegam
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/chat/${delegationId}`)
      
      if (!response.ok) {
        throw new Error('Erro ao carregar mensagens')
      }

      const data = await response.json()
      setMessages(data.messages || [])
      
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }

    unsubscribeRef.current = chatService.current.subscribeToMessages(
      delegationId,
      (newMessage: ChatMessage) => {
        setMessages(prev => {
          // Evitar duplicatas
          if (prev.find(m => m.id === newMessage.id)) {
            return prev
          }
          return [...prev, newMessage]
        })

        // Marcar como lida se não é do usuário atual
        if (newMessage.senderId !== currentUserId) {
          markAsRead([newMessage.id])
        }
      },
      (error) => {
        console.error('Realtime subscription error:', error)
        setIsOnline(false)
      }
    )
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return

    try {
      setIsSending(true)
      
      const response = await fetch(`/api/chat/${delegationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: newMessage.trim(),
          messageType: 'text'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao enviar mensagem')
      }

      setNewMessage('')
      
    } catch (error: any) {
      console.error('Error sending message:', error)
      alert(`Erro: ${error.message}`)
    } finally {
      setIsSending(false)
    }
  }

  const markAsRead = async (messageIds?: string[]) => {
    try {
      await fetch(`/api/chat/${delegationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messageIds })
      })
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: ptBR
    })
  }

  const getMessageAlignment = (senderId: string) => {
    return senderId === currentUserId ? 'flex-row-reverse' : 'flex-row'
  }

  const getMessageBubbleStyle = (senderId: string) => {
    if (senderId === currentUserId) {
      return 'bg-gradient-to-r from-freelaw-purple to-tech-blue text-white ml-12'
    }
    return 'bg-gray-100 text-gray-900 mr-12'
  }

  const getAvatarColor = (senderType: string) => {
    return senderType === 'office' ? 'bg-freelaw-purple' : 'bg-tech-blue'
  }

  return (
    <Card className="h-[600px] flex flex-col">
      {/* Header */}
      <CardHeader className="border-b bg-gradient-to-r from-freelaw-purple/5 to-tech-blue/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className={getAvatarColor(currentUserType === 'office' ? 'provider' : 'office')}>
              <AvatarFallback className="text-white font-semibold">
                {otherPartyName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg text-freelaw-black">
                {otherPartyName}
              </CardTitle>
              <p className="text-sm text-gray-600">
                {delegationTitle}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isOnline && (
              <Badge variant="destructive" className="text-xs">
                Desconectado
              </Badge>
            )}
            <Button variant="ghost" size="sm">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Info className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-freelaw-purple mx-auto mb-2" />
                <p className="text-gray-600">Carregando mensagens...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Send className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-freelaw-black mb-2">
                  Inicie a conversa
                </h3>
                <p className="text-gray-600">
                  Envie a primeira mensagem para começar a colaboração.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-end space-x-2 ${getMessageAlignment(message.senderId)}`}
                >
                  <Avatar className={`w-8 h-8 ${getAvatarColor(message.senderType)}`}>
                    <AvatarFallback className="text-white text-xs">
                      {message.senderName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex flex-col max-w-xs lg:max-w-md">
                    <div className={`rounded-2xl px-4 py-2 ${getMessageBubbleStyle(message.senderId)}`}>
                      {(message.messageType as any) === 'system' ? (
                        <div className="flex items-center space-x-2">
                          <Info className="w-4 h-4" />
                          <span className="text-sm italic">{message.message}</span>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">
                          {message.message}
                        </p>
                      )}
                    </div>
                    
                    <div className={`text-xs text-gray-500 mt-1 ${
                      message.senderId === currentUserId ? 'text-right' : 'text-left'
                    }`}>
                      <span>{message.senderName}</span>
                      <span className="mx-1">•</span>
                      <span>{formatMessageTime(message.createdAt)}</span>
                      {message.senderId === currentUserId && (message as any).isRead && (
                        <span className="ml-1 text-green-600">✓</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="text-gray-500">
            <Paperclip className="w-4 h-4" />
          </Button>
          
          <div className="flex-1">
            <Input
              data-testid="chat-input"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="border-0 bg-gray-50 focus:bg-white transition-colors"
              disabled={isSending}
              aria-label="Campo de mensagem do chat"
              aria-describedby="chat-help"
            />
          </div>
          
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isSending}
            className="bg-gradient-to-r from-freelaw-purple to-tech-blue hover:from-freelaw-purple/90 hover:to-tech-blue/90"
            aria-label={isSending ? "Enviando mensagem..." : "Enviar mensagem"}
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>
            {isOnline ? 'Conectado' : 'Reconectando...'}
          </span>
          <span>
            Pressione Enter para enviar
          </span>
        </div>
      </div>
    </Card>
  )
}
