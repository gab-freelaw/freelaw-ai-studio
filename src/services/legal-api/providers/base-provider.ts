/**
 * Base Legal API Provider Implementation
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { 
  LegalApiProvider, 
  ApiProvider, 
  ApiProviderConfig,
  ApiUsageMetrics,
  ProviderHealthStatus,
  ProcessSearchResult,
  PersonSearchResult,
  LegalDocument,
  ProcessMovement,
  SearchOptions
} from '../types';
import { FALLBACK_CONFIG } from '../config';

export abstract class BaseApiProvider implements LegalApiProvider {
  abstract readonly name: ApiProvider;
  abstract readonly config: ApiProviderConfig;
  
  protected client: AxiosInstance;
  protected metrics: ApiUsageMetrics[] = [];
  protected healthStatus: ProviderHealthStatus;
  protected rateLimitTokens: number;
  protected lastRateLimitReset: number;
  
  constructor(config: ApiProviderConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: FALLBACK_CONFIG.timeoutMs,
      headers: this.getDefaultHeaders(),
    });
    
    this.rateLimitTokens = config.rateLimit?.requests || Infinity;
    this.lastRateLimitReset = Date.now();
    
    this.healthStatus = {
      provider: this.name,
      isHealthy: true,
      lastCheck: new Date(),
      averageResponseTime: config.averageResponseTime,
      successRate: 100,
    };
    
    this.setupInterceptors();
  }
  
  protected abstract getDefaultHeaders(): Record<string, string>;
  
  /**
   * Setup axios interceptors for metrics and error handling
   */
  private setupInterceptors(): void {
    // Request interceptor for rate limiting
    this.client.interceptors.request.use(
      async (config) => {
        await this.enforceRateLimit();
        const startTime = Date.now();
        config.metadata = { startTime };
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor for metrics
    this.client.interceptors.response.use(
      (response) => {
        const endTime = Date.now();
        const startTime = response.config.metadata?.startTime || endTime;
        const responseTime = endTime - startTime;
        
        this.recordMetric({
          provider: this.name,
          endpoint: response.config.url || '',
          timestamp: new Date(),
          responseTime,
          success: true,
          cost: this.calculateCost(response.config.url || ''),
        });
        
        return response;
      },
      (error: AxiosError) => {
        const endTime = Date.now();
        const startTime = error.config?.metadata?.startTime || endTime;
        const responseTime = endTime - startTime;
        
        this.recordMetric({
          provider: this.name,
          endpoint: error.config?.url || '',
          timestamp: new Date(),
          responseTime,
          success: false,
          cost: 0,
          error: error.message,
        });
        
        return Promise.reject(this.transformError(error));
      }
    );
  }
  
  /**
   * Enforce rate limiting
   */
  private async enforceRateLimit(): Promise<void> {
    if (!this.config.rateLimit) return;
    
    const now = Date.now();
    const timeSinceReset = now - this.lastRateLimitReset;
    
    if (timeSinceReset >= this.config.rateLimit.period) {
      this.rateLimitTokens = this.config.rateLimit.requests;
      this.lastRateLimitReset = now;
    }
    
    if (this.rateLimitTokens <= 0) {
      const waitTime = this.config.rateLimit.period - timeSinceReset;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.rateLimitTokens = this.config.rateLimit.requests;
      this.lastRateLimitReset = Date.now();
    }
    
    this.rateLimitTokens--;
  }
  
  /**
   * Calculate cost for an operation
   */
  protected calculateCost(endpoint: string): number {
    if (endpoint.includes('/process')) return this.config.pricing.processSearch;
    if (endpoint.includes('/person')) return this.config.pricing.personSearch;
    if (endpoint.includes('/document')) return this.config.pricing.documentDownload;
    if (endpoint.includes('/movement')) return this.config.pricing.movementTracking;
    return 0;
  }
  
  /**
   * Transform API errors to standard format
   */
  protected transformError(error: AxiosError): Error {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;
      
      if (status === 401) {
        return new Error(`Authentication failed for ${this.name}: Invalid API credentials`);
      }
      if (status === 429) {
        return new Error(`Rate limit exceeded for ${this.name}`);
      }
      if (status === 402) {
        return new Error(`Insufficient credits for ${this.name}`);
      }
      if (status >= 500) {
        return new Error(`${this.name} service unavailable: ${data?.message || 'Server error'}`);
      }
      
      return new Error(`${this.name} API error: ${data?.message || error.message}`);
    }
    
    if (error.code === 'ECONNABORTED') {
      return new Error(`Request to ${this.name} timed out`);
    }
    
    return new Error(`Network error connecting to ${this.name}: ${error.message}`);
  }
  
  /**
   * Record usage metrics
   */
  protected recordMetric(metric: ApiUsageMetrics): void {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
    
    // Update health status
    this.updateHealthStatus();
  }
  
  /**
   * Update provider health status based on recent metrics
   */
  private updateHealthStatus(): void {
    const recentMetrics = this.metrics.filter(
      m => m.timestamp.getTime() > Date.now() - 300000 // Last 5 minutes
    );
    
    if (recentMetrics.length === 0) return;
    
    const successCount = recentMetrics.filter(m => m.success).length;
    const totalResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0);
    
    this.healthStatus = {
      provider: this.name,
      isHealthy: successCount / recentMetrics.length >= 0.8, // 80% success rate
      lastCheck: new Date(),
      averageResponseTime: totalResponseTime / recentMetrics.length,
      successRate: (successCount / recentMetrics.length) * 100,
    };
  }
  
  /**
   * Retry logic with exponential backoff
   */
  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = FALLBACK_CONFIG.maxRetries
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (i < maxRetries - 1) {
          const delay = FALLBACK_CONFIG.retryDelay * Math.pow(FALLBACK_CONFIG.backoffMultiplier, i);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Operation failed after retries');
  }
  
  // Abstract methods to be implemented by specific providers
  abstract searchProcess(processNumber: string, options?: SearchOptions): Promise<ProcessSearchResult>;
  abstract searchPerson(document: string, options?: SearchOptions): Promise<PersonSearchResult>;
  abstract getDocument(documentId: string, options?: SearchOptions): Promise<LegalDocument>;
  abstract trackMovements(processId: string, since?: Date): Promise<ProcessMovement[]>;
  abstract getRemainingCredits(): Promise<number>;
  
  /**
   * Check provider health
   */
  async checkHealth(): Promise<ProviderHealthStatus> {
    try {
      // Try a lightweight operation to check if API is responding
      const startTime = Date.now();
      await this.getRemainingCredits();
      const responseTime = Date.now() - startTime;
      
      this.healthStatus.isHealthy = true;
      this.healthStatus.lastCheck = new Date();
      this.healthStatus.averageResponseTime = 
        (this.healthStatus.averageResponseTime + responseTime) / 2;
      
    } catch (error) {
      this.healthStatus.isHealthy = false;
      this.healthStatus.lastCheck = new Date();
    }
    
    return this.healthStatus;
  }
  
  /**
   * Get usage metrics
   */
  async getUsageMetrics(since?: Date): Promise<ApiUsageMetrics[]> {
    if (!since) {
      return this.metrics;
    }
    
    return this.metrics.filter(m => m.timestamp >= since);
  }
  
  /**
   * Estimate cost for an operation
   */
  estimateCost(operation: string, quantity: number = 1): number {
    const pricing = this.config.pricing;
    
    switch (operation) {
      case 'processSearch':
        return pricing.processSearch * quantity;
      case 'personSearch':
        return pricing.personSearch * quantity;
      case 'documentDownload':
        return pricing.documentDownload * quantity;
      case 'movementTracking':
        return pricing.movementTracking * quantity;
      default:
        return 0;
    }
  }
  
  /**
   * Check if provider is available
   */
  async isAvailable(): Promise<boolean> {
    if (!this.healthStatus.isHealthy) {
      return false;
    }
    
    try {
      const credits = await this.getRemainingCredits();
      return credits > 0;
    } catch {
      return false;
    }
  }
}