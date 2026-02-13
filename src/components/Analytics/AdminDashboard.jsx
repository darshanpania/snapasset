import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../services/api';
import { StatCard } from './StatCard';
import { UserRetentionChart } from './UserRetentionChart';
import { SystemMetricsChart } from './SystemMetricsChart';
import './AdminDashboard.css';

export const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    loadAdminAnalytics();
  }, [period]);

  const loadAdminAnalytics = async () => {
    try {
      setLoading(true);
      const response = await analyticsApi.getAdminDashboard(period);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to load admin analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading admin analytics...</div>;
  }

  if (!analytics) {
    return <div className="error">Failed to load analytics</div>;
  }

  const { overview, systemMetrics, topUsers, retention } = analytics;

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>🔧 Admin Analytics Dashboard</h1>
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* System Overview */}
      <div className="metrics-grid">
        <StatCard
          title="Total Users"
          value={overview.totalUsers}
          icon="👥"
        />
        <StatCard
          title="Active Users"
          value={overview.activeUsers}
          subtitle={`${((overview.activeUsers / overview.totalUsers) * 100).toFixed(1)}% active`}
          icon="✅"
        />
        <StatCard
          title="Total Images"
          value={systemMetrics.reduce((sum, m) => sum + (m.total_images || 0), 0)}
          icon="🖼️"
        />
        <StatCard
          title="Total Projects"
          value={systemMetrics.reduce((sum, m) => sum + (m.total_projects || 0), 0)}
          icon="📁"
        />
        <StatCard
          title="System Cost"
          value={`$${systemMetrics.reduce((sum, m) => sum + parseFloat(m.total_cost_usd || 0), 0).toFixed(2)}`}
          icon="💰"
        />
        <StatCard
          title="Storage Used"
          value={`${systemMetrics.reduce((sum, m) => sum + parseFloat(m.storage_used_gb || 0), 0).toFixed(2)} GB`}
          icon="💾"
        />
      </div>

      {/* User Retention */}
      <div className="chart-section">
        <h2>User Retention</h2>
        <UserRetentionChart data={retention} />
      </div>

      {/* System Metrics Timeline */}
      <div className="chart-section">
        <h2>System Metrics Timeline</h2>
        <SystemMetricsChart data={systemMetrics} />
      </div>

      {/* Top Users */}
      <div className="top-users-section">
        <h2>Top Users by Activity</h2>
        <div className="top-users-list">
          {topUsers?.map((user, index) => (
            <div key={user.user_id} className="top-user-item">
              <div className="user-rank">#{index + 1}</div>
              <div className="user-info">
                <div className="user-email">{user.email}</div>
                <div className="user-stats">
                  <span>🖼️ {user.total_images_generated} images</span>
                  <span>📁 {user.total_projects_created} projects</span>
                  <span>💾 {parseFloat(user.storage_used_gb || 0).toFixed(2)} GB</span>
                </div>
              </div>
              <div className="user-cost">
                ${parseFloat(user.this_month_cost_usd || 0).toFixed(2)}
                <span className="cost-label">this month</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Health Alerts */}
      <div className="health-alerts">
        <h3>⚠️ System Health Alerts</h3>
        <div className="alerts-list">
          {systemMetrics.some((m) => m.error_rate > 0.05) && (
            <div className="alert alert-warning">
              <strong>High Error Rate:</strong> Some days show error rate above 5%
            </div>
          )}
          {systemMetrics.some((m) => m.average_response_time_ms > 1000) && (
            <div className="alert alert-warning">
              <strong>Slow Response Times:</strong> Response times exceeding 1 second detected
            </div>
          )}
          {overview.activeUsers / overview.totalUsers < 0.3 && (
            <div className="alert alert-info">
              <strong>Low Engagement:</strong> Consider user engagement campaigns
            </div>
          )}
          {!systemMetrics.some((m) => m.error_rate > 0.05) &&
            !systemMetrics.some((m) => m.average_response_time_ms > 1000) && (
            <div className="alert alert-success">
              <strong>All Systems Operational:</strong> No issues detected ✅
            </div>
          )}
        </div>
      </div>
    </div>
  );
};