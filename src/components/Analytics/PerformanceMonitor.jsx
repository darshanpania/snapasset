import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './PerformanceMonitor.css';

export const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(24);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadMetrics = async () => {
    try {
      const response = await analyticsApi.getPerformance(null, timeRange);
      setMetrics(response.data);
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading performance data...</div>;
  }

  if (!metrics) {
    return <div className="chart-empty">No performance data available</div>;
  }

  const getStatusColor = (value, threshold) => {
    if (value < threshold * 0.5) return '#10b981'; // Good
    if (value < threshold) return '#f59e0b'; // Warning
    return '#ef4444'; // Critical
  };

  return (
    <div className="performance-monitor">
      {/* Performance Overview */}
      <div className="performance-header">
        <h2>Performance Metrics</h2>
        <select value={timeRange} onChange={(e) => setTimeRange(parseInt(e.target.value))}>
          <option value={1}>Last Hour</option>
          <option value={6}>Last 6 Hours</option>
          <option value={24}>Last 24 Hours</option>
          <option value={168}>Last Week</option>
        </select>
      </div>

      {/* Key Performance Indicators */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <h3>Average Response Time</h3>
          <div
            className="kpi-value"
            style={{ color: getStatusColor(metrics.average, 500) }}
          >
            {metrics.average || 0}ms
          </div>
          <div className="kpi-range">
            <span>Min: {metrics.min || 0}ms</span>
            <span>Max: {metrics.max || 0}ms</span>
          </div>
        </div>

        <div className="kpi-card">
          <h3>95th Percentile</h3>
          <div
            className="kpi-value"
            style={{ color: getStatusColor(metrics.p95, 1000) }}
          >
            {metrics.p95 || 0}ms
          </div>
          <div className="kpi-subtitle">95% of requests faster than this</div>
        </div>

        <div className="kpi-card">
          <h3>99th Percentile</h3>
          <div
            className="kpi-value"
            style={{ color: getStatusColor(metrics.p99, 2000) }}
          >
            {metrics.p99 || 0}ms
          </div>
          <div className="kpi-subtitle">99% of requests faster than this</div>
        </div>

        <div className="kpi-card">
          <h3>Total Requests</h3>
          <div className="kpi-value" style={{ color: '#2563eb' }}>
            {metrics.count || 0}
          </div>
          <div className="kpi-subtitle">in selected period</div>
        </div>
      </div>

      {/* Performance Status */}
      <div className="performance-status">
        <h3>System Health</h3>
        <div className="health-indicators">
          <div className="health-item">
            <span className="health-label">Response Time</span>
            <div className="health-bar">
              <div
                className="health-fill"
                style={{
                  width: `${Math.min((metrics.average / 500) * 100, 100)}%`,
                  background: getStatusColor(metrics.average, 500),
                }}
              ></div>
            </div>
            <span className="health-value">{metrics.average}ms / 500ms target</span>
          </div>

          <div className="health-item">
            <span className="health-label">P95 Latency</span>
            <div className="health-bar">
              <div
                className="health-fill"
                style={{
                  width: `${Math.min((metrics.p95 / 1000) * 100, 100)}%`,
                  background: getStatusColor(metrics.p95, 1000),
                }}
              ></div>
            </div>
            <span className="health-value">{metrics.p95}ms / 1000ms target</span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="performance-recommendations">
        <h3>⚡ Performance Recommendations</h3>
        <ul>
          {metrics.average > 500 && (
            <li className="warning">
              Average response time is above target. Consider optimizing database queries.
            </li>
          )}
          {metrics.p95 > 1000 && (
            <li className="warning">
              95th percentile is high. Some users may experience slow responses.
            </li>
          )}
          {metrics.average < 200 && <li className="success">Excellent response times! 🎉</li>}
          {metrics.p95 < 500 && <li className="success">Great latency distribution! 🚀</li>}
          <li>Enable caching for frequently accessed data</li>
          <li>Use CDN for static assets</li>
          <li>Optimize image sizes before upload</li>
        </ul>
      </div>
    </div>
  );
};