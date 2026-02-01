import React, { useState } from 'react';
import './DateRangePicker.css';

export const DateRangePicker = ({ value, onChange, presets = true }) => {
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const presetRanges = [
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' },
    { label: 'Last 6 months', value: '6m' },
    { label: 'Last year', value: '1y' },
    { label: 'All time', value: 'all' },
  ];

  const handlePresetChange = (preset) => {
    onChange(preset);
    setShowCustom(false);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onChange({ start: customStart, end: customEnd, custom: true });
      setShowCustom(false);
    }
  };

  return (
    <div className="date-range-picker">
      {presets && (
        <div className="preset-buttons">
          {presetRanges.map((preset) => (
            <button
              key={preset.value}
              className={`preset-btn ${value === preset.value ? 'active' : ''}`}
              onClick={() => handlePresetChange(preset.value)}
            >
              {preset.label}
            </button>
          ))}
          <button
            className={`preset-btn ${showCustom ? 'active' : ''}`}
            onClick={() => setShowCustom(!showCustom)}
          >
            Custom Range
          </button>
        </div>
      )}

      {showCustom && (
        <div className="custom-range">
          <div className="date-inputs">
            <div className="date-input-group">
              <label>Start Date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                max={customEnd || new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="date-input-group">
              <label>End Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                min={customStart}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <button onClick={handleCustomApply} className="apply-btn">
            Apply Custom Range
          </button>
        </div>
      )}
    </div>
  );
};