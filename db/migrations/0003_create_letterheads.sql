-- Create letterheads table to store extracted letterhead templates
CREATE TABLE IF NOT EXISTS letterheads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  style_id UUID REFERENCES office_styles(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Template data
  html_template TEXT NOT NULL,
  css_styles TEXT NOT NULL,
  
  -- Extracted elements
  logo_url TEXT,
  header_html TEXT,
  footer_html TEXT,
  
  -- Metadata from extraction
  extracted_from_document VARCHAR(255),
  extracted_fonts JSONB DEFAULT '[]'::jsonb,
  extracted_colors JSONB DEFAULT '[]'::jsonb,
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_letterheads_office_id ON letterheads(office_id);
CREATE INDEX idx_letterheads_style_id ON letterheads(style_id);
CREATE INDEX idx_letterheads_is_default ON letterheads(is_default) WHERE is_default = true;

-- Add trigger to update updated_at
CREATE TRIGGER update_letterheads_updated_at
  BEFORE UPDATE ON letterheads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();