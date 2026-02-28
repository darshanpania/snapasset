import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import ResultsGrid from '../components/ResultsGrid'
import { generateImages } from '../services/api'
import './Home.css'

const PLATFORM_PRESETS = [
  { id: 'instagram-post', name: 'Instagram Post', platform: 'Instagram', width: 1080, height: 1080, ratio: '1:1' },
  { id: 'instagram-story', name: 'Instagram Story', platform: 'Instagram', width: 1080, height: 1920, ratio: '9:16' },
  { id: 'twitter-post', name: 'Twitter Post', platform: 'Twitter', width: 1200, height: 675, ratio: '16:9' },
  { id: 'twitter-header', name: 'Twitter Header', platform: 'Twitter', width: 1500, height: 500, ratio: '3:1' },
  { id: 'facebook-post', name: 'Facebook Post', platform: 'Facebook', width: 1200, height: 630, ratio: '1.91:1' },
  { id: 'facebook-cover', name: 'Facebook Cover', platform: 'Facebook', width: 820, height: 312, ratio: '2.63:1' },
  { id: 'linkedin-post', name: 'LinkedIn Post', platform: 'LinkedIn', width: 1200, height: 627, ratio: '1.91:1' },
  { id: 'youtube-thumbnail', name: 'YouTube Thumbnail', platform: 'YouTube', width: 1280, height: 720, ratio: '16:9' },
  { id: 'pinterest-pin', name: 'Pinterest Pin', platform: 'Pinterest', width: 1000, height: 1500, ratio: '2:3' },
]

const EXAMPLES = [
  'Sunset mountain landscape, vibrant colors',
  'Minimalist geometric logo, modern',
  'Product photo, white background',
  'Abstract digital art, flowing gradients',
]

function Home() {
  const { user, signOut } = useAuth()
  const { theme, toggle: toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [selected, setSelected] = useState([])
  const [results, setResults] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)

  const toggle = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleGenerate = async () => {
    if (!prompt.trim() || selected.length === 0) return
    setError(null)
    setIsGenerating(true)
    try {
      const response = await generateImages({ prompt: prompt.trim(), presets: selected })
      setResults(response.images || [])
    } catch (err) {
      setError(err.message || 'Generation failed. Try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const grouped = PLATFORM_PRESETS.reduce((acc, p) => {
    ;(acc[p.platform] = acc[p.platform] || []).push(p)
    return acc
  }, {})

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <span className="logo" onClick={() => navigate('/')}>SnapAsset</span>
          <div className="topbar-right">
            <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              {theme === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8 1v2m0 10v2m-7-7h2m10 0h2m-2.5-4.5L11 4.5m-6 7L3.5 12.5m9-1L11 11.5m-6-7L3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 9.5A6.5 6.5 0 016.5 2 5.5 5.5 0 1014 9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
              )}
            </button>
            {user ? (
              <>
                <span className="user-email">{user.email}</span>
                <button className="tb-btn" onClick={() => navigate('/settings')}>Settings</button>
                <button className="tb-btn muted" onClick={() => { signOut(); navigate('/auth/login') }}>Sign Out</button>
              </>
            ) : (
              <>
                <button className="tb-btn" onClick={() => navigate('/auth/login')}>Sign In</button>
                <button className="tb-btn primary" onClick={() => navigate('/auth/signup')}>Sign Up</button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="workspace">
        {/* Input Panel */}
        <div className="panel input-panel">
          <div className="panel-section">
            <label className="field-label">Describe your image</label>
            <textarea
              className="prompt-field"
              placeholder="A professional product photo on a clean white background with soft shadows..."
              value={prompt}
              onChange={e => e.target.value.length <= 1000 && setPrompt(e.target.value)}
              onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleGenerate() }}
              disabled={isGenerating}
              rows={4}
            />
            <div className="prompt-meta">
              <div className="examples">
                {EXAMPLES.map((ex, i) => (
                  <button key={i} className="example-chip" onClick={() => setPrompt(ex)} disabled={isGenerating}>{ex}</button>
                ))}
              </div>
              <span className="char-ct">{prompt.length}/1000</span>
            </div>
          </div>

          {error && <div className="err-msg">{error}</div>}

          <button
            className="gen-btn"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim() || selected.length === 0}
          >
            {isGenerating ? (
              <><span className="spinner" /> Generating...</>
            ) : (
              <>Generate {selected.length > 0 ? `(${selected.length} preset${selected.length > 1 ? 's' : ''})` : ''}</>
            )}
          </button>
        </div>

        {/* Presets Panel */}
        <div className="panel presets-panel">
          <div className="presets-head">
            <label className="field-label">Platforms</label>
            <div className="presets-actions">
              <button className="link-btn" onClick={() => setSelected(PLATFORM_PRESETS.map(p => p.id))}>All</button>
              <button className="link-btn" onClick={() => setSelected([])} disabled={selected.length === 0}>None</button>
            </div>
          </div>

          <div className="presets-list">
            {Object.entries(grouped).map(([platform, presets]) => (
              <div key={platform} className="preset-group">
                <div className="group-label">{platform}</div>
                {presets.map(p => {
                  const on = selected.includes(p.id)
                  return (
                    <div key={p.id} className={`preset-row ${on ? 'on' : ''}`} onClick={() => toggle(p.id)}>
                      <div className={`chk ${on ? 'checked' : ''}`}>{on && <svg viewBox="0 0 12 12" width="10" height="10"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" fill="none"/></svg>}</div>
                      <div className="preset-label">
                        <span className="preset-name">{p.name.replace(p.platform + ' ', '')}</span>
                        <span className="preset-dim">{p.width}x{p.height}</span>
                      </div>
                      <span className="preset-ratio">{p.ratio}</span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Results */}
      {(results.length > 0 || isGenerating) && (
        <section className="results-section">
          <div className="results-inner">
            {isGenerating ? (
              <div className="generating-state">
                <div className="spinner lg" />
                <p>Generating your images...</p>
                <p className="sub">This usually takes 20-40 seconds</p>
              </div>
            ) : (
              <>
                <ResultsGrid results={results} prompt={prompt} />
                <div className="results-actions">
                  <button className="tb-btn" onClick={() => setResults([])}>Clear Results</button>
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

export default Home