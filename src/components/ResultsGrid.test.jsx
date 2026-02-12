import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '../tests/utils/test-utils'
import ResultsGrid from './ResultsGrid'

const mockResults = [
  {
    platform: 'Instagram',
    label: 'Post (Square)',
    width: 1080,
    height: 1080,
    icon: '📷',
    url: 'https://example.com/image1.png',
    thumbnail: 'https://example.com/thumb1.png',
    fileSize: 250000,
  },
  {
    platform: 'Twitter',
    label: 'Post',
    width: 1200,
    height: 675,
    icon: '🐦',
    url: 'https://example.com/image2.png',
    thumbnail: 'https://example.com/thumb2.png',
    fileSize: 180000,
  },
]

describe('ResultsGrid Component', () => {
  it('returns null when no results', () => {
    const { container } = render(
      <ResultsGrid results={[]} isGenerating={false} />
    )
    
    expect(container.firstChild).toBeNull()
  })

  it('renders results grid with images', () => {
    render(<ResultsGrid results={mockResults} isGenerating={false} />)
    
    expect(screen.getByText(/generated images/i)).toBeInTheDocument()
    expect(screen.getByText('Instagram')).toBeInTheDocument()
    expect(screen.getByText('Twitter')).toBeInTheDocument()
  })

  it('displays correct number of results', () => {
    render(<ResultsGrid results={mockResults} isGenerating={false} />)
    
    expect(screen.getByText(/2 images/i)).toBeInTheDocument()
  })

  it('shows dimensions for each result', () => {
    render(<ResultsGrid results={mockResults} isGenerating={false} />)
    
    expect(screen.getByText(/1080.*1080/)).toBeInTheDocument()
    expect(screen.getByText(/1200.*675/)).toBeInTheDocument()
  })

  it('displays file sizes when available', () => {
    render(<ResultsGrid results={mockResults} isGenerating={false} />)
    
    // 250000 bytes = 244.14 KB
    expect(screen.getByText(/244.14 KB/i)).toBeInTheDocument()
    // 180000 bytes = 175.78 KB
    expect(screen.getByText(/175.78 KB/i)).toBeInTheDocument()
  })

  it('has download buttons for each image', () => {
    render(<ResultsGrid results={mockResults} isGenerating={false} />)
    
    const downloadButtons = screen.getAllByText(/download/i)
    // At least one download button per image
    expect(downloadButtons.length).toBeGreaterThanOrEqual(mockResults.length)
  })

  it('has download all button', () => {
    render(<ResultsGrid results={mockResults} isGenerating={false} />)
    
    expect(screen.getByText(/download all/i)).toBeInTheDocument()
  })

  it('opens modal when image is clicked', async () => {
    render(<ResultsGrid results={mockResults} isGenerating={false} />)
    
    const images = screen.getAllByRole('img')
    fireEvent.click(images[0])
    
    await waitFor(() => {
      // Modal should show the same platform
      const modalContent = screen.getByText('Instagram')
      expect(modalContent).toBeInTheDocument()
    })
  })

  it('closes modal when close button clicked', async () => {
    render(<ResultsGrid results={mockResults} isGenerating={false} />)
    
    // Open modal
    const images = screen.getAllByRole('img')
    fireEvent.click(images[0])
    
    await waitFor(() => {
      const closeButton = screen.getByLabelText(/close/i)
      fireEvent.click(closeButton)
    })
    
    // Modal should be closed
    await waitFor(() => {
      const modals = screen.queryAllByRole('dialog')
      expect(modals.length).toBe(0)
    })
  })

  it('formats file sizes correctly', () => {
    const { rerender } = render(
      <ResultsGrid results={mockResults} isGenerating={false} />
    )
    
    // Test different file sizes
    const testCases = [
      { fileSize: 1024, expected: '1 KB' },
      { fileSize: 1048576, expected: '1 MB' },
      { fileSize: 500, expected: '500 Bytes' },
    ]
    
    testCases.forEach(({ fileSize, expected }) => {
      const testResults = [{ ...mockResults[0], fileSize }]
      rerender(<ResultsGrid results={testResults} isGenerating={false} />)
      expect(screen.getByText(new RegExp(expected, 'i'))).toBeInTheDocument()
    })
  })

  it('handles download click', async () => {
    // Mock console.log to verify download was attempted
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    render(<ResultsGrid results={mockResults} isGenerating={false} />)
    
    const downloadButtons = screen.getAllByRole('button', { name: /download/i })
    fireEvent.click(downloadButtons[0])
    
    expect(consoleSpy).toHaveBeenCalledWith('Download:', mockResults[0])
    
    consoleSpy.mockRestore()
  })
})