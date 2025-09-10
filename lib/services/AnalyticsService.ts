import { createClient } from '@/lib/supabase/server'

export interface ServiceQualityMetrics {
  averageRating: number
  totalServices: number
  completedServices: number
  averageCompletionTime: number // em dias
  ratingDistribution: {
    rating: number
    count: number
    percentage: number
  }[]
}

export interface ServicesByArea {
  legalArea: string
  totalServices: number
  averageRating: number
  averageCompletionTime: number
  serviceTypes: {
    serviceType: string
    count: number
  }[]
}

export interface ServicesByLawyer {
  providerId: string
  providerName: string
  providerType: 'internal' | 'external' | 'ai'
  totalServices: number
  averageRating: number
  averageCompletionTime: number
  completionRate: number
}

export interface ClientSatisfactionData {
  totalClients: number
  activeClients: number
  averageSatisfaction: number
  satisfactionTrend: {
    month: string
    satisfaction: number
    totalServices: number
  }[]
  topAreas: {
    legalArea: string
    clientCount: number
    satisfaction: number
  }[]
}

export class AnalyticsService {
  private static async getSupabaseClient() {
    return createClient()
  }

  // Qualidade do serviço geral (avaliada de 1 a 5)
  static async getServiceQualityMetrics(officeId: string): Promise<ServiceQualityMetrics> {
    const supabase = await this.getSupabaseClient()
    
    // Buscar todas as delegações com rating
    const { data: delegations, error } = await supabase
      .from('delegations')
      .select(`
        id,
        office_rating,
        provider_rating,
        status,
        created_at,
        completed_at,
        service_type,
        legal_area
      `)
      .eq('office_id', officeId)
      .not('office_rating', 'is', null)

    if (error) {
      console.error('Error fetching service quality metrics:', error)
      throw error
    }

    if (!delegations || delegations.length === 0) {
      return {
        averageRating: 0,
        totalServices: 0,
        completedServices: 0,
        averageCompletionTime: 0,
        ratingDistribution: []
      }
    }

    // Calcular métricas
    const totalServices = delegations.length
    const completedServices = delegations.filter(d => d.status === 'completed').length
    const ratingsSum = delegations.reduce((sum, d) => sum + (d.office_rating || 0), 0)
    const averageRating = ratingsSum / totalServices

    // Calcular tempo médio de conclusão
    const completedDelegations = delegations.filter(d => d.completed_at && d.created_at)
    const totalCompletionTime = completedDelegations.reduce((sum, d) => {
      const createdAt = new Date(d.created_at!)
      const completedAt = new Date(d.completed_at!)
      const diffTime = completedAt.getTime() - createdAt.getTime()
      const diffDays = diffTime / (1000 * 60 * 60 * 24)
      return sum + diffDays
    }, 0)
    const averageCompletionTime = completedDelegations.length > 0 
      ? totalCompletionTime / completedDelegations.length 
      : 0

    // Distribuição de ratings
    const ratingCounts = [1, 2, 3, 4, 5].map(rating => {
      const count = delegations.filter(d => d.office_rating === rating).length
      return {
        rating,
        count,
        percentage: (count / totalServices) * 100
      }
    })

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalServices,
      completedServices,
      averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
      ratingDistribution: ratingCounts
    }
  }

  // Serviços por área do direito
  static async getServicesByArea(officeId: string): Promise<ServicesByArea[]> {
    const supabase = await this.getSupabaseClient()
    
    const { data: delegations, error } = await supabase
      .from('delegations')
      .select(`
        legal_area,
        service_type,
        office_rating,
        created_at,
        completed_at,
        status
      `)
      .eq('office_id', officeId)

    if (error) {
      console.error('Error fetching services by area:', error)
      throw error
    }

    if (!delegations || delegations.length === 0) {
      return []
    }

    // Agrupar por área do direito
    const areaGroups = delegations.reduce((acc, delegation) => {
      const area = delegation.legal_area
      if (!acc[area]) {
        acc[area] = []
      }
      acc[area].push(delegation)
      return acc
    }, {} as Record<string, typeof delegations>)

    // Calcular métricas por área
    return Object.entries(areaGroups).map(([legalArea, areaDelegations]) => {
      const totalServices = areaDelegations.length
      const ratedServices = areaDelegations.filter(d => d.office_rating)
      const averageRating = ratedServices.length > 0 
        ? ratedServices.reduce((sum, d) => sum + (d.office_rating || 0), 0) / ratedServices.length
        : 0

      // Tempo médio de conclusão
      const completedServices = areaDelegations.filter(d => d.completed_at && d.created_at)
      const totalCompletionTime = completedServices.reduce((sum, d) => {
        const createdAt = new Date(d.created_at!)
        const completedAt = new Date(d.completed_at!)
        const diffTime = completedAt.getTime() - createdAt.getTime()
        return sum + (diffTime / (1000 * 60 * 60 * 24))
      }, 0)
      const averageCompletionTime = completedServices.length > 0 
        ? totalCompletionTime / completedServices.length 
        : 0

      // Tipos de serviço
      const serviceTypeCounts = areaDelegations.reduce((acc, d) => {
        const type = d.service_type
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const serviceTypes = Object.entries(serviceTypeCounts).map(([serviceType, count]) => ({
        serviceType,
        count
      }))

      return {
        legalArea,
        totalServices,
        averageRating: Math.round(averageRating * 10) / 10,
        averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
        serviceTypes
      }
    }).sort((a, b) => b.totalServices - a.totalServices)
  }

  // Serviços por advogado (interno, externo, IA)
  static async getServicesByLawyer(officeId: string): Promise<ServicesByLawyer[]> {
    const supabase = await this.getSupabaseClient()
    
    // Buscar delegações com informações do prestador
    const { data: delegations, error } = await supabase
      .from('delegations')
      .select(`
        id,
        provider_id,
        office_rating,
        status,
        created_at,
        completed_at,
        service_type,
        providers (
          id,
          business_name,
          full_name,
          provider_type
        )
      `)
      .eq('office_id', officeId)
      .not('provider_id', 'is', null)

    if (error) {
      console.error('Error fetching services by lawyer:', error)
      throw error
    }

    if (!delegations || delegations.length === 0) {
      return []
    }

    // Agrupar por prestador
    const providerGroups = delegations.reduce((acc, delegation) => {
      const providerId = delegation.provider_id!
      if (!acc[providerId]) {
        acc[providerId] = {
          provider: delegation.providers,
          delegations: []
        }
      }
      acc[providerId].delegations.push(delegation)
      return acc
    }, {} as Record<string, { provider: any, delegations: typeof delegations }>)

    // Calcular métricas por prestador
    return Object.entries(providerGroups).map(([providerId, data]) => {
      const { provider, delegations: providerDelegations } = data
      const totalServices = providerDelegations.length
      const completedServices = providerDelegations.filter(d => d.status === 'completed').length
      const ratedServices = providerDelegations.filter(d => d.office_rating)
      
      const averageRating = ratedServices.length > 0 
        ? ratedServices.reduce((sum, d) => sum + (d.office_rating || 0), 0) / ratedServices.length
        : 0

      // Tempo médio de conclusão
      const completedDelegations = providerDelegations.filter(d => d.completed_at && d.created_at)
      const totalCompletionTime = completedDelegations.reduce((sum, d) => {
        const createdAt = new Date(d.created_at!)
        const completedAt = new Date(d.completed_at!)
        const diffTime = completedAt.getTime() - createdAt.getTime()
        return sum + (diffTime / (1000 * 60 * 60 * 24))
      }, 0)
      const averageCompletionTime = completedDelegations.length > 0 
        ? totalCompletionTime / completedDelegations.length 
        : 0

      const completionRate = totalServices > 0 ? (completedServices / totalServices) * 100 : 0

      return {
        providerId,
        providerName: provider?.business_name || provider?.full_name || 'Nome não disponível',
        providerType: provider?.provider_type || 'external',
        totalServices,
        averageRating: Math.round(averageRating * 10) / 10,
        averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10
      }
    }).sort((a, b) => b.totalServices - a.totalServices)
  }

  // Dados de satisfação do cliente
  static async getClientSatisfactionData(officeId: string): Promise<ClientSatisfactionData> {
    const supabase = await this.getSupabaseClient()
    
    // Buscar delegações dos últimos 12 meses com dados do cliente
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const { data: delegations, error } = await supabase
      .from('delegations')
      .select(`
        client_name,
        legal_area,
        office_rating,
        created_at,
        status
      `)
      .eq('office_id', officeId)
      .gte('created_at', oneYearAgo.toISOString())
      .not('client_name', 'is', null)

    if (error) {
      console.error('Error fetching client satisfaction data:', error)
      throw error
    }

    if (!delegations || delegations.length === 0) {
      return {
        totalClients: 0,
        activeClients: 0,
        averageSatisfaction: 0,
        satisfactionTrend: [],
        topAreas: []
      }
    }

    // Clientes únicos
    const uniqueClients = new Set(delegations.map(d => d.client_name))
    const totalClients = uniqueClients.size

    // Clientes ativos (com serviços nos últimos 3 meses)
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    const recentDelegations = delegations.filter(d => new Date(d.created_at!) >= threeMonthsAgo)
    const activeClients = new Set(recentDelegations.map(d => d.client_name)).size

    // Satisfação média
    const ratedDelegations = delegations.filter(d => d.office_rating)
    const averageSatisfaction = ratedDelegations.length > 0
      ? ratedDelegations.reduce((sum, d) => sum + (d.office_rating || 0), 0) / ratedDelegations.length
      : 0

    // Trend de satisfação por mês
    const monthlyData = delegations.reduce((acc, delegation) => {
      const month = new Date(delegation.created_at!).toISOString().substring(0, 7) // YYYY-MM
      if (!acc[month]) {
        acc[month] = { ratings: [], total: 0 }
      }
      if (delegation.office_rating) {
        acc[month].ratings.push(delegation.office_rating)
      }
      acc[month].total++
      return acc
    }, {} as Record<string, { ratings: number[], total: number }>)

    const satisfactionTrend = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        satisfaction: data.ratings.length > 0 
          ? Math.round((data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length) * 10) / 10
          : 0,
        totalServices: data.total
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // Top áreas por satisfação
    const areaData = delegations.reduce((acc, delegation) => {
      const area = delegation.legal_area
      if (!acc[area]) {
        acc[area] = { ratings: [], clients: new Set() }
      }
      if (delegation.office_rating) {
        acc[area].ratings.push(delegation.office_rating)
      }
      acc[area].clients.add(delegation.client_name)
      return acc
    }, {} as Record<string, { ratings: number[], clients: Set<string> }>)

    const topAreas = Object.entries(areaData)
      .map(([legalArea, data]) => ({
        legalArea,
        clientCount: data.clients.size,
        satisfaction: data.ratings.length > 0
          ? Math.round((data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length) * 10) / 10
          : 0
      }))
      .filter(area => area.satisfaction > 0)
      .sort((a, b) => b.satisfaction - a.satisfaction)
      .slice(0, 5)

    return {
      totalClients,
      activeClients,
      averageSatisfaction: Math.round(averageSatisfaction * 10) / 10,
      satisfactionTrend,
      topAreas
    }
  }

  // Buscar dados gerais para o dashboard
  static async getDashboardMetrics(officeId: string) {
    const [
      serviceQuality,
      servicesByArea,
      servicesByLawyer,
      clientSatisfaction
    ] = await Promise.all([
      this.getServiceQualityMetrics(officeId),
      this.getServicesByArea(officeId),
      this.getServicesByLawyer(officeId),
      this.getClientSatisfactionData(officeId)
    ])

    return {
      serviceQuality,
      servicesByArea,
      servicesByLawyer,
      clientSatisfaction
    }
  }
}




