/**
 * Legal API Provider Configuration
 */

import { ApiProvider, ApiProviderConfig } from './types';

export const API_PROVIDER_CONFIGS: Record<ApiProvider, ApiProviderConfig> = {
  [ApiProvider.ESCAVADOR]: {
    name: 'Escavador',
    apiKey: process.env.ESCAVADOR_API_KEY || '',
    baseUrl: 'https://api.escavador.com/v2',
    rateLimit: {
      requests: 100,
      period: 60000, // 1 minute
    },
    pricing: {
      // Real Escavador pricing in BRL
      processSearch: 3.00,      // "Capa do processo" or "Movimentações do processo"
      personSearch: 3.00,       // "Processos do envolvido" or "Resumo do envolvido"
      documentDownload: 0.06,   // "Documentos Públicos"
      movementTracking: 3.00,   // "Movimentações do processo"
      // Additional operations
      processUpdate: 3.00,      // "Atualização do processo no tribunal"
      processUpdateWithDocs: 0.20, // "Atualização com documentos públicos"
      aiSummary: 0.08,         // "Atualizar resumo por IA"
      monitoring: 3.00,        // Per month for monitoring
    },
    features: {
      processSearch: true,
      personSearch: true,
      documentDownload: true,
      movementTracking: true,
      bulkSearch: true,
      webhook: false,
      aiSummary: true,
      monitoring: true,
    },
    reliability: 95, // 95% uptime
    averageResponseTime: 800, // 800ms average
  },
  
  [ApiProvider.SOLUCIONARE]: {
    name: 'Solucionare',
    apiKey: process.env.SOLUCIONARE_API_TOKEN || '',
    apiSecret: process.env.SOLUCIONARE_API_SECRET || '',
    baseUrl: 'http://online.solucionarelj.com.br:9090',
    rateLimit: {
      requests: 200,
      period: 60000, // 1 minute
    },
    pricing: {
      // Solucionare uses subscription model, not per-request pricing
      // These are estimated equivalent costs based on usage volume
      processSearch: 0,         // Included in subscription (Andamentos API)
      personSearch: 0,          // Included in subscription (BigData API)
      documentDownload: 0,      // Included in subscription
      movementTracking: 0,      // Included in subscription (Andamentos API)
      // Subscription services
      publicationMonitoring: 0, // Publicação API - subscription based
      intimationTracking: 0,    // Intimações API - subscription based
      distributionTracking: 0,  // Distribuição API - subscription based
    },
    features: {
      processSearch: true,
      personSearch: true,
      documentDownload: true,
      movementTracking: true,
      bulkSearch: true,
      webhook: true,
      publicationMonitoring: true,
      intimationTracking: true,
      distributionTracking: true,
      bigDataAccess: true,
    },
    reliability: 98, // Higher reliability based on infrastructure
    averageResponseTime: 600, // Faster response times
  },
};

// Provider preference scoring weights
// IMPORTANT: Solucionare has subscription model (fixed cost), Escavador is pay-per-use
// This dramatically changes the cost calculation - Solucionare is MUCH cheaper for volume
export const SCORING_WEIGHTS = {
  price: 0.6,        // 60% weight on price (increased due to huge difference)
  reliability: 0.2,  // 20% weight on reliability
  speed: 0.1,        // 10% weight on speed
  features: 0.1,     // 10% weight on features
};

// Cache configuration
export const CACHE_CONFIG = {
  defaultTTL: 3600,        // 1 hour default cache
  processSearchTTL: 7200,  // 2 hours for process search
  personSearchTTL: 86400,  // 24 hours for person search
  documentTTL: 604800,     // 7 days for documents
  movementTTL: 1800,       // 30 minutes for movements
};

// Fallback configuration
export const FALLBACK_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,      // 1 second initial delay
  backoffMultiplier: 2,  // Double delay each retry
  timeoutMs: 30000,      // 30 second timeout
};

// Cost alert thresholds
export const COST_ALERTS = {
  dailyLimit: 1000,      // BRL 1000 per day
  hourlyLimit: 100,      // BRL 100 per hour
  singleOperationLimit: 50, // BRL 50 per operation
};

// Provider health check intervals
export const HEALTH_CHECK_CONFIG = {
  interval: 300000,      // Check every 5 minutes
  timeout: 5000,         // 5 second timeout for health checks
  unhealthyThreshold: 3, // Mark unhealthy after 3 failed checks
  healthyThreshold: 2,   // Mark healthy after 2 successful checks
};
