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
ON CONFLICT (service_type, legal_area, version) DO NOTHING;