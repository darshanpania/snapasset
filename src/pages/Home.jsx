import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import './Home.css'

const TARGET_GROUPS = [
  {
    name: 'Paid Social',
    targets: [
      { id: 'instagram-story', label: 'Instagram Story', ratio: '9:16', size: '1080 x 1920' },
      { id: 'instagram-post', label: 'Instagram Feed', ratio: '1:1', size: '1080 x 1080' },
      { id: 'facebook-feed', label: 'Facebook Feed', ratio: '1.91:1', size: '1200 x 628' },
    ],
  },
  {
    name: 'Display',
    targets: [
      { id: 'leaderboard', label: 'Leaderboard', ratio: '728:90', size: '728 x 90' },
      { id: 'mrec', label: 'Medium Rectangle', ratio: '300:250', size: '300 x 250' },
      { id: 'wide-skyscraper', label: 'Wide Skyscraper', ratio: '160:600', size: '160 x 600' },
    ],
  },
  {
    name: 'Organic',
    targets: [
      { id: 'linkedin-post', label: 'LinkedIn Post', ratio: '1.91:1', size: '1200 x 627' },
      { id: 'pinterest-pin', label: 'Pinterest Pin', ratio: '2:3', size: '1000 x 1500' },
      { id: 'youtube-thumb', label: 'YouTube Thumbnail', ratio: '16:9', size: '1280 x 720' },
    ],
  },
]

const PRESERVATION_OPTIONS = [
  {
    id: 'layout',
    title: 'Layout structure',
    description: 'Keep the composition and relative spacing intact where possible.',
  },
  {
    id: 'headline',
    title: 'Headline legibility',
    description: 'Prioritize large text blocks, CTA placement, and readable hierarchy.',
  },
  {
    id: 'brand',
    title: 'Brand system',
    description: 'Preserve logos, key colors, and the overall visual identity.',
  },
]

function Home() {
  const { user, signOut } = useAuth()
  const { theme, toggle: toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [selectedTargets, setSelectedTargets] = useState(['instagram-story', 'instagram-post'])
  const [preservationIntent, setPreservationIntent] = useState('brand')
  const [sourceAsset, setSourceAsset] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    if (!sourceAsset) {
      setPreviewUrl('')
      return undefined
    }

    const nextUrl = URL.createObjectURL(sourceAsset)
    setPreviewUrl(nextUrl)

    return () => URL.revokeObjectURL(nextUrl)
  }, [sourceAsset])

  const selectedTargetDetails = useMemo(
    () => TARGET_GROUPS.flatMap(group => group.targets).filter(target => selectedTargets.includes(target.id)),
    [selectedTargets],
  )

  const toggleTarget = (targetId) => {
    setSelectedTargets(current =>
      current.includes(targetId)
        ? current.filter(id => id !== targetId)
        : [...current, targetId]
    )
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setSourceAsset(file)
  }

  return (
    <div className="app creative-app">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="logo-group" onClick={() => navigate('/')}>
            <span className="logo">SnapAsset</span>
            <span className="logo-tagline">Creative Adaptation Studio</span>
          </div>
          <div className="topbar-right">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
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
                <button className="tb-btn primary" onClick={() => navigate('/auth/signup')}>Get Started</button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="creative-hero">
        <div className="creative-hero-inner">
          <div className="hero-copy">
            <span className="hero-kicker">Built for campaign teams</span>
            <h1>Turn one ad creative into every format you need.</h1>
            <p>
              Upload your existing asset, choose the placements you need, review each version,
              and export the approved set for launch.
            </p>
            <div className="hero-steps">
              <div className="hero-step">
                <span className="hero-step-number">1</span>
                <div>
                  <strong>Upload your approved creative</strong>
                  <span>Start with the ad your team already plans to run.</span>
                </div>
              </div>
              <div className="hero-step">
                <span className="hero-step-number">2</span>
                <div>
                  <strong>Pick the formats you need</strong>
                  <span>Choose feed, story, banner, and other placements.</span>
                </div>
              </div>
              <div className="hero-step">
                <span className="hero-step-number">3</span>
                <div>
                  <strong>Review before export</strong>
                  <span>Approve what works and export a clean set for launch.</span>
                </div>
              </div>
            </div>
            <div className="hero-actions">
              <button
                type="button"
                className="tb-btn primary"
                onClick={() => document.getElementById('source-upload')?.click()}
              >
                Upload Creative
              </button>
              {!user && (
                <button type="button" className="tb-btn" onClick={() => navigate('/auth/signup')}>
                  Create Account
                </button>
              )}
            </div>
          </div>

          <div className="hero-demo" aria-label="Creative resizing preview">
            <div className="demo-stage">
              <div className="demo-source">
                <div className="demo-artwork">
                  <span className="demo-badge">Source</span>
                  <div className="demo-shape demo-shape-one" />
                  <div className="demo-shape demo-shape-two" />
                  <div className="demo-copy">
                    <strong>Spring Sale</strong>
                    <span>Fresh creative, ready for every placement.</span>
                  </div>
                </div>
              </div>

              <div className="demo-arrow" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>

              <div className="demo-outputs">
                <div className="demo-frame frame-story">
                  <div className="frame-art" />
                  <span className="frame-label">Story</span>
                </div>
                <div className="demo-frame frame-square">
                  <div className="frame-art" />
                  <span className="frame-label">Feed</span>
                </div>
                <div className="demo-frame frame-banner">
                  <div className="frame-art" />
                  <span className="frame-label">Banner</span>
                </div>
              </div>
            </div>
            <p className="demo-caption">One creative becomes a reviewed set of ready-to-use campaign formats.</p>
          </div>
        </div>
      </section>

      <main className="creative-workspace">
        <section className="panel source-panel">
          <div className="section-heading">
            <span className="field-label">Source Creative</span>
            <h2>Upload your campaign creative</h2>
            <p>Start with a flat `PNG` or `JPG`, then prepare versions for the channels you care about.</p>
          </div>

          <label className={`upload-dropzone ${sourceAsset ? 'has-file' : ''}`} htmlFor="source-upload">
            <input
              id="source-upload"
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleFileChange}
            />
            {previewUrl ? (
              <div className="upload-preview">
                <img src={previewUrl} alt="Uploaded source creative preview" />
                <div className="upload-meta">
                  <strong>{sourceAsset?.name}</strong>
                  <span>{sourceAsset?.type || 'image/jpeg'}</span>
                </div>
              </div>
            ) : (
              <div className="upload-empty">
                <strong>Drop a creative here or browse files</strong>
                <span>Use a single approved asset as the starting point for all selected placements.</span>
              </div>
            )}
          </label>

          <div className="preservation-panel">
            <div className="section-heading compact">
              <span className="field-label">Preservation Intent</span>
              <h3>What matters most to preserve?</h3>
              <p className="section-note">Choose the priority that should guide the adaptation.</p>
            </div>
            <div className="intent-grid">
              {PRESERVATION_OPTIONS.map(option => (
                <button
                  key={option.id}
                  type="button"
                  className={`intent-card ${preservationIntent === option.id ? 'active' : ''}`}
                  onClick={() => setPreservationIntent(option.id)}
                >
                  <strong>{option.title}</strong>
                  <span>{option.description}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="panel targets-panel">
          <div className="section-heading">
            <span className="field-label">Targets</span>
            <h2>Choose where this creative should run</h2>
            <p>Select the placements you want to generate so every exported asset is campaign-ready.</p>
          </div>

          <div className="target-groups">
            {TARGET_GROUPS.map(group => (
              <div key={group.name} className="target-group">
                <div className="target-group-header">
                  <h3>{group.name}</h3>
                </div>
                <div className="target-grid">
                  {group.targets.map(target => {
                    const isSelected = selectedTargets.includes(target.id)

                    return (
                      <button
                        key={target.id}
                        type="button"
                        className={`target-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleTarget(target.id)}
                      >
                        <strong>{target.label}</strong>
                        <span>{target.size}</span>
                        <em>{target.ratio}</em>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel review-panel">
          <div className="section-heading">
            <span className="field-label">Review</span>
            <h2>Keep approval and export simple</h2>
            <p>
              Review each version by format, keep the ones that are ready, and export a clean set
              for handoff.
            </p>
          </div>

          <div className="review-summary">
            <div className="summary-card">
              <span className="summary-label">Source status</span>
              <strong>{sourceAsset ? 'Creative ready' : 'Waiting for upload'}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-label">Selected targets</span>
              <strong>{selectedTargets.length} placement{selectedTargets.length === 1 ? '' : 's'}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-label">Preservation focus</span>
              <strong>{PRESERVATION_OPTIONS.find(option => option.id === preservationIntent)?.title}</strong>
            </div>
          </div>

          <div className="review-checklist">
            <div className="checklist-column">
              <h3>Selected formats</h3>
              {selectedTargetDetails.length > 0 ? (
                <ul>
                  {selectedTargetDetails.map(target => (
                    <li key={target.id}>
                      <span>{target.label}</span>
                      <strong>{target.ratio}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Select at least one target placement to continue.</p>
              )}
            </div>

            <div className="checklist-column">
              <h3>What you can expect</h3>
              <ul>
                <li>
                  <span>Each format is reviewed separately</span>
                  <strong>Clear approvals</strong>
                </li>
                <li>
                  <span>Approved assets stay ready for export</span>
                  <strong>Export-ready set</strong>
                </li>
                <li>
                  <span>Only the formats that need work should be retried</span>
                  <strong>Selective updates</strong>
                </li>
              </ul>
            </div>
          </div>

          <div className="review-actions">
            <button type="button" className="tb-btn primary" disabled={!sourceAsset || selectedTargets.length === 0}>
              Start Project
            </button>
            <span className="action-hint">Choose a source creative and at least one placement to continue.</span>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Home
