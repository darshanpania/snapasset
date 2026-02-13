import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, createMockPreset } from '../../test/utils/test-utils'

// Example test for PlatformPresets component

describe('PlatformPresets Component (Example)', () => {
  const mockOnPlatformToggle = vi.fn()
  const mockPresets = {
    instagram: createMockPreset({ id: 'instagram', name: 'Instagram' }),
    twitter: createMockPreset({ id: 'twitter', name: 'Twitter' }),
  }
  
  const PlatformPresets = ({ selectedPlatforms, onPlatformToggle, isGenerating }) => (
    <div className="platform-presets-container">
      <h2>Select Target Platforms</h2>
      <div className="selection-summary">
        <span>{selectedPlatforms.length} platforms selected</span>
      </div>
      <div className="presets-grid">
        {Object.entries(mockPresets).map(([key, preset]) => (
          <div
            key={key}
            className={`preset-card ${selectedPlatforms.includes(key) ? 'selected' : ''}`}
            onClick={() => !isGenerating && onPlatformToggle(key, !selectedPlatforms.includes(key))}
          >
            <span>{preset.icon}</span>
            <h4>{preset.name}</h4>
          </div>
        ))}
      </div>
    </div>
  )

  it('renders platform presets', () => {
    render(
      <PlatformPresets 
        selectedPlatforms={[]} 
        onPlatformToggle={mockOnPlatformToggle}
        isGenerating={false}
      />
    )
    
    expect(screen.getByText('Select Target Platforms')).toBeInTheDocument()
    expect(screen.getByText('Instagram')).toBeInTheDocument()
    expect(screen.getByText('Twitter')).toBeInTheDocument()
  })

  it('shows selection count', () => {
    render(
      <PlatformPresets 
        selectedPlatforms={['instagram', 'twitter']} 
        onPlatformToggle={mockOnPlatformToggle}
        isGenerating={false}
      />
    )
    
    expect(screen.getByText('2 platforms selected')).toBeInTheDocument()
  })

  it('toggles platform selection', async () => {
    const user = userEvent.setup()
    render(
      <PlatformPresets 
        selectedPlatforms={[]} 
        onPlatformToggle={mockOnPlatformToggle}
        isGenerating={false}
      />
    )
    
    const instagramCard = screen.getByText('Instagram').closest('.preset-card')
    await user.click(instagramCard)
    
    expect(mockOnPlatformToggle).toHaveBeenCalledWith('instagram', true)
  })

  it('applies selected class to selected platforms', () => {
    render(
      <PlatformPresets 
        selectedPlatforms={['instagram']} 
        onPlatformToggle={mockOnPlatformToggle}
        isGenerating={false}
      />
    )
    
    const instagramCard = screen.getByText('Instagram').closest('.preset-card')
    expect(instagramCard).toHaveClass('selected')
  })

  it('disables interaction when generating', async () => {
    const user = userEvent.setup()
    render(
      <PlatformPresets 
        selectedPlatforms={[]} 
        onPlatformToggle={mockOnPlatformToggle}
        isGenerating={true}
      />
    )
    
    const instagramCard = screen.getByText('Instagram').closest('.preset-card')
    await user.click(instagramCard)
    
    // Should not toggle when generating
    expect(mockOnPlatformToggle).not.toHaveBeenCalled()
  })
})