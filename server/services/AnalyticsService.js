/**
 * Analytics Service
 * Business logic for analytics - delegates data access to db adapter
 */

import { AnalyticsEvent, UserUsageStats } from '../models/Analytics.js';

export class AnalyticsService {
  constructor(dbAdapter) {
    this.db = dbAdapter;
  }

  async trackEvent(eventData) {
    const event = new AnalyticsEvent(eventData);
    const validation = event.validate();

    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    return await this.db.analytics.trackEvent(event.toJSON());
  }

  async getUserDashboard(userId, period = '30d') {
    const dashboard = await this.db.analytics.getDashboard(userId, period) || {};
    const days = this.parsePeriod(period);

    const trends = this.calculateTrends(dashboard.dailyUsage || [], days);

    return {
      overview: dashboard.overview ? new UserUsageStats(dashboard.overview).toJSON() : {},
      dailyUsage: dashboard.dailyUsage || [],
      platformUsage: dashboard.platformUsage || [],
      recentActivity: dashboard.recentActivity || [],
      costAnalysis: this.aggregateCosts(dashboard.costAnalysis || []),
      trends,
      period: {
        days,
        startDate: dashboard.period?.startDate || new Date().toISOString(),
        endDate: dashboard.period?.endDate || new Date().toISOString(),
      },
    };
  }

  async getUsageTimeline(userId, period = '30d', granularity = 'day') {
    const data = await this.db.analytics.getUsageTimeline(userId, period);
    return this.formatTimelineData(data || [], granularity);
  }

  async getPlatformBreakdown(userId, period = '30d') {
    return await this.db.analytics.getPlatformBreakdown(userId, period);
  }

  async getUserEngagement(userId, weeks = 12) {
    return await this.db.analytics.getUserEngagement(userId, `${weeks}w`);
  }

  async getCostAnalytics(userId, period = '30d') {
    const data = await this.db.analytics.getCostAnalytics(userId, period);
    return this.aggregateCosts(data || []);
  }

  async getPerformanceMetrics(metricType = null, hours = 24) {
    const data = await this.db.analytics.getPerformanceMetrics(metricType, hours);
    return this.aggregatePerformanceMetrics(data || []);
  }

  async trackPerformance(metricData) {
    return await this.db.analytics.trackPerformance(metricData);
  }

  async getAdminDashboard(period = '30d') {
    return await this.db.analytics.getAdminDashboard(period);
  }

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

  async trackPlatformUsage(userId, platform) {
    // Delegate to analytics adapter if available, otherwise track as event
    if (this.db.analytics.trackPlatformUsage) {
      return await this.db.analytics.trackPlatformUsage(userId, platform);
    }
    return await this.db.analytics.trackEvent({
      user_id: userId,
      event_type: 'platform_usage',
      platform,
    });
  }

  async getRealtimeStats(userId) {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // Use performance metrics or events from the last hour
    if (this.db.analytics.getRealtimeStats) {
      return await this.db.analytics.getRealtimeStats(userId);
    }

    return {
      lastHour: {},
      recentEvents: [],
      timestamp: new Date().toISOString(),
    };
  }

  // Helper methods (pure JS, no data access)

  parsePeriod(period) {
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

  getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d.toISOString().split('T')[0];
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
      return { totalCost: 0, averageCostPerDay: 0, costByProvider: [], timeline: [] };
    }

    const totalCost = costData.reduce((sum, item) => sum + parseFloat(item.total_cost_usd || 0), 0);
    const averageCostPerDay = totalCost / costData.length;

    const byProvider = {};
    costData.forEach((item) => {
      const provider = item.service_provider || 'unknown';
      if (!byProvider[provider]) byProvider[provider] = { provider, cost: 0, calls: 0, images: 0 };
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
      return { average: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0, count: 0 };
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
    const breakdown = { active: 0, engaged: 0, at_risk: 0, churned: 0 };
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
    if (!data.timeline || data.timeline.length === 0) return 'No data available';
    const headers = Object.keys(data.timeline[0]).join(',');
    const rows = data.timeline.map((item) => Object.values(item).join(','));
    return [headers, ...rows].join('\n');
  }
}
