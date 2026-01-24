import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test/utils/test-utils'

// Example test for PromptInput component
// Adjust based on actual component implementation

describe('PromptInput Component (Example)', () => {
  const mockOnGenerate = vi.fn()
  
  // Mock component for testing structure
  const PromptInput = ({ onGenerate, isGenerating }) => (
    <div className="prompt-input-container">
      <h2>Generate Your Image</h2>
      <form onSubmit={(e) => {
        e.preventDefault()
        onGenerate({ prompt: e.target.prompt.value, imageType: e.target.imageType.value })
      }}>
        <textarea
          name="prompt"
          placeholder="Describe your image"
          disabled={isGenerating}
          maxLength={500}
        />
        <select name="imageType" disabled={isGenerating}>
          <option value="photo">Photo-realistic</option>
          <option value="illustration">Illustration</option>
        </select>
        <button type="submit" disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Generate Images'}
        </button>
      </form>
    </div>
  )

  it('renders prompt input form', () => {
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
    
    expect(screen.getByText('Generate Your Image')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/describe your image/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /generate images/i })).toBeInTheDocument()
  })

  it('allows entering a prompt', async () => {
    const user = userEvent.setup()
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
    
    const textarea = screen.getByPlaceholderText(/describe your image/i)
    await user.type(textarea, 'A beautiful landscape')
    
    expect(textarea).toHaveValue('A beautiful landscape')
  })

  it('calls onGenerate when form is submitted', async () => {
    const user = userEvent.setup()
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
    
    await user.type(screen.getByPlaceholderText(/describe your image/i), 'Test prompt')
    await user.click(screen.getByRole('button', { name: /generate images/i }))
    
    await waitFor(() => {
      expect(mockOnGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'Test prompt',
        })
      )
    })
  })

  it('disables inputs when generating', () => {
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={true} />)
    
    expect(screen.getByPlaceholderText(/describe your image/i)).toBeDisabled()
    expect(screen.getByRole('button', { name: /generating/i })).toBeDisabled()
  })

  it('enforces character limit', async () => {
    const user = userEvent.setup()
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
    
    const textarea = screen.getByPlaceholderText(/describe your image/i)
    const longText = 'a'.repeat(600)
    
    await user.type(textarea, longText)
    
    // Should be limited to 500 characters
    expect(textarea.value.length).toBeLessThanOrEqual(500)
  })

  it('allows selecting image type', async () => {
    const user = userEvent.setup()
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
    
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'illustration')
    
    expect(select).toHaveValue('illustration')
  })
})