import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Home.css'

function Home() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [selectedPresets, setSelectedPresets] = useState([])
  const [results, setResults] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)

  // Platform presets
  const PRESETS = [
    { id: 'instagram-post', name: 'Instagram Post', icon: '📷', width: 1080, height: 1080, ratio: '1:1' },
    { id: 'instagram-story', name: 'Instagram Story', icon: '📱', width: 1080, height: 1920, ratio: '9:16' },
    { id: 'twitter-post', name: 'Twitter Post', icon: '🐦', width: 1200, height: 675, ratio: '16:9' },
    { id: 'twitter-header', name: 'Twitter Header', icon: '🎨', width: 1500, height: 500, ratio: '3:1' },
    { id: 'facebook-post', name: 'Facebook Post', icon: '👥', width: 1200, height: 630, ratio: '1.91:1' },
    { id: 'linkedin-post', name: 'LinkedIn Post', icon: '💼', width: 1200, height: 627, ratio: '1.91:1' },
  ]

  const togglePreset = (presetId) => {
    setSelectedPresets(prev => 
      prev.includes(presetId)
        ? prev.filter(id => id !== presetId)
        : [...prev, presetId]
    )
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    if (selectedPresets.length === 0) {
      setError('Please select at least one platform')
      return
    }

    setError(null)
    setIsGenerating(true)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, presets: selectedPresets })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed')
      }

      setResults(data.images || [])
      
      // Scroll to results
      setTimeout(() => {
        document.querySelector('.results-section')?.scrollIntoView({ 
          behavior: 'smooth' 
        })
      }, 100)
      
    } catch (err) {
      console.error('Generation error:', err)
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth/login')
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <h1>📸 SnapAsset</h1>
            <p>AI-Powered Multi-Platform Image Generator</p>
          </div>
          <div className="header-right">
            {user ? (
              <div className="user-menu">
                <button onClick={() => navigate('/profile')} className="user-button">
                  <img 
                    src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=667eea&color=fff`}
                    alt="Profile"
                    className="user-avatar"
                  />
                  <span>{user.user_metadata?.full_name || user.email}</span>
                </button>
                <button onClick={handleSignOut} className="btn-logout">
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <button onClick={() => navigate('/auth/login')} className="btn-login">
                  Sign In
                </button>
                <button onClick={() => navigate('/auth/signup')} className="btn-signup">
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="main">
        <div className="container">
          {/* Prompt Input Section */}
          <div className="prompt-section">
            <h2>🎨 Describe Your Image</h2>
            <textarea
              className="prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate... e.g., 'A serene mountain landscape at sunset with vibrant colors'"
              rows={4}
              disabled={isGenerating}
            />
            <div className="char-count">{prompt.length} / 1000</div>
          </div>

          {/* Platform Selection */}
          <div className="presets-section">
            <h2>🎯 Select Platforms</h2>
            <p className="section-subtitle">
              {selectedPresets.length} platform{selectedPresets.length !== 1 ? 's' : ''} selected
            </p>
            <div className="presets-grid">
              {PRESETS.map(preset => (
                <div
                  key={preset.id}
                  className={`preset-card ${selectedPresets.includes(preset.id) ? 'selected' : ''}`}
                  onClick={() => togglePreset(preset.id)}
                >
                  <div className="preset-icon">{preset.icon}</div>
                  <h4>{preset.name}</h4>
                  <p className="preset-dims">{preset.width} × {preset.height}</p>
                  <span className="preset-ratio">{preset.ratio}</span>
                  {selectedPresets.includes(preset.id) && (
                    <div className="check-badge">✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-banner">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <div className="action-section">
            <button
              onClick={handleGenerate}
              className="btn-generate"
              disabled={isGenerating || !prompt.trim() || selectedPresets.length === 0}
            >
              {isGenerating ? (
                <>
                  <span className="spinner"></span>
                  Generating Images...
                </>
              ) : (
                <>
                  ✨ Generate Images
                </>
              )}
            </button>
            {results.length > 0 && (
              <button
                onClick={() => setResults([])}
                className="btn-clear"
                disabled={isGenerating}
              >
                Clear Results
              </button>
            )}
          </div>

          {/* Results Section */}
          {results.length > 0 && (
            <div className="results-section">
              <h2>✨ Generated Images</h2>
              <div className="results-grid">
                {results.map((result, idx) => (
                  <div key={idx} className="result-card">
                    <div className="result-image-container">
                      <img src={result.url} alt={result.preset.name} />
                    </div>
                    <div className="result-info">
                      <h4>{result.preset.name}</h4>
                      <p>{result.preset.width} × {result.preset.height}</p>
                      <button className="btn-download">
                        ⬇️ Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Section */}
          {results.length === 0 && !isGenerating && (
            <div className="info-section">
              <h3>🚀 How It Works</h3>
              <div className="steps">
                <div className="step">
                  <div className="step-num">1</div>
                  <h4>Describe</h4>
                  <p>Enter a detailed description of your image</p>
                </div>
                <div className="step">
                  <div className="step-num">2</div>
                  <h4>Select</h4>
                  <p>Choose your target platforms</p>
                </div>
                <div className="step">
                  <div className="step-num">3</div>
                  <h4>Generate</h4>
                  <p>Get perfectly-sized images instantly</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <p>Built with React + Vite | Powered by DALL-E & Supabase</p>
        <p>© 2026 SnapAsset by Darshan Pania</p>
      </footer>
    </div>
  )
}

export default Home