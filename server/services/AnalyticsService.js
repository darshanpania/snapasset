/**
 * Analytics Service
 * Handles analytics data collection, aggregation, and retrieval
 */

import { AnalyticsEvent, UserUsageStats, DailyUsageAggregate } from '../models/Analytics.js';

export class AnalyticsService {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Track an analytics event
   */
  async trackEvent(eventData) {
    const event = new AnalyticsEvent(eventData);
    const validation = event.validate();

    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    const { data, error } = await this.supabase
      .from('analytics_events')
      .insert([event.toJSON()])
      .select();

    if (error) throw error;

    return data[0];
  }

  /**
   * Get user dashboard analytics
   */
  async getUserDashboard(userId, period = '30d') {
    const days = this.parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get overall stats
    const { data: usageStats } = await this.supabase
      .from('user_usage_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get daily usage for period
    const { data: dailyUsage } = await this.supabase
      .from('daily_usage_aggregates')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    // Get platform usage
    const { data: platformUsage } = await this.supabase
      .from('platform_usage_stats')
      .select('*')
      .eq('user_id', userId)
      .order('usage_count', { ascending: false });

    // Get recent events
    const { data: recentEvents } = await this.supabase
      .from('analytics_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Get cost data
    const { data: costData } = await this.supabase
      .from('cost_tracking')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    // Calculate trends
    const trends = this.calculateTrends(dailyUsage, days);

    return {
      overview: new UserUsageStats(usageStats || {}).toJSON(),
      dailyUsage: dailyUsage || [],
      platformUsage: platformUsage || [],
      recentActivity: recentEvents || [],
      costAnalysis: this.aggregateCosts(costData || []),
      trends,
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
    };
  }

  /**
   * Get usage timeline data
   */
  async getUsageTimeline(userId, period = '30d', granularity = 'day') {
    const days = this.parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.supabase
      .from('daily_usage_aggregates')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;

    return this.formatTimelineData(data || [], granularity);
  }

  /**
   * Get platform breakdown
   */
  async getPlatformBreakdown(userId, period = '30d') {
    const days = this.parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.supabase
      .from('analytics_events')
      .select('platform')
      .eq('user_id', userId)
      .eq('event_type', 'image_generated')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    // Aggregate by platform
    const breakdown = {};
    (data || []).forEach((event) => {
      const platform = event.platform || 'unknown';
      breakdown[platform] = (breakdown[platform] || 0) + 1;
    });

    return Object.entries(breakdown)
      .map(([platform, count]) => ({ platform, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get user engagement metrics
   */
  async getUserEngagement(userId, weeks = 12) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeks * 7));
    const weekStart = this.getWeekStart(startDate);

    const { data, error } = await this.supabase
      .from('user_engagement')
      .select('*')
      .eq('user_id', userId)
      .gte('week_start_date', weekStart)
      .order('week_start_date', { ascending: true });

    if (error) throw error;

    return data || [];
  }

  /**
   * Get cost analytics
   */
  async getCostAnalytics(userId, period = '30d') {
    const days = this.parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.supabase
      .from('cost_tracking')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;

    return this.aggregateCosts(data || []);
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(metricType = null, hours = 24) {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    let query = this.supabase
      .from('performance_metrics')
      .select('*')
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: true });

    if (metricType) {
      query = query.eq('metric_type', metricType);
    }

    const { data, error } = await query;

    if (error) throw error;

    return this.aggregatePerformanceMetrics(data || []);
  }

  /**
   * Track performance metric
   */
  async trackPerformance(metricData) {
    const { data, error } = await this.supabase
      .from('performance_metrics')
      .insert([metricData]);

    if (error) throw error;

    return data;
  }

  /**
   * Get admin dashboard (system-wide metrics)
   */
  async getAdminDashboard(period = '30d') {
    const days = this.parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get system metrics
    const { data: systemMetrics } = await this.supabase
      .from('system_metrics')
      .select('*')
      .gte('metric_date', startDate.toISOString().split('T')[0])
      .order('metric_date', { ascending: true });

    // Get user statistics
    const { count: totalUsers } = await this.supabase
      .from('auth.users')
      .select('*', { count: 'exact', head: true });

    const { count: activeUsers } = await this.supabase
      .from('user_usage_stats')
      .select('*', { count: 'exact', head: true })
      .gte('last_active_at', startDate.toISOString());

    // Get top users by activity
    const { data: topUsers } = await this.supabase
      .from('user_analytics_summary')
      .select('*')
      .order('total_images_generated', { ascending: false })
      .limit(10);

    // Get retention data
    const { data: retentionData } = await this.supabase
      .from('user_engagement')
      .select('retention_cohort')
      .gte('week_start_date', this.getWeekStart(startDate));

    const retentionBreakdown = this.calculateRetentionBreakdown(retentionData || []);

    return {
      overview: {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        period: `${days} days`,
      },
      systemMetrics: systemMetrics || [],
      topUsers: topUsers || [],
      retention: retentionBreakdown,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(userId, format = 'json', period = '30d') {
    const dashboard = await this.getUserDashboard(userId, period);
    const timeline = await this.getUsageTimeline(userId, period);

    const exportData = {
      user_id: userId,
      exported_at: new Date().toISOString(),
      period,
      overview: dashboard.overview,
      timeline,
      platforms: dashboard.platformUsage,
      costs: dashboard.costAnalysis,
      trends: dashboard.trends,
    };

    switch (format) {
      case 'csv':
        return this.convertToCSV(exportData);
      case 'json':
      default:
        return exportData;
    }
  }

  // Helper methods

  parsePeriod(period) {
    const match = period.match(/(\d+)([dhwmy])/);
    if (!match) return 30; // Default to 30 days

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'd': return value;
      case 'w': return value * 7;
      case 'm': return value * 30;
      case 'y': return value * 365;
      case 'h': return Math.ceil(value / 24);
      default: return 30;
    }
  }

  getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  }

  calculateTrends(dailyUsage, days) {
    if (!dailyUsage || dailyUsage.length === 0) {
      return {
        imagesGenerated: { value: 0, change: 0, trend: 'stable' },
        imagesDownloaded: { value: 0, change: 0, trend: 'stable' },
        apiCalls: { value: 0, change: 0, trend: 'stable' },
      };
    }

    const midPoint = Math.floor(dailyUsage.length / 2);
    const firstHalf = dailyUsage.slice(0, midPoint);
    const secondHalf = dailyUsage.slice(midPoint);

    const calculateChange = (metric) => {
      const firstSum = firstHalf.reduce((sum, day) => sum + (day[metric] || 0), 0);
      const secondSum = secondHalf.reduce((sum, day) => sum + (day[metric] || 0), 0);
      
      if (firstSum === 0) return { value: secondSum, change: 0, trend: 'stable' };
      
      const change = ((secondSum - firstSum) / firstSum) * 100;
      const trend = change > 5 ? 'up' : change < -5 ? 'down' : 'stable';
      
      return { value: secondSum, change: change.toFixed(1), trend };
    };

    return {
      imagesGenerated: calculateChange('images_generated'),
      imagesDownloaded: calculateChange('images_downloaded'),
      apiCalls: calculateChange('api_calls'),
    };
  }

  aggregateCosts(costData) {
    if (!costData || costData.length === 0) {
      return {
        totalCost: 0,
        averageCostPerDay: 0,
        costByProvider: [],
        timeline: [],
      };
    }

    const totalCost = costData.reduce((sum, item) => sum + parseFloat(item.total_cost_usd || 0), 0);
    const averageCostPerDay = totalCost / costData.length;

    // Group by provider
    const byProvider = {};
    costData.forEach((item) => {
      const provider = item.service_provider || 'unknown';
      if (!byProvider[provider]) {
        byProvider[provider] = { provider, cost: 0, calls: 0, images: 0 };
      }
      byProvider[provider].cost += parseFloat(item.total_cost_usd || 0);
      byProvider[provider].calls += item.api_calls || 0;
      byProvider[provider].images += item.images_generated || 0;
    });

    return {
      totalCost: totalCost.toFixed(4),
      averageCostPerDay: averageCostPerDay.toFixed(4),
      costByProvider: Object.values(byProvider),
      timeline: costData,
    };
  }

  formatTimelineData(data, granularity = 'day') {
    // For now, return daily data as-is
    // Future: Support weekly/monthly aggregation
    return data.map((item) => ({
      date: item.date,
      images: item.images_generated || 0,
      downloads: item.images_downloaded || 0,
      projects: item.projects_created || 0,
      apiCalls: item.api_calls || 0,
      sessions: item.unique_sessions || 0,
    }));
  }

  aggregatePerformanceMetrics(metrics) {
    if (!metrics || metrics.length === 0) {
      return {
        average: 0,
        min: 0,
        max: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        count: 0,
      };
    }

    const values = metrics.map((m) => m.value).sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      average: (sum / values.length).toFixed(2),
      min: values[0],
      max: values[values.length - 1],
      p50: this.percentile(values, 50),
      p95: this.percentile(values, 95),
      p99: this.percentile(values, 99),
      count: values.length,
      unit: metrics[0]?.unit || 'ms',
    };
  }

  percentile(values, p) {
    const index = Math.ceil((p / 100) * values.length) - 1;
    return values[index];
  }

  calculateRetentionBreakdown(retentionData) {
    const breakdown = {
      active: 0,
      engaged: 0,
      at_risk: 0,
      churned: 0,
    };

    retentionData.forEach((item) => {
      const cohort = item.retention_cohort || 'churned';
      breakdown[cohort] = (breakdown[cohort] || 0) + 1;
    });

    const total = Object.values(breakdown).reduce((a, b) => a + b, 0);

    return {
      breakdown,
      percentages: {
        active: total > 0 ? ((breakdown.active / total) * 100).toFixed(1) : 0,
        engaged: total > 0 ? ((breakdown.engaged / total) * 100).toFixed(1) : 0,
        at_risk: total > 0 ? ((breakdown.at_risk / total) * 100).toFixed(1) : 0,
        churned: total > 0 ? ((breakdown.churned / total) * 100).toFixed(1) : 0,
      },
      total,
    };
  }

  convertToCSV(data) {
    // Convert timeline to CSV
    if (!data.timeline || data.timeline.length === 0) {
      return 'No data available';
    }

    const headers = Object.keys(data.timeline[0]).join(',');
    const rows = data.timeline.map((item) => Object.values(item).join(','));

    return [headers, ...rows].join('\n');
  }

  /**
   * Track platform usage
   */
  async trackPlatformUsage(userId, platform) {
    const { data, error } = await this.supabase
      .from('platform_usage_stats')
      .upsert(
        {
          user_id: userId,
          platform,
          usage_count: 1,
          last_used_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,platform',
          ignoreDuplicates: false,
        }
      )
      .select();

    if (error) {
      // If record exists, increment usage_count
      await this.supabase.rpc('increment_platform_usage', {
        p_user_id: userId,
        p_platform: platform,
      });
    }

    return data;
  }

  /**
   * Get real-time analytics stream
   */
  async getRealtimeStats(userId) {
    // Get stats from the last hour
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const { data, error } = await this.supabase
      .from('analytics_events')
      .select('event_type, created_at')
      .eq('user_id', userId)
      .gte('created_at', oneHourAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Aggregate by event type
    const eventCounts = {};
    (data || []).forEach((event) => {
      eventCounts[event.event_type] = (eventCounts[event.event_type] || 0) + 1;
    });

    return {
      lastHour: eventCounts,
      recentEvents: data || [],
      timestamp: new Date().toISOString(),
    };
  }
}