import { v4 as uuidv4 } from 'uuid';

export class SqliteDbAdapter {
  constructor(db) {
    this.db = db;
    this.projects = new ProjectsRepository(db);
    this.analytics = new AnalyticsRepository(db);
    this.images = new ImagesRepository(db);
    this.users = new UsersRepository(db);
  }
}

class ProjectsRepository {
  constructor(db) {
    this.db = db;
  }

  async create(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
      INSERT INTO projects (id, name, description, owner_id, template_id, status, visibility, settings, tags, categories, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        id,
        data.name,
        data.description || '',
        data.owner_id,
        data.template_id || null,
        data.status || 'active',
        data.visibility || 'private',
        JSON.stringify(data.settings || {}),
        JSON.stringify(data.tags || []),
        JSON.stringify(data.categories || []),
        now,
        now
      );
    return this._getById(id);
  }

  async findById(id) {
    const row = this._getById(id);
    if (!row) return undefined;

    row.project_images = this.db
      .prepare('SELECT * FROM project_images WHERE project_id = ? ORDER BY "order"')
      .all(id);
    row.collaborators = this.db
      .prepare(
        `
      SELECT pc.*, u.email as user_email FROM project_collaborators pc
      LEFT JOIN users u ON pc.user_id = u.id WHERE pc.project_id = ?
    `
      )
      .all(id)
      .map((r) => this._parseJson(r, ['permissions']));
    return row;
  }

  async findByUser(userId, filters = {}, pagination = {}) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const offset = (page - 1) * limit;

    let where =
      'WHERE (owner_id = ? OR id IN (SELECT project_id FROM project_collaborators WHERE user_id = ?))';
    const params = [userId, userId];

    if (filters.status) {
      where += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.visibility) {
      where += ' AND visibility = ?';
      params.push(filters.visibility);
    }
    if (filters.search) {
      where += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const countRow = this.db
      .prepare(`SELECT COUNT(*) as count FROM projects ${where}`)
      .get(...params);
    const rows = this.db
      .prepare(`SELECT * FROM projects ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`)
      .all(...params, limit, offset);

    return { data: rows.map((r) => this._parseJsonFields(r)), count: countRow.count };
  }

  async update(id, data) {
    const ALLOWED_COLUMNS = new Set([
      'name',
      'description',
      'status',
      'visibility',
      'template_id',
      'settings',
      'tags',
      'categories',
      'owner_id',
    ]);
    const JSON_COLUMNS = new Set(['tags', 'categories', 'settings']);

    const sets = [];
    const params = [];
    for (const [key, value] of Object.entries(data)) {
      if (!ALLOWED_COLUMNS.has(key)) continue;
      if (JSON_COLUMNS.has(key)) {
        sets.push(`${key} = ?`);
        params.push(JSON.stringify(value));
      } else {
        sets.push(`${key} = ?`);
        params.push(value);
      }
    }
    if (sets.length === 0) return this._getById(id);

    sets.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    this.db.prepare(`UPDATE projects SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    return this._getById(id);
  }

  async delete(id, soft = true) {
    if (soft) {
      this.db
        .prepare('UPDATE projects SET status = ?, deleted_at = ? WHERE id = ?')
        .run('deleted', new Date().toISOString(), id);
    } else {
      this.db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    }
  }

  async addImages(projectId, imageIds) {
    const insert = this.db.prepare(
      'INSERT OR IGNORE INTO project_images (id, project_id, image_id, "order", created_at) VALUES (?, ?, ?, ?, ?)'
    );
    const now = new Date().toISOString();
    const txn = this.db.transaction((ids) => {
      ids.forEach((imageId, index) => insert.run(uuidv4(), projectId, imageId, index, now));
    });
    txn(imageIds);
  }

  async getImages(projectId, pagination = {}) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 50;
    const offset = (page - 1) * limit;

    const countRow = this.db
      .prepare('SELECT COUNT(*) as count FROM project_images WHERE project_id = ?')
      .get(projectId);
    const rows = this.db
      .prepare(
        'SELECT * FROM project_images WHERE project_id = ? ORDER BY "order" LIMIT ? OFFSET ?'
      )
      .all(projectId, limit, offset);

    return { data: rows, count: countRow.count };
  }

  async removeImages(projectId, imageIds) {
    const placeholders = imageIds.map(() => '?').join(',');
    this.db
      .prepare(`DELETE FROM project_images WHERE project_id = ? AND image_id IN (${placeholders})`)
      .run(projectId, ...imageIds);
  }

  async addCollaborator(projectId, data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
      INSERT INTO project_collaborators (id, project_id, user_id, role, permissions, invited_by, invited_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        id,
        projectId,
        data.user_id,
        data.role || 'viewer',
        JSON.stringify(data.permissions || []),
        data.invited_by,
        now
      );
  }

  async getCollaborators(projectId) {
    return this.db
      .prepare(
        `
      SELECT pc.*, u.email as user_email FROM project_collaborators pc
      LEFT JOIN users u ON pc.user_id = u.id WHERE pc.project_id = ?
    `
      )
      .all(projectId)
      .map((r) => this._parseJson(r, ['permissions']));
  }

  async removeCollaborator(projectId, userId) {
    this.db
      .prepare('DELETE FROM project_collaborators WHERE project_id = ? AND user_id = ?')
      .run(projectId, userId);
  }

  async createVersion(projectId, createdBy, notes = '') {
    const id = uuidv4();
    const now = new Date().toISOString();
    const project = this._getById(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);
    const images = this.db
      .prepare('SELECT * FROM project_images WHERE project_id = ?')
      .all(projectId);

    const lastVersion = this.db
      .prepare('SELECT MAX(version_number) as max_v FROM project_versions WHERE project_id = ?')
      .get(projectId);
    const versionNumber = (lastVersion?.max_v || 0) + 1;

    this.db
      .prepare(
        `
      INSERT INTO project_versions (id, project_id, version_number, snapshot, created_by, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        id,
        projectId,
        versionNumber,
        JSON.stringify({ project, images }),
        createdBy,
        notes,
        now
      );

    const row = this.db.prepare('SELECT * FROM project_versions WHERE id = ?').get(id);
    return { ...row, snapshot: JSON.parse(row.snapshot || '{}') };
  }

  async getVersions(projectId) {
    return this.db
      .prepare('SELECT * FROM project_versions WHERE project_id = ? ORDER BY version_number DESC')
      .all(projectId)
      .map((r) => ({ ...r, snapshot: JSON.parse(r.snapshot || '{}') }));
  }

  async restoreVersion(projectId, versionId) {
    const version = this.db
      .prepare('SELECT * FROM project_versions WHERE id = ? AND project_id = ?')
      .get(versionId, projectId);
    if (!version) throw new Error('Version not found');
    const snapshot = JSON.parse(version.snapshot);

    if (snapshot.project) {
      const { id, project_images, collaborators, ...fields } = snapshot.project;
      await this.update(projectId, fields);
    }

    this.db.prepare('DELETE FROM project_images WHERE project_id = ?').run(projectId);
    if (snapshot.images?.length > 0) {
      const insert = this.db.prepare(
        'INSERT INTO project_images (id, project_id, image_id, "order", created_at) VALUES (?, ?, ?, ?, ?)'
      );
      const now = new Date().toISOString();
      for (const img of snapshot.images) {
        insert.run(img.id || uuidv4(), projectId, img.image_id, img.order || 0, now);
      }
    }
    return this._getById(projectId);
  }

  _getById(id) {
    const row = this.db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    return row ? this._parseJsonFields(row) : undefined;
  }

  _parseJsonFields(row) {
    return {
      ...row,
      tags: JSON.parse(row.tags || '[]'),
      categories: JSON.parse(row.categories || '[]'),
      settings: JSON.parse(row.settings || '{}'),
    };
  }

  _parseJson(row, fields) {
    const result = { ...row };
    for (const f of fields) {
      if (result[f]) result[f] = JSON.parse(result[f]);
    }
    return result;
  }
}

class AnalyticsRepository {
  constructor(db) {
    this.db = db;
  }

  async trackEvent(event) {
    const id = uuidv4();
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
      INSERT INTO analytics_events (id, user_id, event_type, event_category, event_action, event_label, event_value, metadata, ip_address, user_agent, referrer, platform, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        id,
        event.user_id,
        event.event_type,
        event.event_category || null,
        event.event_action || null,
        event.event_label || null,
        event.event_value || null,
        JSON.stringify(event.metadata || {}),
        event.ip_address || null,
        event.user_agent || null,
        event.referrer || null,
        event.platform || null,
        now
      );
    return this.db.prepare('SELECT * FROM analytics_events WHERE id = ?').get(id);
  }

  async getDashboard(userId, period = '30d') {
    const days = this._parsePeriod(period);
    const startDate = this._daysAgo(days);

    const usageStats = this.db
      .prepare('SELECT * FROM user_usage_stats WHERE user_id = ?')
      .get(userId);
    const dailyUsage = this.db
      .prepare(
        'SELECT * FROM daily_usage_aggregates WHERE user_id = ? AND date >= ? ORDER BY date ASC'
      )
      .all(userId, startDate);
    const platformUsage = this.db
      .prepare('SELECT * FROM platform_usage_stats WHERE user_id = ? ORDER BY usage_count DESC')
      .all(userId);
    const recentEvents = this.db
      .prepare('SELECT * FROM analytics_events WHERE user_id = ? ORDER BY created_at DESC LIMIT 50')
      .all(userId);
    const costData = this.db
      .prepare('SELECT * FROM cost_tracking WHERE user_id = ? AND date >= ? ORDER BY date ASC')
      .all(userId, startDate);

    return {
      overview: usageStats || {},
      dailyUsage: dailyUsage || [],
      platformUsage: platformUsage || [],
      recentActivity: recentEvents || [],
      costAnalysis: costData || [],
      period: { days, startDate, endDate: new Date().toISOString() },
    };
  }

  async getUsageTimeline(userId, period = '30d') {
    const days = this._parsePeriod(period);
    const startDate = this._daysAgo(days);
    return this.db
      .prepare(
        'SELECT * FROM daily_usage_aggregates WHERE user_id = ? AND date >= ? ORDER BY date ASC'
      )
      .all(userId, startDate);
  }

  async getPlatformBreakdown(userId, period = '30d') {
    const days = this._parsePeriod(period);
    const startDate = this._daysAgoISO(days);
    const events = this.db
      .prepare(
        `
      SELECT platform FROM analytics_events WHERE user_id = ? AND event_type = 'image_generated' AND created_at >= ?
    `
      )
      .all(userId, startDate);

    const breakdown = {};
    events.forEach((e) => {
      const p = e.platform || 'unknown';
      breakdown[p] = (breakdown[p] || 0) + 1;
    });

    return Object.entries(breakdown)
      .map(([platform, count]) => ({ platform, count }))
      .sort((a, b) => b.count - a.count);
  }

  async trackCost(data) {
    const existing = this.db
      .prepare(
        'SELECT * FROM cost_tracking WHERE user_id = ? AND date = ? AND service_provider = ?'
      )
      .get(data.user_id, data.date, data.service_provider);

    if (existing) {
      this.db
        .prepare(
          `
        UPDATE cost_tracking SET api_calls = api_calls + 1, total_cost_usd = total_cost_usd + ?, tokens_used = tokens_used + ?, images_generated = images_generated + ?
        WHERE id = ?
      `
        )
        .run(data.cost || 0, data.tokens || 0, data.images || 0, existing.id);
    } else {
      const id = uuidv4();
      this.db
        .prepare(
          `
        INSERT INTO cost_tracking (id, user_id, date, service_provider, api_calls, total_cost_usd, tokens_used, images_generated, created_at)
        VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)
      `
        )
        .run(
          id,
          data.user_id,
          data.date,
          data.service_provider,
          data.cost || 0,
          data.tokens || 0,
          data.images || 0,
          new Date().toISOString()
        );
    }
  }

  async trackPerformance(metric) {
    const id = uuidv4();
    this.db
      .prepare(
        `
      INSERT INTO performance_metrics (id, metric_type, metric_name, value, unit, tags, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        id,
        metric.metric_type,
        metric.metric_name,
        metric.value,
        metric.unit || 'ms',
        JSON.stringify(metric.tags || {}),
        new Date().toISOString()
      );
  }

  async getCostAnalytics(userId, period = '30d') {
    const days = this._parsePeriod(period);
    const startDate = this._daysAgo(days);
    return this.db
      .prepare('SELECT * FROM cost_tracking WHERE user_id = ? AND date >= ? ORDER BY date ASC')
      .all(userId, startDate);
  }

  async getPerformanceMetrics(metricType = null, hours = 24) {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);
    const start = startTime.toISOString();

    if (metricType) {
      return this.db
        .prepare(
          'SELECT * FROM performance_metrics WHERE metric_type = ? AND created_at >= ? ORDER BY created_at ASC'
        )
        .all(metricType, start);
    }
    return this.db
      .prepare('SELECT * FROM performance_metrics WHERE created_at >= ? ORDER BY created_at ASC')
      .all(start);
  }

  async getAdminDashboard(period = '30d') {
    const days = this._parsePeriod(period);
    const startDate = this._daysAgo(days);

    const systemMetrics = this.db
      .prepare('SELECT * FROM system_metrics WHERE metric_date >= ? ORDER BY metric_date ASC')
      .all(startDate);
    const totalUsers = this.db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const activeUsers = this.db
      .prepare('SELECT COUNT(*) as count FROM user_usage_stats WHERE last_active_at >= ?')
      .get(this._daysAgoISO(days)).count;

    return {
      overview: { totalUsers, activeUsers, period: `${days} days` },
      systemMetrics: systemMetrics || [],
      timestamp: new Date().toISOString(),
    };
  }

  async getUserEngagement(userId, period = '12w') {
    const weeks = parseInt(period) || 12;
    const startDate = this._daysAgo(weeks * 7);
    return this.db
      .prepare(
        'SELECT * FROM user_engagement WHERE user_id = ? AND week_start_date >= ? ORDER BY week_start_date ASC'
      )
      .all(userId, startDate);
  }

  _parsePeriod(period) {
    const match = period.match(/(\d+)([dhwmy])/);
    if (!match) return 30;
    const value = parseInt(match[1]);
    const unit = match[2];
    switch (unit) {
      case 'd':
        return value;
      case 'w':
        return value * 7;
      case 'm':
        return value * 30;
      case 'y':
        return value * 365;
      case 'h':
        return Math.max(1, Math.ceil(value / 24));
      default:
        return 30;
    }
  }

  _daysAgo(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  }

  _daysAgoISO(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
  }
}

class ImagesRepository {
  constructor(db) {
    this.db = db;
  }

  async saveGeneration(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    this.db
      .prepare(
        'INSERT INTO generations (id, user_id, prompt, image_type, status, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(id, data.user_id, data.prompt, data.image_type || 'photo', 'completed', now);
    return this.db.prepare('SELECT * FROM generations WHERE id = ?').get(id);
  }

  async saveGeneratedImage(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
      INSERT INTO generated_images (id, generation_id, platform_id, platform_name, width, height, file_size, storage_path, url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        id,
        data.generation_id,
        data.platform_id,
        data.platform_name,
        data.width,
        data.height,
        data.file_size,
        data.storage_path,
        data.url,
        now
      );
    return this.db.prepare('SELECT * FROM generated_images WHERE id = ?').get(id);
  }
}

class UsersRepository {
  constructor(db) {
    this.db = db;
  }

  async create(email, passwordHash, metadata = {}) {
    const id = uuidv4();
    const now = new Date().toISOString();
    this.db
      .prepare(
        'INSERT INTO users (id, email, password_hash, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(id, email, passwordHash, JSON.stringify(metadata), now, now);
    return { id, email, metadata };
  }

  async findByEmail(email) {
    return this.db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  }

  async findById(id) {
    return this.db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }

  async setApiKey(userId, encryptedKey, source) {
    this.db
      .prepare(
        'UPDATE users SET encrypted_openai_key = ?, openai_key_source = ?, updated_at = ? WHERE id = ?'
      )
      .run(encryptedKey, source, new Date().toISOString(), userId);
  }

  async getApiKey(userId) {
    const row = this.db
      .prepare('SELECT encrypted_openai_key, openai_key_source FROM users WHERE id = ?')
      .get(userId);
    return row ? { encryptedKey: row.encrypted_openai_key, source: row.openai_key_source } : null;
  }

  async removeApiKey(userId) {
    this.db
      .prepare(
        'UPDATE users SET encrypted_openai_key = NULL, openai_key_source = NULL, updated_at = ? WHERE id = ?'
      )
      .run(new Date().toISOString(), userId);
  }

  async setChatgptAccountId(userId, chatgptAccountId) {
    this.db
      .prepare('UPDATE users SET chatgpt_account_id = ?, updated_at = ? WHERE id = ?')
      .run(chatgptAccountId, new Date().toISOString(), userId);
  }

  async setRefreshToken(userId, encryptedRefreshToken) {
    this.db
      .prepare('UPDATE users SET encrypted_refresh_token = ?, updated_at = ? WHERE id = ?')
      .run(encryptedRefreshToken, new Date().toISOString(), userId);
  }
}
