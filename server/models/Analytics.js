/**
 * Analytics Models
 * Data models for analytics tracking
 */

export class AnalyticsEvent {
  constructor(data) {
    this.id = data.id || null;
    this.user_id = data.user_id;
    this.session_id = data.session_id;
    this.event_type = data.event_type; // Required
    this.event_category = data.event_category;
    this.event_action = data.event_action;
    this.event_label = data.event_label;
    this.event_value = data.event_value || 0;
    this.metadata = data.metadata || {};
    this.ip_address = data.ip_address;
    this.user_agent = data.user_agent;
    this.referrer = data.referrer;
    this.platform = data.platform;
    this.created_at = data.created_at || new Date().toISOString();
  }

  validate() {
    const errors = [];

    if (!this.event_type) {
      errors.push('Event type is required');
    }

    if (!this.user_id && !this.session_id) {
      errors.push('Either user_id or session_id is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  toJSON() {
    const json = {
      user_id: this.user_id,
      session_id: this.session_id,
      event_type: this.event_type,
      event_category: this.event_category,
      event_action: this.event_action,
      event_label: this.event_label,
      event_value: this.event_value,
      metadata: this.metadata,
      ip_address: this.ip_address,
      user_agent: this.user_agent,
      referrer: this.referrer,
      platform: this.platform,
      created_at: this.created_at,
    };
    // Only include id if it's set (avoid sending null to DB which conflicts with DEFAULT)
    if (this.id) {
      json.id = this.id;
    }
    return json;
  }
}

export class UserUsageStats {
  constructor(data) {
    this.id = data.id || null;
    this.user_id = data.user_id;
    this.total_images_generated = data.total_images_generated || 0;
    this.total_images_downloaded = data.total_images_downloaded || 0;
    this.total_projects_created = data.total_projects_created || 0;
    this.storage_used_bytes = data.storage_used_bytes || 0;
    this.total_api_calls = data.total_api_calls || 0;
    this.total_active_time_seconds = data.total_active_time_seconds || 0;
    this.last_active_at = data.last_active_at;
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      total_images_generated: this.total_images_generated,
      total_images_downloaded: this.total_images_downloaded,
      total_projects_created: this.total_projects_created,
      storage_used_bytes: this.storage_used_bytes,
      storage_used_mb: (this.storage_used_bytes / (1024 * 1024)).toFixed(2),
      storage_used_gb: (this.storage_used_bytes / (1024 * 1024 * 1024)).toFixed(2),
      total_api_calls: this.total_api_calls,
      total_active_time_seconds: this.total_active_time_seconds,
      total_active_time_hours: (this.total_active_time_seconds / 3600).toFixed(2),
      last_active_at: this.last_active_at,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

export class DailyUsageAggregate {
  constructor(data) {
    this.id = data.id || null;
    this.user_id = data.user_id;
    this.date = data.date;
    this.images_generated = data.images_generated || 0;
    this.images_downloaded = data.images_downloaded || 0;
    this.projects_created = data.projects_created || 0;
    this.api_calls = data.api_calls || 0;
    this.active_time_seconds = data.active_time_seconds || 0;
    this.unique_sessions = data.unique_sessions || 0;
    this.created_at = data.created_at || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      date: this.date,
      images_generated: this.images_generated,
      images_downloaded: this.images_downloaded,
      projects_created: this.projects_created,
      api_calls: this.api_calls,
      active_time_seconds: this.active_time_seconds,
      unique_sessions: this.unique_sessions,
      created_at: this.created_at,
    };
  }
}

export class CostTracking {
  constructor(data) {
    this.id = data.id || null;
    this.user_id = data.user_id;
    this.date = data.date;
    this.service_provider = data.service_provider;
    this.api_calls = data.api_calls || 0;
    this.total_cost_usd = data.total_cost_usd || 0;
    this.tokens_used = data.tokens_used || 0;
    this.images_generated = data.images_generated || 0;
    this.metadata = data.metadata || {};
    this.created_at = data.created_at || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      date: this.date,
      service_provider: this.service_provider,
      api_calls: this.api_calls,
      total_cost_usd: parseFloat(this.total_cost_usd).toFixed(4),
      tokens_used: this.tokens_used,
      images_generated: this.images_generated,
      cost_per_image: this.images_generated > 0 
        ? (this.total_cost_usd / this.images_generated).toFixed(4)
        : 0,
      metadata: this.metadata,
      created_at: this.created_at,
    };
  }
}