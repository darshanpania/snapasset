/**
 * SQLite schema for local provider.
 * Mirrors the Supabase/PostgreSQL schema using SQLite-compatible types.
 * All primary keys are TEXT, dates are TEXT (ISO 8601), JSON fields are TEXT.
 */

/**
 * Initialize all tables, indexes, and constraints on the given better-sqlite3 Database instance.
 * Uses CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS for idempotency.
 * @param {import('better-sqlite3').Database} db
 */
export function initializeSchema(db) {
  db.pragma('foreign_keys = ON');

  db.exec(`
    -- ============================================================
    -- Users
    -- ============================================================
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      metadata TEXT DEFAULT '{}',
      email_verified INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- ============================================================
    -- Projects
    -- ============================================================
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      template_id TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
      visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'shared', 'public')),
      settings TEXT DEFAULT '{}',
      tags TEXT DEFAULT '[]',
      categories TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    -- ============================================================
    -- Project Images
    -- ============================================================
    CREATE TABLE IF NOT EXISTS project_images (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      image_id TEXT NOT NULL,
      "order" INTEGER DEFAULT 0,
      tags TEXT DEFAULT '[]',
      metadata TEXT DEFAULT '{}',
      created_at TEXT NOT NULL,
      UNIQUE(project_id, image_id)
    );

    -- ============================================================
    -- Project Collaborators
    -- ============================================================
    CREATE TABLE IF NOT EXISTS project_collaborators (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
      permissions TEXT DEFAULT '[]',
      invited_by TEXT NOT NULL REFERENCES users(id),
      invited_at TEXT NOT NULL,
      accepted_at TEXT,
      UNIQUE(project_id, user_id)
    );

    -- ============================================================
    -- Project Versions
    -- ============================================================
    CREATE TABLE IF NOT EXISTS project_versions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      version_number INTEGER NOT NULL,
      snapshot TEXT NOT NULL,
      changes TEXT DEFAULT '[]',
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL,
      notes TEXT,
      UNIQUE(project_id, version_number)
    );

    -- ============================================================
    -- Analytics Events
    -- ============================================================
    CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      session_id TEXT,
      event_type TEXT NOT NULL,
      event_category TEXT,
      event_action TEXT,
      event_label TEXT,
      event_value REAL,
      metadata TEXT DEFAULT '{}',
      ip_address TEXT,
      user_agent TEXT,
      referrer TEXT,
      platform TEXT,
      created_at TEXT NOT NULL
    );

    -- ============================================================
    -- User Usage Stats
    -- ============================================================
    CREATE TABLE IF NOT EXISTS user_usage_stats (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      total_images_generated INTEGER DEFAULT 0,
      total_images_downloaded INTEGER DEFAULT 0,
      total_projects_created INTEGER DEFAULT 0,
      storage_used_bytes INTEGER DEFAULT 0,
      total_api_calls INTEGER DEFAULT 0,
      total_active_time_seconds INTEGER DEFAULT 0,
      last_active_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- ============================================================
    -- Daily Usage Aggregates
    -- ============================================================
    CREATE TABLE IF NOT EXISTS daily_usage_aggregates (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      images_generated INTEGER DEFAULT 0,
      images_downloaded INTEGER DEFAULT 0,
      projects_created INTEGER DEFAULT 0,
      api_calls INTEGER DEFAULT 0,
      active_time_seconds INTEGER DEFAULT 0,
      unique_sessions INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, date)
    );

    -- ============================================================
    -- Platform Usage Stats
    -- ============================================================
    CREATE TABLE IF NOT EXISTS platform_usage_stats (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      platform TEXT NOT NULL,
      usage_count INTEGER DEFAULT 0,
      last_used_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT,
      UNIQUE(user_id, platform)
    );

    -- ============================================================
    -- Cost Tracking
    -- ============================================================
    CREATE TABLE IF NOT EXISTS cost_tracking (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      service_provider TEXT,
      api_calls INTEGER DEFAULT 0,
      total_cost_usd REAL DEFAULT 0,
      tokens_used INTEGER DEFAULT 0,
      images_generated INTEGER DEFAULT 0,
      metadata TEXT DEFAULT '{}',
      created_at TEXT NOT NULL,
      UNIQUE(user_id, date, service_provider)
    );

    -- ============================================================
    -- Performance Metrics
    -- ============================================================
    CREATE TABLE IF NOT EXISTS performance_metrics (
      id TEXT PRIMARY KEY,
      metric_type TEXT NOT NULL,
      metric_name TEXT NOT NULL,
      value REAL,
      unit TEXT,
      tags TEXT DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    -- ============================================================
    -- User Engagement
    -- ============================================================
    CREATE TABLE IF NOT EXISTS user_engagement (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      week_start_date TEXT NOT NULL,
      days_active INTEGER DEFAULT 0,
      sessions_count INTEGER DEFAULT 0,
      total_actions INTEGER DEFAULT 0,
      features_used TEXT DEFAULT '[]',
      retention_cohort TEXT CHECK (retention_cohort IS NULL OR retention_cohort IN ('new', 'active', 'engaged', 'at_risk', 'churned')),
      created_at TEXT NOT NULL,
      UNIQUE(user_id, week_start_date)
    );

    -- ============================================================
    -- System Metrics
    -- ============================================================
    CREATE TABLE IF NOT EXISTS system_metrics (
      id TEXT PRIMARY KEY,
      metric_date TEXT NOT NULL UNIQUE,
      total_users INTEGER DEFAULT 0,
      active_users INTEGER DEFAULT 0,
      new_users INTEGER DEFAULT 0,
      total_images INTEGER DEFAULT 0,
      total_projects INTEGER DEFAULT 0,
      total_api_calls INTEGER DEFAULT 0,
      average_response_time_ms REAL,
      error_rate REAL,
      storage_used_gb REAL,
      total_cost_usd REAL,
      metadata TEXT DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    -- ============================================================
    -- Generations
    -- ============================================================
    CREATE TABLE IF NOT EXISTS generations (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      prompt TEXT,
      image_type TEXT,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
      created_at TEXT NOT NULL
    );

    -- ============================================================
    -- Generated Images
    -- ============================================================
    CREATE TABLE IF NOT EXISTS generated_images (
      id TEXT PRIMARY KEY,
      generation_id TEXT NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
      platform_id TEXT,
      platform_name TEXT,
      width INTEGER,
      height INTEGER,
      file_size INTEGER,
      storage_path TEXT,
      url TEXT,
      created_at TEXT NOT NULL
    );

    -- ============================================================
    -- Indexes
    -- ============================================================

    -- Users
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

    -- Projects
    CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_projects_visibility ON projects(visibility);

    -- Project Images
    CREATE INDEX IF NOT EXISTS idx_project_images_project_id ON project_images(project_id);

    -- Project Collaborators
    CREATE INDEX IF NOT EXISTS idx_project_collaborators_project_id ON project_collaborators(project_id);
    CREATE INDEX IF NOT EXISTS idx_project_collaborators_user_id ON project_collaborators(user_id);

    -- Project Versions
    CREATE INDEX IF NOT EXISTS idx_project_versions_project_id ON project_versions(project_id);

    -- Analytics Events
    CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);

    -- Daily Usage Aggregates
    CREATE INDEX IF NOT EXISTS idx_daily_usage_aggregates_user_date ON daily_usage_aggregates(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_daily_usage_aggregates_date ON daily_usage_aggregates(date);

    -- Platform Usage Stats
    CREATE INDEX IF NOT EXISTS idx_platform_usage_stats_user_id ON platform_usage_stats(user_id);

    -- Cost Tracking
    CREATE INDEX IF NOT EXISTS idx_cost_tracking_user_date ON cost_tracking(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_cost_tracking_date ON cost_tracking(date);

    -- Performance Metrics
    CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at);
    CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_type ON performance_metrics(metric_type);

    -- User Engagement
    CREATE INDEX IF NOT EXISTS idx_user_engagement_user_id ON user_engagement(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_engagement_week_start_date ON user_engagement(week_start_date);

    -- System Metrics
    CREATE INDEX IF NOT EXISTS idx_system_metrics_metric_date ON system_metrics(metric_date);

    -- Generations
    CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);
    CREATE INDEX IF NOT EXISTS idx_generations_status ON generations(status);

    -- Generated Images
    CREATE INDEX IF NOT EXISTS idx_generated_images_generation_id ON generated_images(generation_id);
  `);
}
