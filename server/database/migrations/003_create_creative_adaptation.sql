-- Creative adaptation persistence model

CREATE TABLE IF NOT EXISTS adaptation_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'review', 'completed', 'archived')),
  preservation_intent JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archived_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS adaptation_source_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL UNIQUE REFERENCES adaptation_projects(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS adaptation_requested_outputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES adaptation_projects(id) ON DELETE CASCADE,
  preset_id TEXT,
  label TEXT NOT NULL,
  aspect_ratio TEXT NOT NULL,
  target_width INTEGER,
  target_height INTEGER,
  generation_strategy TEXT DEFAULT 'adapt',
  max_file_size_bytes INTEGER,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'generated', 'approved', 'rejected', 'failed')),
  review_notes TEXT DEFAULT '',
  approved_attempt_id UUID,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS adaptation_output_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  output_id UUID NOT NULL REFERENCES adaptation_requested_outputs(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  provider TEXT,
  model TEXT,
  instructions TEXT DEFAULT '',
  storage_path TEXT,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  error_message TEXT,
  diagnostics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(output_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_adaptation_projects_owner ON adaptation_projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_adaptation_projects_status ON adaptation_projects(status);
CREATE INDEX IF NOT EXISTS idx_adaptation_source_assets_project ON adaptation_source_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_adaptation_requested_outputs_project ON adaptation_requested_outputs(project_id);
CREATE INDEX IF NOT EXISTS idx_adaptation_requested_outputs_status ON adaptation_requested_outputs(status);
CREATE INDEX IF NOT EXISTS idx_adaptation_output_attempts_output ON adaptation_output_attempts(output_id);
CREATE INDEX IF NOT EXISTS idx_adaptation_output_attempts_status ON adaptation_output_attempts(status);

CREATE TRIGGER update_adaptation_projects_updated_at
  BEFORE UPDATE ON adaptation_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_adaptation_requested_outputs_updated_at
  BEFORE UPDATE ON adaptation_requested_outputs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE adaptation_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE adaptation_source_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE adaptation_requested_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE adaptation_output_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their adaptation projects" ON adaptation_projects
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their own adaptation projects" ON adaptation_projects
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own adaptation projects" ON adaptation_projects
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own adaptation projects" ON adaptation_projects
  FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY "Users can view source assets in their adaptation projects" ON adaptation_source_assets
  FOR SELECT USING (
    project_id IN (SELECT id FROM adaptation_projects WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can manage source assets in their adaptation projects" ON adaptation_source_assets
  FOR ALL USING (
    project_id IN (SELECT id FROM adaptation_projects WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can view requested outputs in their adaptation projects" ON adaptation_requested_outputs
  FOR SELECT USING (
    project_id IN (SELECT id FROM adaptation_projects WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can manage requested outputs in their adaptation projects" ON adaptation_requested_outputs
  FOR ALL USING (
    project_id IN (SELECT id FROM adaptation_projects WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can view attempts in their adaptation projects" ON adaptation_output_attempts
  FOR SELECT USING (
    output_id IN (
      SELECT id FROM adaptation_requested_outputs
      WHERE project_id IN (SELECT id FROM adaptation_projects WHERE owner_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage attempts in their adaptation projects" ON adaptation_output_attempts
  FOR ALL USING (
    output_id IN (
      SELECT id FROM adaptation_requested_outputs
      WHERE project_id IN (SELECT id FROM adaptation_projects WHERE owner_id = auth.uid())
    )
  );

ALTER TABLE adaptation_requested_outputs ADD COLUMN IF NOT EXISTS generation_strategy TEXT DEFAULT 'adapt';
ALTER TABLE adaptation_requested_outputs ADD COLUMN IF NOT EXISTS max_file_size_bytes INTEGER;
