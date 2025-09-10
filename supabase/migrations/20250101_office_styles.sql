-- Criar schema para estilos de escritório
-- Baseado na análise do projeto freelaw-ai-project

-- Tabela principal de estilos de escritório
CREATE TABLE IF NOT EXISTS office_styles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Configurações de tipografia
  typography JSONB DEFAULT '{
    "fontFamily": ["Times New Roman", "Arial"],
    "fontSize": {
      "h1": [16, 18],
      "h2": [14, 16],
      "h3": [13, 14],
      "body": [12],
      "footer": [10]
    },
    "fontWeight": ["normal", "bold"],
    "lineHeight": [1.15, 1.2, 1.5],
    "letterSpacing": [0, 0.5]
  }'::JSONB,
  
  -- Configurações de layout
  layout JSONB DEFAULT '{
    "margins": {
      "top": [2.5, 3.0],
      "bottom": [2.5, 3.0],
      "left": [3.0, 3.5],
      "right": [2.0, 2.5]
    },
    "spacing": {
      "paragraph": [8, 10, 12],
      "section": [16, 18, 20],
      "lineHeight": [1.15, 1.2, 1.5]
    },
    "alignment": {
      "title": ["center"],
      "subtitle": ["left"],
      "body": ["justify"],
      "signature": ["right"]
    },
    "pageFormat": "A4"
  }'::JSONB,
  
  -- Estrutura jurídica específica
  legal_structure JSONB DEFAULT '{
    "hasHeader": true,
    "hasFooter": true,
    "hasLetterhead": false,
    "sectionPatterns": [],
    "numbering": {
      "style": "numeric",
      "pattern": "1.",
      "depth": 3
    },
    "citations": {
      "style": "inline",
      "format": [],
      "frequency": 0
    }
  }'::JSONB,
  
  -- Preferências de linguagem
  language_preferences JSONB DEFAULT '{
    "formality": 75,
    "complexity": 60,
    "technicality": 70,
    "commonPhrases": [],
    "preferredTerms": [],
    "avoidedTerms": []
  }'::JSONB,
  
  -- Template HTML para aplicação
  html_template TEXT,
  
  -- CSS gerado ou customizado
  css_styles TEXT,
  
  -- Elementos do cabeçalho/timbre
  letterhead_elements JSONB DEFAULT '{
    "court": null,
    "client": {
      "name": null,
      "cpf": null,
      "address": null
    },
    "office": {
      "address": null,
      "lawyers": [],
      "oab": []
    },
    "defendant": {
      "name": null,
      "cnpj": null,
      "address": null
    }
  }'::JSONB,
  
  -- Metadados
  confidence_score INTEGER DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  sample_documents JSONB DEFAULT '[]'::JSONB, -- Array de IDs de documentos usados como modelo
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Tabela de histórico/versões de estilos
CREATE TABLE IF NOT EXISTS office_style_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  office_style_id UUID NOT NULL REFERENCES office_styles(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  changes_made JSONB,
  style_snapshot JSONB NOT NULL, -- Snapshot completo do estilo naquele momento
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(office_style_id, version_number)
);

-- Tabela de análises de documentos para extração de estilo
CREATE TABLE IF NOT EXISTS style_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  document_name VARCHAR(255),
  document_type VARCHAR(100),
  
  -- Resultado da análise
  analysis_result JSONB NOT NULL,
  extracted_style JSONB,
  processing_time_ms INTEGER,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  -- Status da análise
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'applied')),
  error_message TEXT,
  
  -- Se foi aplicado como estilo do escritório
  applied_as_style_id UUID REFERENCES office_styles(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX idx_office_styles_office_id ON office_styles(office_id);
CREATE INDEX idx_office_styles_is_active ON office_styles(is_active);
CREATE INDEX idx_office_styles_is_default ON office_styles(is_default);
CREATE INDEX idx_style_analyses_office_id ON style_analyses(office_id);
CREATE INDEX idx_style_analyses_status ON style_analyses(status);
CREATE INDEX idx_office_style_history_style_id ON office_style_history(office_style_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_office_styles_updated_at
  BEFORE UPDATE ON office_styles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para garantir apenas um estilo padrão por escritório
CREATE OR REPLACE FUNCTION ensure_single_default_style()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE office_styles 
    SET is_default = false 
    WHERE office_id = NEW.office_id 
      AND id != NEW.id 
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_style_trigger
  BEFORE INSERT OR UPDATE ON office_styles
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_style();

-- Função para criar versão no histórico antes de atualizar
CREATE OR REPLACE FUNCTION create_style_version()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  -- Calcular próximo número de versão
  SELECT COALESCE(MAX(version_number), 0) + 1 
  INTO next_version
  FROM office_style_history 
  WHERE office_style_id = OLD.id;
  
  -- Inserir snapshot do estado anterior
  INSERT INTO office_style_history (
    office_style_id,
    version_number,
    changes_made,
    style_snapshot,
    created_by
  ) VALUES (
    OLD.id,
    next_version,
    jsonb_build_object(
      'typography', 
      CASE WHEN OLD.typography IS DISTINCT FROM NEW.typography 
        THEN jsonb_build_object('old', OLD.typography, 'new', NEW.typography) 
        ELSE NULL 
      END,
      'layout',
      CASE WHEN OLD.layout IS DISTINCT FROM NEW.layout 
        THEN jsonb_build_object('old', OLD.layout, 'new', NEW.layout) 
        ELSE NULL 
      END,
      'legal_structure',
      CASE WHEN OLD.legal_structure IS DISTINCT FROM NEW.legal_structure 
        THEN jsonb_build_object('old', OLD.legal_structure, 'new', NEW.legal_structure) 
        ELSE NULL 
      END,
      'language_preferences',
      CASE WHEN OLD.language_preferences IS DISTINCT FROM NEW.language_preferences 
        THEN jsonb_build_object('old', OLD.language_preferences, 'new', NEW.language_preferences) 
        ELSE NULL 
      END
    ),
    jsonb_build_object(
      'typography', OLD.typography,
      'layout', OLD.layout,
      'legal_structure', OLD.legal_structure,
      'language_preferences', OLD.language_preferences,
      'html_template', OLD.html_template,
      'css_styles', OLD.css_styles,
      'letterhead_elements', OLD.letterhead_elements
    ),
    NEW.updated_by
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_style_version_trigger
  BEFORE UPDATE ON office_styles
  FOR EACH ROW
  WHEN (
    OLD.typography IS DISTINCT FROM NEW.typography OR
    OLD.layout IS DISTINCT FROM NEW.layout OR
    OLD.legal_structure IS DISTINCT FROM NEW.legal_structure OR
    OLD.language_preferences IS DISTINCT FROM NEW.language_preferences OR
    OLD.html_template IS DISTINCT FROM NEW.html_template OR
    OLD.css_styles IS DISTINCT FROM NEW.css_styles OR
    OLD.letterhead_elements IS DISTINCT FROM NEW.letterhead_elements
  )
  EXECUTE FUNCTION create_style_version();

-- RLS (Row Level Security)
ALTER TABLE office_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_style_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_analyses ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para office_styles
CREATE POLICY "Users can view styles from their office"
  ON office_styles FOR SELECT
  USING (
    office_id IN (
      SELECT office_id FROM office_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  );

CREATE POLICY "Admin users can manage office styles"
  ON office_styles FOR ALL
  USING (
    office_id IN (
      SELECT office_id FROM office_members 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner')
      AND status = 'active'
    )
  );

-- Políticas para office_style_history
CREATE POLICY "Users can view style history from their office"
  ON office_style_history FOR SELECT
  USING (
    office_style_id IN (
      SELECT id FROM office_styles 
      WHERE office_id IN (
        SELECT office_id FROM office_members 
        WHERE user_id = auth.uid() 
        AND status = 'active'
      )
    )
  );

-- Políticas para style_analyses
CREATE POLICY "Users can view analyses from their office"
  ON style_analyses FOR SELECT
  USING (
    office_id IN (
      SELECT office_id FROM office_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  );

CREATE POLICY "Users can create style analyses for their office"
  ON style_analyses FOR INSERT
  WITH CHECK (
    office_id IN (
      SELECT office_id FROM office_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  );

-- Comentários para documentação
COMMENT ON TABLE office_styles IS 'Armazena estilos e templates de formatação para cada escritório';
COMMENT ON TABLE office_style_history IS 'Histórico de versões dos estilos de escritório';
COMMENT ON TABLE style_analyses IS 'Resultados de análises de documentos para extração de estilo';

COMMENT ON COLUMN office_styles.typography IS 'Configurações de tipografia (fontes, tamanhos, pesos)';
COMMENT ON COLUMN office_styles.layout IS 'Configurações de layout (margens, espaçamentos, alinhamentos)';
COMMENT ON COLUMN office_styles.legal_structure IS 'Estrutura específica de documentos jurídicos';
COMMENT ON COLUMN office_styles.language_preferences IS 'Preferências de linguagem e termos';
COMMENT ON COLUMN office_styles.letterhead_elements IS 'Elementos do timbre/cabeçalho do escritório';
COMMENT ON COLUMN office_styles.confidence_score IS 'Confiança na análise do estilo (0-100)';