-- =====================================================
-- COMPLETE PETITION SYSTEM MIGRATION
-- Includes all dependencies and petition-specific tables
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =====================================================
-- CORE USER AND PROFILE SYSTEM
-- =====================================================

-- Profiles table (simplified version for RLS)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'lawyer' CHECK (role IN ('admin', 'lawyer', 'paralegal', 'client')),
  oab_number TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB DEFAULT '{}',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique profile per user
  UNIQUE(user_id)
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profile policies
CREATE POLICY "Users can read their own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- OFFICES SYSTEM (Organizations)
-- =====================================================

-- Offices table
CREATE TABLE IF NOT EXISTS offices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  cnpj TEXT,
  type TEXT NOT NULL DEFAULT 'law_firm' CHECK (type IN ('law_firm', 'company', 'individual')),
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
  logo_url TEXT,
  website TEXT,
  address JSONB,
  contact_info JSONB,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Office members table
CREATE TABLE IF NOT EXISTS office_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  permissions JSONB DEFAULT '{}',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Ensure unique membership per office
  UNIQUE(office_id, user_id)
);

-- Office styles table for petition formatting
CREATE TABLE IF NOT EXISTS office_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'petition' CHECK (type IN ('petition', 'contract', 'letterhead')),
  template TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique default per office and type
  UNIQUE(office_id, type, is_default) DEFERRABLE INITIALLY DEFERRED
);

-- Enable RLS on office tables
ALTER TABLE offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_styles ENABLE ROW LEVEL SECURITY;

-- Office policies
CREATE POLICY "Anyone can read active offices" ON offices
  FOR SELECT USING (is_active = true);

CREATE POLICY "Office members can read their offices" ON offices
  FOR SELECT USING (
    id IN (
      SELECT office_id FROM office_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Office owners can manage their office" ON offices
  FOR ALL USING (
    id IN (
      SELECT office_id FROM office_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Office members policies
CREATE POLICY "Office members can read office memberships" ON office_members
  FOR SELECT USING (
    office_id IN (
      SELECT office_id FROM office_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Office owners can manage memberships" ON office_members
  FOR ALL USING (
    office_id IN (
      SELECT office_id FROM office_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Office styles policies  
CREATE POLICY "Office members can read styles" ON office_styles
  FOR SELECT USING (
    office_id IN (
      SELECT office_id FROM office_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Office admins can manage styles" ON office_styles
  FOR ALL USING (
    office_id IN (
      SELECT office_id FROM office_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- PETITION SYSTEM TABLES
-- =====================================================

-- Create petition_schemas table
CREATE TABLE IF NOT EXISTS petition_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type VARCHAR(50) NOT NULL,
  legal_area VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '{}',
  instructions TEXT NOT NULL,
  examples TEXT[],
  active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  style_preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique combination of service_type, legal_area, and version
  UNIQUE(service_type, legal_area, version)
);

-- Create petition_templates table
CREATE TABLE IF NOT EXISTS petition_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_id UUID REFERENCES petition_schemas(id) ON DELETE CASCADE,
  office_id UUID REFERENCES offices(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  tags TEXT[],
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create petition_generation_logs table for analytics
CREATE TABLE IF NOT EXISTS petition_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  petition_id UUID NOT NULL,
  schema_id UUID REFERENCES petition_schemas(id),
  template_id UUID REFERENCES petition_templates(id),
  office_id UUID REFERENCES offices(id),
  user_id UUID REFERENCES profiles(user_id),
  service_type VARCHAR(50) NOT NULL,
  legal_area VARCHAR(50) NOT NULL,
  model_used VARCHAR(100),
  processing_time_ms INTEGER,
  chunks_processed INTEGER,
  cost_estimate DECIMAL(10,4),
  confidence_score INTEGER,
  office_style_applied BOOLEAN DEFAULT false,
  letterhead_applied BOOLEAN DEFAULT false,
  validation_errors TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create petition cache table
CREATE TABLE IF NOT EXISTS petition_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(64) NOT NULL,
  office_id UUID REFERENCES offices(id) ON DELETE CASCADE,
  service_type VARCHAR(50) NOT NULL,
  legal_area VARCHAR(50) NOT NULL,
  input_hash VARCHAR(64) NOT NULL,
  petition_text TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  hit_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique cache key per office (or global if office_id is null)
  UNIQUE(cache_key, office_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Core indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_offices_slug ON offices(slug);
CREATE INDEX IF NOT EXISTS idx_office_members_office ON office_members(office_id);
CREATE INDEX IF NOT EXISTS idx_office_members_user ON office_members(user_id);
CREATE INDEX IF NOT EXISTS idx_office_styles_office ON office_styles(office_id);

-- Petition system indexes
CREATE INDEX IF NOT EXISTS idx_petition_schemas_service_area ON petition_schemas(service_type, legal_area, active);
CREATE INDEX IF NOT EXISTS idx_petition_templates_schema ON petition_templates(schema_id);
CREATE INDEX IF NOT EXISTS idx_petition_templates_office ON petition_templates(office_id);
CREATE INDEX IF NOT EXISTS idx_petition_templates_public ON petition_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_petition_logs_office ON petition_generation_logs(office_id);
CREATE INDEX IF NOT EXISTS idx_petition_logs_user ON petition_generation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_petition_logs_created ON petition_generation_logs(created_at);

-- Cache indexes
CREATE INDEX IF NOT EXISTS idx_petition_cache_key ON petition_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_petition_cache_office ON petition_cache(office_id);
CREATE INDEX IF NOT EXISTS idx_petition_cache_expires ON petition_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_petition_cache_type_area ON petition_cache(service_type, legal_area);
CREATE INDEX IF NOT EXISTS idx_petition_cache_last_accessed ON petition_cache(last_accessed);

-- =====================================================
-- RLS POLICIES FOR PETITION SYSTEM
-- =====================================================

-- Enable RLS
ALTER TABLE petition_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE petition_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE petition_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE petition_cache ENABLE ROW LEVEL SECURITY;

-- Schemas are public read, admin write
CREATE POLICY "Anyone can read active schemas" ON petition_schemas
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage schemas" ON petition_schemas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Templates: office members can read their own and public templates
CREATE POLICY "Read own office templates and public templates" ON petition_templates
  FOR SELECT USING (
    is_public = true OR
    office_id IN (
      SELECT office_id FROM office_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Office members can create templates" ON petition_templates
  FOR INSERT WITH CHECK (
    office_id IN (
      SELECT office_id FROM office_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Office members can update their templates" ON petition_templates
  FOR UPDATE USING (
    office_id IN (
      SELECT office_id FROM office_members
      WHERE user_id = auth.uid()
    )
  );

-- Logs: office members can read their own logs
CREATE POLICY "Office members can read their logs" ON petition_generation_logs
  FOR SELECT USING (
    office_id IN (
      SELECT office_id FROM office_members
      WHERE user_id = auth.uid()
    ) OR user_id = auth.uid()
  );

CREATE POLICY "System can insert logs" ON petition_generation_logs
  FOR INSERT WITH CHECK (true);

-- Cache policies
CREATE POLICY "Office members can read their cache" ON petition_cache
  FOR SELECT USING (
    office_id IS NULL OR
    office_id IN (
      SELECT office_id FROM office_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage cache" ON petition_cache
  FOR ALL USING (true);

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to increment template usage
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE petition_templates
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate template success rate
CREATE OR REPLACE FUNCTION update_template_success_rate(
  template_id UUID,
  was_successful BOOLEAN
)
RETURNS VOID AS $$
DECLARE
  current_rate DECIMAL(5,2);
  current_count INTEGER;
BEGIN
  SELECT success_rate, usage_count
  INTO current_rate, current_count
  FROM petition_templates
  WHERE id = template_id;

  IF current_rate IS NULL THEN
    current_rate := 0;
  END IF;

  -- Calculate new success rate (weighted average)
  UPDATE petition_templates
  SET success_rate = ((current_rate * current_count) + (CASE WHEN was_successful THEN 100 ELSE 0 END)) / (current_count + 1),
      updated_at = NOW()
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_petition_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM petition_cache
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get cache statistics
CREATE OR REPLACE FUNCTION get_petition_cache_stats(p_office_id UUID DEFAULT NULL)
RETURNS TABLE (
  total_entries BIGINT,
  total_hits BIGINT,
  avg_processing_time NUMERIC,
  cache_size_mb NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_entries,
    COALESCE(SUM(hit_count), 0)::BIGINT as total_hits,
    COALESCE(AVG((metadata->>'processing_time')::NUMERIC), 0) as avg_processing_time,
    COALESCE(SUM(pg_column_size(petition_text))::NUMERIC / 1024 / 1024, 0) as cache_size_mb
  FROM petition_cache
  WHERE (p_office_id IS NULL OR office_id = p_office_id)
    AND expires_at > NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DEFAULT DATA INSERTION
-- =====================================================

-- Insert default petition schemas
INSERT INTO petition_schemas (service_type, legal_area, name, fields, instructions, style_preferences)
VALUES 
  (
    'peticao_inicial',
    'civel',
    'Petição Inicial Cível',
    '{
      "autor": {
        "name": "autor",
        "type": "string",
        "required": true,
        "description": "Nome completo e qualificação do autor",
        "validation": {"minLength": 3}
      },
      "reu": {
        "name": "reu",
        "type": "string",
        "required": true,
        "description": "Nome completo e qualificação do réu",
        "validation": {"minLength": 3}
      },
      "fatos": {
        "name": "fatos",
        "type": "string",
        "required": true,
        "description": "Descrição dos fatos",
        "validation": {"minLength": 50},
        "consolidation": "concatenate"
      },
      "pedidos": {
        "name": "pedidos",
        "type": "array",
        "required": true,
        "description": "Lista de pedidos",
        "consolidation": "merge_list"
      },
      "valor_causa": {
        "name": "valor_causa",
        "type": "string",
        "required": true,
        "description": "Valor da causa",
        "validation": {"pattern": "^R\\\\$\\\\s*[0-9.,]+$"}
      }
    }'::JSONB,
    'Gere uma petição inicial completa seguindo o CPC, com endereçamento, qualificação das partes, narrativa dos fatos, fundamentação jurídica, pedidos e valor da causa.',
    '{"formality": "formal", "structure": "tradicional", "citations": "completa"}'::JSONB
  ),
  (
    'contestacao',
    'civel',
    'Contestação Cível',
    '{
      "reu": {
        "name": "reu",
        "type": "string",
        "required": true,
        "description": "Nome do réu/contestante"
      },
      "autor": {
        "name": "autor",
        "type": "string",
        "required": true,
        "description": "Nome do autor da ação"
      },
      "preliminares": {
        "name": "preliminares",
        "type": "array",
        "required": false,
        "description": "Preliminares a arguir",
        "consolidation": "merge_list"
      },
      "merito": {
        "name": "merito",
        "type": "string",
        "required": true,
        "description": "Defesa de mérito",
        "consolidation": "concatenate"
      }
    }'::JSONB,
    'Gere uma contestação completa, iniciando com preliminares (se houver), seguida da defesa de mérito.',
    '{"formality": "formal", "structure": "tradicional", "citations": "completa"}'::JSONB
  ),
  (
    'agravo_instrumento',
    'civel',
    'Agravo de Instrumento Cível',
    '{
      "agravante": {
        "name": "agravante",
        "type": "string",
        "required": true,
        "description": "Nome do agravante"
      },
      "agravado": {
        "name": "agravado",
        "type": "string",
        "required": true,
        "description": "Nome do agravado"
      },
      "decisao": {
        "name": "decisao",
        "type": "string",
        "required": true,
        "description": "Decisão agravada",
        "validation": {"minLength": 50}
      },
      "fundamentos": {
        "name": "fundamentos",
        "type": "string",
        "required": true,
        "description": "Fundamentos do recurso",
        "consolidation": "concatenate"
      }
    }'::JSONB,
    'Gere um agravo de instrumento com a qualificação das partes, síntese da decisão agravada, demonstração do cabimento, fundamentos da reforma e pedidos.',
    '{"formality": "formal", "structure": "tradicional", "citations": "essencial"}'::JSONB
  ),
  (
    'recurso_apelacao',
    'civel',
    'Recurso de Apelação Cível',
    '{
      "apelante": {
        "name": "apelante",
        "type": "string",
        "required": true,
        "description": "Nome do apelante"
      },
      "apelado": {
        "name": "apelado", 
        "type": "string",
        "required": true,
        "description": "Nome do apelado"
      },
      "sentenca": {
        "name": "sentenca",
        "type": "string",
        "required": true,
        "description": "Resumo da sentença apelada",
        "validation": {"minLength": 50}
      },
      "fundamentos": {
        "name": "fundamentos",
        "type": "string", 
        "required": true,
        "description": "Fundamentos do recurso",
        "consolidation": "concatenate"
      }
    }'::JSONB,
    'Gere um recurso de apelação com síntese da sentença, fundamentos jurídicos para reforma e pedidos específicos.',
    '{"formality": "formal", "structure": "tradicional", "citations": "completa"}'::JSONB
  ),
  (
    'embargos_declaracao',
    'civel',
    'Embargos de Declaração Cível',
    '{
      "embargante": {
        "name": "embargante",
        "type": "string",
        "required": true,
        "description": "Nome do embargante"
      },
      "embargado": {
        "name": "embargado",
        "type": "string",
        "required": true,
        "description": "Nome do embargado"
      },
      "decisao": {
        "name": "decisao",
        "type": "string",
        "required": true,
        "description": "Decisão embargada",
        "validation": {"minLength": 30}
      },
      "vicio": {
        "name": "vicio",
        "type": "string",
        "required": true,
        "description": "Vício a ser sanado (obscuridade, contradição, omissão)",
        "consolidation": "concatenate"
      }
    }'::JSONB,
    'Gere embargos de declaração apontando vícios de obscuridade, contradição ou omissão na decisão.',
    '{"formality": "formal", "structure": "tradicional", "citations": "essencial"}'::JSONB
  ),
  (
    'mandado_seguranca',
    'constitucional',
    'Mandado de Segurança',
    '{
      "impetrante": {
        "name": "impetrante",
        "type": "string",
        "required": true,
        "description": "Nome do impetrante"
      },
      "impetrado": {
        "name": "impetrado",
        "type": "string",
        "required": true,
        "description": "Nome da autoridade coatora"
      },
      "ato_coator": {
        "name": "ato_coator",
        "type": "string",
        "required": true,
        "description": "Descrição do ato coator impugnado",
        "validation": {"minLength": 50}
      },
      "direito_liquido": {
        "name": "direito_liquido",
        "type": "string",
        "required": true,
        "description": "Demonstração do direito líquido e certo",
        "consolidation": "concatenate"
      },
      "prova_pre_constituida": {
        "name": "prova_pre_constituida",
        "type": "string",
        "required": true,
        "description": "Prova pré-constituída do direito",
        "consolidation": "concatenate"
      }
    }'::JSONB,
    'Gere um mandado de segurança com demonstração do direito líquido e certo, identificação do ato coator e prova pré-constituída.',
    '{"formality": "formal", "structure": "tradicional", "citations": "completa"}'::JSONB
  )
ON CONFLICT (service_type, legal_area, version) DO NOTHING;

-- =====================================================
-- FINAL VERIFICATION
-- =====================================================

-- Create a function to verify installation
CREATE OR REPLACE FUNCTION verify_petition_system_installation()
RETURNS TABLE (
  component TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Check tables
  RETURN QUERY
  SELECT 
    'Tables'::TEXT as component,
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'petition_schemas') THEN 'OK'
      ELSE 'MISSING'
    END as status,
    'Core petition system tables'::TEXT as details;
    
  -- Check schemas data
  RETURN QUERY  
  SELECT 
    'Default Schemas'::TEXT as component,
    CASE 
      WHEN (SELECT COUNT(*) FROM petition_schemas WHERE active = true) >= 6 THEN 'OK'
      ELSE 'MISSING'
    END as status,
    CONCAT('Found ', (SELECT COUNT(*) FROM petition_schemas WHERE active = true), ' active schemas (expected 6)') as details;
    
  -- Check RLS
  RETURN QUERY
  SELECT 
    'RLS Policies'::TEXT as component,
    CASE 
      WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'petition_schemas') THEN 'OK'
      ELSE 'MISSING'  
    END as status,
    'Row Level Security policies'::TEXT as details;
    
END;
$$ LANGUAGE plpgsql;

-- Run verification
SELECT * FROM verify_petition_system_installation();