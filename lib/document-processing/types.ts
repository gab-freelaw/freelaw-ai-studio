/**
 * Shared types for document processing
 * Can be imported in both client and server components
 */

// Legal service types (Brazilian law)
export enum ServiceType {
  AGRAVO_INSTRUMENTO = 'agravo_instrumento',
  APELACAO = 'apelacao',
  RECURSO_ESPECIAL = 'recurso_especial',
  RECURSO_EXTRAORDINARIO = 'recurso_extraordinario',
  EMBARGOS_DECLARACAO = 'embargos_declaracao',
  MANDADO_SEGURANCA = 'mandado_seguranca',
  ACAO_ORDINARIA = 'acao_ordinaria',
  ACAO_CAUTELAR = 'acao_cautelar',
  PETICAO_INICIAL = 'peticao_inicial',
  CONTESTACAO = 'contestacao',
  CONTRATO = 'contrato',
}

// Legal areas
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
  AMBIENTAL = 'ambiental',
}

// Document processing configuration
export const PROCESSING_CONFIG = {
  CHUNK_SIZE: 10000, // characters per chunk
  MAX_PARALLEL_CHUNKS: 5,
  CONSOLIDATION_STRATEGIES: {
    FIRST_NON_NULL: 'first_non_null',
    MERGE_LIST: 'merge_list',
    CONCATENATE: 'concatenate',
    MOST_COMPLETE: 'most_complete',
  }
} as const;

// Extraction schema types
export interface ExtractionSchema {
  id: string;
  name: string;
  description: string;
  service_type: ServiceType;
  legal_area: LegalArea;
  fields: Record<string, FieldConfig>;
  prompt_template?: string;
}

export interface FieldConfig {
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  description: string;
  required: boolean;
  consolidation?: 'first_non_null' | 'merge_list' | 'concatenate' | 'most_complete';
  extraction_hints?: string[];
}