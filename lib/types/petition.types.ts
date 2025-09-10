export enum ServiceType {
  PETICAO_INICIAL = 'peticao_inicial',
  CONTESTACAO = 'contestacao',
  RECURSO_APELACAO = 'recurso_apelacao',
  AGRAVO_INSTRUMENTO = 'agravo_instrumento',
  RECURSO_ESPECIAL = 'recurso_especial',
  RECURSO_EXTRAORDINARIO = 'recurso_extraordinario',
  EMBARGOS_DECLARACAO = 'embargos_declaracao',
  MANDADO_SEGURANCA = 'mandado_seguranca',
  ACAO_ORDINARIA = 'acao_ordinaria',
  ACAO_CAUTELAR = 'acao_cautelar'
}

export enum LegalArea {
  CIVEL = 'civel',
  CRIMINAL = 'criminal',
  TRABALHISTA = 'trabalhista',
  TRIBUTARIO = 'tributario',
  ADMINISTRATIVO = 'administrativo',
  CONSTITUCIONAL = 'constitucional',
  EMPRESARIAL = 'empresarial',
  FAMILIA = 'familia',
  CONSUMIDOR = 'consumidor',
  AMBIENTAL = 'ambiental'
}

export enum ConsolidationStrategy {
  FIRST_NON_NULL = 'first_non_null',
  MERGE_LIST = 'merge_list',
  CONCATENATE = 'concatenate',
  MOST_COMPLETE = 'most_complete'
}

export interface SchemaField {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  required: boolean
  description?: string
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
    enum?: string[]
  }
  consolidation?: ConsolidationStrategy
  defaultValue?: any
}

export interface PetitionSchema {
  id: string
  service_type: ServiceType
  legal_area: LegalArea
  name: string
  description?: string
  fields: Record<string, SchemaField>
  instructions: string
  examples?: string[]
  active: boolean
  version: number
  style_preferences?: {
    formality: 'formal' | 'moderado' | 'objetivo'
    structure: 'tradicional' | 'moderna' | 'concisa'
    citations: 'completa' | 'essencial' | 'minima'
  }
  created_at?: string
  updated_at?: string
}

export interface PetitionTemplate {
  id: string
  schema_id: string
  office_id: string
  name: string
  description?: string
  content: string
  variables: Record<string, any>
  tags?: string[]
  usage_count: number
  success_rate?: number
  is_public: boolean
  created_at?: string
  updated_at?: string
}

export interface PetitionGenerationRequest {
  service_type: ServiceType
  legal_area: LegalArea
  office_id?: string
  data: Record<string, any>
  use_office_style?: boolean
  use_letterhead?: boolean
  style_preferences?: PetitionSchema['style_preferences']
  template_id?: string
}

export interface PetitionChunk {
  index: number
  total: number
  section: 'header' | 'facts' | 'legal_basis' | 'requests' | 'conclusion'
  content: string
  tokens?: number
}

export interface PetitionGenerationResult {
  id: string
  petition_text: string
  chunks_processed?: PetitionChunk[]
  processing_time: number
  model_used: string
  cost_estimate?: number
  office_style_applied?: boolean
  letterhead_applied?: boolean
  template_used?: string
  confidence_score?: number
  validation_errors?: string[]
}

export interface PetitionValidation {
  isValid: boolean
  errors: Array<{
    field: string
    message: string
    severity: 'error' | 'warning'
  }>
  warnings: string[]
  suggestions: Array<{
    field: string
    suggestion: string
  }>
}