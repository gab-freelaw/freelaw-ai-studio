import { createClient } from '@/lib/supabase/server'

export interface ProviderPerformanceMetrics {
  averageRating: number
  totalServices: number
  completedServices: number
  incidentRate: number // % de intercorrências (notas 1-2 ou atrasos)
  onTimeDeliveryRate: number
  monthlyGoal: number
  currentMonthServices: number
  goalProgress: number // % da meta alcançada
}

export interface MonthlyServiceData {
  month: string
  year: number
  servicesCompleted: number
  averageRating: number
  incidents: number
  goal: number
  goalAchieved: boolean
}

export interface IncidentAnalysis {
  lowRatings: number // Notas 1-2
  lateDeliveries: number
  totalIncidents: number
  incidentRate: number
  mostCommonIssues: {
    issue: string
    count: number
  }[]
}

export interface ProviderDashboardData {
  performance: ProviderPerformanceMetrics
  monthlyData: MonthlyServiceData[]
  incidents: IncidentAnalysis
  recentFeedback: {
    delegationId: string
    clientFeedback: string
    rating: number
    date: string
    legalArea: string
  }[]
}

export class ProviderAnalyticsService {
  private static async getSupabaseClient() {
    return createClient()
  }

  // Métricas de performance do prestador
  static async getProviderPerformance(providerId: string): Promise<ProviderPerformanceMetrics> {
    const supabase = await this.getSupabaseClient()
    
    // Buscar dados do prestador
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('monthly_goal')
      .eq('id', providerId)
      .single()

    if (providerError) {
      console.error('Error fetching provider:', providerError)
      throw providerError
    }

    // Buscar delegações do prestador
    const { data: delegations, error } = await supabase
      .from('delegations')
      .select(`
        id,
        office_rating,
        provider_rating,
        status,
        created_at,
        completed_at,
        deadline,
        delivery_deadline,
        office_feedback
      `)
      .eq('provider_id', providerId)

    if (error) {
      console.error('Error fetching provider delegations:', error)
      throw error
    }

    if (!delegations || delegations.length === 0) {
      return {
        averageRating: 0,
        totalServices: 0,
        completedServices: 0,
        incidentRate: 0,
        onTimeDeliveryRate: 0,
        monthlyGoal: provider?.monthly_goal || 10,
        currentMonthServices: 0,
        goalProgress: 0
      }
    }

    const totalServices = delegations.length
    const completedServices = delegations.filter(d => d.status === 'completed').length

    // Calcular avaliação média
    const ratedServices = delegations.filter(d => d.office_rating)
    const averageRating = ratedServices.length > 0 
      ? ratedServices.reduce((sum, d) => sum + (d.office_rating || 0), 0) / ratedServices.length
      : 0

    // Calcular intercorrências (notas 1-2 ou atrasos)
    const lowRatings = delegations.filter(d => d.office_rating && d.office_rating <= 2).length
    const lateDeliveries = delegations.filter(d => {
      if (!d.completed_at || !d.deadline) return false
      const completedDate = new Date(d.completed_at)
      const deadline = new Date(d.deadline)
      return completedDate > deadline
    }).length
    
    const totalIncidents = lowRatings + lateDeliveries
    const incidentRate = totalServices > 0 ? (totalIncidents / totalServices) * 100 : 0

    // Taxa de entrega no prazo
    const onTimeDeliveries = delegations.filter(d => {
      if (!d.completed_at || !d.deadline) return true // Se não tem prazo, considera no prazo
      const completedDate = new Date(d.completed_at)
      const deadline = new Date(d.deadline)
      return completedDate <= deadline
    }).length
    const onTimeDeliveryRate = completedServices > 0 ? (onTimeDeliveries / completedServices) * 100 : 0

    // Serviços do mês atual
    const currentMonth = new Date()
    const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const currentMonthServices = delegations.filter(d => {
      const createdDate = new Date(d.created_at!)
      return createdDate >= currentMonthStart
    }).length

    const monthlyGoal = provider?.monthly_goal || 10
    const goalProgress = (currentMonthServices / monthlyGoal) * 100

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalServices,
      completedServices,
      incidentRate: Math.round(incidentRate * 10) / 10,
      onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 10) / 10,
      monthlyGoal,
      currentMonthServices,
      goalProgress: Math.round(goalProgress * 10) / 10
    }
  }

  // Dados mensais dos últimos 12 meses
  static async getMonthlyServiceData(providerId: string): Promise<MonthlyServiceData[]> {
    const supabase = await this.getSupabaseClient()
    
    // Buscar delegações dos últimos 12 meses
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const { data: delegations, error } = await supabase
      .from('delegations')
      .select(`
        created_at,
        completed_at,
        office_rating,
        deadline,
        status
      `)
      .eq('provider_id', providerId)
      .gte('created_at', twelveMonthsAgo.toISOString())

    if (error) {
      console.error('Error fetching monthly data:', error)
      throw error
    }

    // Buscar meta mensal do prestador
    const { data: provider } = await supabase
      .from('providers')
      .select('monthly_goal')
      .eq('id', providerId)
      .single()

    const monthlyGoal = provider?.monthly_goal || 10

    if (!delegations || delegations.length === 0) {
      return []
    }

    // Agrupar por mês
    const monthlyData = delegations.reduce((acc, delegation) => {
      const createdDate = new Date(delegation.created_at!)
      const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: createdDate.toLocaleDateString('pt-BR', { month: 'short' }),
          year: createdDate.getFullYear(),
          services: [],
          incidents: 0
        }
      }
      
      acc[monthKey].services.push(delegation)
      
      // Contar incidentes (notas baixas ou atrasos)
      if (delegation.office_rating && delegation.office_rating <= 2) {
        acc[monthKey].incidents++
      }
      if (delegation.completed_at && delegation.deadline) {
        const completedDate = new Date(delegation.completed_at)
        const deadline = new Date(delegation.deadline)
        if (completedDate > deadline) {
          acc[monthKey].incidents++
        }
      }
      
      return acc
    }, {} as Record<string, any>)

    // Converter para array e calcular métricas
    return Object.entries(monthlyData)
      .map(([monthKey, data]) => {
        const servicesCompleted = data.services.filter((s: any) => s.status === 'completed').length
        const ratedServices = data.services.filter((s: any) => s.office_rating)
        const averageRating = ratedServices.length > 0
          ? ratedServices.reduce((sum: number, s: any) => sum + (s.office_rating || 0), 0) / ratedServices.length
          : 0

        return {
          month: data.month,
          year: data.year,
          servicesCompleted,
          averageRating: Math.round(averageRating * 10) / 10,
          incidents: data.incidents,
          goal: monthlyGoal,
          goalAchieved: servicesCompleted >= monthlyGoal
        }
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year
        return new Date(`${a.month} 1, ${a.year}`).getMonth() - new Date(`${b.month} 1, ${b.year}`).getMonth()
      })
  }

  // Análise detalhada de intercorrências
  static async getIncidentAnalysis(providerId: string): Promise<IncidentAnalysis> {
    const supabase = await this.getSupabaseClient()
    
    const { data: delegations, error } = await supabase
      .from('delegations')
      .select(`
        office_rating,
        completed_at,
        deadline,
        office_feedback,
        status
      `)
      .eq('provider_id', providerId)

    if (error) {
      console.error('Error fetching incident analysis:', error)
      throw error
    }

    if (!delegations || delegations.length === 0) {
      return {
        lowRatings: 0,
        lateDeliveries: 0,
        totalIncidents: 0,
        incidentRate: 0,
        mostCommonIssues: []
      }
    }

    // Contar notas baixas (1-2)
    const lowRatings = delegations.filter(d => d.office_rating && d.office_rating <= 2).length

    // Contar entregas atrasadas
    const lateDeliveries = delegations.filter(d => {
      if (!d.completed_at || !d.deadline) return false
      const completedDate = new Date(d.completed_at)
      const deadline = new Date(d.deadline)
      return completedDate > deadline
    }).length

    const totalIncidents = lowRatings + lateDeliveries
    const incidentRate = delegations.length > 0 ? (totalIncidents / delegations.length) * 100 : 0

    // Analisar feedbacks para identificar problemas comuns
    const feedbacks = delegations
      .filter(d => d.office_feedback)
      .map(d => d.office_feedback!.toLowerCase())

    const issueKeywords = {
      'atraso': ['atraso', 'atrasado', 'prazo', 'tempo'],
      'qualidade': ['qualidade', 'erro', 'incorreto', 'incompleto'],
      'comunicação': ['comunicação', 'resposta', 'contato', 'retorno'],
      'formatação': ['formato', 'formatação', 'estrutura', 'organização']
    }

    const issueCount = Object.entries(issueKeywords).map(([issue, keywords]) => {
      const count = feedbacks.filter(feedback => 
        keywords.some(keyword => feedback.includes(keyword))
      ).length
      return { issue, count }
    }).filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count)

    return {
      lowRatings,
      lateDeliveries,
      totalIncidents,
      incidentRate: Math.round(incidentRate * 10) / 10,
      mostCommonIssues: issueCount
    }
  }

  // Feedback recente
  static async getRecentFeedback(providerId: string, limit: number = 5) {
    const supabase = await this.getSupabaseClient()
    
    const { data: delegations, error } = await supabase
      .from('delegations')
      .select(`
        id,
        office_feedback,
        office_rating,
        completed_at,
        legal_area
      `)
      .eq('provider_id', providerId)
      .not('office_feedback', 'is', null)
      .not('office_rating', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching recent feedback:', error)
      throw error
    }

    return delegations?.map(d => ({
      delegationId: d.id,
      clientFeedback: d.office_feedback || '',
      rating: d.office_rating || 0,
      date: d.completed_at || '',
      legalArea: d.legal_area || ''
    })) || []
  }

  // Atualizar meta mensal do prestador
  static async updateMonthlyGoal(providerId: string, newGoal: number) {
    const supabase = await this.getSupabaseClient()
    
    const { error } = await supabase
      .from('providers')
      .update({ monthly_goal: newGoal })
      .eq('id', providerId)

    if (error) {
      console.error('Error updating monthly goal:', error)
      throw error
    }

    return { success: true }
  }

  // Dados completos do dashboard
  static async getProviderDashboardData(providerId: string): Promise<ProviderDashboardData> {
    const [performance, monthlyData, incidents, recentFeedback] = await Promise.all([
      this.getProviderPerformance(providerId),
      this.getMonthlyServiceData(providerId),
      this.getIncidentAnalysis(providerId),
      this.getRecentFeedback(providerId)
    ])

    return {
      performance,
      monthlyData,
      incidents,
      recentFeedback
    }
  }
}




