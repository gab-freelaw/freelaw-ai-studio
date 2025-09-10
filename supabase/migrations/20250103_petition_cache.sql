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