import { useState } from 'react'
import { platformPresets } from '../data/platformPresets'
import './PlatformPresets.css'

const PlatformPresets = ({ selectedPlatforms, onPlatformToggle, isGenerating }) => {
  const [expandedCategory, setExpandedCategory] = useState('social')
  const [searchTerm, setSearchTerm] = useState('')

  const categories = {
    social: { name: 'Social Media', icon: '📱' },
    app: { name: 'App Icons', icon: '📲' },
    web: { name: 'Web Assets', icon: '🌐' },
    custom: { name: 'Custom Sizes', icon: '⚙️' }
  }

  const filteredPresets = Object.entries(platformPresets).filter(([key, preset]) => {
    const matchesSearch = searchTerm === '' || 
      preset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      key.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getPresetsByCategory = (category) => {
    return filteredPresets.filter(([_, preset]) => preset.category === category)
  }

  const selectedCount = selectedPlatforms.length
  const totalDimensions = selectedPlatforms.reduce((sum, key) => {
    return sum + (platformPresets[key]?.dimensions?.length || 0)
  }, 0)

  const selectAllInCategory = (category) => {
    const categoryPresets = getPresetsByCategory(category)
    const categoryKeys = categoryPresets.map(([key]) => key)
    const allSelected = categoryKeys.every(key => selectedPlatforms.includes(key))
    
    if (allSelected) {
      // Deselect all in category
      const newSelection = selectedPlatforms.filter(key => !categoryKeys.includes(key))
      categoryKeys.forEach(key => onPlatformToggle(key, false))
    } else {
      // Select all in category
      categoryKeys.forEach(key => {
        if (!selectedPlatforms.includes(key)) {
          onPlatformToggle(key, true)
        }
      })
    }
  }

  return (
    <div className="platform-presets-container">
      <div className="presets-header">
        <h2>🎯 Select Target Platforms</h2>
        <div className="selection-summary">
          <span className="badge">{selectedCount} platform{selectedCount !== 1 ? 's' : ''}</span>
          <span className="badge secondary">{totalDimensions} size{totalDimensions !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search platforms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={isGenerating}
        />
        {searchTerm && (
          <button 
            className="clear-search"
            onClick={() => setSearchTerm('')}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {selectedCount > 0 && (
        <button 
          className="clear-all-btn"
          onClick={() => selectedPlatforms.forEach(key => onPlatformToggle(key, false))}
          disabled={isGenerating}
        >
          Clear All Selections
        </button>
      )}

      <div className="categories">
        {Object.entries(categories).map(([catKey, category]) => {
          const categoryPresets = getPresetsByCategory(catKey)
          if (categoryPresets.length === 0 && searchTerm) return null

          const categorySelected = categoryPresets.every(([key]) => 
            selectedPlatforms.includes(key)
          )

          return (
            <div key={catKey} className="category">
              <div 
                className="category-header"
                onClick={() => setExpandedCategory(expandedCategory === catKey ? null : catKey)}
              >
                <div className="category-title">
                  <span className="category-icon">{category.icon}</span>
                  <h3>{category.name}</h3>
                  <span className="preset-count">({categoryPresets.length})</span>
                </div>
                <div className="category-actions">
                  <button
                    className="select-all-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      selectAllInCategory(catKey)
                    }}
                    disabled={isGenerating || categoryPresets.length === 0}
                  >
                    {categorySelected ? '☑ Deselect All' : '☐ Select All'}
                  </button>
                  <span className="expand-icon">
                    {expandedCategory === catKey ? '▼' : '▶'}
                  </span>
                </div>
              </div>

              {expandedCategory === catKey && (
                <div className="presets-grid">
                  {categoryPresets.map(([key, preset]) => {
                    const isSelected = selectedPlatforms.includes(key)
                    return (
                      <div
                        key={key}
                        className={`preset-card ${isSelected ? 'selected' : ''} ${isGenerating ? 'disabled' : ''}`}
                        onClick={() => !isGenerating && onPlatformToggle(key, !isSelected)}
                      >
                        <div className="preset-header">
                          <span className="platform-icon">{preset.icon}</span>
                          <div className="checkbox">
                            {isSelected && '✓'}
                          </div>
                        </div>
                        <h4>{preset.name}</h4>
                        <div className="dimensions-list">
                          {preset.dimensions.map((dim, idx) => (
                            <div key={idx} className="dimension-tag">
                              {dim.label && <span className="dim-label">{dim.label}:</span>}
                              <span className="dim-size">{dim.width}×{dim.height}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filteredPresets.length === 0 && searchTerm && (
        <div className="no-results">
          <p>No platforms found for "{searchTerm}"</p>
        </div>
      )}
    </div>
  )
}

export default PlatformPresets