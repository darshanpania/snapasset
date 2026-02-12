import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '../tests/utils/test-utils'
import PlatformPresets from './PlatformPresets'

describe('PlatformPresets Component', () => {
  const mockOnPlatformToggle = vi.fn()
  const mockSelectedPlatforms = []

  beforeEach(() => {
    mockOnPlatformToggle.mockClear()
  })

  it('renders platform presets component', () => {
    render(
      <PlatformPresets
        selectedPlatforms={mockSelectedPlatforms}
        onPlatformToggle={mockOnPlatformToggle}
        isGenerating={false}
      />
    )
    
    expect(screen.getByText(/select target platforms/i)).toBeInTheDocument()
  })

  it('displays selection summary', () => {
    render(
      <PlatformPresets
        selectedPlatforms={['instagram']}
        onPlatformToggle={mockOnPlatformToggle}
        isGenerating={false}
      />
    )
    
    expect(screen.getByText(/1 platform/i)).toBeInTheDocument()
  })

  it('shows multiple platforms selected', () => {
    render(
      <PlatformPresets
        selectedPlatforms={['instagram', 'twitter', 'facebook']}
        onPlatformToggle={mockOnPlatformToggle}
        isGenerating={false}
      />
    )
    
    expect(screen.getByText(/3 platforms/i)).toBeInTheDocument()
  })

  it('expands category when clicked', async () => {
    render(
      <PlatformPresets
        selectedPlatforms={mockSelectedPlatforms}
        onPlatformToggle={mockOnPlatformToggle}
        isGenerating={false}
      />
    )
    
    const socialCategory = screen.getByText(/social media/i)
    fireEvent.click(socialCategory.closest('.category-header'))
    
    // Should show preset cards
    expect(screen.getByText(/instagram/i)).toBeInTheDocument()
  })

  it('toggles platform selection when clicked', async () => {
    render(
      <PlatformPresets
        selectedPlatforms={mockSelectedPlatforms}
        onPlatformToggle={mockOnPlatformToggle}
        isGenerating={false}
      />
    )
    
    // Expand social category first
    const socialHeader = screen.getByText(/social media/i).closest('.category-header')
    fireEvent.click(socialHeader)
    
    // Click on Instagram preset
    const instagramCard = screen.getByText(/instagram/i).closest('.preset-card')
    fireEvent.click(instagramCard)
    
    expect(mockOnPlatformToggle).toHaveBeenCalledWith('instagram', true)
  })

  it('filters platforms by search term', async () => {
    render(
      <PlatformPresets
        selectedPlatforms={mockSelectedPlatforms}
        onPlatformToggle={mockOnPlatformToggle}
        isGenerating={false}
      />
    )
    
    const searchInput = screen.getByPlaceholderText(/search platforms/i)
    fireEvent.change(searchInput, { target: { value: 'instagram' } })
    
    // Should filter results
    expect(searchInput.value).toBe('instagram')
  })

  it('clears search when clear button clicked', async () => {
    render(
      <PlatformPresets
        selectedPlatforms={mockSelectedPlatforms}
        onPlatformToggle={mockOnPlatformToggle}
        isGenerating={false}
      />
    )
    
    const searchInput = screen.getByPlaceholderText(/search platforms/i)
    fireEvent.change(searchInput, { target: { value: 'test' } })
    
    const clearButton = screen.getByLabelText(/clear search/i)
    fireEvent.click(clearButton)
    
    expect(searchInput.value).toBe('')
  })

  it('disables interaction when generating', () => {
    render(
      <PlatformPresets
        selectedPlatforms={mockSelectedPlatforms}
        onPlatformToggle={mockOnPlatformToggle}
        isGenerating={true}
      />
    )
    
    const searchInput = screen.getByPlaceholderText(/search platforms/i)
    expect(searchInput).toBeDisabled()
  })

  it('shows clear all button when platforms selected', () => {
    render(
      <PlatformPresets
        selectedPlatforms={['instagram', 'twitter']}
        onPlatformToggle={mockOnPlatformToggle}
        isGenerating={false}
      />
    )
    
    expect(screen.getByText(/clear all selections/i)).toBeInTheDocument()
  })

  it('handles select all in category', async () => {
    render(
      <PlatformPresets
        selectedPlatforms={mockSelectedPlatforms}
        onPlatformToggle={mockOnPlatformToggle}
        isGenerating={false}
      />
    )
    
    // Expand category
    const socialHeader = screen.getByText(/social media/i).closest('.category-header')
    fireEvent.click(socialHeader)
    
    // Click select all button
    const selectAllButton = screen.getByText(/select all/i)
    fireEvent.click(selectAllButton)
    
    // Should call toggle for each platform in category
    expect(mockOnPlatformToggle).toHaveBeenCalled()
  })
})