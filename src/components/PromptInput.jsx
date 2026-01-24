import { useState } from 'react'
import './PromptInput.css'

const PromptInput = ({ onGenerate, isGenerating }) => {
  const [prompt, setPrompt] = useState('')
  const [imageType, setImageType] = useState('photo')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validation
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }
    
    if (prompt.length < 3) {
      setError('Prompt must be at least 3 characters')
      return
    }
    
    setError('')
    onGenerate({ prompt: prompt.trim(), imageType })
  }

  const handlePromptChange = (e) => {
    setPrompt(e.target.value)
    if (error) setError('')
  }

  return (
    <div className="prompt-input-container">
      <h2>🎨 Generate Your Image</h2>
      <form onSubmit={handleSubmit} className="prompt-form">
        <div className="form-group">
          <label htmlFor="prompt">
            Describe your image
            <span className="char-count">
              {prompt.length}/500
            </span>
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={handlePromptChange}
            placeholder="e.g., A modern minimalist logo with geometric shapes and vibrant colors"
            maxLength={500}
            rows={4}
            disabled={isGenerating}
            className={error ? 'error' : ''}
          />
          {error && <span className="error-message">{error}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="imageType">Image Style</label>
          <select
            id="imageType"
            value={imageType}
            onChange={(e) => setImageType(e.target.value)}
            disabled={isGenerating}
          >
            <option value="photo">📷 Photo-realistic</option>
            <option value="illustration">🎨 Illustration</option>
            <option value="abstract">✨ Abstract</option>
            <option value="minimalist">⚪ Minimalist</option>
            <option value="3d">🎭 3D Render</option>
            <option value="cartoon">😄 Cartoon</option>
          </select>
        </div>

        <button 
          type="submit" 
          disabled={isGenerating || !prompt.trim()}
          className="generate-btn"
        >
          {isGenerating ? (
            <>
              <span className="spinner"></span>
              Generating...
            </>
          ) : (
            <>
              ✨ Generate Images
            </>
          )}
        </button>
      </form>

      <div className="tips">
        <p><strong>💡 Tips:</strong></p>
        <ul>
          <li>Be specific and descriptive</li>
          <li>Include colors, mood, and style</li>
          <li>Mention key objects or themes</li>
        </ul>
      </div>
    </div>
  )
}

export default PromptInput