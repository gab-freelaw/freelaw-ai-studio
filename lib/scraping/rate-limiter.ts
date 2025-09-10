// Rate Limiter para scraping
// Previne bloqueios por excesso de requisições

export interface RateLimitConfig {
  windowMs: number // Janela de tempo em milissegundos
  maxRequests: number // Máximo de requisições por janela
  keyGenerator?: (req: any) => string // Função para gerar chave única
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  error?: string
}

export class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: 60 * 1000, // 1 minuto por padrão
      maxRequests: 5, // 5 requisições por padrão
      ...config
    }
  }

  checkLimit(key: string): RateLimitResult {
    const now = Date.now()
    const windowStart = now - this.config.windowMs
    
    // Obter requisições existentes para esta chave
    const existingRequests = this.requests.get(key) || []
    
    // Filtrar apenas requisições dentro da janela de tempo
    const recentRequests = existingRequests.filter(time => time > windowStart)
    
    // Verificar se excedeu o limite
    if (recentRequests.length >= this.config.maxRequests) {
      const oldestRequest = Math.min(...recentRequests)
      const resetTime = oldestRequest + this.config.windowMs
      
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        error: `Rate limit excedido. Máximo ${this.config.maxRequests} requisições por ${this.config.windowMs / 1000} segundos.`
      }
    }
    
    // Adicionar nova requisição
    recentRequests.push(now)
    this.requests.set(key, recentRequests)
    
    // Limpar requisições antigas periodicamente
    this.cleanup()
    
    return {
      allowed: true,
      remaining: this.config.maxRequests - recentRequests.length,
      resetTime: now + this.config.windowMs
    }
  }

  private cleanup(): void {
    const now = Date.now()
    const cutoff = now - (this.config.windowMs * 2) // Manter histórico de 2x a janela
    
    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => time > cutoff)
      
      if (validRequests.length === 0) {
        this.requests.delete(key)
      } else {
        this.requests.set(key, validRequests)
      }
    }
  }

  reset(key?: string): void {
    if (key) {
      this.requests.delete(key)
    } else {
      this.requests.clear()
    }
  }

  getStats(): { totalKeys: number, totalRequests: number } {
    let totalRequests = 0
    
    for (const requests of this.requests.values()) {
      totalRequests += requests.length
    }
    
    return {
      totalKeys: this.requests.size,
      totalRequests
    }
  }
}

// Rate limiters específicos para cada serviço
export const linkedinRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 3 // Máximo 3 requisições por minuto para LinkedIn
})

export const lattesRateLimiter = new RateLimiter({
  windowMs: 30 * 1000, // 30 segundos
  maxRequests: 5 // Máximo 5 requisições por 30 segundos para Lattes
})

// Função utilitária para extrair IP da requisição
export function getClientIP(request: any): string {
  // Tentar várias fontes de IP
  const forwarded = request.headers?.['x-forwarded-for']
  const realIP = request.headers?.['x-real-ip']
  const remoteAddr = request.connection?.remoteAddress || request.socket?.remoteAddress
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (remoteAddr) {
    return remoteAddr
  }
  
  return 'unknown'
}

// Função para gerar chave única baseada em IP + User Agent
export function generateRateLimitKey(request: any): string {
  const ip = getClientIP(request)
  const userAgent = request.headers?.['user-agent'] || 'unknown'
  
  // Criar hash simples para anonimizar
  const combined = `${ip}-${userAgent}`
  let hash = 0
  
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Converter para 32bit
  }
  
  return `user_${Math.abs(hash)}`
}
