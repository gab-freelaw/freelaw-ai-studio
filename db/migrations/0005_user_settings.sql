-- User Settings Migration

-- User Settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  
  -- Solucionare Settings
  solucionare_office_id TEXT,
  solucionare_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Escavador Settings  
  escavador_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- API Preferences
  preferred_provider TEXT DEFAULT 'solucionare',
  
  -- Cost Controls
  daily_cost_limit INTEGER DEFAULT 1000,
  monthly_cost_limit INTEGER DEFAULT 10000,
  cost_alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Feature Flags
  auto_import_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  andamentos_enrich_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  discovery_full_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Office/Firm Information
  firm_name TEXT,
  firm_cnpj TEXT,
  firm_address JSONB,
  
  -- Onboarding Status
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 1,
  
  -- Additional Settings
  metadata JSONB,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Organization Settings table
CREATE TABLE IF NOT EXISTS organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE,
  name TEXT NOT NULL,
  
  -- Shared Solucionare Settings
  solucionare_office_id TEXT,
  solucionare_relational_name TEXT DEFAULT 'Freelaw',
  
  -- Billing
  billing_email TEXT,
  billing_plan TEXT DEFAULT 'starter',
  
  -- Limits
  max_users INTEGER DEFAULT 5,
  max_processes INTEGER DEFAULT 1000,
  
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User-Organization relationship table
CREATE TABLE IF NOT EXISTS user_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES organization_settings(id),
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id ON user_organizations(organization_id);

-- Create updated_at triggers
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_settings_updated_at BEFORE UPDATE ON organization_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_settings
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid()::text = user_id);

-- RLS Policies for organization_settings
CREATE POLICY "Org members can view org settings" ON organization_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_organizations 
      WHERE user_organizations.organization_id = organization_settings.organization_id 
      AND user_organizations.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Org admins can update org settings" ON organization_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_organizations 
      WHERE user_organizations.organization_id = organization_settings.organization_id 
      AND user_organizations.user_id = auth.uid()::text
      AND user_organizations.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for user_organizations
CREATE POLICY "Users can view their org memberships" ON user_organizations
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Org admins can manage memberships" ON user_organizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_organizations uo2
      WHERE uo2.organization_id = user_organizations.organization_id 
      AND uo2.user_id = auth.uid()::text
      AND uo2.role IN ('owner', 'admin')
    )
  );