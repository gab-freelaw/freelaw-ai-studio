/**
 * Cache Manager for Legal API Responses
 */

import { CACHE_CONFIG } from './config';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval?: NodeJS.Timeout;
  
  constructor() {
    // Start periodic cleanup
    this.startCleanup();
  }
  
  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if cache is expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  /**
   * Set cache data
   */
  async set<T>(key: string, data: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds || this.getDefaultTTL(key);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }
  
  /**
   * Delete specific cache entry
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }
  
  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }
  
  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    keys: string[];
    memoryUsage: number;
  } {
    const keys = Array.from(this.cache.keys());
    
    // Rough estimation of memory usage
    let memoryUsage = 0;
    for (const entry of this.cache.values()) {
      memoryUsage += JSON.stringify(entry.data).length;
    }
    
    return {
      size: this.cache.size,
      keys,
      memoryUsage,
    };
  }
  
  /**
   * Get default TTL based on key pattern
   */
  private getDefaultTTL(key: string): number {
    if (key.startsWith('process:')) {
      return CACHE_CONFIG.processSearchTTL;
    }
    if (key.startsWith('person:')) {
      return CACHE_CONFIG.personSearchTTL;
    }
    if (key.startsWith('document:')) {
      return CACHE_CONFIG.documentTTL;
    }
    if (key.startsWith('movement:')) {
      return CACHE_CONFIG.movementTTL;
    }
    
    return CACHE_CONFIG.defaultTTL;
  }
  
  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 60000); // Run every minute
  }
  
  /**
   * Clean up expired cache entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
    
    if (keysToDelete.length > 0) {
      console.log(`Cache cleanup: removed ${keysToDelete.length} expired entries`);
    }
  }
  
  /**
   * Stop cleanup interval
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }
}