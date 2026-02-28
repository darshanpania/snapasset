import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useToast } from '../contexts/ToastContext'
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

const DEFAULT_EXAMPLES = [
  'Sunset mountain landscape, vibrant colors',
  'Minimalist geometric logo, modern',
  'Product photo, white background',
  'Abstract digital art, flowing gradients',
]

const HISTORY_KEY = 'snapasset_history'
const TEMPLATES_KEY = 'snapasset_templates'
const MAX_HISTORY = 20

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}
function saveHistory(h) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, MAX_HISTORY)))
}
function loadTemplates() {
  try { return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '[]') } catch { return [] }
}
function saveTemplates(t) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(t))
}

function Home() {
  const { user, signOut } = useAuth()
  const { theme, toggle: toggleTheme } = useTheme()
  const toast = useToast()
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [selected, setSelected] = useState([])
  const [results, setResults] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [history, setHistory] = useState(loadHistory)
  const [showHistory, setShowHistory] = useState(false)
  const [templates, setTemplates] = useState(loadTemplates)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)

  const toggle = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleGenerate = async () => {
    if (!prompt.trim() || selected.length === 0) return
    setIsGenerating(true)
    try {
      const response = await generateImages({ prompt: prompt.trim(), presets: selected })
      const images = response.images || []
      setResults(images)
      toast.success(`Generated ${images.length} image${images.length > 1 ? 's' : ''}`)
      const entry = { prompt: prompt.trim(), presets: selected, count: images.length, ts: Date.now() }
      const updated = [entry, ...history.filter(h => h.prompt !== entry.prompt)].slice(0, MAX_HISTORY)
      setHistory(updated)
      saveHistory(updated)
    } catch (err) {
      toast.error(err.message || 'Generation failed. Try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveTemplate = () => {
    if (!prompt.trim()) return
    const trimmed = prompt.trim()
    if (templates.includes(trimmed) || DEFAULT_EXAMPLES.includes(trimmed)) {
      toast.info('This prompt is already saved')
      return
    }
    const updated = [trimmed, ...templates].slice(0, 10)
    setTemplates(updated)
    saveTemplates(updated)
    setShowSaveTemplate(false)
    toast.success('Prompt template saved')
  }

  const removeTemplate = (t) => {
    const updated = templates.filter(x => x !== t)
    setTemplates(updated)
    saveTemplates(updated)
    toast.info('Template removed')
  }

  const clearHistory = () => {
    setHistory([])
    saveHistory([])
    toast.info('History cleared')
  }

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    // Cmd/Ctrl + Shift + A = select all presets
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'a') {
      e.preventDefault()
      setSelected(PLATFORM_PRESETS.map(p => p.id))
    }
    // Escape = close results or history
    if (e.key === 'Escape') {
      if (showHistory) setShowHistory(false)
      else if (results.length > 0) setResults([])
    }
  }, [showHistory, results.length])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const grouped = PLATFORM_PRESETS.reduce((acc, p) => {
    ;(acc[p.platform] = acc[p.platform] || []).push(p)
    return acc
  }, {})

  const showOnboarding = !user && results.length === 0 && !isGenerating && !prompt

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
                <button className="tb-btn" onClick={() => setShowHistory(!showHistory)}>History</button>
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

      {/* Onboarding / Info Section */}
      {showOnboarding && (
        <section className="onboarding">
          <div className="onboarding-inner">
            <h1 className="onboarding-title">Create perfect social media images with AI</h1>
            <p className="onboarding-sub">
              Describe what you want, pick your platforms, and SnapAsset generates correctly-sized images for every channel — Instagram, Twitter, Facebook, LinkedIn, YouTube, and Pinterest.
            </p>
            <div className="onboarding-steps">
              <div className="step">
                <div className="step-num">1</div>
                <div className="step-text">
                  <strong>Describe your image</strong>
                  <span>Write a prompt describing the image you need</span>
                </div>
              </div>
              <div className="step">
                <div className="step-num">2</div>
                <div className="step-text">
                  <strong>Pick platforms</strong>
                  <span>Select the social media sizes you need</span>
                </div>
              </div>
              <div className="step">
                <div className="step-num">3</div>
                <div className="step-text">
                  <strong>Generate & download</strong>
                  <span>Get AI-generated images sized for each platform</span>
                </div>
              </div>
            </div>
            <div className="onboarding-cta">
              <button className="tb-btn primary" onClick={() => navigate('/auth/signup')}>Get Started Free</button>
              <span className="onboarding-hint">Bring your own OpenAI API key — or sign in with ChatGPT</span>
            </div>
          </div>
        </section>
      )}

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
                {templates.map((t, i) => (
                  <span key={`t-${i}`} className="example-chip saved">
                    <button className="chip-btn" onClick={() => setPrompt(t)} disabled={isGenerating}>{t}</button>
                    <button className="chip-remove" onClick={() => removeTemplate(t)} title="Remove">&times;</button>
                  </span>
                ))}
                {DEFAULT_EXAMPLES.map((ex, i) => (
                  <button key={i} className="example-chip" onClick={() => setPrompt(ex)} disabled={isGenerating}>{ex}</button>
                ))}
              </div>
              <span className="char-ct">{prompt.length}/1000</span>
            </div>
          </div>

          {prompt.trim() && (
            <button className="save-template-btn" onClick={handleSaveTemplate}>
              + Save as template
            </button>
          )}

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

          <div className="shortcuts-hint">
            <kbd>{navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter</kbd> Generate
            <kbd>{navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Shift+A</kbd> Select all
            <kbd>Esc</kbd> Clear
          </div>
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

      {/* History Sidebar */}
      {showHistory && (
        <div className="history-overlay" onClick={() => setShowHistory(false)}>
          <div className="history-panel" onClick={e => e.stopPropagation()}>
            <div className="history-head">
              <h3>Generation History</h3>
              {history.length > 0 && (
                <button className="link-btn" onClick={clearHistory}>Clear</button>
              )}
            </div>
            {history.length === 0 ? (
              <p className="history-empty">No generations yet</p>
            ) : (
              <div className="history-list">
                {history.map((h, i) => (
                  <div key={i} className="history-item" onClick={() => { setPrompt(h.prompt); setSelected(h.presets); setShowHistory(false) }}>
                    <p className="history-prompt">{h.prompt}</p>
                    <div className="history-meta">
                      <span>{h.count} image{h.count > 1 ? 's' : ''}</span>
                      <span>{new Date(h.ts).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
