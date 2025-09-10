import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/services/LoggingService'

export interface RequestContext {
  startTime: number
  requestId: string
  userId?: string
  userType?: string
  organizationId?: string
}

/**
 * Middleware para logging automático de requisições
 */
export function withLogging(
  handler: (req: NextRequest, context: RequestContext) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now()
    const requestId = generateRequestId()
    
    // Extrair informações do usuário (se disponível)
    const userId = req.headers.get('x-user-id') || undefined
    const userType = req.headers.get('x-user-type') || undefined
    const organizationId = req.headers.get('x-organization-id') || undefined
    
    const context: RequestContext = {
      startTime,
      requestId,
      userId,
      userType: userType as "admin" | "provider" | "office" | "system" | undefined,
      organizationId
    }

    // Log inicial da requisição
    logger.debug(`[${requestId}] ${req.method} ${req.url}`, {
      requestId,
      route: req.nextUrl.pathname,
      method: req.method,
      userId,
      userType: userType as "admin" | "provider" | "office" | "system" | undefined,
      ipAddress: getClientIP(req),
      userAgent: req.headers.get('user-agent') || undefined
    })

    let response: NextResponse
    let error: Error | null = null

    try {
      response = await handler(req, context)
    } catch (err) {
      error = err as Error
      
      // Log do erro
      logger.error(`[${requestId}] Request failed: ${error.message}`, error, {
        requestId,
        route: req.nextUrl.pathname,
        method: req.method,
        userId,
        userType: userType as "admin" | "provider" | "office" | "system" | undefined,
        ipAddress: getClientIP(req),
        userAgent: req.headers.get('user-agent') || undefined
      })

      // Retornar resposta de erro
      response = NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    const duration = Date.now() - startTime
    const statusCode = response.status

    // Log final da requisição
    const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'
    
    logger.log(logLevel, `[${requestId}] ${req.method} ${req.url} - ${statusCode} (${duration}ms)`, {
      requestId,
      route: req.nextUrl.pathname,
      method: req.method,
      statusCode,
      duration,
      userId,
      userType: userType as "admin" | "provider" | "office" | "system" | undefined,
      ipAddress: getClientIP(req),
      userAgent: req.headers.get('user-agent') || undefined
    })

    // Rastrear métricas de performance
    logger.trackPerformance(
      req.nextUrl.pathname,
      req.method,
      duration,
      statusCode,
      userId
    )

    // Adicionar headers de resposta para debugging
    response.headers.set('x-request-id', requestId)
    response.headers.set('x-response-time', `${duration}ms`)

    return response
  }
}

/**
 * Gerar ID único para requisição
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Extrair IP do cliente
 */
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')
  // const clientIP = req.ip // Não disponível no NextRequest
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return realIP || 'unknown'
}

/**
 * Wrapper específico para APIs do Next.js
 */
export function withAPILogging(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return withLogging(async (req, context) => {
    return await handler(req)
  })
}

/**
 * Helper para adicionar contexto de usuário em APIs
 */
export async function addUserContext(req: NextRequest, userId: string, userType: string, organizationId?: string) {
  // Simular headers para o middleware
  req.headers.set('x-user-id', userId)
  req.headers.set('x-user-type', userType)
  if (organizationId) {
    req.headers.set('x-organization-id', organizationId)
  }
}


