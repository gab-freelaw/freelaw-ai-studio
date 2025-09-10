import { createClient } from '@/lib/supabase/client'
import crypto from 'crypto'

interface CacheEntry {
  id: string
  cache_key: string
  service_type: string
  legal_area: string
  input_hash: string
  petition_text: string
  metadata: {
    model_used: string
    processing_time: number
    chunks_processed?: number
    office_style_applied?: boolean
    letterhead_applied?: boolean
  }
  hit_count: number
  last_accessed: string
  expires_at: string
  created_at: string
}

class PetitionCacheService {
  private readonly DEFAULT_TTL_HOURS = 72 // 3 days default
  private readonly MAX_CACHE_SIZE = 100 // Max entries per office

  private getSupabase() {
    return createClient()
  }

  /**
   * Generate cache key from request data
   */
  generateCacheKey(
    serviceType: string,
    legalArea: string,
    data: Record<string, any>,
    officeId?: string
  ): string {
    // Normalize and sort data for consistent hashing
    const normalizedData = this.normalizeData(data)
    const dataString = JSON.stringify({
      serviceType,
      legalArea,
      data: normalizedData,
      officeId
    })

    // Create hash
    return crypto
      .createHash('sha256')
      .update(dataString)
      .digest('hex')
  }

  /**
   * Get cached petition if exists and not expired
   */
  async getCachedPetition(
    cacheKey: string,
    officeId?: string
  ): Promise<CacheEntry | null> {
    try {
      let query = this.getSupabase()
        .from('petition_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (officeId) {
        query = (query as any).eq('office_id', officeId)
      }

      const { data, error } = await query

      if (error && error.code !== 'PGRST116') {
        console.error('Cache lookup error:', error)
        return null
      }

      if (data) {
        // Update hit count and last accessed asynchronously
        this.updateCacheStats(data.id).catch(console.error)
        return data
      }

      return null
    } catch (error) {
      console.error('Cache service error:', error)
      return null
    }
  }

  /**
   * Save petition to cache
   */
  async cachePetition(
    cacheKey: string,
    serviceType: string,
    legalArea: string,
    petitionText: string,
    metadata: CacheEntry['metadata'],
    officeId?: string,
    ttlHours: number = this.DEFAULT_TTL_HOURS
  ): Promise<void> {
    try {
      // Check cache size limit for office
      if (officeId) {
        await this.enforceOfficeCacheLimit(officeId)
      }

      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + ttlHours)

      const { error } = await this.getSupabase()
        .from('petition_cache')
        .upsert({
          cache_key: cacheKey,
          service_type: serviceType,
          legal_area: legalArea,
          office_id: officeId,
          input_hash: cacheKey, // Using same as cache_key for simplicity
          petition_text: petitionText,
          metadata: metadata,
          hit_count: 0,
          expires_at: expiresAt.toISOString()
        })

      if (error) {
        console.error('Cache save error:', error)
      }
    } catch (error) {
      console.error('Cache service error:', error)
    }
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache(): Promise<number> {
    try {
      const { data, error } = await this.getSupabase()
        .from('petition_cache')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id')

      if (error) {
        console.error('Clear cache error:', error)
        return 0
      }

      return data?.length || 0
    } catch (error) {
      console.error('Cache service error:', error)
      return 0
    }
  }

  /**
   * Clear cache for specific office
   */
  async clearOfficeCache(officeId: string): Promise<void> {
    try {
      const { error } = await this.getSupabase()
        .from('petition_cache')
        .delete()
        .eq('office_id', officeId)

      if (error) {
        console.error('Clear office cache error:', error)
      }
    } catch (error) {
      console.error('Cache service error:', error)
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(officeId?: string): Promise<{
    totalEntries: number
    totalHits: number
    avgProcessingTime: number
    cacheHitRate: number
    topTemplates: Array<{ type: string; area: string; hits: number }>
  }> {
    try {
      let query = this.getSupabase()
        .from('petition_cache')
        .select('service_type, legal_area, hit_count, metadata')

      if (officeId) {
        query = (query as any).eq('office_id', officeId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Cache stats error:', error)
        return {
          totalEntries: 0,
          totalHits: 0,
          avgProcessingTime: 0,
          cacheHitRate: 0,
          topTemplates: []
        }
      }

      if (!data || data.length === 0) {
        return {
          totalEntries: 0,
          totalHits: 0,
          avgProcessingTime: 0,
          cacheHitRate: 0,
          topTemplates: []
        }
      }

      const totalHits = data.reduce((sum, entry) => sum + (entry.hit_count || 0), 0)
      const avgProcessingTime = data.reduce((sum, entry) => {
        const time = (entry.metadata as any)?.processing_time || 0
        return sum + time
      }, 0) / data.length

      // Group by template type
      const templateGroups = data.reduce((groups, entry) => {
        const key = `${entry.service_type}:${entry.legal_area}`
        if (!groups[key]) {
          groups[key] = { 
            type: entry.service_type, 
            area: entry.legal_area, 
            hits: 0 
          }
        }
        groups[key].hits += entry.hit_count || 0
        return groups
      }, {} as Record<string, any>)

      const topTemplates = Object.values(templateGroups)
        .sort((a: any, b: any) => b.hits - a.hits)
        .slice(0, 5)

      return {
        totalEntries: data.length,
        totalHits,
        avgProcessingTime,
        cacheHitRate: totalHits / Math.max(1, data.length),
        topTemplates
      }
    } catch (error) {
      console.error('Cache service error:', error)
      return {
        totalEntries: 0,
        totalHits: 0,
        avgProcessingTime: 0,
        cacheHitRate: 0,
        topTemplates: []
      }
    }
  }

  // Private helper methods

  private normalizeData(data: Record<string, any>): Record<string, any> {
    const normalized: Record<string, any> = {}
    
    // Sort keys alphabetically
    const sortedKeys = Object.keys(data).sort()
    
    for (const key of sortedKeys) {
      const value = data[key]
      
      // Normalize values
      if (typeof value === 'string') {
        // Trim and lowercase for comparison
        normalized[key] = value.trim().toLowerCase()
      } else if (Array.isArray(value)) {
        // Sort arrays for consistent hashing
        normalized[key] = value.sort()
      } else if (value !== null && value !== undefined) {
        normalized[key] = value
      }
    }

    return normalized
  }

  private async updateCacheStats(cacheId: string): Promise<void> {
    try {
      await this.getSupabase()
        .from('petition_cache')
        .update({
          hit_count: 1, // Simplificado para evitar erro SQL
          last_accessed: new Date().toISOString()
        })
        .eq('id', cacheId)
    } catch (error) {
      console.error('Update cache stats error:', error)
    }
  }

  private async enforceOfficeCacheLimit(officeId: string): Promise<void> {
    try {
      // Count current entries
      const { count } = await this.getSupabase()
        .from('petition_cache')
        .select('*', { count: 'exact', head: true })
        .eq('office_id', officeId)

      if (count && count >= this.MAX_CACHE_SIZE) {
        // Delete oldest entries (by last_accessed)
        const toDelete = count - this.MAX_CACHE_SIZE + 1
        
        const { data: oldestEntries } = await this.getSupabase()
          .from('petition_cache')
          .select('id')
          .eq('office_id', officeId)
          .order('last_accessed', { ascending: true })
          .limit(toDelete)

        if (oldestEntries && oldestEntries.length > 0) {
          const idsToDelete = oldestEntries.map(e => e.id)
          await this.getSupabase()
            .from('petition_cache')
            .delete()
            .in('id', idsToDelete)
        }
      }
    } catch (error) {
      console.error('Enforce cache limit error:', error)
    }
  }

  /**
   * Warm up cache with common templates
   */
  async warmUpCache(officeId: string): Promise<void> {
    // This could pre-generate common petition types
    // Implementation depends on business logic
    console.log('Cache warm-up not implemented yet')
  }
}

export const petitionCacheService = new PetitionCacheService()