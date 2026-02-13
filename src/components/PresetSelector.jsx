import { useState } from 'react'
import './PresetSelector.css'

const PLATFORM_PRESETS = [
  {
    id: 'instagram-post',
    name: 'Instagram Post',
    platform: 'Instagram',
    icon: '📷',
    width: 1080,
    height: 1080,
    aspectRatio: '1:1'
  },
  {
    id: 'instagram-story',
    name: 'Instagram Story',
    platform: 'Instagram',
    icon: '📱',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16'
  },
  {
    id: 'twitter-post',
    name: 'Twitter Post',
    platform: 'Twitter',
    icon: '🐦',
    width: 1200,
    height: 675,
    aspectRatio: '16:9'
  },
  {
    id: 'twitter-header',
    name: 'Twitter Header',
    platform: 'Twitter',
    icon: '🎨',
    width: 1500,
    height: 500,
    aspectRatio: '3:1'
  },
  {
    id: 'facebook-post',
    name: 'Facebook Post',
    platform: 'Facebook',
    icon: '👥',
    width: 1200,
    height: 630,
    aspectRatio: '1.91:1'
  },
  {
    id: 'facebook-cover',
    name: 'Facebook Cover',
    platform: 'Facebook',
    icon: '🖼️',
    width: 820,
    height: 312,
    aspectRatio: '2.63:1'
  },
  {
    id: 'linkedin-post',
    name: 'LinkedIn Post',
    platform: 'LinkedIn',
    icon: '💼',
    width: 1200,
    height: 627,
    aspectRatio: '1.91:1'
  },
  {
    id: 'youtube-thumbnail',
    name: 'YouTube Thumbnail',
    platform: 'YouTube',
    icon: '📺',
    width: 1280,
    height: 720,
    aspectRatio: '16:9'
  },
  {
    id: 'pinterest-pin',
    name: 'Pinterest Pin',
    platform: 'Pinterest',
    icon: '📌',
    width: 1000,
    height: 1500,
    aspectRatio: '2:3'
  }
]

function PresetSelector({ selectedPresets, onChange, disabled }) {
  const [filter, setFilter] = useState('all')

  const platforms = ['all', ...new Set(PLATFORM_PRESETS.map(p => p.platform))]

  const filteredPresets = filter === 'all'
    ? PLATFORM_PRESETS
    : PLATFORM_PRESETS.filter(p => p.platform === filter)

  const togglePreset = (presetId) => {
    if (selectedPresets.includes(presetId)) {
      onChange(selectedPresets.filter(id => id !== presetId))
    } else {
      onChange([...selectedPresets, presetId])
    }
  }

  const selectAll = () => {
    onChange(filteredPresets.map(p => p.id))
  }

  const clearAll = () => {
    onChange([])
  }

  return (
    <div className="preset-selector-container">
      <div className="preset-header">
        <div className="header-left">
          <h3 className="preset-title">
            📐 Select Platform Presets
          </h3>
          <p className="preset-subtitle">
            {selectedPresets.length} {selectedPresets.length === 1 ? 'preset' : 'presets'} selected
          </p>
        </div>
        <div className="header-actions">
          <button
            className="action-btn"
            onClick={selectAll}
            disabled={disabled}
          >
            Select All {filter !== 'all' ? filter : ''}
          </button>
          <button
            className="action-btn secondary"
            onClick={clearAll}
            disabled={disabled || selectedPresets.length === 0}
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="platform-filters">
        {platforms.map(platform => (
          <button
            key={platform}
            className={`filter-btn ${filter === platform ? 'active' : ''}`}
            onClick={() => setFilter(platform)}
            disabled={disabled}
          >
            {platform === 'all' ? '🌐 All Platforms' : platform}
          </button>
        ))}
      </div>

      <div className="presets-grid">
        {filteredPresets.map(preset => {
          const isSelected = selectedPresets.includes(preset.id)
          return (
            <div
              key={preset.id}
              className={`preset-card ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
              onClick={() => !disabled && togglePreset(preset.id)}
            >
              <div className="preset-icon">{preset.icon}</div>
              <div className="preset-info">
                <h4 className="preset-name">{preset.name}</h4>
                <p className="preset-dimensions">
                  {preset.width} × {preset.height}
                </p>
                <span className="preset-ratio">{preset.aspectRatio}</span>
              </div>
              {isSelected && (
                <div className="selected-badge">✓</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PresetSelector