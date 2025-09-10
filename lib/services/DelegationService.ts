import { createClient } from '@/lib/supabase/server'
import { AuditService } from './AuditService'

export interface CreateDelegationData {
  title: string
  description: string
  legalArea: string
  urgency: 'low' | 'medium' | 'high' | 'urgent'
  serviceType: 'petition' | 'appeal' | 'defense' | 'contract' | 'opinion' | 'research' | 'other'
  processNumber?: string
  clientName?: string
  court?: string
  deadline?: string
  estimatedHours?: number
  budgetMin?: number
  budgetMax?: number
  requirements?: string[]
  requiredExperience?: 'junior' | 'pleno' | 'senior' | 'especialista'
  responseDeadline?: string
  deliveryDeadline?: string
  complexity?: 'simple' | 'medium' | 'complex' | 'very_complex'
}

export interface Delegation {
  id: string
  title: string
  description: string
  legalArea: string
  urgency: string
  serviceType: string
  status: string
  calculatedPrice?: number
  deadline?: string
  createdAt: string
  providerResponse?: 'pending' | 'accepted' | 'rejected'
  providerName?: string
  officeName?: string
}

export class DelegationService {
  private supabase: any
  private auditService: AuditService

  constructor() {
    this.auditService = new AuditService()
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
   * Criar nova delegação
   */
  async createDelegation(
    officeId: string, 
    createdBy: string, 
    data: CreateDelegationData
  ): Promise<{
    success: boolean
    delegationId?: string
    calculatedPrice?: number
    error?: string
  }> {
    try {
      await this.initializeSupabase()

      // Calcular preço automaticamente baseado em critérios simples
      const calculatedPrice = this.calculateSimplePrice(
        data.serviceType,
        data.legalArea,
        data.urgency,
        data.requiredExperience || 'pleno',
        data.estimatedHours
      )

      const { data: delegation, error } = await this.supabase
        .from('delegations')
        .insert({
          office_id: officeId,
          created_by: createdBy,
          title: data.title,
          description: data.description,
          legal_area: data.legalArea,
          urgency: data.urgency,
          service_type: data.serviceType,
          process_number: data.processNumber,
          client_name: data.clientName,
          court: data.court,
          deadline: data.deadline,
          estimated_hours: data.estimatedHours,
          calculated_price: calculatedPrice,
          requirements: data.requirements || [],
          required_experience: data.requiredExperience,
          response_deadline: data.responseDeadline,
          delivery_deadline: data.deliveryDeadline,
          status: 'open',
          provider_response: 'pending',
          metadata: {
            created_via: 'web_interface',
            created_at: new Date().toISOString(),
            pricing_factors: {
              serviceType: data.serviceType,
              legalArea: data.legalArea,
              urgency: data.urgency,
              requiredExperience: data.requiredExperience,
              estimatedHours: data.estimatedHours,
              complexity: data.complexity
            }
          }
        })
        .select()
        .single()

      if (error) {
        console.error('Create delegation error:', error)
        return {
          success: false,
          error: 'Erro ao criar delegação'
        }
      }

      // Log de auditoria
      try {
        await this.auditService.logDelegationCreated(
          delegation.id,
          delegation,
          {
            userId: 'unknown', // organizationData não disponível no contexto
            userType: 'office',
            userName: 'Unknown Organization',
            userEmail: 'unknown@email.com'
          }
        )
      } catch (auditError) {
        console.warn('Erro no log de auditoria:', auditError)
      }

      return {
        success: true,
        delegationId: delegation.id,
        calculatedPrice
      }

    } catch (error: any) {
      console.error('Delegation service error:', error)
      return {
        success: false,
        error: 'Erro interno no serviço'
      }
    }
  }

  /**
   * Listar delegações de um escritório
   */
  async getOfficeDelegations(officeId: string): Promise<Delegation[]> {
    try {
      await this.initializeSupabase()

      const { data, error } = await this.supabase
        .from('delegations')
        .select(`
          *,
          proposal_count:delegation_proposals(count)
        `)
        .eq('office_id', officeId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Get office delegations error:', error)
        return []
      }

      return data.map((d: any) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        legalArea: d.legal_area,
        urgency: d.urgency,
        serviceType: d.service_type,
        status: d.status,
        budgetMin: d.budget_min,
        budgetMax: d.budget_max,
        deadline: d.deadline,
        createdAt: d.created_at,
        proposalCount: d.proposal_count?.[0]?.count || 0
      }))

    } catch (error: any) {
      console.error('Get office delegations service error:', error)
      return []
    }
  }

  /**
   * Listar delegações abertas para prestadores
   */
  async getOpenDelegations(
    providerId?: string,
    filters?: {
      legalArea?: string
      urgency?: string
      serviceType?: string
      budgetMin?: number
      budgetMax?: number
    }
  ): Promise<Delegation[]> {
    try {
      await this.initializeSupabase()

      let query = this.supabase
        .from('delegations')
        .select(`
          *,
          office:organizations(name),
          proposal_count:delegation_proposals(count)
        `)
        .eq('status', 'open')

      // Aplicar filtros
      if (filters?.legalArea) {
        query = query.eq('legal_area', filters.legalArea)
      }

      if (filters?.urgency) {
        query = query.eq('urgency', filters.urgency)
      }

      if (filters?.serviceType) {
        query = query.eq('service_type', filters.serviceType)
      }

      if (filters?.budgetMin) {
        query = query.gte('budget_min', filters.budgetMin)
      }

      if (filters?.budgetMax) {
        query = query.lte('budget_max', filters.budgetMax)
      }

      query = query.order('priority', { ascending: false })
                  .order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error('Get open delegations error:', error)
        return []
      }

      return data.map((d: any) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        legalArea: d.legal_area,
        urgency: d.urgency,
        serviceType: d.service_type,
        status: d.status,
        budgetMin: d.budget_min,
        budgetMax: d.budget_max,
        deadline: d.deadline,
        createdAt: d.created_at,
        proposalCount: d.proposal_count?.[0]?.count || 0,
        officeName: d.office?.name
      }))

    } catch (error: any) {
      console.error('Get open delegations service error:', error)
      return []
    }
  }

  /**
   * Prestador responder à delegação (aceitar/rejeitar)
   */
  async respondToDelegation(
    delegationId: string,
    providerId: string,
    response: 'accepted' | 'rejected',
    message?: string
  ): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      await this.initializeSupabase()

      // Verificar se a delegação ainda está aberta
      const { data: delegation } = await this.supabase
        .from('delegations')
        .select('status, provider_response, provider_id')
        .eq('id', delegationId)
        .single()

      if (!delegation || delegation.status !== 'open') {
        return {
          success: false,
          error: 'Esta delegação não está mais disponível'
        }
      }

      if (delegation.provider_response !== 'pending') {
        return {
          success: false,
          error: 'Você já respondeu a esta delegação'
        }
      }

      // Atualizar resposta do prestador
      const updateData: any = {
        provider_response: response,
        provider_response_at: new Date().toISOString(),
        provider_response_message: message
      }

      // Se aceito, atribuir o prestador e mudar status
      if (response === 'accepted') {
        updateData.provider_id = providerId
        updateData.status = 'matched'
      }

      const { error } = await this.supabase
        .from('delegations')
        .update(updateData)
        .eq('id', delegationId)

      if (error) {
        console.error('Respond to delegation error:', error)
        return {
          success: false,
          error: 'Erro ao responder delegação'
        }
      }

      // Buscar dados do prestador para auditoria
      const { data: providerData } = await this.supabase
        .from('providers')
        .select('full_name, email')
        .eq('id', providerId)
        .single()

      // Log de auditoria
      await this.auditService.logProviderResponse(
        delegationId,
        response,
        message,
        {
          userId: providerId,
          userType: 'provider',
          userName: providerData?.full_name,
          userEmail: providerData?.email
        }
      )

      if (response === 'accepted') {
        await this.auditService.logDelegationStatusChanged(
          delegationId,
          'open',
          'matched',
          providerId,
          {
            userId: providerId,
            userType: 'provider',
            userName: providerData?.full_name,
            userEmail: providerData?.email
          }
        )
      }

      return {
        success: true
      }

    } catch (error: any) {
      console.error('Respond to delegation service error:', error)
      return {
        success: false,
        error: 'Erro interno no serviço'
      }
    }
  }

  /**
   * Listar propostas de uma delegação
   */
  async getDelegationProposals(delegationId: string): Promise<any[]> {
    try {
      await this.initializeSupabase()

      const { data, error } = await this.supabase
        .from('delegation_proposals')
        .select(`
          *,
          provider:providers(full_name, experience_level, quality_rating)
        `)
        .eq('delegation_id', delegationId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Get delegation proposals error:', error)
        return []
      }

      return data.map((p: any) => ({
        id: p.id,
        delegationId: p.delegation_id,
        providerId: p.provider_id,
        providerName: p.provider?.full_name || 'Prestador',
        providerExperience: p.provider?.experience_level || 'junior',
        providerRating: p.provider?.quality_rating || 0,
        message: p.message,
        proposedAmount: p.proposed_amount,
        estimatedDelivery: p.estimated_delivery,
        status: p.status,
        createdAt: p.created_at
      }))

    } catch (error: any) {
      console.error('Get delegation proposals service error:', error)
      return []
    }
  }

  /**
   * Aceitar proposta
   */
  async acceptProposal(
    proposalId: string,
    respondedBy: string,
    response?: string
  ): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      await this.initializeSupabase()

      // Buscar proposta
      const { data: proposal, error: proposalError } = await this.supabase
        .from('delegation_proposals')
        .select('delegation_id, provider_id, proposed_amount')
        .eq('id', proposalId)
        .single()

      if (proposalError || !proposal) {
        return {
          success: false,
          error: 'Proposta não encontrada'
        }
      }

      // Atualizar proposta como aceita
      const { error: updateProposalError } = await this.supabase
        .from('delegation_proposals')
        .update({
          status: 'accepted',
          office_response: response,
          responded_at: new Date().toISOString(),
          responded_by: respondedBy
        })
        .eq('id', proposalId)

      if (updateProposalError) {
        console.error('Update proposal error:', updateProposalError)
        return {
          success: false,
          error: 'Erro ao aceitar proposta'
        }
      }

      // Atualizar delegação
      const { error: updateDelegationError } = await this.supabase
        .from('delegations')
        .update({
          status: 'matched',
          provider_id: proposal.provider_id,
          agreed_amount: proposal.proposed_amount
        })
        .eq('id', proposal.delegation_id)

      if (updateDelegationError) {
        console.error('Update delegation error:', updateDelegationError)
        return {
          success: false,
          error: 'Erro ao atualizar delegação'
        }
      }

      // Rejeitar outras propostas
      await this.supabase
        .from('delegation_proposals')
        .update({
          status: 'rejected',
          office_response: 'Outra proposta foi aceita',
          responded_at: new Date().toISOString(),
          responded_by: respondedBy
        })
        .eq('delegation_id', proposal.delegation_id)
        .neq('id', proposalId)

      return { success: true }

    } catch (error: any) {
      console.error('Accept proposal service error:', error)
      return {
        success: false,
        error: 'Erro interno no serviço'
      }
    }
  }

  /**
   * Rejeitar proposta
   */
  async rejectProposal(
    proposalId: string,
    respondedBy: string,
    response: string
  ): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      await this.initializeSupabase()

      const { error } = await this.supabase
        .from('delegation_proposals')
        .update({
          status: 'rejected',
          office_response: response,
          responded_at: new Date().toISOString(),
          responded_by: respondedBy
        })
        .eq('id', proposalId)

      if (error) {
        console.error('Reject proposal error:', error)
        return {
          success: false,
          error: 'Erro ao rejeitar proposta'
        }
      }

      return { success: true }

    } catch (error: any) {
      console.error('Reject proposal service error:', error)
      return {
        success: false,
        error: 'Erro interno no serviço'
      }
    }
  }

  /**
   * Atualizar status da delegação
   */
  async updateDelegationStatus(
    delegationId: string,
    status: string,
    metadata?: Record<string, any>
  ): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      await this.initializeSupabase()

      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }

      if (metadata) {
        updateData.metadata = metadata
      }

      const { error } = await this.supabase
        .from('delegations')
        .update(updateData)
        .eq('id', delegationId)

      if (error) {
        console.error('Update delegation status error:', error)
        return {
          success: false,
          error: 'Erro ao atualizar status'
        }
      }

      return { success: true }

    } catch (error: any) {
      console.error('Update delegation status service error:', error)
      return {
        success: false,
        error: 'Erro interno no serviço'
      }
    }
  }

  /**
   * Buscar delegação por ID
   */
  async getDelegationById(delegationId: string): Promise<any> {
    try {
      await this.initializeSupabase()

      const { data, error } = await this.supabase
        .from('delegations')
        .select(`
          *,
          office:organizations(name, email),
          provider:providers(full_name, email, experience_level),
          created_by_user:users!delegations_created_by_fkey(full_name, email)
        `)
        .eq('id', delegationId)
        .single()

      if (error) {
        console.error('Get delegation by ID error:', error)
        return null
      }

      return data

    } catch (error: any) {
      console.error('Get delegation by ID service error:', error)
      return null
    }
  }

  /**
   * Buscar delegações do prestador
   */
  async getProviderDelegations(providerId: string): Promise<Delegation[]> {
    try {
      await this.initializeSupabase()

      const { data, error } = await this.supabase
        .from('delegations')
        .select(`
          *,
          office:organizations(name)
        `)
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Get provider delegations error:', error)
        return []
      }

      return data.map((d: any) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        legalArea: d.legal_area,
        urgency: d.urgency,
        serviceType: d.service_type,
        status: d.status,
        budgetMin: d.budget_min,
        budgetMax: d.budget_max,
        deadline: d.deadline,
        createdAt: d.created_at,
        proposalCount: 0,
        officeName: d.office?.name
      }))

    } catch (error: any) {
      console.error('Get provider delegations service error:', error)
      return []
    }
  }
}
