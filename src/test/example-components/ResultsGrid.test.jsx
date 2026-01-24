import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, createMockGeneratedImage } from '../../test/utils/test-utils'

// Example test for ResultsGrid component

describe('ResultsGrid Component (Example)', () => {
  const mockResults = [
    createMockGeneratedImage(),
    createMockGeneratedImage({
      preset: { name: 'Twitter Post', width: 1200, height: 675 },
    }),
  ]
  
  const ResultsGrid = ({ results, isGenerating }) => {
    if (!results || results.length === 0) return null
    
    return (
      <div className="results-grid-container">
        <div className="results-header">
          <h2>Generated Images</h2>
          <span className="result-count">{results.length} images</span>
          <button disabled={isGenerating}>Download All</button>
        </div>
        <div className="results-grid">
          {results.map((result, idx) => (
            <div key={idx} className="result-card">
              <img src={result.url} alt={result.preset.name} />
              <h4>{result.preset.name}</h4>
              <p>{result.preset.width} × {result.preset.height}</p>
              <button>Download</button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  it('renders nothing when no results', () => {
    const { container } = render(
      <ResultsGrid results={[]} isGenerating={false} />
    )
    
    expect(container.firstChild).toBeNull()
  })

  it('renders results grid with images', () => {
    render(
      <ResultsGrid results={mockResults} isGenerating={false} />
    )
    
    expect(screen.getByText('Generated Images')).toBeInTheDocument()
    expect(screen.getByText('2 images')).toBeInTheDocument()
    expect(screen.getByText('Instagram Post')).toBeInTheDocument()
    expect(screen.getByText('Twitter Post')).toBeInTheDocument()
  })

  it('displays all result cards', () => {
    render(
      <ResultsGrid results={mockResults} isGenerating={false} />
    )
    
    const cards = screen.getAllByRole('img')
    expect(cards).toHaveLength(2)
  })

  it('shows platform dimensions', () => {
    render(
      <ResultsGrid results={mockResults} isGenerating={false} />
    )
    
    expect(screen.getByText('1080 × 1080')).toBeInTheDocument()
    expect(screen.getByText('1200 × 675')).toBeInTheDocument()
  })

  it('has download button for each image', () => {
    render(
      <ResultsGrid results={mockResults} isGenerating={false} />
    )
    
    const downloadButtons = screen.getAllByRole('button', { name: /download/i })
    expect(downloadButtons).toHaveLength(3) // 2 individual + 1 download all
  })

  it('disables download all when generating', () => {
    render(
      <ResultsGrid results={mockResults} isGenerating={true} />
    )
    
    const downloadAllButton = screen.getByRole('button', { name: /download all/i })
    expect(downloadAllButton).toBeDisabled()
  })
})