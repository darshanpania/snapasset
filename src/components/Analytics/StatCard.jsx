import React from 'react';
import './StatCard.css';

export const StatCard = ({ title, value, subtitle, change, trend, icon }) => {
  const getTrendColor = () => {
    if (!trend) return '#6b7280';
    switch (trend) {
      case 'up': return '#10b981';
      case 'down': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-icon">{icon}</span>
        <span className="stat-title">{title}</span>
      </div>
      <div className="stat-value">{value?.toLocaleString() || value}</div>
      {subtitle && <div className="stat-subtitle">{subtitle}</div>}
      {change !== undefined && change !== null && (
        <div className="stat-change" style={{ color: getTrendColor() }}>
          <span className="trend-icon">{getTrendIcon()}</span>
          <span>{Math.abs(change)}%</span>
          <span className="change-label">
            {parseFloat(change) >= 0 ? 'increase' : 'decrease'}
          </span>
        </div>
      )}
    </div>
  );
};