import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './UsageChart.css';

export const UsageChart = ({ data, detailed = false }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        <p>No usage data available for this period</p>
      </div>
    );
  }

  // Format data for chart
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    images: item.images_generated || item.images || 0,
    downloads: item.images_downloaded || item.downloads || 0,
    projects: item.projects_created || item.projects || 0,
    apiCalls: item.api_calls || item.apiCalls || 0,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="usage-chart">
      <ResponsiveContainer width="100%" height={400}>
        {detailed ? (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="images"
              stroke="#2563eb"
              strokeWidth={2}
              name="Images Generated"
              dot={{ fill: '#2563eb', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="downloads"
              stroke="#10b981"
              strokeWidth={2}
              name="Downloads"
              dot={{ fill: '#10b981', r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="projects"
              stroke="#f59e0b"
              strokeWidth={2}
              name="Projects"
              dot={{ fill: '#f59e0b', r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="apiCalls"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="API Calls"
              dot={{ fill: '#8b5cf6', r: 4 }}
            />
          </LineChart>
        ) : (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorImages" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="images"
              stroke="#2563eb"
              fillOpacity={1}
              fill="url(#colorImages)"
              name="Images Generated"
            />
            <Area
              type="monotone"
              dataKey="downloads"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorDownloads)"
              name="Downloads"
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};