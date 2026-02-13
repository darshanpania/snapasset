-- Analytics Tables for SnapAsset
-- Comprehensive analytics and tracking system

-- 1. Analytics Events Table
-- Stores all user events and actions
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  event_type VARCHAR(50) NOT NULL, -- image_generated, image_downloaded, project_created, etc.
  event_category VARCHAR(50), -- generation, project, user, system
  event_action VARCHAR(100),
  event_label VARCHAR(255),
  event_value NUMERIC,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  platform VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Usage Statistics
-- Aggregated user-level statistics
CREATE TABLE IF NOT EXISTS user_usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_images_generated INTEGER DEFAULT 0,
  total_images_downloaded INTEGER DEFAULT 0,
  total_projects_created INTEGER DEFAULT 0,
  storage_used_bytes BIGINT DEFAULT 0,
  total_api_calls INTEGER DEFAULT 0,
  total_active_time_seconds INTEGER DEFAULT 0,
  last_active_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Daily Usage Aggregates
-- Daily aggregated usage statistics per user
CREATE TABLE IF NOT EXISTS daily_usage_aggregates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  images_generated INTEGER DEFAULT 0,
  images_downloaded INTEGER DEFAULT 0,
  projects_created INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  active_time_seconds INTEGER DEFAULT 0,
  unique_sessions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 4. Platform Usage Stats
-- Track which platforms are most used
CREATE TABLE IF NOT EXISTS platform_usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform VARCHAR(100) NOT NULL, -- instagram, facebook, twitter, etc.
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- 5. Cost Tracking
-- Track API costs and usage for optimization
CREATE TABLE IF NOT EXISTS cost_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  service_provider VARCHAR(50), -- openai, stability, replicate, etc.
  api_calls INTEGER DEFAULT 0,
  total_cost_usd NUMERIC(10, 4) DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  images_generated INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date, service_provider)
);

-- 6. Performance Metrics
-- Track system performance and response times
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_type VARCHAR(50) NOT NULL, -- api_response, image_generation, db_query, etc.
  metric_name VARCHAR(100) NOT NULL,
  value NUMERIC,
  unit VARCHAR(20), -- ms, bytes, count, etc.
  tags JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. User Engagement Metrics
-- Track user engagement and retention
CREATE TABLE IF NOT EXISTS user_engagement (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  days_active INTEGER DEFAULT 0,
  sessions_count INTEGER DEFAULT 0,
  total_actions INTEGER DEFAULT 0,
  features_used TEXT[] DEFAULT '{}',
  retention_cohort VARCHAR(20), -- new, active, at_risk, churned
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_start_date)
);

-- 8. System Metrics
-- System-wide metrics for admin dashboard
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_date DATE NOT NULL UNIQUE,
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  total_images INTEGER DEFAULT 0,
  total_projects INTEGER DEFAULT 0,
  total_api_calls INTEGER DEFAULT 0,
  average_response_time_ms NUMERIC,
  error_rate NUMERIC(5, 4),
  storage_used_gb NUMERIC(10, 2),
  total_cost_usd NUMERIC(10, 2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX idx_daily_usage_user_date ON daily_usage_aggregates(user_id, date);
CREATE INDEX idx_daily_usage_date ON daily_usage_aggregates(date);
CREATE INDEX idx_platform_usage_user ON platform_usage_stats(user_id);
CREATE INDEX idx_cost_tracking_user_date ON cost_tracking(user_id, date);
CREATE INDEX idx_cost_tracking_date ON cost_tracking(date);
CREATE INDEX idx_performance_metrics_created ON performance_metrics(created_at);
CREATE INDEX idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX idx_user_engagement_user ON user_engagement(user_id);
CREATE INDEX idx_user_engagement_week ON user_engagement(week_start_date);
CREATE INDEX idx_system_metrics_date ON system_metrics(metric_date);

-- Create updated_at trigger for tables
CREATE TRIGGER update_user_usage_stats_updated_at
  BEFORE UPDATE ON user_usage_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_usage_stats_updated_at
  BEFORE UPDATE ON platform_usage_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for performance_metrics (service-level inserts, admin reads)
CREATE POLICY "Service can insert performance metrics" ON performance_metrics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view performance metrics" ON performance_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for analytics_events
CREATE POLICY "Users can view their own analytics events" ON analytics_events
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own analytics events" ON analytics_events
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for user_usage_stats
CREATE POLICY "Users can view their own usage stats" ON user_usage_stats
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own usage stats" ON user_usage_stats
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for daily_usage_aggregates
CREATE POLICY "Users can view their own daily usage" ON daily_usage_aggregates
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for platform_usage_stats
CREATE POLICY "Users can view their own platform stats" ON platform_usage_stats
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for cost_tracking
CREATE POLICY "Users can view their own cost data" ON cost_tracking
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for user_engagement
CREATE POLICY "Users can view their own engagement data" ON user_engagement
  FOR SELECT USING (user_id = auth.uid());

-- Admin policies (requires admin role check function)
CREATE POLICY "Admins can view all system metrics" ON system_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Functions for analytics aggregation

-- Function to aggregate daily usage
CREATE OR REPLACE FUNCTION aggregate_daily_usage()
RETURNS void AS $$
BEGIN
  INSERT INTO daily_usage_aggregates (
    user_id,
    date,
    images_generated,
    images_downloaded,
    api_calls,
    unique_sessions
  )
  SELECT
    user_id,
    DATE(created_at) as date,
    COUNT(*) FILTER (WHERE event_type = 'image_generated') as images_generated,
    COUNT(*) FILTER (WHERE event_type = 'image_downloaded') as images_downloaded,
    COUNT(*) as api_calls,
    COUNT(DISTINCT session_id) as unique_sessions
  FROM analytics_events
  WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
  GROUP BY user_id, DATE(created_at)
  ON CONFLICT (user_id, date) 
  DO UPDATE SET
    images_generated = EXCLUDED.images_generated,
    images_downloaded = EXCLUDED.images_downloaded,
    api_calls = EXCLUDED.api_calls,
    unique_sessions = EXCLUDED.unique_sessions;
END;
$$ LANGUAGE plpgsql;

-- Function to update user usage stats
CREATE OR REPLACE FUNCTION update_user_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_usage_stats (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE user_usage_stats
  SET
    total_images_generated = total_images_generated + 
      CASE WHEN NEW.event_type = 'image_generated' THEN 1 ELSE 0 END,
    total_images_downloaded = total_images_downloaded + 
      CASE WHEN NEW.event_type = 'image_downloaded' THEN 1 ELSE 0 END,
    total_projects_created = total_projects_created + 
      CASE WHEN NEW.event_type = 'project_created' THEN 1 ELSE 0 END,
    total_api_calls = total_api_calls + 1,
    last_active_at = NEW.created_at,
    updated_at = NOW()
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update usage stats
CREATE TRIGGER trigger_update_user_usage_stats
  AFTER INSERT ON analytics_events
  FOR EACH ROW
  EXECUTE FUNCTION update_user_usage_stats();

-- Function to calculate retention cohorts
CREATE OR REPLACE FUNCTION calculate_retention_cohorts()
RETURNS void AS $$
DECLARE
  week_start DATE;
BEGIN
  week_start := DATE_TRUNC('week', CURRENT_DATE);
  
  INSERT INTO user_engagement (
    user_id,
    week_start_date,
    days_active,
    sessions_count,
    total_actions,
    retention_cohort
  )
  SELECT
    user_id,
    week_start,
    COUNT(DISTINCT DATE(created_at)) as days_active,
    COUNT(DISTINCT session_id) as sessions_count,
    COUNT(*) as total_actions,
    CASE
      WHEN COUNT(DISTINCT DATE(created_at)) >= 5 THEN 'active'
      WHEN COUNT(DISTINCT DATE(created_at)) >= 2 THEN 'engaged'
      WHEN COUNT(DISTINCT DATE(created_at)) = 1 THEN 'at_risk'
      ELSE 'churned'
    END as retention_cohort
  FROM analytics_events
  WHERE created_at >= week_start
    AND created_at < week_start + INTERVAL '1 week'
  GROUP BY user_id
  ON CONFLICT (user_id, week_start_date)
  DO UPDATE SET
    days_active = EXCLUDED.days_active,
    sessions_count = EXCLUDED.sessions_count,
    total_actions = EXCLUDED.total_actions,
    retention_cohort = EXCLUDED.retention_cohort;
END;
$$ LANGUAGE plpgsql;

-- Create admin role table (if not exists)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);

-- View for easy analytics queries
CREATE OR REPLACE VIEW user_analytics_summary AS
SELECT
  u.id as user_id,
  u.email,
  u.created_at as user_created_at,
  uus.total_images_generated,
  uus.total_images_downloaded,
  uus.total_projects_created,
  uus.storage_used_bytes,
  uus.total_api_calls,
  uus.last_active_at,
  COALESCE(ct.total_cost, 0) as lifetime_cost_usd,
  COALESCE(ct.this_month_cost, 0) as this_month_cost_usd
FROM auth.users u
LEFT JOIN user_usage_stats uus ON u.id = uus.user_id
LEFT JOIN (
  SELECT
    user_id,
    SUM(total_cost_usd) as total_cost,
    SUM(CASE WHEN date >= DATE_TRUNC('month', CURRENT_DATE) THEN total_cost_usd ELSE 0 END) as this_month_cost
  FROM cost_tracking
  GROUP BY user_id
) ct ON u.id = ct.user_id;

-- Initialize user stats for existing users
INSERT INTO user_usage_stats (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;