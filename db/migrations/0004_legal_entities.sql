-- Legal entities migration: clients, processes, publications, and relationships

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  cpf_cnpj TEXT,
  person_type TEXT NOT NULL DEFAULT 'FISICA',
  email TEXT,
  phone TEXT,
  address JSONB,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_cpf_cnpj ON clients(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

-- Processes table
CREATE TABLE IF NOT EXISTS processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  cnj_number TEXT NOT NULL,
  title TEXT,
  court TEXT,
  court_class TEXT,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  value DECIMAL(15, 2),
  start_date TIMESTAMP,
  last_update TIMESTAMP,
  next_deadline TIMESTAMP,
  parties JSONB,
  movements JSONB,
  documents JSONB,
  metadata JSONB,
  source_api TEXT,
  source_data JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processes_user_id ON processes(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_processes_cnj_number ON processes(cnj_number);
CREATE INDEX IF NOT EXISTS idx_processes_status ON processes(status);
CREATE INDEX IF NOT EXISTS idx_processes_court ON processes(court);

-- Publications table
CREATE TABLE IF NOT EXISTS publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  process_id UUID REFERENCES processes(id) ON DELETE CASCADE,
  publication_date TIMESTAMP NOT NULL,
  capture_date TIMESTAMP,
  content TEXT NOT NULL,
  summary TEXT,
  type TEXT,
  court TEXT,
  diary TEXT,
  page INTEGER,
  edition TEXT,
  oab TEXT,
  source_api TEXT,
  source_data JSONB,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_publications_user_id ON publications(user_id);
CREATE INDEX IF NOT EXISTS idx_publications_process_id ON publications(process_id);
CREATE INDEX IF NOT EXISTS idx_publications_date ON publications(publication_date);
CREATE INDEX IF NOT EXISTS idx_publications_oab ON publications(oab);

-- Client-Process relationship table
CREATE TABLE IF NOT EXISTS client_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  participation_type TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_process_unique ON client_processes(client_id, process_id);
CREATE INDEX IF NOT EXISTS idx_client_processes_client ON client_processes(client_id);
CREATE INDEX IF NOT EXISTS idx_client_processes_process ON client_processes(process_id);

-- API Cost Tracking table
CREATE TABLE IF NOT EXISTS api_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  operation TEXT NOT NULL,
  cost DECIMAL(10, 2) NOT NULL,
  credits INTEGER,
  request_data JSONB,
  response_status INTEGER,
  response_time INTEGER,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_costs_user_id ON api_costs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_costs_provider ON api_costs(provider);
CREATE INDEX IF NOT EXISTS idx_api_costs_created_at ON api_costs(created_at);

-- Lawyers table
CREATE TABLE IF NOT EXISTS lawyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  oab TEXT NOT NULL,
  state TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  specialties JSONB,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lawyers_user_id ON lawyers(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_lawyers_oab_state ON lawyers(oab, state);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processes_updated_at BEFORE UPDATE ON processes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_publications_updated_at BEFORE UPDATE ON publications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_processes_updated_at BEFORE UPDATE ON client_processes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lawyers_updated_at BEFORE UPDATE ON lawyers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Clients: users can only see their own clients
CREATE POLICY "Users can view own clients" ON clients
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own clients" ON clients
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own clients" ON clients
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own clients" ON clients
  FOR DELETE USING (auth.uid()::text = user_id);

-- Processes: users can only see their own processes
CREATE POLICY "Users can view own processes" ON processes
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own processes" ON processes
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own processes" ON processes
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own processes" ON processes
  FOR DELETE USING (auth.uid()::text = user_id);

-- Publications: users can only see their own publications
CREATE POLICY "Users can view own publications" ON publications
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own publications" ON publications
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own publications" ON publications
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own publications" ON publications
  FOR DELETE USING (auth.uid()::text = user_id);

-- Client-Processes: users can only manage relationships for their own clients/processes
CREATE POLICY "Users can view own client-process relationships" ON client_processes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = client_processes.client_id AND clients.user_id = auth.uid()::text)
    OR EXISTS (SELECT 1 FROM processes WHERE processes.id = client_processes.process_id AND processes.user_id = auth.uid()::text)
  );

CREATE POLICY "Users can insert own client-process relationships" ON client_processes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = client_processes.client_id AND clients.user_id = auth.uid()::text)
    AND EXISTS (SELECT 1 FROM processes WHERE processes.id = client_processes.process_id AND processes.user_id = auth.uid()::text)
  );

CREATE POLICY "Users can update own client-process relationships" ON client_processes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = client_processes.client_id AND clients.user_id = auth.uid()::text)
    AND EXISTS (SELECT 1 FROM processes WHERE processes.id = client_processes.process_id AND processes.user_id = auth.uid()::text)
  );

CREATE POLICY "Users can delete own client-process relationships" ON client_processes
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = client_processes.client_id AND clients.user_id = auth.uid()::text)
    AND EXISTS (SELECT 1 FROM processes WHERE processes.id = client_processes.process_id AND processes.user_id = auth.uid()::text)
  );

-- API Costs: users can only see their own API costs
CREATE POLICY "Users can view own API costs" ON api_costs
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own API costs" ON api_costs
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Lawyers: users can only see their own lawyers
CREATE POLICY "Users can view own lawyers" ON lawyers
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own lawyers" ON lawyers
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own lawyers" ON lawyers
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own lawyers" ON lawyers
  FOR DELETE USING (auth.uid()::text = user_id);