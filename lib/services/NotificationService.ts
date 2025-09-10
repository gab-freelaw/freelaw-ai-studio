import { createClient } from '@/lib/supabase/client'

export interface NotificationData {
  id: string
  title: string
  message: string
  type: 'deadline' | 'urgent' | 'info' | 'success' | 'warning' | 'error'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  deadline?: string
  relatedId?: string
  relatedType?: 'processo' | 'delegacao' | 'documento' | 'publicacao'
  userId: string
  read: boolean
  createdAt: string
}

export class NotificationService {
  private supabase = createClient()

  async createDeadlineNotification(
    userId: string,
    processo: any,
    deadline: Date,
    daysUntilDeadline: number
  ): Promise<NotificationData> {
    const urgencyLevel = this.calculateUrgencyLevel(daysUntilDeadline)
    
    const notification: Omit<NotificationData, 'id' | 'createdAt'> = {
      title: this.getDeadlineTitle(urgencyLevel, daysUntilDeadline),
      message: `Processo ${processo.numero_cnj || processo.numero_processo}: ${processo.classe || 'Processo'} - Prazo: ${deadline.toLocaleDateString('pt-BR')}`,
      type: urgencyLevel === 'urgent' ? 'urgent' : 'deadline',
      priority: urgencyLevel,
      deadline: deadline.toISOString(),
      relatedId: processo.id,
      relatedType: 'processo',
      userId,
      read: false
    }

    // Salvar no Supabase
    const { data, error } = await this.supabase
      .from('notifications')
      .insert([{
        ...notification,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error

    return {
      ...notification,
      id: data.id,
      createdAt: data.created_at
    }
  }

  async createPublicationNotification(
    userId: string,
    publicacao: any
  ): Promise<NotificationData> {
    const isUrgent = publicacao.urgente || (publicacao.prazo_dias && publicacao.prazo_dias <= 5)
    
    const notification: Omit<NotificationData, 'id' | 'createdAt'> = {
      title: isUrgent ? '🚨 Nova Publicação Urgente!' : '📰 Nova Publicação',
      message: `${publicacao.tribunal}: ${publicacao.numero_processo} - ${publicacao.tipo_movimento}`,
      type: isUrgent ? 'urgent' : 'info',
      priority: isUrgent ? 'urgent' : 'medium',
      deadline: publicacao.prazo_dias ? 
        new Date(Date.now() + publicacao.prazo_dias * 24 * 60 * 60 * 1000).toISOString() : 
        undefined,
      relatedId: publicacao.id,
      relatedType: 'publicacao',
      userId,
      read: false
    }

    const { data, error } = await this.supabase
      .from('notifications')
      .insert([{
        ...notification,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error

    return {
      ...notification,
      id: data.id,
      createdAt: data.created_at
    }
  }

  async getNotifications(userId: string, limit = 20): Promise<NotificationData[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return (data || []).map(item => ({
      id: item.id,
      title: item.title,
      message: item.message,
      type: item.type,
      priority: item.priority,
      deadline: item.deadline,
      relatedId: item.related_id,
      relatedType: item.related_type,
      userId: item.user_id,
      read: item.read,
      createdAt: item.created_at
    }))
  }

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId)

    if (error) throw error
  }

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) throw error
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) throw error
    return count || 0
  }

  private calculateUrgencyLevel(daysUntilDeadline: number): 'low' | 'medium' | 'high' | 'urgent' {
    if (daysUntilDeadline <= 1) return 'urgent'
    if (daysUntilDeadline <= 3) return 'high'
    if (daysUntilDeadline <= 7) return 'medium'
    return 'low'
  }

  private getDeadlineTitle(urgency: string, days: number): string {
    switch (urgency) {
      case 'urgent': return '🚨 Prazo Urgente!'
      case 'high': return '⚠️ Prazo Próximo'
      case 'medium': return '📅 Lembrete de Prazo'
      default: return '📝 Prazo Agendado'
    }
  }

  // Método para verificar prazos automaticamente
  async checkUpcomingDeadlines(userId: string): Promise<NotificationData[]> {
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    // Buscar processos com prazos próximos
    const { data: processos, error } = await this.supabase
      .from('processes')
      .select('*')
      .eq('user_id', userId)
      .not('deadline', 'is', null)
      .lte('deadline', sevenDaysFromNow.toISOString())

    if (error) throw error

    const notifications: NotificationData[] = []

    for (const processo of processos || []) {
      const deadline = new Date(processo.deadline)
      const daysUntil = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      
      if (daysUntil >= 0) {
        const notification = await this.createDeadlineNotification(
          userId,
          processo,
          deadline,
          daysUntil
        )
        notifications.push(notification)
      }
    }

    return notifications
  }
}

export const notificationService = new NotificationService()




