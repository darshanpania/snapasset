import { useState, useEffect } from 'react'
import { supabase } from './services/supabase'
import PromptInput from './components/PromptInput'
import PlatformPresets from './components/PlatformPresets'
import ResultsGrid from './components/ResultsGrid'
import { platformPresets } from './data/platformPresets'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedPlatforms, setSelectedPlatforms] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [results, setResults] = useState([])

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handlePlatformToggle = (platformKey, isSelected) => {
    setSelectedPlatforms(prev => {
      if (isSelected && !prev.includes(platformKey)) {
        return [...prev, platformKey]
      } else if (!isSelected && prev.includes(platformKey)) {
        return prev.filter(key => key !== platformKey)
      }
      return prev
    })
  }

  const handleGenerate = async ({ prompt, imageType }) => {
    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform')
      return
    }

    setIsGenerating(true)
    setResults([])

    try {
      // TODO: Replace with actual API call
      console.log('Generating images:', { prompt, imageType, platforms: selectedPlatforms })

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Generate mock results based on selected platforms
      const mockResults = []
      selectedPlatforms.forEach(platformKey => {
        const preset = platformPresets[platformKey]
        preset.dimensions.forEach(dim => {
          mockResults.push({
            platform: preset.name,
            label: dim.label,
            width: dim.width,
            height: dim.height,
            icon: preset.icon,
            url: `https://via.placeholder.com/${dim.width}x${dim.height}/667eea/ffffff?text=${encodeURIComponent(preset.name)}`,
            thumbnail: `https://via.placeholder.com/400x400/667eea/ffffff?text=${encodeURIComponent(preset.name)}`,
            fileSize: Math.floor(Math.random() * 500000) + 100000, // Random size between 100KB - 600KB
          })
        })
      })

      setResults(mockResults)

      // Scroll to results
      setTimeout(() => {
        document.querySelector('.results-grid-container')?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        })
      }, 100)

    } catch (error) {
      console.error('Generation error:', error)
      alert('Failed to generate images. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner-large"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>📸 SnapAsset</h1>
        <p>AI-Powered Multi-Platform Image Generator</p>
      </header>
      
      <main className="main">
        <div className="container">
          {/* Welcome Section */}
          <div className="welcome-section">
            {user ? (
              <div className="user-info-bar">
                <span>✅ Logged in as: <strong>{user.email}</strong></span>
                <button 
                  className="small-btn"
                  onClick={() => supabase.auth.signOut()}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="auth-banner">
                <p>🔒 <strong>Authentication Coming Soon!</strong> Generate images without signing in for now.</p>
              </div>
            )}
          </div>

          {/* Prompt Input Section */}
          <PromptInput 
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />

          {/* Platform Selection */}
          <PlatformPresets 
            selectedPlatforms={selectedPlatforms}
            onPlatformToggle={handlePlatformToggle}
            isGenerating={isGenerating}
          />

          {/* Results Display */}
          <ResultsGrid 
            results={results}
            isGenerating={isGenerating}
          />

          {/* Info Section */}
          {results.length === 0 && !isGenerating && (
            <div className="info-section">
              <h3>🚀 How It Works</h3>
              <div className="steps">
                <div className="step">
                  <div className="step-number">1</div>
                  <h4>Describe Your Image</h4>
                  <p>Enter a detailed prompt describing what you want to create</p>
                </div>
                <div className="step">
                  <div className="step-number">2</div>
                  <h4>Select Platforms</h4>
                  <p>Choose which platforms and sizes you need</p>
                </div>
                <div className="step">
                  <div className="step-number">3</div>
                  <h4>Generate & Download</h4>
                  <p>Get perfectly-sized images for all your platforms</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <p>Built with React + Vite | Powered by Supabase</p>
        <p>© 2026 SnapAsset by Darshan Pania</p>
      </footer>
    </div>
  )
}

export default App