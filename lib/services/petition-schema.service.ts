import { createClient } from '@/lib/supabase/client'
import type { 
  PetitionSchema, 
  ServiceType, 
  LegalArea,
  PetitionTemplate,
  PetitionValidation,
  SchemaField
} from '@/lib/types/petition.types'

class PetitionSchemaService {
  private getSupabase() {
    return createClient()
  }

  /**
   * Get schema for a specific service type and legal area
   */
  async getSchema(
    serviceType: ServiceType,
    legalArea: LegalArea
  ): Promise<PetitionSchema | null> {
    const { data, error } = await this.getSupabase()
      .from('petition_schemas')
      .select('*')
      .eq('service_type', serviceType)
      .eq('legal_area', legalArea)
      .eq('active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching schema:', error)
      throw error
    }

    return data
  }

  /**
   * Get all active schemas
   */
  async getAllSchemas(): Promise<PetitionSchema[]> {
    const { data, error } = await this.getSupabase()
      .from('petition_schemas')
      .select('*')
      .eq('active', true)
      .order('service_type', { ascending: true })
      .order('legal_area', { ascending: true })

    if (error) {
      console.error('Error fetching schemas:', error)
      throw error
    }

    return data || []
  }

  /**
   * Create or update a schema
   */
  async upsertSchema(schema: Partial<PetitionSchema>): Promise<PetitionSchema> {
    const { data, error } = await this.getSupabase()
      .from('petition_schemas')
      .upsert(schema)
      .select()
      .single()

    if (error) {
      console.error('Error upserting schema:', error)
      throw error
    }

    return data
  }

  /**
   * Validate petition data against schema
   */
  validateData(
    data: Record<string, any>,
    schema: PetitionSchema
  ): PetitionValidation {
    const errors: PetitionValidation['errors'] = []
    const warnings: string[] = []
    const suggestions: PetitionValidation['suggestions'] = []

    // Check required fields
    Object.entries(schema.fields).forEach(([fieldName, field]) => {
      const value = data[fieldName]

      // Check if required field is missing
      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field: fieldName,
          message: `Campo obrigatório: ${field.description || fieldName}`,
          severity: 'error'
        })
        return
      }

      // Skip validation if field is not provided and not required
      if (!field.required && (value === undefined || value === null)) {
        return
      }

      // Type validation
      if (!this.validateFieldType(value, field)) {
        errors.push({
          field: fieldName,
          message: `Tipo inválido para ${fieldName}. Esperado: ${field.type}`,
          severity: 'error'
        })
      }

      // Additional validations
      if (field.validation) {
        const validation = field.validation

        if (validation.minLength && value.length < validation.minLength) {
          errors.push({
            field: fieldName,
            message: `${fieldName} deve ter no mínimo ${validation.minLength} caracteres`,
            severity: 'error'
          })
        }

        if (validation.maxLength && value.length > validation.maxLength) {
          warnings.push(`${fieldName} excede o limite de ${validation.maxLength} caracteres`)
        }

        if (validation.pattern) {
          const regex = new RegExp(validation.pattern)
          if (!regex.test(value)) {
            errors.push({
              field: fieldName,
              message: `${fieldName} não corresponde ao formato esperado`,
              severity: 'error'
            })
          }
        }

        if (validation.enum && !validation.enum.includes(value)) {
          errors.push({
            field: fieldName,
            message: `${fieldName} deve ser um dos valores: ${validation.enum.join(', ')}`,
            severity: 'error'
          })
        }
      }

      // Generate suggestions for common fields
      if (!value && !field.required) {
        suggestions.push({
          field: fieldName,
          suggestion: this.generateFieldSuggestion(fieldName, schema)
        })
      }
    })

    // Check for extra fields not in schema
    Object.keys(data).forEach(key => {
      if (!schema.fields[key]) {
        warnings.push(`Campo não reconhecido: ${key}`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    }
  }

  /**
   * Get templates for a specific schema
   */
  async getTemplates(
    schemaId: string,
    officeId?: string
  ): Promise<PetitionTemplate[]> {
    let query = this.getSupabase()
      .from('petition_templates')
      .select('*')
      .eq('schema_id', schemaId)

    if (officeId) {
      query = query.or(`office_id.eq.${officeId},is_public.eq.true`)
    } else {
      query = query.eq('is_public', true)
    }

    const { data, error } = await query
      .order('usage_count', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching templates:', error)
      throw error
    }

    return data || []
  }

  /**
   * Save a successful petition as template
   */
  async saveAsTemplate(
    template: Partial<PetitionTemplate>
  ): Promise<PetitionTemplate> {
    const { data, error } = await this.getSupabase()
      .from('petition_templates')
      .insert(template)
      .select()
      .single()

    if (error) {
      console.error('Error saving template:', error)
      throw error
    }

    // Increment usage count
    await this.incrementTemplateUsage(data.id)

    return data
  }

  /**
   * Increment template usage count
   */
  async incrementTemplateUsage(templateId: string): Promise<void> {
    const { error } = await this.getSupabase()
      .rpc('increment_template_usage', { template_id: templateId })

    if (error) {
      console.error('Error incrementing usage:', error)
    }
  }

  /**
   * Get default schemas for common petition types
   */
  getDefaultSchemas(): Partial<PetitionSchema>[] {
    return [
      {
        service_type: 'peticao_inicial' as ServiceType,
        legal_area: 'civel' as LegalArea,
        name: 'Petição Inicial Cível',
        fields: {
          autor: {
            name: 'autor',
            type: 'string',
            required: true,
            description: 'Nome completo e qualificação do autor',
            validation: { minLength: 3 }
          },
          reu: {
            name: 'reu',
            type: 'string',
            required: true,
            description: 'Nome completo e qualificação do réu',
            validation: { minLength: 3 }
          },
          fatos: {
            name: 'fatos',
            type: 'string',
            required: true,
            description: 'Descrição dos fatos',
            validation: { minLength: 50 },
            consolidation: 'concatenate' as any
          },
          fundamentacao: {
            name: 'fundamentacao',
            type: 'string',
            required: false,
            description: 'Fundamentação jurídica',
            consolidation: 'concatenate' as any
          },
          pedidos: {
            name: 'pedidos',
            type: 'array',
            required: true,
            description: 'Lista de pedidos',
            consolidation: 'merge_list' as any
          },
          valor_causa: {
            name: 'valor_causa',
            type: 'string',
            required: true,
            description: 'Valor da causa',
            validation: { pattern: '^R\\$\\s*[0-9.,]+$' }
          },
          provas: {
            name: 'provas',
            type: 'array',
            required: false,
            description: 'Provas a produzir',
            consolidation: 'merge_list' as any
          }
        },
        instructions: 'Gere uma petição inicial completa seguindo o CPC, com endereçamento, qualificação das partes, narrativa dos fatos, fundamentação jurídica, pedidos e valor da causa.',
        style_preferences: {
          formality: 'formal',
          structure: 'tradicional',
          citations: 'completa'
        },
        active: true,
        version: 1
      },
      {
        service_type: 'contestacao' as ServiceType,
        legal_area: 'civel' as LegalArea,
        name: 'Contestação Cível',
        fields: {
          reu: {
            name: 'reu',
            type: 'string',
            required: true,
            description: 'Nome do réu/contestante'
          },
          autor: {
            name: 'autor',
            type: 'string',
            required: true,
            description: 'Nome do autor da ação'
          },
          processo: {
            name: 'processo',
            type: 'string',
            required: false,
            description: 'Número do processo',
            validation: { pattern: '^[0-9.-]+$' }
          },
          preliminares: {
            name: 'preliminares',
            type: 'array',
            required: false,
            description: 'Preliminares a arguir',
            consolidation: 'merge_list' as any
          },
          merito: {
            name: 'merito',
            type: 'string',
            required: true,
            description: 'Defesa de mérito',
            consolidation: 'concatenate' as any
          },
          provas: {
            name: 'provas',
            type: 'array',
            required: false,
            description: 'Provas a produzir',
            consolidation: 'merge_list' as any
          }
        },
        instructions: 'Gere uma contestação completa, iniciando com preliminares (se houver), seguida da defesa de mérito, impugnando os fatos e argumentos do autor.',
        style_preferences: {
          formality: 'formal',
          structure: 'tradicional',
          citations: 'completa'
        },
        active: true,
        version: 1
      },
      {
        service_type: 'agravo_instrumento' as ServiceType,
        legal_area: 'civel' as LegalArea,
        name: 'Agravo de Instrumento Cível',
        fields: {
          agravante: {
            name: 'agravante',
            type: 'string',
            required: true,
            description: 'Nome do agravante'
          },
          agravado: {
            name: 'agravado',
            type: 'string',
            required: true,
            description: 'Nome do agravado'
          },
          decisao: {
            name: 'decisao',
            type: 'string',
            required: true,
            description: 'Decisão agravada',
            validation: { minLength: 50 }
          },
          fundamentos: {
            name: 'fundamentos',
            type: 'string',
            required: true,
            description: 'Fundamentos do recurso',
            consolidation: 'concatenate' as any
          },
          urgencia: {
            name: 'urgencia',
            type: 'string',
            required: false,
            description: 'Justificativa da urgência'
          },
          pedido_liminar: {
            name: 'pedido_liminar',
            type: 'string',
            required: false,
            description: 'Pedido de efeito suspensivo/antecipação de tutela'
          }
        },
        instructions: 'Gere um agravo de instrumento com a qualificação das partes, síntese da decisão agravada, demonstração do cabimento, fundamentos da reforma e pedidos.',
        style_preferences: {
          formality: 'formal',
          structure: 'tradicional',
          citations: 'essencial'
        },
        active: true,
        version: 1
      }
    ]
  }

  // Private helper methods

  private validateFieldType(value: any, field: SchemaField): boolean {
    switch (field.type) {
      case 'string':
        return typeof value === 'string'
      case 'number':
        return typeof value === 'number' || !isNaN(Number(value))
      case 'boolean':
        return typeof value === 'boolean'
      case 'array':
        return Array.isArray(value)
      case 'object':
        return typeof value === 'object' && !Array.isArray(value)
      default:
        return true
    }
  }

  private generateFieldSuggestion(fieldName: string, schema: PetitionSchema): string {
    const suggestions: Record<string, string> = {
      valor_causa: 'Considere incluir o valor da causa para cálculo de custas',
      provas: 'Liste as provas que pretende produzir (documental, testemunhal, pericial)',
      urgencia: 'Se houver urgência, descreva os motivos e o perigo da demora',
      preliminares: 'Verifique se há preliminares a arguir (incompetência, inépcia, etc.)',
      fundamentacao: 'Adicione fundamentação jurídica com citação de leis e jurisprudência'
    }

    return suggestions[fieldName] || `Considere preencher o campo ${fieldName}`
  }
}

export const petitionSchemaService = new PetitionSchemaService()