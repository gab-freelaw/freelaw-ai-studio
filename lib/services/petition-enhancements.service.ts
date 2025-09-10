import { createClient } from '@/lib/supabase/client'
import type { PetitionGenerationResult } from '@/lib/types/petition.types'

/**
 * Service for enhanced petition features based on analysis of other Freelaw projects
 */
export class PetitionEnhancementsService {
  private getSupabase() {
    return createClient()
  }

  /**
   * Extract key information from uploaded documents to auto-fill petition forms
   * Inspired by the "lever" project's dynamic extraction
   */
  async extractDocumentData(file: File): Promise<Record<string, any>> {
    try {
      const base64 = await this.fileToBase64(file)
      
      // Call AI to extract structured data from document
      const response = await fetch('/api/documents/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentBase64: base64,
          extractionSchema: {
            parties: {
              plaintiff: { type: 'string', description: 'Nome do autor/requerente' },
              defendant: { type: 'string', description: 'Nome do réu/requerido' },
              lawyers: { type: 'array', description: 'Advogados das partes' }
            },
            case: {
              number: { type: 'string', description: 'Número do processo' },
              court: { type: 'string', description: 'Tribunal/Vara' },
              subject: { type: 'string', description: 'Assunto/Matéria' },
              value: { type: 'string', description: 'Valor da causa' }
            },
            facts: {
              summary: { type: 'string', description: 'Resumo dos fatos' },
              timeline: { type: 'array', description: 'Cronologia dos eventos' },
              evidence: { type: 'array', description: 'Provas mencionadas' }
            },
            requests: {
              main: { type: 'array', description: 'Pedidos principais' },
              preliminary: { type: 'array', description: 'Pedidos preliminares' },
              urgency: { type: 'string', description: 'Justificativa de urgência' }
            }
          }
        })
      })

      if (!response.ok) throw new Error('Failed to extract document data')
      
      const data = await response.json()
      return data.extractedData || {}
    } catch (error) {
      console.error('Error extracting document data:', error)
      return {}
    }
  }

  /**
   * Generate petition suggestions based on case analysis
   * Inspired by the AI chat's contextual suggestions
   */
  async generatePetitionSuggestions(
    caseType: string,
    facts: string
  ): Promise<{
    suggestedType: string
    relevantLaws: string[]
    keyArguments: string[]
    precedents: string[]
    strategy: string
  }> {
    try {
      const response = await fetch('/api/ai/analyze-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseType, facts })
      })

      if (!response.ok) throw new Error('Failed to analyze case')
      
      const analysis = await response.json()
      
      return {
        suggestedType: analysis.suggestedPetitionType || caseType,
        relevantLaws: analysis.relevantLaws || [],
        keyArguments: analysis.keyArguments || [],
        precedents: analysis.precedents || [],
        strategy: analysis.strategy || ''
      }
    } catch (error) {
      console.error('Error generating suggestions:', error)
      return {
        suggestedType: caseType,
        relevantLaws: [],
        keyArguments: [],
        precedents: [],
        strategy: ''
      }
    }
  }

  /**
   * Create petition from process timeline
   * Allows generating petitions based on process history
   */
  async createPetitionFromProcess(
    processId: string,
    petitionType: string
  ): Promise<Partial<PetitionGenerationResult>> {
    try {
      // Get process data
      const { data: processData, error } = await this.getSupabase()
        .from('processes')
        .select('*')
        .eq('id', processId)
        .single()

      if (error || !processData) {
        throw new Error('Process not found')
      }

      // Get process timeline/movements
      const { data: movements } = await this.getSupabase()
        .from('process_movements')
        .select('*')
        .eq('process_id', processId)
        .order('date', { ascending: false })
        .limit(10)

      // Build context from process data
      const context = {
        processNumber: processData.number,
        parties: {
          plaintiff: processData.plaintiff,
          defendant: processData.defendant
        },
        court: processData.court,
        subject: processData.subject,
        value: processData.value,
        lastMovements: movements?.map(m => ({
          date: m.date,
          description: m.description,
          type: m.type
        })) || []
      }

      // Generate petition with process context
      const response = await fetch('/api/petitions/generate-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: petitionType,
          legal_area: processData.legal_area || 'civel',
          data: {
            ...context,
            process_context: true,
            auto_filled: true
          },
          use_office_style: true
        })
      })

      if (!response.ok) throw new Error('Failed to generate petition')
      
      return await response.json()
    } catch (error) {
      console.error('Error creating petition from process:', error)
      throw error
    }
  }

  /**
   * Batch petition generation for multiple similar cases
   */
  async generateBatchPetitions(
    template: string,
    cases: Array<Record<string, any>>
  ): Promise<PetitionGenerationResult[]> {
    const results: PetitionGenerationResult[] = []
    
    // Process in batches of 3 to avoid overload
    const batchSize = 3
    for (let i = 0; i < cases.length; i += batchSize) {
      const batch = cases.slice(i, i + batchSize)
      
      const batchPromises = batch.map(caseData =>
        fetch('/api/petitions/generate-v2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId: template,
            data: caseData,
            use_office_style: true,
            use_cache: true // Use cache for similar petitions
          })
        }).then(res => res.json())
      )
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }
    
    return results
  }

  /**
   * Get petition recommendations based on user history
   */
  async getRecommendedTemplates(
    officeId: string,
    currentCase?: Record<string, any>
  ): Promise<Array<{
    templateId: string
    name: string
    relevance: number
    reason: string
  }>> {
    try {
      // Get user's petition history
      const { data: history } = await this.getSupabase()
        .from('petition_generation_logs')
        .select('service_type, legal_area, confidence_score')
        .eq('office_id', officeId)
        .order('created_at', { ascending: false })
        .limit(20)

      // Get most used templates
      const { data: templates } = await this.getSupabase()
        .from('petition_templates')
        .select('*')
        .eq('office_id', officeId)
        .order('usage_count', { ascending: false })
        .limit(5)

      // Calculate recommendations
      const recommendations = []
      
      if (templates) {
        for (const template of templates) {
          const relevance = this.calculateRelevance(template, currentCase, history)
          recommendations.push({
            templateId: template.id,
            name: template.name,
            relevance,
            reason: this.getRecommendationReason(template, relevance)
          })
        }
      }

      // Sort by relevance
      return recommendations.sort((a, b) => b.relevance - a.relevance)
    } catch (error) {
      console.error('Error getting recommendations:', error)
      return []
    }
  }

  /**
   * Version control for petitions - track changes
   */
  async savePetitionVersion(
    petitionId: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      const { data, error } = await this.getSupabase()
        .from('petition_versions')
        .insert({
          petition_id: petitionId,
          content,
          metadata,
          version: 1 // Simplificado para evitar erro SQL
        })
        .select('id')
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('Error saving petition version:', error)
      throw error
    }
  }

  /**
   * Compare petition versions (diff)
   */
  async comparePetitionVersions(
    versionId1: string,
    versionId2: string
  ): Promise<{
    additions: string[]
    deletions: string[]
    modifications: string[]
  }> {
    try {
      const [version1, version2] = await Promise.all([
        this.getSupabase()
          .from('petition_versions')
          .select('content')
          .eq('id', versionId1)
          .single(),
        this.getSupabase()
          .from('petition_versions')
          .select('content')
          .eq('id', versionId2)
          .single()
      ])

      if (!version1.data || !version2.data) {
        throw new Error('Version not found')
      }

      // Simple diff implementation (could be enhanced with diff library)
      const lines1 = version1.data.content.split('\n')
      const lines2 = version2.data.content.split('\n')
      
      const additions: string[] = []
      const deletions: string[] = []
      const modifications: string[] = []

      // Compare lines
      const maxLength = Math.max(lines1.length, lines2.length)
      for (let i = 0; i < maxLength; i++) {
        if (i >= lines1.length) {
          additions.push(lines2[i])
        } else if (i >= lines2.length) {
          deletions.push(lines1[i])
        } else if (lines1[i] !== lines2[i]) {
          modifications.push(`Line ${i + 1}: "${lines1[i]}" → "${lines2[i]}"`)
        }
      }

      return { additions, deletions, modifications }
    } catch (error) {
      console.error('Error comparing versions:', error)
      throw error
    }
  }

  // Private helper methods

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const base64 = reader.result as string
        resolve(base64.split(',')[1])
      }
      reader.onerror = reject
    })
  }

  private calculateRelevance(
    template: any,
    currentCase: Record<string, any> | undefined,
    history: any[] | null
  ): number {
    let relevance = 0
    
    // Base relevance from usage count
    relevance += Math.min(template.usage_count * 0.1, 30)
    
    // Success rate contribution
    if (template.success_rate) {
      relevance += template.success_rate * 0.3
    }
    
    // Match with current case type
    if (currentCase?.type === template.service_type) {
      relevance += 20
    }
    
    // Historical preference
    if (history) {
      const similarCases = history.filter(h => 
        h.service_type === template.service_type
      ).length
      relevance += similarCases * 5
    }
    
    return Math.min(relevance, 100)
  }

  private getRecommendationReason(template: any, relevance: number): string {
    if (relevance > 80) {
      return 'Altamente recomendado baseado no seu histórico'
    } else if (relevance > 60) {
      return 'Frequentemente usado em casos similares'
    } else if (relevance > 40) {
      return 'Pode ser útil para este tipo de caso'
    } else {
      return 'Template disponível'
    }
  }
}

export const petitionEnhancementsService = new PetitionEnhancementsService()