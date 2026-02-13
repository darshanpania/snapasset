import React from 'react';
import './ActivityHeatmap.css';

export const ActivityHeatmap = ({ data, period = 90 }) => {
  // Generate heatmap grid for the last N days
  const generateHeatmapData = () => {
    const heatmapData = [];
    const today = new Date();
    const dataMap = new Map(data?.map((item) => [item.date, item.images || 0]) || []);

    // Calculate max value for color scaling
    const maxValue = Math.max(...(data?.map((item) => item.images || 0) || [1]));

    for (let i = period - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const value = dataMap.get(dateStr) || 0;

      heatmapData.push({
        date: dateStr,
        day: date.getDay(),
        week: Math.floor(i / 7),
        value,
        intensity: maxValue > 0 ? value / maxValue : 0,
      });
    }

    return heatmapData;
  };

  const heatmapData = generateHeatmapData();
  const weeks = Math.ceil(period / 7);

  const getColor = (intensity) => {
    if (intensity === 0) return '#ebedf0';
    if (intensity < 0.25) return '#9be9a8';
    if (intensity < 0.5) return '#40c463';
    if (intensity < 0.75) return '#30a14e';
    return '#216e39';
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="activity-heatmap">
      <h3>Activity Heatmap</h3>
      <div className="heatmap-container">
        <div className="day-labels">
          {dayLabels.map((label, index) => (
            <div key={index} className="day-label">
              {label}
            </div>
          ))}
        </div>
        <div className="heatmap-grid" style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}>
          {heatmapData.map((cell, index) => (
            <div
              key={index}
              className="heatmap-cell"
              style={{
                background: getColor(cell.intensity),
                gridColumn: cell.week + 1,
                gridRow: cell.day + 1,
              }}
              title={`${cell.date}: ${cell.value} images`}
            />
          ))}
        </div>
      </div>
      <div className="heatmap-legend">
        <span>Less</span>
        <div className="legend-colors">
          <div style={{ background: '#ebedf0' }} />
          <div style={{ background: '#9be9a8' }} />
          <div style={{ background: '#40c463' }} />
          <div style={{ background: '#30a14e' }} />
          <div style={{ background: '#216e39' }} />
        </div>
        <span>More</span>
      </div>
    </div>
  );
};