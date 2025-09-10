import { createClient } from '@/lib/supabase/server'

export interface MatchingCriteria {
  legalArea: string
  serviceType: string
  urgency: 'low' | 'medium' | 'high' | 'urgent'
  requiredExperience: 'junior' | 'pleno' | 'senior' | 'especialista'
  estimatedHours?: number
  deadline?: string
  complexity?: 'simple' | 'medium' | 'complex' | 'very_complex'
  preferredProviders?: string[] // IDs de prestadores preferidos
}

export interface ProviderMatch {
  providerId: string
  providerName: string
  experience: string
  specialties: string[]
  qualityRating: number
  totalJobs: number
  completedJobs: number
  onTimeRate: number
  averageRating: number
  matchScore: number
  availability: string
  estimatedPrice: number
  reasons: string[]
  warnings: string[]
}

export interface MatchingResult {
  totalCandidates: number
  matches: ProviderMatch[]
  bestMatch?: ProviderMatch
  averageScore: number
  criteria: MatchingCriteria
}

export class MatchingService {
  private supabase: any

  constructor() {
  }

  async initializeSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
  }

  /**
   * Calcular preço simples baseado em critérios básicos
   */
  private calculateSimplePrice(
    serviceType: string,
    legalArea: string,
    urgency: string,
    experience: string,
    estimatedHours?: number
  ): number {
    // Valor base por hora baseado na experiência
    const hourlyRates = {
      junior: 80,
      pleno: 120,
      senior: 180,
      especialista: 250
    }

    // Multiplicadores por tipo de serviço
    const serviceMultipliers = {
      petition: 1.0,
      appeal: 1.2,
      defense: 1.3,
      contract: 0.8,
      opinion: 0.9,
      research: 0.7,
      other: 1.0
    }

    // Multiplicadores por urgência
    const urgencyMultipliers = {
      low: 0.9,
      medium: 1.0,
      high: 1.3,
      urgent: 1.6
    }

    const baseRate = hourlyRates[experience as keyof typeof hourlyRates] || 120
    const serviceMultiplier = serviceMultipliers[serviceType as keyof typeof serviceMultipliers] || 1.0
    const urgencyMultiplier = urgencyMultipliers[urgency as keyof typeof urgencyMultipliers] || 1.0
    
    const hours = estimatedHours || 8 // Default 8 horas
    
    return Math.round(baseRate * serviceMultiplier * urgencyMultiplier * hours)
  }

  /**
   * Encontrar prestadores compatíveis com uma delegação
   */
  async findMatches(criteria: MatchingCriteria): Promise<MatchingResult> {
    try {
      await this.initializeSupabase()

      // Buscar prestadores aprovados
      const { data: providers, error } = await this.supabase
        .from('providers')
        .select(`
          id,
          full_name,
          experience_level,
          specialties,
          quality_rating,
          total_jobs,
          completed_jobs,
          availability,
          last_active_at,
          metadata
        `)
        .eq('status', 'approved')
        .gte('evaluation_score', 70) // Nota mínima
        .order('quality_rating', { ascending: false })

      if (error) {
        console.error('Error fetching providers:', error)
        return {
          totalCandidates: 0,
          matches: [],
          averageScore: 0,
          criteria
        }
      }

      if (!providers || providers.length === 0) {
        return {
          totalCandidates: 0,
          matches: [],
          averageScore: 0,
          criteria
        }
      }

      // Calcular scores de matching para cada prestador
      const matches: ProviderMatch[] = []

      for (const provider of providers) {
        const matchResult = await this.calculateMatchScore(provider, criteria)
        
        if (matchResult.matchScore > 0.3) { // Score mínimo de 30%
          matches.push(matchResult)
        }
      }

      // Ordenar por score decrescente
      matches.sort((a, b) => b.matchScore - a.matchScore)

      // Calcular estatísticas
      const averageScore = matches.length > 0 
        ? matches.reduce((sum, match) => sum + match.matchScore, 0) / matches.length 
        : 0

      const bestMatch = matches.length > 0 ? matches[0] : undefined

      return {
        totalCandidates: providers.length,
        matches: matches.slice(0, 10), // Top 10 matches
        bestMatch,
        averageScore,
        criteria
      }

    } catch (error: any) {
      console.error('Matching service error:', error)
      return {
        totalCandidates: 0,
        matches: [],
        averageScore: 0,
        criteria
      }
    }
  }

  /**
   * Calcular score de matching para um prestador específico
   */
  private async calculateMatchScore(
    provider: any, 
    criteria: MatchingCriteria
  ): Promise<ProviderMatch> {
    let score = 0
    const reasons: string[] = []
    const warnings: string[] = []

    // 1. ESPECIALIDADE (peso: 30%)
    const specialties = Array.isArray(provider.specialties) ? provider.specialties : []
    const hasSpecialty = specialties.includes(criteria.legalArea)
    
    if (hasSpecialty) {
      score += 0.3
      reasons.push(`Especialista em ${criteria.legalArea}`)
    } else {
      // Penalidade por não ter a especialidade
      score += 0.1
      warnings.push(`Não tem especialização específica em ${criteria.legalArea}`)
    }

    // 2. EXPERIÊNCIA (peso: 25%)
    const experienceScore = this.calculateExperienceScore(
      provider.experience_level, 
      criteria.requiredExperience
    )
    score += experienceScore * 0.25
    
    if (experienceScore >= 0.8) {
      reasons.push(`Nível de experiência adequado (${provider.experience_level})`)
    } else if (experienceScore < 0.5) {
      warnings.push(`Experiência pode ser insuficiente (${provider.experience_level} vs ${criteria.requiredExperience})`)
    }

    // 3. QUALIDADE/AVALIAÇÕES (peso: 20%)
    const qualityRating = provider.quality_rating || 0
    const qualityScore = Math.min(qualityRating / 5, 1) // Normalizar para 0-1
    score += qualityScore * 0.2
    
    if (qualityRating >= 4.5) {
      reasons.push(`Excelente avaliação (${qualityRating.toFixed(1)}/5.0)`)
    } else if (qualityRating < 3.5) {
      warnings.push(`Avaliação baixa (${qualityRating.toFixed(1)}/5.0)`)
    }

    // 4. HISTÓRICO DE TRABALHOS (peso: 15%)
    const totalJobs = provider.total_jobs || 0
    const completedJobs = provider.completed_jobs || 0
    const completionRate = totalJobs > 0 ? completedJobs / totalJobs : 0
    
    let historyScore = 0
    if (totalJobs >= 10) {
      historyScore = Math.min(completionRate, 1)
      reasons.push(`${totalJobs} trabalhos realizados (${(completionRate * 100).toFixed(0)}% concluídos)`)
    } else if (totalJobs >= 5) {
      historyScore = completionRate * 0.8
      reasons.push(`${totalJobs} trabalhos realizados`)
    } else {
      historyScore = 0.5 // Score neutro para iniciantes
      warnings.push(`Poucos trabalhos realizados (${totalJobs})`)
    }
    
    score += historyScore * 0.15

    // 5. DISPONIBILIDADE (peso: 10%)
    const availabilityScore = this.calculateAvailabilityScore(
      provider.availability,
      criteria.urgency,
      provider.last_active_at
    )
    score += availabilityScore * 0.1
    
    if (availabilityScore >= 0.8) {
      reasons.push('Boa disponibilidade')
    } else if (availabilityScore < 0.5) {
      warnings.push('Disponibilidade limitada')
    }

    // 6. PRESTADORES PREFERIDOS (bônus)
    if (criteria.preferredProviders?.includes(provider.id)) {
      score += 0.1 // Bônus de 10%
      reasons.push('Prestador preferido do escritório')
    }

    // 7. ATIVIDADE RECENTE (bônus/penalidade)
    const lastActive = provider.last_active_at ? new Date(provider.last_active_at) : null
    const daysSinceActive = lastActive 
      ? Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
      : 999

    if (daysSinceActive <= 7) {
      score += 0.05
      reasons.push('Ativo recentemente')
    } else if (daysSinceActive > 30) {
      score -= 0.05
      warnings.push(`Inativo há ${daysSinceActive} dias`)
    }

    // Normalizar score para 0-1
    score = Math.max(0, Math.min(1, score))

    // Calcular preço estimado
    const estimatedPrice = this.calculateSimplePrice(
      criteria.serviceType as any,
      criteria.legalArea,
      criteria.urgency,
      provider.experience_level,
      criteria.estimatedHours
    )

    // Calcular taxa de pontualidade (simulada por enquanto)
    const onTimeRate = completionRate > 0 ? Math.min(completionRate + 0.1, 1) : 0.8

    return {
      providerId: provider.id,
      providerName: provider.full_name,
      experience: provider.experience_level,
      specialties,
      qualityRating: provider.quality_rating || 0,
      totalJobs: provider.total_jobs || 0,
      completedJobs: provider.completed_jobs || 0,
      onTimeRate,
      averageRating: provider.quality_rating || 0,
      matchScore: score,
      availability: provider.availability,
      estimatedPrice,
      reasons,
      warnings
    }
  }

  /**
   * Calcular score de experiência
   */
  private calculateExperienceScore(
    providerExperience: string,
    requiredExperience: string
  ): number {
    const experienceLevels = {
      'junior': 1,
      'pleno': 2,
      'senior': 3,
      'especialista': 4
    }

    const providerLevel = experienceLevels[providerExperience as keyof typeof experienceLevels] || 1
    const requiredLevel = experienceLevels[requiredExperience as keyof typeof experienceLevels] || 1

    if (providerLevel >= requiredLevel) {
      // Prestador tem experiência suficiente ou superior
      return 1.0
    } else if (providerLevel === requiredLevel - 1) {
      // Prestador tem um nível abaixo do requerido
      return 0.7
    } else {
      // Prestador tem experiência muito abaixo
      return 0.3
    }
  }

  /**
   * Calcular score de disponibilidade
   */
  private calculateAvailabilityScore(
    availability: string,
    urgency: string,
    lastActiveAt?: string
  ): number {
    let score = 0.5 // Score base

    // Score baseado na disponibilidade declarada
    switch (availability) {
      case 'immediate':
        score = 1.0
        break
      case 'week':
        score = 0.8
        break
      case 'flexible':
        score = 0.6
        break
      default:
        score = 0.5
    }

    // Ajustar baseado na urgência
    if (urgency === 'urgent' && availability !== 'immediate') {
      score *= 0.7 // Penalidade para casos urgentes
    } else if (urgency === 'low' && availability === 'flexible') {
      score *= 1.1 // Bônus para casos não urgentes
    }

    // Penalidade por inatividade
    if (lastActiveAt) {
      const daysSinceActive = Math.floor(
        (Date.now() - new Date(lastActiveAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      
      if (daysSinceActive > 14) {
        score *= 0.8 // Penalidade por inatividade
      }
    }

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Atribuir automaticamente a melhor opção
   */
  async autoAssignBestMatch(
    delegationId: string,
    criteria: MatchingCriteria,
    minScore: number = 0.7
  ): Promise<{
    success: boolean
    assignedProvider?: ProviderMatch
    error?: string
  }> {
    try {
      const matchingResult = await this.findMatches(criteria)

      if (!matchingResult.bestMatch || matchingResult.bestMatch.matchScore < minScore) {
        return {
          success: false,
          error: 'Nenhum prestador com score suficiente encontrado'
        }
      }

      // Atribuir o melhor prestador
      await this.initializeSupabase()
      
      const { error } = await this.supabase
        .from('delegations')
        .update({
          provider_id: matchingResult.bestMatch.providerId,
          status: 'matched',
          metadata: {
            auto_assigned: true,
            match_score: matchingResult.bestMatch.matchScore,
            match_reasons: matchingResult.bestMatch.reasons,
            assigned_at: new Date().toISOString()
          }
        })
        .eq('id', delegationId)

      if (error) {
        console.error('Auto assign error:', error)
        return {
          success: false,
          error: 'Erro ao atribuir prestador'
        }
      }

      return {
        success: true,
        assignedProvider: matchingResult.bestMatch
      }

    } catch (error: any) {
      console.error('Auto assign service error:', error)
      return {
        success: false,
        error: 'Erro interno no serviço'
      }
    }
  }

  /**
   * Registrar métricas de matching para tuning
   */
  async logMatchingMetrics(
    delegationId: string,
    criteria: MatchingCriteria,
    result: MatchingResult,
    selectedProviderId?: string
  ): Promise<void> {
    try {
      await this.initializeSupabase()

      const metrics = {
        delegation_id: delegationId,
        criteria,
        total_candidates: result.totalCandidates,
        matches_found: result.matches.length,
        average_score: result.averageScore,
        best_score: result.bestMatch?.matchScore || 0,
        selected_provider_id: selectedProviderId,
        selected_provider_score: selectedProviderId 
          ? result.matches.find(m => m.providerId === selectedProviderId)?.matchScore || 0
          : null,
        timestamp: new Date().toISOString()
      }

      // Salvar métricas (criar tabela se necessário)
      await this.supabase
        .from('matching_metrics')
        .insert(metrics)

    } catch (error: any) {
      console.error('Log matching metrics error:', error)
      // Não falhar se não conseguir salvar métricas
    }
  }

  /**
   * Obter estatísticas de matching
   */
  async getMatchingStats(period: 'week' | 'month' | 'quarter' = 'month'): Promise<{
    totalMatches: number
    averageScore: number
    averageCandidates: number
    successRate: number
    topPerformers: { providerId: string; providerName: string; matchCount: number }[]
  }> {
    try {
      await this.initializeSupabase()

      const periodDays = {
        week: 7,
        month: 30,
        quarter: 90
      }

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - periodDays[period])

      const { data: metrics, error } = await this.supabase
        .from('matching_metrics')
        .select('*')
        .gte('timestamp', startDate.toISOString())

      if (error || !metrics) {
        return {
          totalMatches: 0,
          averageScore: 0,
          averageCandidates: 0,
          successRate: 0,
          topPerformers: []
        }
      }

      const totalMatches = metrics.length
      const averageScore = metrics.reduce((sum: number, m: any) => sum + (m.average_score || 0), 0) / totalMatches
      const averageCandidates = metrics.reduce((sum: number, m: any) => sum + (m.total_candidates || 0), 0) / totalMatches
      const successfulMatches = metrics.filter((m: any) => m.selected_provider_id).length
      const successRate = successfulMatches / totalMatches

      // Top performers (simplificado)
      const topPerformers: { providerId: string; providerName: string; matchCount: number }[] = []

      return {
        totalMatches,
        averageScore,
        averageCandidates,
        successRate,
        topPerformers
      }

    } catch (error: any) {
      console.error('Get matching stats error:', error)
      return {
        totalMatches: 0,
        averageScore: 0,
        averageCandidates: 0,
        successRate: 0,
        topPerformers: []
      }
    }
  }
}


