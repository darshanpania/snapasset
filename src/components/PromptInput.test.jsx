import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../tests/utils/test-utils'
import PromptInput from './PromptInput'

describe('PromptInput Component', () => {
  const mockOnGenerate = vi.fn()

  beforeEach(() => {
    mockOnGenerate.mockClear()
  })

  it('renders prompt input component', () => {
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
    
    expect(screen.getByRole('heading', { name: /generate your image/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/describe your image/i)).toBeInTheDocument()
  })

  it('displays character count', () => {
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
    
    expect(screen.getByText('0/500')).toBeInTheDocument()
  })

  it('updates character count when typing', async () => {
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
    
    const textarea = screen.getByPlaceholderText(/describe your image/i)
    fireEvent.change(textarea, { target: { value: 'Test prompt' } })
    
    await waitFor(() => {
      expect(screen.getByText('11/500')).toBeInTheDocument()
    })
  })

  it('enforces maximum character limit', async () => {
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
    
    const textarea = screen.getByPlaceholderText(/describe your image/i)
    const longText = 'a'.repeat(600)
    
    fireEvent.change(textarea, { target: { value: longText } })
    
    await waitFor(() => {
      expect(textarea.value).toHaveLength(500)
    })
  })

  it('shows error when submitting empty prompt', async () => {
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
    
    const submitButton = screen.getByRole('button', { name: /generate images/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a prompt/i)).toBeInTheDocument()
    })
    expect(mockOnGenerate).not.toHaveBeenCalled()
  })

  it('shows error for prompt less than 3 characters', async () => {
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
    
    const textarea = screen.getByPlaceholderText(/describe your image/i)
    fireEvent.change(textarea, { target: { value: 'ab' } })
    
    const submitButton = screen.getByRole('button', { name: /generate images/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/prompt must be at least 3 characters/i)).toBeInTheDocument()
    })
  })

  it('calls onGenerate with correct data when form is valid', async () => {
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
    
    const textarea = screen.getByPlaceholderText(/describe your image/i)
    const select = screen.getByLabelText(/image style/i)
    
    fireEvent.change(textarea, { target: { value: 'A beautiful sunset' } })
    fireEvent.change(select, { target: { value: 'illustration' } })
    
    const submitButton = screen.getByRole('button', { name: /generate images/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnGenerate).toHaveBeenCalledWith({
        prompt: 'A beautiful sunset',
        imageType: 'illustration',
      })
    })
  })

  it('disables inputs when generating', () => {
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={true} />)
    
    const textarea = screen.getByPlaceholderText(/describe your image/i)
    const select = screen.getByLabelText(/image style/i)
    const submitButton = screen.getByRole('button')
    
    expect(textarea).toBeDisabled()
    expect(select).toBeDisabled()
    expect(submitButton).toBeDisabled()
  })

  it('shows loading state when generating', () => {
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={true} />)
    
    expect(screen.getByText(/generating/i)).toBeInTheDocument()
  })

  it('has all image style options', () => {
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
    
    const select = screen.getByLabelText(/image style/i)
    const options = Array.from(select.options).map(opt => opt.value)
    
    expect(options).toEqual([
      'photo',
      'illustration',
      'abstract',
      'minimalist',
      '3d',
      'cartoon',
    ])
  })

  it('displays helpful tips section', () => {
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
    
    expect(screen.getByText(/tips:/i)).toBeInTheDocument()
    expect(screen.getByText(/be specific and descriptive/i)).toBeInTheDocument()
  })
})