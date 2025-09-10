import { createClient } from '@/lib/supabase/server'

export interface AuditLogEntry {
  entityType: string
  entityId: string
  action: string
  actionCategory: 'auth' | 'workflow' | 'data' | 'system'
  description: string
  changes?: {
    before?: any
    after?: any
    fields?: string[]
  }
  metadata?: Record<string, any>
  severity?: 'low' | 'info' | 'warning' | 'high' | 'critical'
  isSensitive?: boolean
}

export interface AuditContext {
  userId?: string
  userType?: 'office' | 'provider' | 'admin' | 'system'
  userName?: string
  userEmail?: string
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  requestId?: string
}

export interface AuditQueryOptions {
  entityType?: string
  entityId?: string
  userId?: string
  action?: string
  actionCategory?: string
  severity?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

export class AuditService {
  private supabase

  constructor() {
    this.supabase = createClient() as any
  }

  /**
   * Registrar evento de auditoria
   */
  async log(entry: AuditLogEntry, context?: AuditContext): Promise<void> {
    try {
      const { data: userData } = await this.supabase.auth.getUser()
      
      // Determinar contexto do usuário se não fornecido
      const finalContext: AuditContext = {
        userId: context?.userId || userData.user?.id,
        userType: context?.userType || 'system',
        userName: context?.userName || userData.user?.user_metadata?.full_name,
        userEmail: context?.userEmail || userData.user?.email,
        ...context
      }

      const auditData = {
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        action: entry.action,
        action_category: entry.actionCategory,
        description: entry.description,
        changes: entry.changes || null,
        metadata: entry.metadata || {},
        severity: entry.severity || 'info',
        is_sensitive: entry.isSensitive || false,
        user_id: finalContext.userId,
        user_type: finalContext.userType,
        user_name: finalContext.userName,
        user_email: finalContext.userEmail,
        ip_address: finalContext.ipAddress,
        user_agent: finalContext.userAgent,
        session_id: finalContext.sessionId,
        request_id: finalContext.requestId
      }

      const { error } = await this.supabase
        .from('audit_logs')
        .insert([auditData])

      if (error) {
        console.error('Failed to log audit entry:', error)
        // Não falhar o processo principal por erro de auditoria
      }

    } catch (error) {
      console.error('Audit service error:', error)
      // Fail silently para não afetar a operação principal
    }
  }

  /**
   * Buscar logs de auditoria
   */
  async getLogs(options: AuditQueryOptions = {}): Promise<{
    logs: any[]
    total: number
    hasMore: boolean
  }> {
    try {
      let query = this.supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })

      // Filtros
      if (options.entityType) {
        query = query.eq('entity_type', options.entityType)
      }
      if (options.entityId) {
        query = query.eq('entity_id', options.entityId)
      }
      if (options.userId) {
        query = query.eq('user_id', options.userId)
      }
      if (options.action) {
        query = query.eq('action', options.action)
      }
      if (options.actionCategory) {
        query = query.eq('action_category', options.actionCategory)
      }
      if (options.severity) {
        query = query.eq('severity', options.severity)
      }
      if (options.startDate) {
        query = query.gte('created_at', options.startDate.toISOString())
      }
      if (options.endDate) {
        query = query.lte('created_at', options.endDate.toISOString())
      }

      // Paginação
      const limit = options.limit || 50
      const offset = options.offset || 0
      
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        throw error
      }

      return {
        logs: data || [],
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      }

    } catch (error) {
      console.error('Get audit logs error:', error)
      return { logs: [], total: 0, hasMore: false }
    }
  }

  /**
   * Buscar timeline de uma entidade específica
   */
  async getEntityTimeline(entityType: string, entityId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('audit_logs')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Get entity timeline error:', error)
      return []
    }
  }

  /**
   * Métodos específicos para diferentes tipos de eventos
   */

  // === DELEGAÇÃO ===
  async logDelegationCreated(delegationId: string, delegationData: any, context?: AuditContext) {
    await this.log({
      entityType: 'delegation',
      entityId: delegationId,
      action: 'created',
      actionCategory: 'workflow',
      description: `Delegação criada: ${delegationData.service_type} - ${delegationData.legal_area}`,
      changes: { after: delegationData },
      metadata: {
        service_type: delegationData.service_type,
        legal_area: delegationData.legal_area,
        calculated_price: delegationData.calculated_price
      },
      severity: 'info'
    }, context)
  }

  async logDelegationStatusChanged(
    delegationId: string, 
    oldStatus: string, 
    newStatus: string,
    providerId?: string,
    context?: AuditContext
  ) {
    await this.log({
      entityType: 'delegation',
      entityId: delegationId,
      action: 'status_updated',
      actionCategory: 'workflow',
      description: `Status da delegação alterado de "${oldStatus}" para "${newStatus}"`,
      changes: {
        before: { status: oldStatus },
        after: { status: newStatus },
        fields: ['status']
      },
      metadata: {
        old_status: oldStatus,
        new_status: newStatus,
        provider_id: providerId
      },
      severity: newStatus === 'cancelled' ? 'warning' : 'info'
    }, context)
  }

  async logProviderResponse(
    delegationId: string,
    response: 'accepted' | 'rejected',
    message?: string,
    context?: AuditContext
  ) {
    await this.log({
      entityType: 'delegation',
      entityId: delegationId,
      action: 'provider_response',
      actionCategory: 'workflow',
      description: `Prestador ${response === 'accepted' ? 'aceitou' : 'rejeitou'} a delegação`,
      changes: {
        after: { provider_response: response, provider_response_message: message }
      },
      metadata: {
        response,
        message
      },
      severity: response === 'rejected' ? 'warning' : 'info'
    }, context)
  }

  // === PRESTADOR ===
  async logProviderRegistered(providerId: string, providerData: any, context?: AuditContext) {
    await this.log({
      entityType: 'provider',
      entityId: providerId,
      action: 'registered',
      actionCategory: 'auth',
      description: `Novo prestador registrado: ${providerData.full_name} (OAB: ${providerData.oab_number})`,
      changes: { after: { ...providerData, password: '[REDACTED]' } },
      metadata: {
        oab_number: providerData.oab_number,
        specializations: providerData.specializations
      },
      severity: 'info',
      isSensitive: true
    }, context)
  }

  async logProviderApproved(providerId: string, approvedBy: string, context?: AuditContext) {
    await this.log({
      entityType: 'provider',
      entityId: providerId,
      action: 'approved',
      actionCategory: 'auth',
      description: 'Prestador aprovado pelo administrador',
      changes: {
        before: { status: 'pending' },
        after: { status: 'approved' },
        fields: ['status']
      },
      metadata: {
        approved_by: approvedBy
      },
      severity: 'info'
    }, context)
  }

  async logProviderEvaluated(
    providerId: string,
    evaluationData: any,
    context?: AuditContext
  ) {
    await this.log({
      entityType: 'provider',
      entityId: providerId,
      action: 'evaluated',
      actionCategory: 'workflow',
      description: `Prestador avaliado por IA - Score: ${evaluationData.overall_score}`,
      changes: { after: evaluationData },
      metadata: {
        overall_score: evaluationData.overall_score,
        technical_score: evaluationData.technical_score,
        evaluation_type: evaluationData.evaluation_type
      },
      severity: 'info'
    }, context)
  }

  // === DOCUMENTOS ===
  async logDocumentUploaded(
    entityType: string,
    entityId: string,
    documentInfo: any,
    context?: AuditContext
  ) {
    await this.log({
      entityType,
      entityId,
      action: 'document_uploaded',
      actionCategory: 'data',
      description: `Documento enviado: ${documentInfo.file_name}`,
      changes: { after: documentInfo },
      metadata: {
        file_name: documentInfo.file_name,
        file_type: documentInfo.file_type,
        document_type: documentInfo.document_type
      },
      severity: 'info'
    }, context)
  }

  async logDocumentVersionCreated(
    delegationId: string,
    versionNumber: number,
    context?: AuditContext
  ) {
    await this.log({
      entityType: 'delegation',
      entityId: delegationId,
      action: 'document_version_created',
      actionCategory: 'workflow',
      description: `Nova versão do documento criada: v${versionNumber}`,
      changes: { after: { version: versionNumber } },
      metadata: {
        version_number: versionNumber
      },
      severity: 'info'
    }, context)
  }

  // === CHAT ===
  async logChatMessage(
    delegationId: string,
    messageType: 'text' | 'audio' | 'file',
    context?: AuditContext
  ) {
    await this.log({
      entityType: 'delegation',
      entityId: delegationId,
      action: 'chat_message_sent',
      actionCategory: 'data',
      description: `Mensagem de ${messageType} enviada no chat`,
      metadata: {
        message_type: messageType
      },
      severity: 'low'
    }, context)
  }

  async logAudioTranscribed(
    delegationId: string,
    messageId: string,
    confidence: number,
    context?: AuditContext
  ) {
    await this.log({
      entityType: 'delegation',
      entityId: delegationId,
      action: 'audio_transcribed',
      actionCategory: 'system',
      description: `Áudio transcrito automaticamente`,
      metadata: {
        message_id: messageId,
        transcription_confidence: confidence
      },
      severity: 'low'
    }, context)
  }

  // === SISTEMA ===
  async logSystemError(
    entityType: string,
    entityId: string,
    error: any,
    context?: AuditContext
  ) {
    await this.log({
      entityType,
      entityId,
      action: 'system_error',
      actionCategory: 'system',
      description: `Erro do sistema: ${error.message || 'Erro desconhecido'}`,
      metadata: {
        error_code: error.code,
        error_message: error.message,
        stack_trace: error.stack
      },
      severity: 'high',
      isSensitive: true
    }, context)
  }

  async logSecurityEvent(
    action: string,
    description: string,
    metadata?: any,
    context?: AuditContext
  ) {
    await this.log({
      entityType: 'security',
      entityId: 'system',
      action,
      actionCategory: 'auth',
      description,
      metadata,
      severity: 'critical',
      isSensitive: true
    }, context)
  }

  /**
   * Gerar relatório de auditoria
   */
  async generateAuditReport(options: AuditQueryOptions & {
    format?: 'summary' | 'detailed'
  }) {
    const { logs, total } = await this.getLogs(options)
    
    const summary = {
      total,
      period: {
        start: options.startDate?.toISOString(),
        end: options.endDate?.toISOString()
      },
      actions: this.groupBy(logs, 'action'),
      categories: this.groupBy(logs, 'action_category'),
      severities: this.groupBy(logs, 'severity'),
      users: this.groupBy(logs, 'user_type'),
      entities: this.groupBy(logs, 'entity_type')
    }

    if (options.format === 'summary') {
      return { summary }
    }

    return {
      summary,
      logs: logs.map(log => ({
        ...log,
        // Sanitizar dados sensíveis se necessário
        changes: log.is_sensitive ? '[SENSITIVE_DATA]' : log.changes,
        metadata: log.is_sensitive ? '[SENSITIVE_DATA]' : log.metadata
      }))
    }
  }

  /**
   * Utilitário para agrupar dados
   */
  private groupBy(array: any[], key: string): Record<string, number> {
    return array.reduce((acc, item) => {
      const value = item[key] || 'unknown'
      acc[value] = (acc[value] || 0) + 1
      return acc
    }, {})
  }

  /**
   * Detectar atividades suspeitas
   */
  async detectSuspiciousActivity(): Promise<{
    alerts: Array<{
      type: string
      description: string
      severity: string
      count: number
      lastOccurrence: string
    }>
  }> {
    try {
      const now = new Date()
      const oneHour = new Date(now.getTime() - 60 * 60 * 1000)
      
      // Buscar eventos das últimas horas
      const { logs } = await this.getLogs({
        startDate: oneHour,
        severity: 'warning',
        limit: 1000
      })

      const alerts = []

      // Detectar tentativas múltiplas de login falhadas
      const failedLogins = logs.filter(l => l.action === 'login_failed')
      if (failedLogins.length > 5) {
        alerts.push({
          type: 'multiple_failed_logins',
          description: `${failedLogins.length} tentativas de login falhadas na última hora`,
          severity: 'high',
          count: failedLogins.length,
          lastOccurrence: failedLogins[0]?.created_at
        })
      }

      // Detectar rejeições excessivas de delegações
      const rejections = logs.filter(l => 
        l.action === 'provider_response' && 
        l.metadata?.response === 'rejected'
      )
      if (rejections.length > 10) {
        alerts.push({
          type: 'excessive_rejections',
          description: `${rejections.length} delegações rejeitadas na última hora`,
          severity: 'warning',
          count: rejections.length,
          lastOccurrence: rejections[0]?.created_at
        })
      }

      return { alerts }
      
    } catch (error) {
      console.error('Detect suspicious activity error:', error)
      return { alerts: [] }
    }
  }
}


