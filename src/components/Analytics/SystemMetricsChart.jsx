import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export const SystemMetricsChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="chart-empty">No system metrics available</div>;
  }

  const chartData = data.map((item) => ({
    date: new Date(item.metric_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    users: item.active_users,
    images: item.total_images,
    apiCalls: item.total_api_calls,
    responseTime: item.average_response_time_ms,
    errorRate: (item.error_rate * 100).toFixed(2),
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.name === 'Response Time' && 'ms'}
              {entry.name === 'Error Rate' && '%'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" stroke="#6b7280" />
        <YAxis yAxisId="left" stroke="#6b7280" />
        <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar yAxisId="left" dataKey="users" fill="#2563eb" name="Active Users" />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="responseTime"
          stroke="#10b981"
          strokeWidth={2}
          name="Response Time"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="errorRate"
          stroke="#ef4444"
          strokeWidth={2}
          name="Error Rate"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};