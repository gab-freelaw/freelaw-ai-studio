/**
 * Smart API Provider Manager
 * Handles intelligent routing between multiple legal API providers
 */

import {
  LegalApiProvider,
  ApiProvider,
  ProviderSelectionStrategy,
  SearchOptions,
  ProcessSearchResult,
  PersonSearchResult,
  LegalDocument,
  ProcessMovement,
  ApiUsageMetrics,
  ProviderHealthStatus,
} from './types';
import { EscavadorProvider } from './providers/escavador-provider';
import { SolucionareProvider } from './providers/solucionare-provider';
import { SCORING_WEIGHTS, COST_ALERTS, HEALTH_CHECK_CONFIG } from './config';
import { CacheManager } from './cache-manager';
import { MetricsCollector } from './metrics-collector';

export class SmartProviderSelectionStrategy implements ProviderSelectionStrategy {
  private metricsCollector: MetricsCollector;
  
  constructor(metricsCollector: MetricsCollector) {
    this.metricsCollector = metricsCollector;
  }
  
  async selectProvider(
    operation: string,
    providers: LegalApiProvider[],
    options?: SearchOptions
  ): Promise<LegalApiProvider> {
    // If user specified a preferred provider, try to use it if available
    if (options?.preferredProvider) {
      const preferred = providers.find(p => p.name === options.preferredProvider);
      if (preferred && await preferred.isAvailable()) {
        return preferred;
      }
    }
    
    // Filter available providers
    const availableProviders = await this.filterAvailableProviders(providers);
    
    if (availableProviders.length === 0) {
      throw new Error('No API providers are currently available');
    }
    
    if (availableProviders.length === 1) {
      return availableProviders[0];
    }
    
    // Score and rank providers
    const scoredProviders = await this.scoreProviders(
      availableProviders,
      operation,
      options
    );
    
    // Return the best provider
    return scoredProviders[0].provider;
  }
  
  private async filterAvailableProviders(
    providers: LegalApiProvider[]
  ): Promise<LegalApiProvider[]> {
    const availabilityChecks = await Promise.all(
      providers.map(async (provider) => ({
        provider,
        available: await provider.isAvailable(),
      }))
    );
    
    return availabilityChecks
      .filter(check => check.available)
      .map(check => check.provider);
  }
  
  private async scoreProviders(
    providers: LegalApiProvider[],
    operation: string,
    options?: SearchOptions
  ): Promise<Array<{ provider: LegalApiProvider; score: number }>> {
    const scores = await Promise.all(
      providers.map(async (provider) => {
        const score = await this.calculateProviderScore(provider, operation, options);
        return { provider, score };
      })
    );
    
    // Sort by score (higher is better)
    return scores.sort((a, b) => b.score - a.score);
  }
  
  private async calculateProviderScore(
    provider: LegalApiProvider,
    operation: string,
    options?: SearchOptions
  ): Promise<number> {
    const health = await provider.checkHealth();
    const cost = provider.estimateCost(operation);
    const recentMetrics = await this.metricsCollector.getProviderMetrics(
      provider.name,
      new Date(Date.now() - 3600000) // Last hour
    );
    
    let score = 0;
    
    // Price score (lower is better, max 100 points)
    const maxCost = options?.maxCost || COST_ALERTS.singleOperationLimit;
    const priceScore = Math.max(0, 100 * (1 - cost / maxCost));
    score += priceScore * SCORING_WEIGHTS.price;
    
    // Reliability score (based on success rate)
    const reliabilityScore = health.successRate;
    score += reliabilityScore * SCORING_WEIGHTS.reliability;
    
    // Speed score (faster is better, max 100 points)
    const maxResponseTime = options?.maxResponseTime || 5000;
    const speedScore = Math.max(0, 100 * (1 - health.averageResponseTime / maxResponseTime));
    score += speedScore * SCORING_WEIGHTS.speed;
    
    // Features score (check if provider supports required features)
    const featureScore = this.calculateFeatureScore(provider, operation);
    score += featureScore * SCORING_WEIGHTS.features;
    
    // Bonus for recent successful operations
    if (recentMetrics.length > 0) {
      const recentSuccessRate = recentMetrics.filter(m => m.success).length / recentMetrics.length;
      score += recentSuccessRate * 10; // Bonus points
    }
    
    // Penalty for being close to credit limit
    if (health.currentCredits !== undefined && health.creditLimit !== undefined) {
      const creditUsage = health.currentCredits / health.creditLimit;
      if (creditUsage < 0.1) {
        score *= 0.5; // 50% penalty if less than 10% credits remaining
      }
    }
    
    return score;
  }
  
  private calculateFeatureScore(provider: LegalApiProvider, operation: string): number {
    const features = provider.config.features;
    let score = 100; // Start with full score
    
    switch (operation) {
      case 'processSearch':
        if (!features.processSearch) return 0;
        break;
      case 'personSearch':
        if (!features.personSearch) return 0;
        break;
      case 'documentDownload':
        if (!features.documentDownload) return 0;
        break;
      case 'movementTracking':
        if (!features.movementTracking) return 0;
        if (features.webhook) score += 20; // Bonus for webhook support
        break;
    }
    
    return score;
  }
}

export class LegalApiProviderManager {
  private providers: Map<ApiProvider, LegalApiProvider> = new Map();
  private selectionStrategy: ProviderSelectionStrategy;
  private cacheManager: CacheManager;
  private metricsCollector: MetricsCollector;
  private healthCheckInterval?: NodeJS.Timeout;
  
  constructor() {
    // Initialize providers
    this.providers.set(ApiProvider.ESCAVADOR, new EscavadorProvider());
    this.providers.set(ApiProvider.SOLUCIONARE, new SolucionareProvider());
    
    // Initialize supporting services
    this.cacheManager = new CacheManager();
    this.metricsCollector = new MetricsCollector();
    this.selectionStrategy = new SmartProviderSelectionStrategy(this.metricsCollector);
    
    // Start health monitoring
    this.startHealthMonitoring();
  }
  
  /**
   * Search for a legal process with automatic provider selection
   */
  async searchProcess(
    processNumber: string,
    options?: SearchOptions
  ): Promise<ProcessSearchResult> {
    // Check cache first
    if (options?.cacheEnabled !== false) {
      const cached = await this.cacheManager.get<ProcessSearchResult>(
        `process:${processNumber}`
      );
      if (cached) {
        this.metricsCollector.recordCacheHit('processSearch');
        return cached;
      }
    }
    
    const provider = await this.selectProvider('processSearch', options);
    
    try {
      const result = await provider.searchProcess(processNumber, options);
      
      // Cache the result
      if (options?.cacheEnabled !== false) {
        await this.cacheManager.set(
          `process:${processNumber}`,
          result,
          options?.cacheDuration
        );
      }
      
      // Record metrics
      this.metricsCollector.recordApiCall(provider.name, 'processSearch', true);
      
      return result;
    } catch (error) {
      // Record failure
      this.metricsCollector.recordApiCall(provider.name, 'processSearch', false);
      
      // Try fallback if enabled
      if (options?.fallbackEnabled !== false) {
        return this.searchProcessWithFallback(processNumber, options, provider.name);
      }
      
      throw error;
    }
  }
  
  /**
   * Search for a person with automatic provider selection
   */
  async searchPerson(
    document: string,
    options?: SearchOptions
  ): Promise<PersonSearchResult> {
    // Check cache first
    if (options?.cacheEnabled !== false) {
      const cached = await this.cacheManager.get<PersonSearchResult>(
        `person:${document}`
      );
      if (cached) {
        this.metricsCollector.recordCacheHit('personSearch');
        return cached;
      }
    }
    
    const provider = await this.selectProvider('personSearch', options);
    
    try {
      const result = await provider.searchPerson(document, options);
      
      // Cache the result
      if (options?.cacheEnabled !== false) {
        await this.cacheManager.set(
          `person:${document}`,
          result,
          options?.cacheDuration
        );
      }
      
      // Record metrics
      this.metricsCollector.recordApiCall(provider.name, 'personSearch', true);
      
      return result;
    } catch (error) {
      // Record failure
      this.metricsCollector.recordApiCall(provider.name, 'personSearch', false);
      
      // Try fallback if enabled
      if (options?.fallbackEnabled !== false) {
        return this.searchPersonWithFallback(document, options, provider.name);
      }
      
      throw error;
    }
  }
  
  /**
   * Get a document with automatic provider selection
   */
  async getDocument(
    documentId: string,
    options?: SearchOptions
  ): Promise<LegalDocument> {
    // Check cache first
    if (options?.cacheEnabled !== false) {
      const cached = await this.cacheManager.get<LegalDocument>(
        `document:${documentId}`
      );
      if (cached) {
        this.metricsCollector.recordCacheHit('documentDownload');
        return cached;
      }
    }
    
    const provider = await this.selectProvider('documentDownload', options);
    const result = await provider.getDocument(documentId, options);
    
    // Cache the result (documents are cached longer)
    if (options?.cacheEnabled !== false) {
      await this.cacheManager.set(
        `document:${documentId}`,
        result,
        options?.cacheDuration || 604800 // 7 days default for documents
      );
    }
    
    return result;
  }
  
  /**
   * Track movements with automatic provider selection
   */
  async trackMovements(
    processId: string,
    since?: Date,
    options?: SearchOptions
  ): Promise<ProcessMovement[]> {
    const provider = await this.selectProvider('movementTracking', options);
    return provider.trackMovements(processId, since);
  }
  
  /**
   * Get usage metrics for all providers
   */
  async getUsageMetrics(since?: Date): Promise<ApiUsageMetrics[]> {
    const allMetrics: ApiUsageMetrics[] = [];
    
    for (const provider of this.providers.values()) {
      const metrics = await provider.getUsageMetrics(since);
      allMetrics.push(...metrics);
    }
    
    return allMetrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  /**
   * Get health status for all providers
   */
  async getHealthStatus(): Promise<ProviderHealthStatus[]> {
    const statuses: ProviderHealthStatus[] = [];
    
    for (const provider of this.providers.values()) {
      const status = await provider.checkHealth();
      statuses.push(status);
    }
    
    return statuses;
  }
  
  /**
   * Get cost summary
   */
  async getCostSummary(period: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<{
    total: number;
    byProvider: Record<string, number>;
    byOperation: Record<string, number>;
    alerts: string[];
  }> {
    const now = Date.now();
    const periodMs = {
      hour: 3600000,
      day: 86400000,
      week: 604800000,
      month: 2592000000,
    }[period];
    
    const since = new Date(now - periodMs);
    const metrics = await this.getUsageMetrics(since);
    
    const summary = {
      total: 0,
      byProvider: {} as Record<string, number>,
      byOperation: {} as Record<string, number>,
      alerts: [] as string[],
    };
    
    for (const metric of metrics) {
      summary.total += metric.cost;
      
      // By provider
      if (!summary.byProvider[metric.provider]) {
        summary.byProvider[metric.provider] = 0;
      }
      summary.byProvider[metric.provider] += metric.cost;
      
      // By operation
      const operation = metric.endpoint.split('/').pop() || 'unknown';
      if (!summary.byOperation[operation]) {
        summary.byOperation[operation] = 0;
      }
      summary.byOperation[operation] += metric.cost;
    }
    
    // Check for cost alerts
    if (period === 'day' && summary.total > COST_ALERTS.dailyLimit) {
      summary.alerts.push(`Daily cost limit exceeded: R$ ${summary.total.toFixed(2)}`);
    }
    if (period === 'hour' && summary.total > COST_ALERTS.hourlyLimit) {
      summary.alerts.push(`Hourly cost limit exceeded: R$ ${summary.total.toFixed(2)}`);
    }
    
    return summary;
  }
  
  /**
   * Select the best provider for an operation
   */
  private async selectProvider(
    operation: string,
    options?: SearchOptions
  ): Promise<LegalApiProvider> {
    const providers = Array.from(this.providers.values());
    return this.selectionStrategy.selectProvider(operation, providers, options);
  }
  
  /**
   * Fallback search for process
   */
  private async searchProcessWithFallback(
    processNumber: string,
    options: SearchOptions | undefined,
    failedProvider: ApiProvider
  ): Promise<ProcessSearchResult> {
    const providers = Array.from(this.providers.values())
      .filter(p => p.name !== failedProvider);
    
    for (const provider of providers) {
      try {
        if (await provider.isAvailable()) {
          const result = await provider.searchProcess(processNumber, options);
          this.metricsCollector.recordApiCall(provider.name, 'processSearch', true);
          return result;
        }
      } catch (error) {
        this.metricsCollector.recordApiCall(provider.name, 'processSearch', false);
        continue;
      }
    }
    
    throw new Error('All API providers failed to search process');
  }
  
  /**
   * Fallback search for person
   */
  private async searchPersonWithFallback(
    document: string,
    options: SearchOptions | undefined,
    failedProvider: ApiProvider
  ): Promise<PersonSearchResult> {
    const providers = Array.from(this.providers.values())
      .filter(p => p.name !== failedProvider);
    
    for (const provider of providers) {
      try {
        if (await provider.isAvailable()) {
          const result = await provider.searchPerson(document, options);
          this.metricsCollector.recordApiCall(provider.name, 'personSearch', true);
          return result;
        }
      } catch (error) {
        this.metricsCollector.recordApiCall(provider.name, 'personSearch', false);
        continue;
      }
    }
    
    throw new Error('All API providers failed to search person');
  }
  
  /**
   * Start health monitoring for all providers
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      for (const provider of this.providers.values()) {
        try {
          await provider.checkHealth();
        } catch (error) {
          console.error(`Health check failed for ${provider.name}:`, error);
        }
      }
    }, HEALTH_CHECK_CONFIG.interval);
  }
  
  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }
  
  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.stopHealthMonitoring();
    await this.cacheManager.clear();
  }
}