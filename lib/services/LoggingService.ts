import * as Sentry from '@sentry/nextjs'
import { PostHog } from 'posthog-node'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface LogContext {
  userId?: string
  userType?: 'office' | 'provider' | 'admin' | 'system'
  organizationId?: string
  sessionId?: string
  requestId?: string
  delegationId?: string
  providerId?: string
  ipAddress?: string
  userAgent?: string
  route?: string
  method?: string
  statusCode?: number
  duration?: number
  metadata?: Record<string, any>
}

export interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
  userId?: string
  timestamp?: Date
}

export class LoggingService {
  private static instance: LoggingService
  private posthog: PostHog | null = null
  private isServerSide: boolean

  constructor() {
    this.isServerSide = typeof window === 'undefined'
    this.initializePostHog()
  }

  static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService()
    }
    return LoggingService.instance
  }

  private initializePostHog() {
    if (this.isServerSide && process.env.POSTHOG_API_KEY) {
      this.posthog = new PostHog(process.env.POSTHOG_API_KEY, {
        host: process.env.POSTHOG_HOST || 'https://app.posthog.com',
        flushAt: 20,
        flushInterval: 10000
      })
    }
  }

  /**
   * Log estruturado com níveis
   */
  log(level: LogLevel, message: string, context?: LogContext) {
    const logData = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: context || {},
      environment: process.env.NODE_ENV,
      service: 'freelaw-ai-studio'
    }

    // Log no console para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = level === 'error' || level === 'fatal' ? 'error' : 
                           level === 'warn' ? 'warn' : 'log'
      console[consoleMethod](`[${level.toUpperCase()}]`, message, context)
    }

    // Enviar para Sentry baseado no nível
    if (level === 'error' || level === 'fatal') {
      this.logToSentry(level, message, context)
    }

    // Log estruturado para produção
    if (process.env.NODE_ENV === 'production') {
      // Aqui você pode integrar com outros serviços de logging
      // como CloudWatch, Datadog, etc.
    }
  }

  /**
   * Logs específicos por nível
   */
  debug(message: string, context?: LogContext) {
    this.log('debug', message, context)
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context)
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error, context?: LogContext) {
    const errorContext = {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    }
    this.log('error', message, errorContext)
  }

  fatal(message: string, error?: Error, context?: LogContext) {
    const errorContext = {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    }
    this.log('fatal', message, errorContext)
  }

  /**
   * Enviar para Sentry
   */
  private logToSentry(level: LogLevel, message: string, context?: LogContext) {
    Sentry.withScope((scope) => {
      // Configurar usuário
      if (context?.userId) {
        scope.setUser({
          id: context.userId,
          userType: context.userType,
          organizationId: context.organizationId
        })
      }

      // Configurar tags
      if (context?.userType) scope.setTag('userType', context.userType)
      if (context?.route) scope.setTag('route', context.route)
      if (context?.method) scope.setTag('method', context.method)
      if (context?.statusCode) scope.setTag('statusCode', context.statusCode.toString())

      // Configurar contexto extra
      if (context?.metadata) {
        scope.setContext('metadata', context.metadata)
      }

      // Configurar nível
      scope.setLevel(level === 'fatal' ? 'fatal' : level as any)

      // Capturar mensagem ou exceção
      if ((context as any)?.error) {
        Sentry.captureException(new Error(message), scope)
      } else {
        Sentry.captureMessage(message, scope)
      }
    })
  }

  /**
   * Rastrear eventos de analytics
   */
  trackEvent(event: AnalyticsEvent) {
    if (this.posthog) {
      this.posthog.capture({
        distinctId: event.userId || 'anonymous',
        event: event.event,
        properties: {
          ...event.properties,
          $timestamp: event.timestamp || new Date(),
          environment: process.env.NODE_ENV,
          service: 'freelaw-ai-studio'
        }
      })
    }

    // Log do evento para debugging
    this.debug(`Analytics event: ${event.event}`, {
      metadata: event.properties
    })
  }

  /**
   * Eventos de negócio específicos
   */
  trackUserRegistration(userId: string, userType: 'office' | 'provider', metadata?: any) {
    this.trackEvent({
      event: 'user_registered',
      userId,
      properties: {
        user_type: userType,
        ...metadata
      }
    })
  }

  trackProviderApproved(providerId: string, approvedBy: string) {
    this.trackEvent({
      event: 'provider_approved',
      userId: providerId,
      properties: {
        approved_by: approvedBy
      }
    })
  }

  trackDelegationCreated(delegationId: string, officeId: string, metadata?: any) {
    this.trackEvent({
      event: 'delegation_created',
      userId: officeId,
      properties: {
        delegation_id: delegationId,
        ...metadata
      }
    })
  }

  trackDelegationResponse(delegationId: string, providerId: string, response: 'accepted' | 'rejected') {
    this.trackEvent({
      event: 'delegation_response',
      userId: providerId,
      properties: {
        delegation_id: delegationId,
        response
      }
    })
  }

  trackDocumentUploaded(userId: string, documentType: string, metadata?: any) {
    this.trackEvent({
      event: 'document_uploaded',
      userId,
      properties: {
        document_type: documentType,
        ...metadata
      }
    })
  }

  trackChatMessage(delegationId: string, senderId: string, messageType: 'text' | 'audio' | 'file') {
    this.trackEvent({
      event: 'chat_message_sent',
      userId: senderId,
      properties: {
        delegation_id: delegationId,
        message_type: messageType
      }
    })
  }

  trackAudioTranscribed(delegationId: string, userId: string, confidence: number) {
    this.trackEvent({
      event: 'audio_transcribed',
      userId,
      properties: {
        delegation_id: delegationId,
        transcription_confidence: confidence
      }
    })
  }

  trackAIEvaluation(providerId: string, evaluationType: string, score: number) {
    this.trackEvent({
      event: 'ai_evaluation_completed',
      userId: providerId,
      properties: {
        evaluation_type: evaluationType,
        overall_score: score
      }
    })
  }

  /**
   * Métricas de performance
   */
  trackPerformance(route: string, method: string, duration: number, statusCode: number, userId?: string) {
    this.trackEvent({
      event: 'api_request',
      userId,
      properties: {
        route,
        method,
        duration_ms: duration,
        status_code: statusCode
      }
    })

    // Log de performance se for muito lento
    if (duration > 5000) {
      this.warn(`Slow API request: ${method} ${route}`, {
        route,
        method,
        duration,
        statusCode,
        userId
      })
    }
  }

  /**
   * Métricas de erro
   */
  trackError(error: Error, context?: LogContext) {
    this.error(`Unhandled error: ${error.message}`, error, context)
    
    this.trackEvent({
      event: 'error_occurred',
      userId: context?.userId,
      properties: {
        error_name: error.name,
        error_message: error.message,
        route: context?.route,
        method: context?.method,
        user_type: context?.userType
      }
    })
  }

  /**
   * Flush manual para PostHog (útil em serverless)
   */
  async flush() {
    if (this.posthog) {
      await this.posthog.flush()
    }
  }

  /**
   * Shutdown graceful
   */
  async shutdown() {
    if (this.posthog) {
      await this.posthog.shutdown()
    }
  }
}

// Instância singleton
export const logger = LoggingService.getInstance()

// Helper functions para facilitar o uso
export const logInfo = (message: string, context?: LogContext) => logger.info(message, context)
export const logError = (message: string, error?: Error, context?: LogContext) => logger.error(message, error, context)
export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context)
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context)

export const trackEvent = (event: AnalyticsEvent) => logger.trackEvent(event)


