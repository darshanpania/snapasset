import { useState } from 'react'
import './PromptInput.css'

function PromptInput({ value, onChange, onGenerate, isGenerating }) {
  const [charCount, setCharCount] = useState(value.length)
  const maxChars = 1000

  const handleChange = (e) => {
    const newValue = e.target.value
    if (newValue.length <= maxChars) {
      onChange(newValue)
      setCharCount(newValue.length)
    }
  }

  const handleKeyDown = (e) => {
    // Submit on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isGenerating) {
      onGenerate()
    }
  }

  const examplePrompts = [
    'A serene mountain landscape at sunset with vibrant colors',
    'Modern minimalist logo with geometric shapes',
    'Abstract digital art with flowing colors and patterns',
    'Professional product photography on white background'
  ]

  const handleExampleClick = (example) => {
    onChange(example)
    setCharCount(example.length)
  }

  return (
    <div className="prompt-input-container">
      <label htmlFor="prompt" className="prompt-label">
        <span className="label-text">✍️ Image Description</span>
        <span className="char-count">
          {charCount} / {maxChars}
        </span>
      </label>
      
      <textarea
        id="prompt"
        className="prompt-textarea"
        placeholder="Describe the image you want to generate... Be specific and detailed for better results!"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={isGenerating}
        rows={4}
      />

      <div className="prompt-tips">
        <p className="tip-title">💡 Tips for better results:</p>
        <ul>
          <li>Be specific about style, colors, and mood</li>
          <li>Include details about composition and lighting</li>
          <li>Mention the subject clearly</li>
        </ul>
      </div>

      <div className="example-prompts">
        <p className="example-title">Try these examples:</p>
        <div className="example-buttons">
          {examplePrompts.map((example, index) => (
            <button
              key={index}
              className="example-button"
              onClick={() => handleExampleClick(example)}
              disabled={isGenerating}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PromptInput