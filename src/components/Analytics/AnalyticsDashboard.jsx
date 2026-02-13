import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../services/api';
import { StatCard } from './StatCard';
import { UsageChart } from './UsageChart';
import { PlatformChart } from './PlatformChart';
import { CostAnalytics } from './CostAnalytics';
import { EngagementMetrics } from './EngagementMetrics';
import { PerformanceMonitor } from './PerformanceMonitor';
import { RealtimeUpdates } from './RealtimeUpdates';
import './AnalyticsDashboard.css';

export const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await analyticsApi.getDashboard(period);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      setExporting(true);
      const blob = await analyticsApi.exportAnalytics(period, format);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return <div className="analytics-error">Failed to load analytics data</div>;
  }

  const { overview, dailyUsage, platformUsage, costAnalysis, trends, recentActivity } = analytics;

  return (
    <div className="analytics-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Analytics Dashboard</h1>
          <p className="subtitle">Track your usage, performance, and costs</p>
        </div>
        <div className="header-actions">
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="period-selector">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
            <option value="all">All time</option>
          </select>
          <div className="export-dropdown">
            <button className="btn-secondary" disabled={exporting}>
              {exporting ? 'Exporting...' : '📥 Export'}
            </button>
            <div className="dropdown-menu">
              <button onClick={() => handleExport('json')}>Export as JSON</button>
              <button onClick={() => handleExport('csv')}>Export as CSV</button>
              <button onClick={() => handleExport('pdf')}>Export as PDF</button>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Updates */}
      <RealtimeUpdates />

      {/* Navigation Tabs */}
      <div className="analytics-tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'usage' ? 'active' : ''}
          onClick={() => setActiveTab('usage')}
        >
          Usage
        </button>
        <button
          className={activeTab === 'costs' ? 'active' : ''}
          onClick={() => setActiveTab('costs')}
        >
          Costs
        </button>
        <button
          className={activeTab === 'engagement' ? 'active' : ''}
          onClick={() => setActiveTab('engagement')}
        >
          Engagement
        </button>
        <button
          className={activeTab === 'performance' ? 'active' : ''}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <>
            {/* Key Metrics */}
            <div className="metrics-grid">
              <StatCard
                title="Images Generated"
                value={overview.total_images_generated || 0}
                change={trends.imagesGenerated?.change}
                trend={trends.imagesGenerated?.trend}
                icon="🖼️"
              />
              <StatCard
                title="Images Downloaded"
                value={overview.total_images_downloaded || 0}
                change={trends.imagesDownloaded?.change}
                trend={trends.imagesDownloaded?.trend}
                icon="⬇️"
              />
              <StatCard
                title="Projects Created"
                value={overview.total_projects_created || 0}
                icon="📁"
              />
              <StatCard
                title="Storage Used"
                value={`${overview.storage_used_mb || 0} MB`}
                subtitle={`${overview.storage_used_gb || 0} GB`}
                icon="💾"
              />
              <StatCard
                title="API Calls"
                value={overview.total_api_calls || 0}
                change={trends.apiCalls?.change}
                trend={trends.apiCalls?.trend}
                icon="⚡"
              />
              <StatCard
                title="Active Time"
                value={`${overview.total_active_time_hours || 0} hrs`}
                icon="⏱️"
              />
            </div>

            {/* Usage Chart */}
            <div className="chart-section">
              <h2>Usage Timeline</h2>
              <UsageChart data={dailyUsage || []} />
            </div>

            {/* Platform Distribution */}
            <div className="chart-section">
              <h2>Platform Distribution</h2>
              <PlatformChart data={platformUsage || []} />
            </div>
          </>
        )}

        {activeTab === 'usage' && (
          <>
            <div className="chart-section">
              <h2>Detailed Usage Analytics</h2>
              <UsageChart data={dailyUsage || []} detailed={true} />
            </div>
            
            <div className="recent-activity">
              <h2>Recent Activity</h2>
              <div className="activity-list">
                {recentActivity?.slice(0, 20).map((event, index) => (
                  <div key={index} className="activity-item">
                    <span className="activity-type">{event.event_type}</span>
                    <span className="activity-time">
                      {new Date(event.created_at).toLocaleString()}
                    </span>
                    {event.platform && (
                      <span className="activity-platform">{event.platform}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'costs' && (
          <CostAnalytics data={costAnalysis} period={period} />
        )}

        {activeTab === 'engagement' && (
          <EngagementMetrics userId={overview.user_id} />
        )}

        {activeTab === 'performance' && (
          <PerformanceMonitor />
        )}
      </div>
    </div>
  );
};