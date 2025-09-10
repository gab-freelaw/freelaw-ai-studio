-- Create structured provider profile table
CREATE TABLE IF NOT EXISTS provider_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Personal Info
  full_name TEXT NOT NULL,
  cpf VARCHAR(14),
  birth_date DATE,
  phone VARCHAR(20),
  
  -- Professional Info
  oab_number VARCHAR(20) NOT NULL,
  oab_state VARCHAR(2) NOT NULL,
  oab_verified BOOLEAN DEFAULT false,
  oab_verification_date TIMESTAMPTZ,
  
  -- Education
  university TEXT,
  graduation_year INTEGER,
  post_graduation TEXT[],
  specializations TEXT[],
  
  -- Experience
  years_of_experience INTEGER,
  summary TEXT,
  previous_experiences JSONB DEFAULT '[]',
  
  -- Professional Links
  linkedin_url TEXT,
  lattes_url TEXT,
  website_url TEXT,
  
  -- Specialties (áreas de atuação)
  main_specialty TEXT,
  specialties TEXT[] DEFAULT '{}',
  sub_specialties TEXT[] DEFAULT '{}',
  services_offered TEXT[] DEFAULT '{}',
  
  -- Work Preferences
  work_preference TEXT CHECK (work_preference IN ('full_time', 'part_time', 'freelance', 'on_demand')),
  weekly_availability INTEGER, -- hours per week
  availability_days TEXT[] DEFAULT '{}', -- ['monday', 'tuesday', etc]
  work_on_holidays BOOLEAN DEFAULT false,
  preferred_deadlines TEXT[] DEFAULT '{}', -- ['urgent', 'normal', 'flexible']
  
  -- Financial
  expected_monthly_income DECIMAL(10,2),
  has_cnpj BOOLEAN DEFAULT false,
  cnpj VARCHAR(18),
  company_name TEXT,
  can_emit_invoice BOOLEAN DEFAULT false,
  
  -- Location
  country VARCHAR(100) DEFAULT 'Brasil',
  state VARCHAR(100),
  city VARCHAR(100),
  zip_code VARCHAR(10),
  address TEXT,
  address_number VARCHAR(20),
  address_complement VARCHAR(100),
  neighborhood VARCHAR(100),
  
  -- Assessment & Level
  assessment_status TEXT DEFAULT 'pending' CHECK (assessment_status IN ('pending', 'in_progress', 'completed', 'failed')),
  assessment_score DECIMAL(5,2),
  assessment_date TIMESTAMPTZ,
  provider_level TEXT CHECK (provider_level IN ('junior', 'pleno', 'senior', 'expert')),
  level_assigned_date TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected', 'suspended', 'inactive')),
  verified BOOLEAN DEFAULT false,
  high_volume_interest BOOLEAN DEFAULT false,
  massive_volume_interest BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id),
  UNIQUE(cpf),
  UNIQUE(cnpj)
);

-- Create practical tests table
CREATE TABLE IF NOT EXISTS provider_practical_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES provider_profiles(id) ON DELETE CASCADE,
  
  -- Test Info
  test_type TEXT NOT NULL, -- 'initial_assessment', 'specialty_test', 'promotion_test'
  specialty TEXT NOT NULL, -- área do direito sendo testada
  difficulty_level TEXT CHECK (difficulty_level IN ('basic', 'intermediate', 'advanced', 'expert')),
  
  -- Test Content
  case_description TEXT NOT NULL, -- descrição do caso para elaborar a peça
  required_document_type TEXT NOT NULL, -- tipo de peça solicitada
  additional_instructions TEXT,
  reference_materials JSONB DEFAULT '[]', -- materiais de referência fornecidos
  
  -- Submission
  submitted_document TEXT, -- documento elaborado pelo advogado
  submission_time TIMESTAMPTZ,
  time_spent_minutes INTEGER,
  
  -- AI Analysis
  ai_analysis_result JSONB, -- resultado detalhado da análise
  ai_score DECIMAL(5,2),
  ai_feedback TEXT,
  strengths TEXT[],
  weaknesses TEXT[],
  suggestions TEXT[],
  
  -- Evaluation Criteria Scores (0-100)
  technical_accuracy_score DECIMAL(5,2),
  legal_argumentation_score DECIMAL(5,2),
  formatting_score DECIMAL(5,2),
  clarity_score DECIMAL(5,2),
  completeness_score DECIMAL(5,2),
  creativity_score DECIMAL(5,2),
  
  -- Human Review (optional)
  human_reviewer_id UUID REFERENCES auth.users(id),
  human_review_date TIMESTAMPTZ,
  human_score DECIMAL(5,2),
  human_feedback TEXT,
  
  -- Final Result
  final_score DECIMAL(5,2),
  passed BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  evaluated_at TIMESTAMPTZ,
  
  INDEX idx_provider_tests (provider_id, test_type),
  INDEX idx_test_scores (final_score, passed)
);

-- Create provider documents table (for storing CV and certificates)
CREATE TABLE IF NOT EXISTS provider_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES provider_profiles(id) ON DELETE CASCADE,
  
  document_type TEXT NOT NULL, -- 'oab_card', 'diploma', 'certificate', 'cv', etc
  document_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  
  verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_provider_docs (provider_id, document_type)
);

-- Create provider specialties reference table
CREATE TABLE IF NOT EXISTS legal_specialties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  category TEXT, -- 'main', 'sub'
  parent_id UUID REFERENCES legal_specialties(id),
  description TEXT,
  active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(slug)
);

-- Insert some initial legal specialties
INSERT INTO legal_specialties (name, slug, category) VALUES
  ('Direito Civil', 'direito-civil', 'main'),
  ('Direito Trabalhista', 'direito-trabalhista', 'main'),
  ('Direito Penal', 'direito-penal', 'main'),
  ('Direito Tributário', 'direito-tributario', 'main'),
  ('Direito Empresarial', 'direito-empresarial', 'main'),
  ('Direito do Consumidor', 'direito-consumidor', 'main'),
  ('Direito de Família', 'direito-familia', 'main'),
  ('Direito Imobiliário', 'direito-imobiliario', 'main'),
  ('Direito Previdenciário', 'direito-previdenciario', 'main'),
  ('Direito Ambiental', 'direito-ambiental', 'main'),
  ('Direito Digital', 'direito-digital', 'main'),
  ('Direito Administrativo', 'direito-administrativo', 'main')
ON CONFLICT (slug) DO NOTHING;

-- Create test templates table
CREATE TABLE IF NOT EXISTS test_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  specialty TEXT NOT NULL,
  difficulty_level TEXT NOT NULL,
  document_type TEXT NOT NULL,
  
  case_title TEXT NOT NULL,
  case_description TEXT NOT NULL,
  required_elements TEXT[], -- elementos que devem estar presentes
  evaluation_criteria JSONB, -- critérios detalhados de avaliação
  time_limit_minutes INTEGER DEFAULT 120,
  
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_test_templates (specialty, difficulty_level)
);

-- Insert sample test templates
INSERT INTO test_templates (specialty, difficulty_level, document_type, case_title, case_description, required_elements, time_limit_minutes) VALUES
  (
    'direito-trabalhista',
    'intermediate',
    'Reclamação Trabalhista',
    'Demissão sem justa causa com horas extras não pagas',
    'João Silva trabalhou na empresa XYZ Ltda por 3 anos como vendedor. Foi demitido sem justa causa e não recebeu: verbas rescisórias completas, horas extras dos últimos 6 meses (média de 20h/mês), e FGTS não foi depositado nos últimos 12 meses. Salário: R$ 2.500,00. Elabore a petição inicial.',
    ARRAY['Qualificação das partes', 'Dos fatos', 'Do direito', 'Pedidos', 'Valor da causa'],
    90
  ),
  (
    'direito-civil',
    'basic',
    'Petição de Cobrança',
    'Cobrança de dívida com contrato',
    'Maria Santos emprestou R$ 10.000,00 para Pedro Oliveira em 01/03/2023, com contrato assinado prevendo juros de 1% ao mês e vencimento em 01/09/2023. O devedor não pagou. Elabore petição de cobrança.',
    ARRAY['Qualificação das partes', 'Dos fatos', 'Do direito', 'Pedidos', 'Provas'],
    60
  );

-- Enable RLS
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_practical_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Providers can view own profile" ON provider_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Providers can update own profile" ON provider_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Providers can insert own profile" ON provider_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Providers can view own tests" ON provider_practical_tests
  FOR SELECT USING (provider_id IN (
    SELECT id FROM provider_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Providers can submit tests" ON provider_practical_tests
  FOR INSERT WITH CHECK (provider_id IN (
    SELECT id FROM provider_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Providers can update own test submissions" ON provider_practical_tests
  FOR UPDATE USING (provider_id IN (
    SELECT id FROM provider_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Anyone can view legal specialties" ON legal_specialties
  FOR SELECT USING (active = true);

CREATE POLICY "Anyone can view active test templates" ON test_templates
  FOR SELECT USING (active = true);

CREATE POLICY "Providers can manage own documents" ON provider_documents
  FOR ALL USING (provider_id IN (
    SELECT id FROM provider_profiles WHERE user_id = auth.uid()
  ));