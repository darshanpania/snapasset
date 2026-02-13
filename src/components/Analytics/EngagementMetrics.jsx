import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './EngagementMetrics.css';

export const EngagementMetrics = ({ userId }) => {
  const [engagement, setEngagement] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEngagement();
  }, [userId]);

  const loadEngagement = async () => {
    try {
      const response = await analyticsApi.getEngagement(12); // 12 weeks
      setEngagement(response.data || []);
    } catch (error) {
      console.error('Failed to load engagement:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading engagement data...</div>;
  }

  // Calculate average engagement
  const avgDaysActive = engagement.length > 0
    ? (engagement.reduce((sum, w) => sum + w.days_active, 0) / engagement.length).toFixed(1)
    : 0;

  const avgSessions = engagement.length > 0
    ? (engagement.reduce((sum, w) => sum + w.sessions_count, 0) / engagement.length).toFixed(1)
    : 0;

  // Format data for chart
  const chartData = engagement.map((week) => ({
    week: new Date(week.week_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    daysActive: week.days_active,
    sessions: week.sessions_count,
    actions: week.total_actions,
  }));

  // Get current cohort
  const currentCohort = engagement.length > 0
    ? engagement[engagement.length - 1].retention_cohort
    : 'unknown';

  const getCohortColor = (cohort) => {
    switch (cohort) {
      case 'active': return '#10b981';
      case 'engaged': return '#3b82f6';
      case 'at_risk': return '#f59e0b';
      case 'churned': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="engagement-metrics">
      {/* Engagement Overview */}
      <div className="engagement-overview">
        <div className="engagement-card">
          <h3>Current Status</h3>
          <div
            className="cohort-badge"
            style={{ background: getCohortColor(currentCohort) }}
          >
            {currentCohort.toUpperCase()}
          </div>
          <p className="cohort-description">
            {currentCohort === 'active' && 'You\'re highly engaged! Keep it up! 🎉'}
            {currentCohort === 'engaged' && 'You\'re doing great! 👍'}
            {currentCohort === 'at_risk' && 'We miss you! Come back soon 👋'}
            {currentCohort === 'churned' && 'Welcome back! We\'ve missed you 💙'}
          </p>
        </div>

        <div className="engagement-card">
          <h3>Average Days Active</h3>
          <div className="stat-big">{avgDaysActive}</div>
          <p>days per week</p>
        </div>

        <div className="engagement-card">
          <h3>Average Sessions</h3>
          <div className="stat-big">{avgSessions}</div>
          <p>sessions per week</p>
        </div>
      </div>

      {/* Weekly Engagement Chart */}
      <div className="chart-section">
        <h2>Weekly Engagement Trend</h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="week" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Bar dataKey="daysActive" fill="#2563eb" name="Days Active" />
            <Bar dataKey="sessions" fill="#10b981" name="Sessions" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Engagement Tips */}
      <div className="engagement-tips">
        <h3>🎯 Boost Your Engagement</h3>
        <ul>
          <li>Set a daily reminder to check your projects</li>
          <li>Create a project template for recurring tasks</li>
          <li>Invite team members to collaborate</li>
          <li>Use bulk operations to save time</li>
          <li>Explore different platforms and sizes</li>
        </ul>
      </div>
    </div>
  );
};