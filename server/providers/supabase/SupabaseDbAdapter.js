/**
 * Supabase Database Adapter
 *
 * Wraps Supabase query chains behind a uniform interface
 * matching the SqliteDbAdapter so either backend can be
 * swapped without changing calling code.
 */

// ---------------------------------------------------------------------------
// Projects Repository
// ---------------------------------------------------------------------------

class SupabaseProjectsRepository {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  async create(data) {
    const { data: result, error } = await this.supabase
      .from('projects')
      .insert([data])
      .select();
    if (error) throw error;
    return result[0];
  }

  async findById(id) {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*, project_images(*), collaborators:project_collaborators(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async findByUser(userId, filters = {}, pagination = {}) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.supabase
      .from('projects')
      .select('*, project_images(count)', { count: 'exact' })
      .eq('owner_id', userId);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.visibility) {
      query = query.eq('visibility', filters.visibility);
    }
    if (filters.search) {
      const sanitized = filters.search.replace(/[%_.*,()]/g, '');
      query = query.or(
        `name.ilike.%${sanitized}%,description.ilike.%${sanitized}%`
      );
    }

    query = query.range(from, to).order('updated_at', { ascending: false });

    const { data, error, count } = await query;
    if (error) throw error;
    return { data, count };
  }

  async update(id, data) {
    const { data: result, error } = await this.supabase
      .from('projects')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();
    if (error) throw error;
    return result[0];
  }

  async delete(id, soft = true) {
    if (soft) {
      const { error } = await this.supabase
        .from('projects')
        .update({ status: 'deleted', deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await this.supabase
        .from('projects')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }
    return true;
  }

  // -- Project Images -------------------------------------------------------

  async addImages(projectId, imageIds) {
    const rows = imageIds.map((imageId, index) => ({
      project_id: projectId,
      image_id: imageId,
      order: index,
    }));

    const { data, error } = await this.supabase
      .from('project_images')
      .insert(rows)
      .select();
    if (error) throw error;
    return data;
  }

  async getImages(projectId, pagination = {}) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await this.supabase
      .from('project_images')
      .select('*, images(*)', { count: 'exact' })
      .eq('project_id', projectId)
      .order('order', { ascending: true })
      .range(from, to);
    if (error) throw error;
    return { data, count };
  }

  async removeImages(projectId, imageIds) {
    const { error } = await this.supabase
      .from('project_images')
      .delete()
      .eq('project_id', projectId)
      .in('image_id', imageIds);
    if (error) throw error;
    return true;
  }

  // -- Collaborators --------------------------------------------------------

  async addCollaborator(projectId, data) {
    const { data: result, error } = await this.supabase
      .from('project_collaborators')
      .insert([{ ...data, project_id: projectId }])
      .select();
    if (error) throw error;
    return result[0];
  }

  async getCollaborators(projectId) {
    const { data, error } = await this.supabase
      .from('project_collaborators')
      .select('*, users(id, email, name)')
      .eq('project_id', projectId);
    if (error) throw error;
    return data;
  }

  async removeCollaborator(projectId, userId) {
    const { error } = await this.supabase
      .from('project_collaborators')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);
    if (error) throw error;
    return true;
  }

  // -- Versions -------------------------------------------------------------

  async createVersion(projectId, userId, notes = '') {
    // Snapshot current images
    const { data: images, error: imagesError } = await this.supabase
      .from('project_images')
      .select('*')
      .eq('project_id', projectId);
    if (imagesError) throw imagesError;

    // Snapshot current project state
    const { data: project, error: projectError } = await this.supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    if (projectError) throw projectError;

    // Determine next version number
    const { data: versions, error: versionsError } = await this.supabase
      .from('project_versions')
      .select('version_number')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(1);
    if (versionsError) throw versionsError;

    const versionNumber =
      versions && versions.length > 0 ? versions[0].version_number + 1 : 1;

    const { data: result, error } = await this.supabase
      .from('project_versions')
      .insert([
        {
          project_id: projectId,
          version_number: versionNumber,
          snapshot: { project, images },
          created_by: userId,
          notes,
        },
      ])
      .select();
    if (error) throw error;
    return result[0];
  }

  async getVersions(projectId) {
    const { data, error } = await this.supabase
      .from('project_versions')
      .select('*')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false });
    if (error) throw error;
    return data;
  }

  async restoreVersion(projectId, versionId) {
    // Fetch the version — scoped to the project to prevent cross-project restores
    const { data: version, error: versionError } = await this.supabase
      .from('project_versions')
      .select('*')
      .eq('id', versionId)
      .eq('project_id', projectId)
      .single();
    if (versionError) throw versionError;

    // Restore project data
    const { data: updatedProject, error: updateError } = await this.supabase
      .from('projects')
      .update(version.snapshot.project)
      .eq('id', projectId)
      .select();
    if (updateError) throw updateError;

    // Clear current images and re-insert from snapshot
    const { error: deleteError } = await this.supabase
      .from('project_images')
      .delete()
      .eq('project_id', projectId);
    if (deleteError) throw deleteError;

    if (version.snapshot.images && version.snapshot.images.length > 0) {
      const { error: insertError } = await this.supabase
        .from('project_images')
        .insert(version.snapshot.images);
      if (insertError) throw insertError;
    }

    return updatedProject[0];
  }
}

// ---------------------------------------------------------------------------
// Analytics Repository
// ---------------------------------------------------------------------------

class SupabaseAnalyticsRepository {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  async trackEvent(event) {
    const { data, error } = await this.supabase
      .from('analytics_events')
      .insert([event])
      .select();
    if (error) throw error;
    return data[0];
  }

  async getDashboard(userId, period = '30d') {
    const days = this._parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: usageStats } = await this.supabase
      .from('user_usage_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: dailyUsage } = await this.supabase
      .from('daily_usage_aggregates')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    const { data: platformUsage } = await this.supabase
      .from('platform_usage_stats')
      .select('*')
      .eq('user_id', userId)
      .order('usage_count', { ascending: false });

    const { data: recentEvents } = await this.supabase
      .from('analytics_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: costData } = await this.supabase
      .from('cost_tracking')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    return {
      overview: usageStats || {},
      dailyUsage: dailyUsage || [],
      platformUsage: platformUsage || [],
      recentActivity: recentEvents || [],
      costAnalysis: costData || [],
    };
  }

  async getUsageTimeline(userId, period = '30d') {
    const days = this._parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.supabase
      .from('daily_usage_aggregates')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });
    if (error) throw error;
    return data;
  }

  async getPlatformBreakdown(userId, period = '30d') {
    const days = this._parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.supabase
      .from('analytics_events')
      .select('platform')
      .eq('user_id', userId)
      .eq('event_type', 'image_generated')
      .gte('created_at', startDate.toISOString());
    if (error) throw error;

    const breakdown = {};
    (data || []).forEach((event) => {
      const platform = event.platform || 'unknown';
      breakdown[platform] = (breakdown[platform] || 0) + 1;
    });

    return Object.entries(breakdown)
      .map(([platform, count]) => ({ platform, count }))
      .sort((a, b) => b.count - a.count);
  }

  async trackCost(data) {
    const { data: result, error } = await this.supabase
      .from('cost_tracking')
      .upsert([data], { onConflict: 'user_id,date,service_provider' })
      .select();
    if (error) throw error;
    return result[0];
  }

  async getCostAnalytics(userId, period = '30d') {
    const days = this._parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.supabase
      .from('cost_tracking')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });
    if (error) throw error;
    return data;
  }

  async trackPerformance(metric) {
    const { data, error } = await this.supabase
      .from('performance_metrics')
      .insert([metric]);
    if (error) throw error;
    return data;
  }

  async getPerformanceMetrics(type = null, hours = 24) {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    let query = this.supabase
      .from('performance_metrics')
      .select('*')
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: true });

    if (type) {
      query = query.eq('metric_type', type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getAdminDashboard(period = '30d') {
    const days = this._parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: systemMetrics } = await this.supabase
      .from('system_metrics')
      .select('*')
      .gte('metric_date', startDate.toISOString().split('T')[0])
      .order('metric_date', { ascending: true });

    let totalUsers = 0;
    try {
      const { data: usersData } = await this.supabase.auth.admin.listUsers({ perPage: 1 });
      totalUsers = usersData?.total || 0;
    } catch {
      const { count } = await this.supabase
        .from('user_usage_stats')
        .select('*', { count: 'exact', head: true });
      totalUsers = count || 0;
    }

    const { count: activeUsers } = await this.supabase
      .from('user_usage_stats')
      .select('*', { count: 'exact', head: true })
      .gte('last_active_at', startDate.toISOString());

    const { data: topUsers } = await this.supabase
      .from('user_analytics_summary')
      .select('*')
      .order('total_images_generated', { ascending: false })
      .limit(10);

    return {
      overview: {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        period: `${days} days`,
      },
      systemMetrics: systemMetrics || [],
      topUsers: topUsers || [],
    };
  }

  async getUserEngagement(userId, period = '12w') {
    const days = this._parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const weekStart = this._getWeekStart(startDate);

    const { data, error } = await this.supabase
      .from('user_engagement')
      .select('*')
      .eq('user_id', userId)
      .gte('week_start_date', weekStart)
      .order('week_start_date', { ascending: true });
    if (error) throw error;
    return data;
  }

  // -- Helpers --------------------------------------------------------------

  _parsePeriod(period) {
    const match = period.match(/(\d+)([dhwmy])/);
    if (!match) return 30;
    const value = parseInt(match[1]);
    const unit = match[2];
    switch (unit) {
      case 'd': return value;
      case 'w': return value * 7;
      case 'm': return value * 30;
      case 'y': return value * 365;
      case 'h': return Math.max(1, Math.ceil(value / 24));
      default: return 30;
    }
  }

  _getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d.toISOString().split('T')[0];
  }
}

// ---------------------------------------------------------------------------
// Images Repository
// ---------------------------------------------------------------------------

class SupabaseImagesRepository {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  async saveGeneration(data) {
    const { data: result, error } = await this.supabase
      .from('generations')
      .insert([data])
      .select()
      .single();
    if (error) throw error;
    return result;
  }

  async saveGeneratedImage(data) {
    const { data: result, error } = await this.supabase
      .from('generated_images')
      .insert([data])
      .select()
      .single();
    if (error) throw error;
    return result;
  }
}

// ---------------------------------------------------------------------------
// Creative Adaptation Repository
// ---------------------------------------------------------------------------

class SupabaseAdaptationsRepository {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  async createProject(data) {
    const { data: result, error } = await this.supabase
      .from('adaptation_projects')
      .insert([data])
      .select()
      .single();
    if (error) throw error;
    return result;
  }

  async getProjectById(id) {
    const { data, error } = await this.supabase
      .from('adaptation_projects')
      .select(`
        *,
        source_asset:adaptation_source_assets(*),
        requested_outputs:adaptation_requested_outputs(
          *,
          attempts:adaptation_output_attempts(*)
        )
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async listProjectsByOwner(ownerId, filters = {}, pagination = {}) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.supabase
      .from('adaptation_projects')
      .select('*', { count: 'exact' })
      .eq('owner_id', ownerId);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    query = query.range(from, to).order('updated_at', { ascending: false });

    const { data, error, count } = await query;
    if (error) throw error;
    return { data, count };
  }

  async updateProject(id, updates) {
    const { data, error } = await this.supabase
      .from('adaptation_projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async createSourceAsset(data) {
    const { data: result, error } = await this.supabase
      .from('adaptation_source_assets')
      .insert([data])
      .select()
      .single();
    if (error) throw error;
    return result;
  }

  async updateSourceAsset(id, updates) {
    const { data, error } = await this.supabase
      .from('adaptation_source_assets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async createRequestedOutput(data) {
    const { data: result, error } = await this.supabase
      .from('adaptation_requested_outputs')
      .insert([data])
      .select()
      .single();
    if (error) throw error;
    return result;
  }

  async updateRequestedOutput(id, updates) {
    const { data, error } = await this.supabase
      .from('adaptation_requested_outputs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async createOutputAttempt(data) {
    const payload = {
      ...data,
      attempt_number: data.attempt_number || await this._nextAttemptNumber(data.output_id),
    };

    const { data: result, error } = await this.supabase
      .from('adaptation_output_attempts')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return result;
  }

  async updateOutputAttempt(id, updates) {
    const { data, error } = await this.supabase
      .from('adaptation_output_attempts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async _nextAttemptNumber(outputId) {
    const { data, error } = await this.supabase
      .from('adaptation_output_attempts')
      .select('attempt_number')
      .eq('output_id', outputId)
      .order('attempt_number', { ascending: false })
      .limit(1);
    if (error) throw error;

    return data && data.length > 0 ? data[0].attempt_number + 1 : 1;
  }
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class SupabaseDbAdapter {
  constructor(supabaseClient) {
    this.projects = new SupabaseProjectsRepository(supabaseClient);
    this.adaptations = new SupabaseAdaptationsRepository(supabaseClient);
    this.analytics = new SupabaseAnalyticsRepository(supabaseClient);
    this.images = new SupabaseImagesRepository(supabaseClient);
  }
}

export {
  SupabaseProjectsRepository,
  SupabaseAdaptationsRepository,
  SupabaseAnalyticsRepository,
  SupabaseImagesRepository,
};
