import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import './UserRetentionChart.css';

const COHORT_COLORS = {
  active: '#10b981',
  engaged: '#3b82f6',
  at_risk: '#f59e0b',
  churned: '#ef4444',
};

export const UserRetentionChart = ({ data }) => {
  if (!data || !data.breakdown) {
    return <div className="chart-empty">No retention data available</div>;
  }

  const { breakdown, percentages, total } = data;

  const chartData = Object.entries(breakdown)
    .filter(([_, value]) => value > 0)
    .map(([cohort, value]) => ({
      name: cohort.charAt(0).toUpperCase() + cohort.slice(1).replace('_', ' '),
      value,
      percentage: percentages[cohort],
    }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{data.name}</p>
          <p>Users: {data.value}</p>
          <p>Percentage: {data.payload.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="retention-chart">
      <div className="retention-overview">
        <div className="retention-total">
          <span className="total-label">Total Users</span>
          <span className="total-value">{total}</span>
        </div>
      </div>

      <div className="retention-visualization">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => {
                const cohortKey = entry.name.toLowerCase().replace(' ', '_');
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={COHORT_COLORS[cohortKey] || '#6b7280'}
                  />
                );
              })}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="retention-breakdown">
        <h3>User Cohorts</h3>
        {Object.entries(breakdown).map(([cohort, count]) => (
          <div key={cohort} className="cohort-row">
            <div className="cohort-info">
              <div
                className="cohort-indicator"
                style={{ background: COHORT_COLORS[cohort] }}
              />
              <span className="cohort-name">{cohort.replace('_', ' ')}</span>
            </div>
            <div className="cohort-stats">
              <span className="cohort-count">{count}</span>
              <span className="cohort-percentage">({percentages[cohort]}%)</span>
            </div>
          </div>
        ))}
      </div>

      <div className="retention-insights">
        <h3>💡 Retention Insights</h3>
        <ul>
          {parseFloat(percentages.active) > 50 && (
            <li className="insight-good">Excellent retention rate! Over 50% of users are highly active.</li>
          )}
          {parseFloat(percentages.churned) > 30 && (
            <li className="insight-warning">High churn rate. Consider re-engagement campaigns.</li>
          )}
          {parseFloat(percentages.at_risk) > 20 && (
            <li className="insight-warning">{percentages.at_risk}% of users are at risk of churning.</li>
          )}
          <li>Send weekly engagement emails to at-risk users</li>
          <li>Offer premium features to highly active users</li>
          <li>Analyze churned user feedback for improvements</li>
        </ul>
      </div>
    </div>
  );
};