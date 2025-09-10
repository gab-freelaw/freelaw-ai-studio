/**
 * Metrics Collector for API Usage Tracking
 */

import { ApiProvider, ApiUsageMetrics } from './types';

interface MetricsSummary {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalCost: number;
  averageResponseTime: number;
  cacheHitRate: number;
}

export class MetricsCollector {
  private metrics: ApiUsageMetrics[] = [];
  private cacheHits: Map<string, number> = new Map();
  private cacheMisses: Map<string, number> = new Map();
  private maxMetricsSize = 10000; // Keep last 10,000 metrics
  
  /**
   * Record an API call
   */
  recordApiCall(
    provider: ApiProvider,
    operation: string,
    success: boolean,
    responseTime?: number,
    cost?: number
  ): void {
    const metric: ApiUsageMetrics = {
      provider,
      endpoint: operation,
      timestamp: new Date(),
      responseTime: responseTime || 0,
      success,
      cost: cost || this.estimateOperationCost(provider, operation),
    };
    
    this.metrics.push(metric);
    
    // Trim metrics if too large
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics = this.metrics.slice(-this.maxMetricsSize);
    }
  }
  
  /**
   * Record a cache hit
   */
  recordCacheHit(operation: string): void {
    const current = this.cacheHits.get(operation) || 0;
    this.cacheHits.set(operation, current + 1);
  }
  
  /**
   * Record a cache miss
   */
  recordCacheMiss(operation: string): void {
    const current = this.cacheMisses.get(operation) || 0;
    this.cacheMisses.set(operation, current + 1);
  }
  
  /**
   * Get metrics for a specific provider
   */
  async getProviderMetrics(
    provider: ApiProvider,
    since?: Date
  ): Promise<ApiUsageMetrics[]> {
    let metrics = this.metrics.filter(m => m.provider === provider);
    
    if (since) {
      metrics = metrics.filter(m => m.timestamp >= since);
    }
    
    return metrics;
  }
  
  /**
   * Get metrics summary
   */
  async getMetricsSummary(
    provider?: ApiProvider,
    since?: Date
  ): Promise<MetricsSummary> {
    let metrics = this.metrics;
    
    if (provider) {
      metrics = metrics.filter(m => m.provider === provider);
    }
    
    if (since) {
      metrics = metrics.filter(m => m.timestamp >= since);
    }
    
    const totalCalls = metrics.length;
    const successfulCalls = metrics.filter(m => m.success).length;
    const failedCalls = totalCalls - successfulCalls;
    const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0);
    const totalResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0);
    const averageResponseTime = totalCalls > 0 ? totalResponseTime / totalCalls : 0;
    
    // Calculate cache hit rate
    const totalHits = Array.from(this.cacheHits.values()).reduce((sum, hits) => sum + hits, 0);
    const totalMisses = Array.from(this.cacheMisses.values()).reduce((sum, misses) => sum + misses, 0);
    const cacheHitRate = totalHits + totalMisses > 0 
      ? (totalHits / (totalHits + totalMisses)) * 100 
      : 0;
    
    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      totalCost,
      averageResponseTime,
      cacheHitRate,
    };
  }
  
  /**
   * Get cost breakdown by provider
   */
  async getCostBreakdown(since?: Date): Promise<Record<string, number>> {
    let metrics = this.metrics;
    
    if (since) {
      metrics = metrics.filter(m => m.timestamp >= since);
    }
    
    const breakdown: Record<string, number> = {};
    
    for (const metric of metrics) {
      if (!breakdown[metric.provider]) {
        breakdown[metric.provider] = 0;
      }
      breakdown[metric.provider] += metric.cost;
    }
    
    return breakdown;
  }
  
  /**
   * Get operation statistics
   */
  async getOperationStats(since?: Date): Promise<Record<string, {
    count: number;
    successRate: number;
    averageResponseTime: number;
    totalCost: number;
  }>> {
    let metrics = this.metrics;
    
    if (since) {
      metrics = metrics.filter(m => m.timestamp >= since);
    }
    
    const stats: Record<string, any> = {};
    
    for (const metric of metrics) {
      if (!stats[metric.endpoint]) {
        stats[metric.endpoint] = {
          count: 0,
          successful: 0,
          totalResponseTime: 0,
          totalCost: 0,
        };
      }
      
      stats[metric.endpoint].count++;
      if (metric.success) {
        stats[metric.endpoint].successful++;
      }
      stats[metric.endpoint].totalResponseTime += metric.responseTime;
      stats[metric.endpoint].totalCost += metric.cost;
    }
    
    // Calculate final stats
    const finalStats: Record<string, any> = {};
    
    for (const [operation, data] of Object.entries(stats)) {
      finalStats[operation] = {
        count: data.count,
        successRate: (data.successful / data.count) * 100,
        averageResponseTime: data.totalResponseTime / data.count,
        totalCost: data.totalCost,
      };
    }
    
    return finalStats;
  }
  
  /**
   * Get error rate by provider
   */
  async getErrorRates(since?: Date): Promise<Record<string, number>> {
    let metrics = this.metrics;
    
    if (since) {
      metrics = metrics.filter(m => m.timestamp >= since);
    }
    
    const providerStats: Record<string, { total: number; failed: number }> = {};
    
    for (const metric of metrics) {
      if (!providerStats[metric.provider]) {
        providerStats[metric.provider] = { total: 0, failed: 0 };
      }
      
      providerStats[metric.provider].total++;
      if (!metric.success) {
        providerStats[metric.provider].failed++;
      }
    }
    
    const errorRates: Record<string, number> = {};
    
    for (const [provider, stats] of Object.entries(providerStats)) {
      errorRates[provider] = (stats.failed / stats.total) * 100;
    }
    
    return errorRates;
  }
  
  /**
   * Get hourly usage pattern
   */
  async getHourlyUsagePattern(days: number = 7): Promise<Record<number, {
    averageCalls: number;
    averageCost: number;
  }>> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const metrics = this.metrics.filter(m => m.timestamp >= since);
    
    const hourlyData: Record<number, { calls: number[]; costs: number[] }> = {};
    
    // Initialize hourly buckets
    for (let hour = 0; hour < 24; hour++) {
      hourlyData[hour] = { calls: [], costs: [] };
    }
    
    // Group metrics by day and hour
    const dailyHourly: Record<string, Record<number, { calls: number; cost: number }>> = {};
    
    for (const metric of metrics) {
      const date = metric.timestamp.toISOString().split('T')[0];
      const hour = metric.timestamp.getHours();
      
      if (!dailyHourly[date]) {
        dailyHourly[date] = {};
        for (let h = 0; h < 24; h++) {
          dailyHourly[date][h] = { calls: 0, cost: 0 };
        }
      }
      
      dailyHourly[date][hour].calls++;
      dailyHourly[date][hour].cost += metric.cost;
    }
    
    // Calculate averages
    const pattern: Record<number, { averageCalls: number; averageCost: number }> = {};
    
    for (let hour = 0; hour < 24; hour++) {
      const calls: number[] = [];
      const costs: number[] = [];
      
      for (const date of Object.keys(dailyHourly)) {
        calls.push(dailyHourly[date][hour].calls);
        costs.push(dailyHourly[date][hour].cost);
      }
      
      pattern[hour] = {
        averageCalls: calls.length > 0 ? calls.reduce((a, b) => a + b, 0) / calls.length : 0,
        averageCost: costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 0,
      };
    }
    
    return pattern;
  }
  
  /**
   * Estimate operation cost
   */
  private estimateOperationCost(provider: ApiProvider, operation: string): number {
    // Default cost estimates by operation type
    const costMap: Record<string, Record<string, number>> = {
      [ApiProvider.ESCAVADOR]: {
        processSearch: 0.50,
        personSearch: 0.30,
        documentDownload: 0.20,
        movementTracking: 0.10,
      },
      [ApiProvider.SOLUCIONARE]: {
        processSearch: 0.40,
        personSearch: 0.25,
        documentDownload: 0.15,
        movementTracking: 0.08,
      },
    };
    
    return costMap[provider]?.[operation] || 0;
  }
  
  /**
   * Export metrics to CSV format
   */
  exportToCSV(since?: Date): string {
    let metrics = this.metrics;
    
    if (since) {
      metrics = metrics.filter(m => m.timestamp >= since);
    }
    
    const headers = ['Timestamp', 'Provider', 'Operation', 'Success', 'Response Time (ms)', 'Cost (BRL)'];
    const rows = metrics.map(m => [
      m.timestamp.toISOString(),
      m.provider,
      m.endpoint,
      m.success ? 'Yes' : 'No',
      m.responseTime.toString(),
      m.cost.toFixed(2),
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
  
  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.cacheHits.clear();
    this.cacheMisses.clear();
  }
}