
-- =====================================================
-- FREELAW AI DATABASE SETUP
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  oab_number TEXT,
  role TEXT NOT NULL DEFAULT 'lawyer' CHECK (role IN ('admin', 'lawyer', 'paralegal', 'client')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  specialties JSONB,
  experience JSONB,
  settings JSONB DEFAULT '{}',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  cnpj TEXT,
  type TEXT NOT NULL DEFAULT 'law_firm' CHECK (type IN ('law_firm', 'company', 'individual')),
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
  logo_url TEXT,
  website TEXT,
  metadata JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Organization members table
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  permissions JSONB,
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('contract', 'petition', 'ruling', 'law', 'doctrine', 'other')),
  category TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  content TEXT,
  summary TEXT,
  embedding vector(1536),
  metadata JSONB,
  tags JSONB,
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Document versions table
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  changes JSONB,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- AI chats table
CREATE TABLE IF NOT EXISTS ai_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('general', 'document_analysis', 'legal_research', 'contract_review', 'case_analysis')),
  model TEXT NOT NULL DEFAULT 'gpt-4',
  system_prompt TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- AI messages table
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES ai_chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  document_ids JSONB,
  citations JSONB,
  token_count INTEGER,
  cost DECIMAL(10, 6),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- AI prompt templates table
CREATE TABLE IF NOT EXISTS ai_prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  prompt TEXT NOT NULL,
  variables JSONB,
  is_public BOOLEAN NOT NULL DEFAULT false,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- AI usage metrics table
CREATE TABLE IF NOT EXISTS ai_usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  date TIMESTAMP NOT NULL,
  model TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  total_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  metadata JSONB,
  UNIQUE(organization_id, user_id, date, model)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_documents_organization ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_ai_chats_user ON ai_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_chat ON ai_messages(chat_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_chats_updated_at BEFORE UPDATE ON ai_chats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_prompt_templates_updated_at BEFORE UPDATE ON ai_prompt_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- EXTRACTION SCHEMAS
-- =====================================================

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
