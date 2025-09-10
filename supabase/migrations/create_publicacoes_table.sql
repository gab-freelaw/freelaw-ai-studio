-- Migração: Tabela de Publicações da Comunica API
-- Data: 2025-09-09
-- Descrição: Criar tabela para armazenar publicações jurídicas do PJE

-- Tabela para armazenar publicações da Comunica API
CREATE TABLE IF NOT EXISTS publicacoes (
  id TEXT PRIMARY KEY,
  numero_processo TEXT NOT NULL,
  tribunal TEXT NOT NULL,
  data_publicacao DATE NOT NULL,
  conteudo TEXT NOT NULL,
  tipo_movimento TEXT,
  destinatarios JSONB DEFAULT '[]',
  advogados_mencionados JSONB DEFAULT '[]',
  prazo_dias INTEGER,
  urgente BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'nova' CHECK (status IN ('nova', 'lida', 'processada')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_publicacoes_user_id ON publicacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_publicacoes_data_publicacao ON publicacoes(data_publicacao);
CREATE INDEX IF NOT EXISTS idx_publicacoes_numero_processo ON publicacoes(numero_processo);
CREATE INDEX IF NOT EXISTS idx_publicacoes_tribunal ON publicacoes(tribunal);
CREATE INDEX IF NOT EXISTS idx_publicacoes_urgente ON publicacoes(urgente);
CREATE INDEX IF NOT EXISTS idx_publicacoes_status ON publicacoes(status);

-- Índice composto para consultas comuns
CREATE INDEX IF NOT EXISTS idx_publicacoes_user_status_data ON publicacoes(user_id, status, data_publicacao DESC);

-- RLS (Row Level Security)
ALTER TABLE publicacoes ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view own publicacoes" ON publicacoes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own publicacoes" ON publicacoes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own publicacoes" ON publicacoes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own publicacoes" ON publicacoes
  FOR DELETE USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_publicacoes_updated_at ON publicacoes;
CREATE TRIGGER update_publicacoes_updated_at 
  BEFORE UPDATE ON publicacoes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE publicacoes IS 'Armazena publicações jurídicas obtidas da Comunica API do PJE';
COMMENT ON COLUMN publicacoes.id IS 'ID único da publicação (vem da Comunica API)';
COMMENT ON COLUMN publicacoes.numero_processo IS 'Número do processo com máscara';
COMMENT ON COLUMN publicacoes.tribunal IS 'Sigla do tribunal (ex: TJMG, TRF3)';
COMMENT ON COLUMN publicacoes.conteudo IS 'Texto completo da publicação';
COMMENT ON COLUMN publicacoes.destinatarios IS 'Array JSON com nomes dos destinatários';
COMMENT ON COLUMN publicacoes.advogados_mencionados IS 'Array JSON com nomes dos advogados mencionados';
COMMENT ON COLUMN publicacoes.prazo_dias IS 'Número de dias até o prazo (extraído do conteúdo)';
COMMENT ON COLUMN publicacoes.urgente IS 'Indica se a publicação é urgente (prazo <= 5 dias)';

-- Inserir dados de exemplo para teste (apenas em desenvolvimento)
INSERT INTO publicacoes (
  id, numero_processo, tribunal, data_publicacao, conteudo, tipo_movimento, 
  urgente, user_id, created_at, updated_at
) VALUES (
  'test_pub_001',
  '5001635-49.2019.8.13.0317', 
  'TJMG',
  CURRENT_DATE,
  'Teste de publicação para validar estrutura da tabela',
  'Intimação',
  false,
  (SELECT id FROM auth.users LIMIT 1),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;




