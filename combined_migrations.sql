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

-- Create indexes
CREATE INDEX idx_petition_schemas_service_area ON petition_schemas(service_type, legal_area, active);
CREATE INDEX idx_petition_templates_schema ON petition_templates(schema_id);
CREATE INDEX idx_petition_templates_office ON petition_templates(office_id);
CREATE INDEX idx_petition_templates_public ON petition_templates(is_public);
CREATE INDEX idx_petition_logs_office ON petition_generation_logs(office_id);
CREATE INDEX idx_petition_logs_created ON petition_generation_logs(created_at);

-- Add RLS policies
ALTER TABLE petition_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE petition_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE petition_generation_logs ENABLE ROW LEVEL SECURITY;

-- Schemas are public read, admin write
CREATE POLICY "Anyone can read active schemas" ON petition_schemas
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage schemas" ON petition_schemas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
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
    )
  );

CREATE POLICY "System can insert logs" ON petition_generation_logs
  FOR INSERT WITH CHECK (true);

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

-- Insert default schemas
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
        "validation": {"pattern": "^R\\$\\s*[0-9.,]+$"}
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
  )
ON CONFLICT (service_type, legal_area, version) DO NOTHING;-- Create petition cache table
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

-- Create indexes for performance
CREATE INDEX idx_petition_cache_key ON petition_cache(cache_key);
CREATE INDEX idx_petition_cache_office ON petition_cache(office_id);
CREATE INDEX idx_petition_cache_expires ON petition_cache(expires_at);
CREATE INDEX idx_petition_cache_type_area ON petition_cache(service_type, legal_area);
CREATE INDEX idx_petition_cache_last_accessed ON petition_cache(last_accessed);

-- Enable RLS
ALTER TABLE petition_cache ENABLE ROW LEVEL SECURITY;

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

-- Function to clean expired cache entries (can be called by a cron job)
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