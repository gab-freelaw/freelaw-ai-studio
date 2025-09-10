import { createClient } from '@/lib/supabase/server'
import { ChatService } from './ChatService'

export interface SubmitDeliverableData {
  delegationId: string
  deliverableUrl?: string
  deliverableContent?: string
  notes?: string
}

export interface ReviewData {
  delegationId: string
  reviewId?: string
  feedback: string
  rating?: number
  status: 'approved' | 'rejected' | 'needs_revision'
  revisionNotes?: string
  revisionDeadline?: string
}

export interface Review {
  id: string
  delegationId: string
  reviewerId: string
  reviewerName: string
  reviewerType: 'office' | 'provider'
  reviewType: string
  deliverableUrl?: string
  deliverableContent?: string
  feedback?: string
  rating?: number
  status: string
  revisionNotes?: string
  revisionDeadline?: string
  createdAt: string
  updatedAt: string
}

export class ApprovalService {
  private supabase: any
  private chatService: ChatService

  constructor() {
    this.chatService = new ChatService()
  }

  async initializeSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
  }

  /**
   * Prestador submeter trabalho para revisão
   */
  async submitDeliverable(
    providerId: string,
    data: SubmitDeliverableData
  ): Promise<{
    success: boolean
    reviewId?: string
    error?: string
  }> {
    try {
      await this.initializeSupabase()

      // Verificar se a delegação existe e pertence ao prestador
      const { data: delegation, error: delegationError } = await this.supabase
        .from('delegations')
        .select('id, status, provider_id, title')
        .eq('id', data.delegationId)
        .eq('provider_id', providerId)
        .single()

      if (delegationError || !delegation) {
        return {
          success: false,
          error: 'Delegação não encontrada ou acesso negado'
        }
      }

      if (delegation.status !== 'in_progress') {
        return {
          success: false,
          error: 'Delegação não está em andamento'
        }
      }

      // Criar revisão de submissão
      const { data: review, error: reviewError } = await this.supabase
        .from('delegation_reviews')
        .insert({
          delegation_id: data.delegationId,
          reviewer_id: providerId,
          reviewer_type: 'provider',
          review_type: 'submission',
          deliverable_url: data.deliverableUrl,
          deliverable_content: data.deliverableContent,
          feedback: data.notes,
          status: 'pending',
          metadata: {
            submitted_at: new Date().toISOString()
          }
        })
        .select()
        .single()

      if (reviewError) {
        console.error('Submit deliverable error:', reviewError)
        return {
          success: false,
          error: 'Erro ao submeter trabalho'
        }
      }

      // Atualizar status da delegação
      await this.supabase
        .from('delegations')
        .update({
          status: 'under_review',
          metadata: {
            submitted_for_review_at: new Date().toISOString(),
            latest_review_id: review.id
          }
        })
        .eq('id', data.delegationId)

      // Enviar mensagem automática no chat
      await (this.chatService as any).sendSystemMessage(
        data.delegationId,
        `📋 Trabalho submetido para revisão pelo prestador.\n\n${data.notes || 'Aguardando feedback do escritório.'}`,
        'status_update'
      )

      return {
        success: true,
        reviewId: review.id
      }

    } catch (error: any) {
      console.error('Submit deliverable service error:', error)
      return {
        success: false,
        error: 'Erro interno no serviço'
      }
    }
  }

  /**
   * Escritório revisar trabalho submetido
   */
  async reviewDeliverable(
    reviewerId: string,
    data: ReviewData
  ): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      await this.initializeSupabase()

      // Verificar acesso à delegação
      const { data: delegation, error: delegationError } = await this.supabase
        .from('delegations')
        .select('id, office_id, status, title')
        .eq('id', data.delegationId)
        .single()

      if (delegationError || !delegation) {
        return {
          success: false,
          error: 'Delegação não encontrada'
        }
      }

      // Verificar se o revisor é do escritório
      const { data: reviewer } = await this.supabase
        .from('users')
        .select('metadata')
        .eq('id', reviewerId)
        .single()

      if (!reviewer || reviewer.metadata?.organization_id !== delegation.office_id) {
        return {
          success: false,
          error: 'Acesso negado'
        }
      }

      if (delegation.status !== 'under_review') {
        return {
          success: false,
          error: 'Delegação não está em revisão'
        }
      }

      // Criar ou atualizar revisão
      let reviewData: any = {
        delegation_id: data.delegationId,
        reviewer_id: reviewerId,
        reviewer_type: 'office',
        review_type: data.status === 'approved' ? 'approval' : 
                    data.status === 'rejected' ? 'rejection' : 'revision_request',
        feedback: data.feedback,
        rating: data.rating,
        status: data.status,
        revision_notes: data.revisionNotes,
        revision_deadline: data.revisionDeadline,
        metadata: {
          reviewed_at: new Date().toISOString()
        }
      }

      let review
      if (data.reviewId) {
        // Atualizar revisão existente
        const { data: updatedReview, error: updateError } = await this.supabase
          .from('delegation_reviews')
          .update(reviewData)
          .eq('id', data.reviewId)
          .select()
          .single()

        if (updateError) {
          console.error('Update review error:', updateError)
          return {
            success: false,
            error: 'Erro ao atualizar revisão'
          }
        }
        review = updatedReview
      } else {
        // Criar nova revisão
        const { data: newReview, error: createError } = await this.supabase
          .from('delegation_reviews')
          .insert(reviewData)
          .select()
          .single()

        if (createError) {
          console.error('Create review error:', createError)
          return {
            success: false,
            error: 'Erro ao criar revisão'
          }
        }
        review = newReview
      }

      // Atualizar status da delegação baseado na revisão
      let newDelegationStatus = delegation.status
      let delegationMetadata: any = {
        latest_review_id: review.id,
        reviewed_at: new Date().toISOString()
      }

      if (data.status === 'approved') {
        newDelegationStatus = 'completed'
        delegationMetadata.completed_at = new Date().toISOString()
        delegationMetadata.final_rating = data.rating
      } else if (data.status === 'rejected') {
        newDelegationStatus = 'cancelled'
        delegationMetadata.rejected_at = new Date().toISOString()
        delegationMetadata.rejection_reason = data.feedback
      } else if (data.status === 'needs_revision') {
        newDelegationStatus = 'in_progress'
        delegationMetadata.revision_requested_at = new Date().toISOString()
        delegationMetadata.revision_deadline = data.revisionDeadline
      }

      await this.supabase
        .from('delegations')
        .update({
          status: newDelegationStatus,
          metadata: delegationMetadata
        })
        .eq('id', data.delegationId)

      // Enviar mensagem automática no chat
      let chatMessage = ''
      if (data.status === 'approved') {
        chatMessage = `✅ Trabalho aprovado pelo escritório!\n\n⭐ Avaliação: ${data.rating}/5\n\n💬 Feedback: ${data.feedback}`
      } else if (data.status === 'rejected') {
        chatMessage = `❌ Trabalho rejeitado pelo escritório.\n\n💬 Motivo: ${data.feedback}`
      } else if (data.status === 'needs_revision') {
        chatMessage = `🔄 Revisão solicitada pelo escritório.\n\n📝 Observações: ${data.feedback}\n\n${data.revisionNotes ? `📋 Itens para revisar: ${data.revisionNotes}` : ''}\n\n⏰ Prazo: ${data.revisionDeadline ? new Date(data.revisionDeadline).toLocaleDateString('pt-BR') : 'A definir'}`
      }

      await (this.chatService as any).sendSystemMessage(
        data.delegationId,
        chatMessage,
        'status_update'
      )

      return { success: true }

    } catch (error: any) {
      console.error('Review deliverable service error:', error)
      return {
        success: false,
        error: 'Erro interno no serviço'
      }
    }
  }

  /**
   * Buscar revisões de uma delegação
   */
  async getDelegationReviews(delegationId: string): Promise<Review[]> {
    try {
      await this.initializeSupabase()

      const { data: reviews, error } = await this.supabase
        .from('delegation_reviews')
        .select(`
          *,
          reviewer:users(full_name, email)
        `)
        .eq('delegation_id', delegationId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Get delegation reviews error:', error)
        return []
      }

      return reviews.map((review: any) => ({
        id: review.id,
        delegationId: review.delegation_id,
        reviewerId: review.reviewer_id,
        reviewerName: review.reviewer?.full_name || 'Usuário',
        reviewerType: review.reviewer_type,
        reviewType: review.review_type,
        deliverableUrl: review.deliverable_url,
        deliverableContent: review.deliverable_content,
        feedback: review.feedback,
        rating: review.rating,
        status: review.status,
        revisionNotes: review.revision_notes,
        revisionDeadline: review.revision_deadline,
        createdAt: review.created_at,
        updatedAt: review.updated_at
      }))

    } catch (error: any) {
      console.error('Get delegation reviews service error:', error)
      return []
    }
  }

  /**
   * Buscar última revisão de uma delegação
   */
  async getLatestReview(delegationId: string): Promise<Review | null> {
    try {
      await this.initializeSupabase()

      const { data: review, error } = await this.supabase
        .from('delegation_reviews')
        .select(`
          *,
          reviewer:users(full_name, email)
        `)
        .eq('delegation_id', delegationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        return null
      }

      return {
        id: review.id,
        delegationId: review.delegation_id,
        reviewerId: review.reviewer_id,
        reviewerName: review.reviewer?.full_name || 'Usuário',
        reviewerType: review.reviewer_type,
        reviewType: review.review_type,
        deliverableUrl: review.deliverable_url,
        deliverableContent: review.deliverable_content,
        feedback: review.feedback,
        rating: review.rating,
        status: review.status,
        revisionNotes: review.revision_notes,
        revisionDeadline: review.revision_deadline,
        createdAt: review.created_at,
        updatedAt: review.updated_at
      }

    } catch (error: any) {
      console.error('Get latest review service error:', error)
      return null
    }
  }

  /**
   * Marcar delegação como iniciada
   */
  async startWork(
    delegationId: string,
    providerId: string
  ): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      await this.initializeSupabase()

      // Verificar se a delegação está matched e pertence ao prestador
      const { data: delegation, error: delegationError } = await this.supabase
        .from('delegations')
        .select('id, status, provider_id')
        .eq('id', delegationId)
        .eq('provider_id', providerId)
        .single()

      if (delegationError || !delegation) {
        return {
          success: false,
          error: 'Delegação não encontrada'
        }
      }

      if (delegation.status !== 'matched') {
        return {
          success: false,
          error: 'Delegação não está disponível para iniciar'
        }
      }

      // Atualizar status para in_progress
      const { error: updateError } = await this.supabase
        .from('delegations')
        .update({
          status: 'in_progress',
          metadata: {
            work_started_at: new Date().toISOString()
          }
        })
        .eq('id', delegationId)

      if (updateError) {
        console.error('Start work error:', updateError)
        return {
          success: false,
          error: 'Erro ao iniciar trabalho'
        }
      }

      // Enviar mensagem automática
      await (this.chatService as any).sendSystemMessage(
        delegationId,
        '🚀 Trabalho iniciado pelo prestador. O desenvolvimento está em andamento.',
        'status_update'
      )

      return { success: true }

    } catch (error: any) {
      console.error('Start work service error:', error)
      return {
        success: false,
        error: 'Erro interno no serviço'
      }
    }
  }

  /**
   * Obter estatísticas de aprovação
   */
  async getApprovalStats(
    officeId?: string,
    providerId?: string,
    period: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<{
    totalReviews: number
    approvedCount: number
    rejectedCount: number
    revisionCount: number
    averageRating: number
    approvalRate: number
  }> {
    try {
      await this.initializeSupabase()

      const periodDays = {
        week: 7,
        month: 30,
        quarter: 90
      }

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - periodDays[period])

      let query = this.supabase
        .from('delegation_reviews')
        .select(`
          *,
          delegation:delegations(office_id, provider_id)
        `)
        .gte('created_at', startDate.toISOString())
        .in('review_type', ['approval', 'rejection', 'revision_request'])

      if (officeId) {
        query = query.eq('delegation.office_id', officeId)
      }

      if (providerId) {
        query = query.eq('delegation.provider_id', providerId)
      }

      const { data: reviews, error } = await query

      if (error || !reviews) {
        return {
          totalReviews: 0,
          approvedCount: 0,
          rejectedCount: 0,
          revisionCount: 0,
          averageRating: 0,
          approvalRate: 0
        }
      }

      const totalReviews = reviews.length
      const approvedCount = reviews.filter((r: any) => r.review_type === 'approval').length
      const rejectedCount = reviews.filter((r: any) => r.review_type === 'rejection').length
      const revisionCount = reviews.filter((r: any) => r.review_type === 'revision_request').length

      const ratingsSum = reviews
        .filter((r: any) => r.rating)
        .reduce((sum: number, r: any) => sum + r.rating, 0)
      const ratingsCount = reviews.filter((r: any) => r.rating).length
      const averageRating = ratingsCount > 0 ? ratingsSum / ratingsCount : 0

      const approvalRate = totalReviews > 0 ? approvedCount / totalReviews : 0

      return {
        totalReviews,
        approvedCount,
        rejectedCount,
        revisionCount,
        averageRating,
        approvalRate
      }

    } catch (error: any) {
      console.error('Get approval stats service error:', error)
      return {
        totalReviews: 0,
        approvedCount: 0,
        rejectedCount: 0,
        revisionCount: 0,
        averageRating: 0,
        approvalRate: 0
      }
    }
  }
}


