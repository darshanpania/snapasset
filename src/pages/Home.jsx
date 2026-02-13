import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PromptInput from '../components/PromptInput'
import PresetSelector from '../components/PresetSelector'
import ResultsGrid from '../components/ResultsGrid'
import { generateImages } from '../services/api'
import './Home.css'

function Home() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [selectedPresets, setSelectedPresets] = useState([])
  const [results, setResults] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt for image generation')
      return
    }

    if (selectedPresets.length === 0) {
      setError('Please select at least one platform preset')
      return
    }

    setError(null)
    setIsGenerating(true)

    try {
      const response = await generateImages({
        prompt: prompt.trim(),
        presets: selectedPresets
      })

      setResults(response.images || [])
    } catch (err) {
      console.error('Generation error:', err)
      setError(err.message || 'Failed to generate images. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClearResults = () => {
    setResults([])
    setError(null)
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
          {/* Input Section */}
          <div className="input-section">
            <PromptInput
              value={prompt}
              onChange={setPrompt}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />

            <PresetSelector
              selectedPresets={selectedPresets}
              onChange={setSelectedPresets}
              disabled={isGenerating}
            />

            {error && (
              <div className="error-message">
                <span>⚠️</span>
                <p>{error}</p>
              </div>
            )}

            <div className="action-buttons">
              <button
                className="generate-button"
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim() || selectedPresets.length === 0}
              >
                {isGenerating ? (
                  <>
                    <span className="spinner"></span>
                    Generating...
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    Generate Images
                  </>
                )}
              </button>

              {results.length > 0 && (
                <button
                  className="clear-button"
                  onClick={handleClearResults}
                  disabled={isGenerating}
                >
                  Clear Results
                </button>
              )}
            </div>
          </div>

          {/* Results Section */}
          {results.length > 0 && (
            <ResultsGrid
              results={results}
              prompt={prompt}
            />
          )}

          {/* Info Section */}
          {results.length === 0 && !isGenerating && (
            <div className="info-section">
              <div className="info-card">
                <h3>🎨 How it works</h3>
                <ol>
                  <li>Enter a detailed description of the image you want to create</li>
                  <li>Select the platforms where you'll use the image</li>
                  <li>Click "Generate Images" and let AI do the magic</li>
                  <li>Download individual images or all at once</li>
                </ol>
              </div>

              <div className="features">
                <div className="feature-card">
                  <h3>🚀 AI-Powered</h3>
                  <p>Generate unique images using DALL-E AI technology</p>
                </div>
                <div className="feature-card">
                  <h3>📐 Perfect Sizes</h3>
                  <p>Automatically resized for each platform's requirements</p>
                </div>
                <div className="feature-card">
                  <h3>⚡ Fast & Easy</h3>
                  <p>Generate multiple platform assets in seconds</p>
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