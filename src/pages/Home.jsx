import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useToast } from '../contexts/ToastContext'
import ResultsGrid from '../components/ResultsGrid'
import { generateImages, getImageModels } from '../services/api'
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

const PLATFORM_ICONS = {
  Instagram: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>,
  Twitter: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  Facebook: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  LinkedIn: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
  YouTube: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
  Pinterest: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/></svg>,
}

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
  const [models, setModels] = useState([])
  const [model, setModel] = useState('dall-e-3')
  const [augment, setAugment] = useState(true)

  useEffect(() => {
    let cancelled = false
    getImageModels()
      .then((res) => {
        if (cancelled || !res?.models) return
        setModels(res.models)
        if (res.default) setModel(res.default)
      })
      .catch(() => { /* fall back to default; UI still usable */ })
    return () => { cancelled = true }
  }, [])

  const toggle = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleGenerate = async () => {
    if (!prompt.trim() || selected.length === 0) return
    setIsGenerating(true)
    try {
      const response = await generateImages({ prompt: prompt.trim(), presets: selected, model, augment })
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
          <div className="logo-group" onClick={() => navigate('/')}>
            <span className="logo">SnapAsset</span>
            <span className="logo-tagline">AI Image Generator</span>
          </div>
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
            <div className="hero-badge"><span className="hero-badge-dot" />Powered by DALL-E 3</div>
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

      {user && !showOnboarding && (
        <div className="workspace-header">
          <p className="workspace-sub">Describe your image, pick platforms, generate — perfectly sized for every social channel.</p>
        </div>
      )}

      <main className="workspace">
        {/* Input Panel */}
        <div className="panel input-panel">
          <div className="panel-section model-section">
            <label className="field-label" htmlFor="model-picker">Model</label>
            <select
              id="model-picker"
              className="model-picker"
              value={model}
              onChange={e => setModel(e.target.value)}
              disabled={isGenerating}
            >
              {(models.length > 0 ? models : [{ id: model, name: model }]).map(m => (
                <option key={m.id} value={m.id}>{m.name || m.id}</option>
              ))}
            </select>
            <label className="augment-toggle">
              <input
                type="checkbox"
                checked={augment}
                onChange={e => setAugment(e.target.checked)}
                disabled={isGenerating}
              />
              <span>Enhance my prompt automatically</span>
              <span className="augment-hint" title="Adds quality and composition hints so images crop cleanly to every selected aspect ratio.">?</span>
            </label>
          </div>

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
                <div className="group-label">{PLATFORM_ICONS[platform]}{platform}</div>
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

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">SnapAsset</span>
            <span className="footer-desc">AI-powered social media image generator. Create perfectly-sized images for Instagram, Twitter, Facebook, LinkedIn, YouTube, and Pinterest in seconds.</span>
          </div>
          <div className="footer-meta">
            <span className="footer-chip">DALL-E 3</span>
            <span className="footer-chip">v2.0</span>
            <span className="footer-chip">BYOK</span>
            <span className="footer-chip">ChatGPT Auth</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
