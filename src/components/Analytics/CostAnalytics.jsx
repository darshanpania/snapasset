import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './CostAnalytics.css';

export const CostAnalytics = ({ data, period }) => {
  if (!data) {
    return <div className="chart-empty">No cost data available</div>;
  }

  const { totalCost, averageCostPerDay, costByProvider, timeline } = data;

  // Format timeline data for chart
  const chartData = timeline?.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    cost: parseFloat(item.total_cost_usd || 0),
    images: item.images_generated || 0,
  })) || [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          <p style={{ color: '#10b981' }}>Cost: ${payload[0]?.value?.toFixed(4)}</p>
          <p style={{ color: '#6b7280' }}>Images: {payload[1]?.value}</p>
          {payload[0]?.value && payload[1]?.value && (
            <p style={{ color: '#8b5cf6' }}>
              Per Image: ${(payload[0].value / payload[1].value).toFixed(4)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="cost-analytics">
      {/* Cost Overview */}
      <div className="cost-overview">
        <div className="cost-card">
          <h3>Total Cost</h3>
          <div className="cost-value">${parseFloat(totalCost || 0).toFixed(2)}</div>
          <p className="cost-label">for {period}</p>
        </div>
        <div className="cost-card">
          <h3>Average per Day</h3>
          <div className="cost-value">${parseFloat(averageCostPerDay || 0).toFixed(4)}</div>
          <p className="cost-label">daily average</p>
        </div>
        <div className="cost-card">
          <h3>Cost per Image</h3>
          <div className="cost-value">
            $
            {timeline && timeline.length > 0
              ? (
                  timeline.reduce((sum, item) => sum + parseFloat(item.total_cost_usd || 0), 0) /
                  timeline.reduce((sum, item) => sum + (item.images_generated || 0), 0)
                ).toFixed(4)
              : '0.0000'}
          </div>
          <p className="cost-label">average</p>
        </div>
      </div>

      {/* Cost Timeline */}
      <div className="chart-section">
        <h2>Cost Timeline</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="cost" fill="#10b981" name="Cost (USD)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cost by Provider */}
      {costByProvider && costByProvider.length > 0 && (
        <div className="provider-breakdown">
          <h2>Cost by Provider</h2>
          <div className="provider-list">
            {costByProvider.map((provider, index) => (
              <div key={index} className="provider-item">
                <div className="provider-info">
                  <span className="provider-name">{provider.provider}</span>
                  <div className="provider-details">
                    <span>{provider.calls} API calls</span>
                    <span>{provider.images} images</span>
                  </div>
                </div>
                <div className="provider-cost">
                  <span className="cost-amount">${parseFloat(provider.cost).toFixed(2)}</span>
                  <span className="cost-per-image">
                    ${(provider.cost / provider.images).toFixed(4)}/img
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cost Optimization Tips */}
      <div className="optimization-tips">
        <h3>💡 Cost Optimization Tips</h3>
        <ul>
          <li>Batch similar image generation requests together</li>
          <li>Use lower resolution for preview images</li>
          <li>Cache frequently generated images</li>
          <li>Consider using templates to reduce generation time</li>
          <li>Monitor and optimize your most expensive platforms</li>
        </ul>
      </div>
    </div>
  );
};