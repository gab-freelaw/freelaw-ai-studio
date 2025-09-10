-- Extraction schemas for different document types
CREATE TABLE IF NOT EXISTS extraction_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  service_type TEXT NOT NULL,
  legal_area TEXT NOT NULL,
  fields JSONB NOT NULL,
  prompt_template TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(service_type, legal_area)
);

-- Document extractions table
CREATE TABLE IF NOT EXISTS document_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  schema_id UUID REFERENCES extraction_schemas(id),
  service_type TEXT NOT NULL,
  legal_area TEXT NOT NULL,
  extracted_data JSONB NOT NULL,
  confidence_score DECIMAL(3, 2),
  processing_time INTEGER, -- milliseconds
  chunks_processed INTEGER,
  model_used TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_extraction_schemas_type ON extraction_schemas(service_type, legal_area);
CREATE INDEX IF NOT EXISTS idx_document_extractions_document ON document_extractions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_extractions_status ON document_extractions(status);

-- Add triggers for updated_at
CREATE TRIGGER update_extraction_schemas_updated_at BEFORE UPDATE ON extraction_schemas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_extractions_updated_at BEFORE UPDATE ON document_extractions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default extraction schemas
INSERT INTO extraction_schemas (name, description, service_type, legal_area, fields) VALUES
(
  'Petição Inicial Cível',
  'Extração de dados de petições iniciais na área cível',
  'peticao_inicial',
  'civel',
  '{
    "autor": {
      "type": "object",
      "description": "Dados completos do autor/requerente",
      "required": true,
      "consolidation": "most_complete",
      "extraction_hints": ["AUTOR", "REQUERENTE", "EXEQUENTE"]
    },
    "reu": {
      "type": "object", 
      "description": "Dados completos do réu/requerido",
      "required": true,
      "consolidation": "most_complete",
      "extraction_hints": ["RÉU", "REQUERIDO", "EXECUTADO"]
    },
    "valor_causa": {
      "type": "string",
      "description": "Valor dado à causa",
      "required": false,
      "consolidation": "first_non_null",
      "extraction_hints": ["VALOR DA CAUSA", "DÁ-SE À CAUSA"]
    },
    "pedidos": {
      "type": "array",
      "description": "Lista de pedidos/requerimentos",
      "required": true,
      "consolidation": "merge_list",
      "extraction_hints": ["REQUER", "PEDE", "DOS PEDIDOS"]
    },
    "fatos": {
      "type": "string",
      "description": "Resumo dos fatos narrados",
      "required": true,
      "consolidation": "concatenate",
      "extraction_hints": ["DOS FATOS", "SÍNTESE FÁTICA"]
    },
    "fundamentos": {
      "type": "string",
      "description": "Fundamentos jurídicos",
      "required": true,
      "consolidation": "concatenate",
      "extraction_hints": ["DO DIREITO", "FUNDAMENTOS JURÍDICOS"]
    },
    "provas": {
      "type": "array",
      "description": "Provas mencionadas ou anexadas",
      "required": false,
      "consolidation": "merge_list",
      "extraction_hints": ["DAS PROVAS", "DOCUMENTOS ANEXOS"]
    }
  }'::jsonb
),
(
  'Contrato de Prestação de Serviços',
  'Extração de dados de contratos de prestação de serviços',
  'contrato',
  'empresarial',
  '{
    "contratante": {
      "type": "object",
      "description": "Dados do contratante",
      "required": true,
      "consolidation": "most_complete"
    },
    "contratado": {
      "type": "object",
      "description": "Dados do contratado",
      "required": true,
      "consolidation": "most_complete"
    },
    "objeto": {
      "type": "string",
      "description": "Objeto do contrato",
      "required": true,
      "consolidation": "first_non_null"
    },
    "valor": {
      "type": "string",
      "description": "Valor total do contrato",
      "required": true,
      "consolidation": "first_non_null"
    },
    "prazo": {
      "type": "string",
      "description": "Prazo de vigência",
      "required": true,
      "consolidation": "first_non_null"
    },
    "forma_pagamento": {
      "type": "string",
      "description": "Forma e condições de pagamento",
      "required": true,
      "consolidation": "concatenate"
    },
    "clausulas_especiais": {
      "type": "array",
      "description": "Cláusulas especiais ou observações",
      "required": false,
      "consolidation": "merge_list"
    },
    "multas": {
      "type": "object",
      "description": "Multas e penalidades previstas",
      "required": false,
      "consolidation": "most_complete"
    },
    "foro": {
      "type": "string",
      "description": "Foro de eleição",
      "required": false,
      "consolidation": "first_non_null"
    }
  }'::jsonb
),
(
  'Recurso de Apelação',
  'Extração de dados de recursos de apelação',
  'apelacao',
  'civel',
  '{
    "apelante": {
      "type": "object",
      "description": "Dados do apelante",
      "required": true,
      "consolidation": "most_complete"
    },
    "apelado": {
      "type": "object",
      "description": "Dados do apelado",
      "required": true,
      "consolidation": "most_complete"
    },
    "processo_origem": {
      "type": "string",
      "description": "Número do processo de origem",
      "required": true,
      "consolidation": "first_non_null"
    },
    "sentenca_recorrida": {
      "type": "string",
      "description": "Resumo da sentença recorrida",
      "required": true,
      "consolidation": "concatenate"
    },
    "razoes_recurso": {
      "type": "array",
      "description": "Razões do recurso",
      "required": true,
      "consolidation": "merge_list"
    },
    "pedidos": {
      "type": "array",
      "description": "Pedidos do recurso",
      "required": true,
      "consolidation": "merge_list"
    },
    "preparo": {
      "type": "object",
      "description": "Informações sobre preparo recursal",
      "required": false,
      "consolidation": "first_non_null"
    }
  }'::jsonb
);