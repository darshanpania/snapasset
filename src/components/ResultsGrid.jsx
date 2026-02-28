import { useState } from 'react'
import './ResultsGrid.css'

function ResultsGrid({ results, prompt }) {
  const [preview, setPreview] = useState(null)

  const src = (img) => img.image || img.url
  const name = (img) => img.platformName || img.preset?.name || img.platform
  const w = (img) => img.width || img.preset?.width
  const h = (img) => img.height || img.preset?.height

  const download = (img) => {
    const a = document.createElement('a')
    a.href = src(img)
    a.download = `${name(img).replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const downloadAll = () => {
    results.forEach((img, i) => setTimeout(() => download(img), i * 400))
  }

  return (
    <div className="rg">
      <div className="rg-head">
        <div>
          <h2 className="rg-title">Generated Images</h2>
          <p className="rg-prompt">"{prompt}"</p>
        </div>
        <button className="rg-dl-all" onClick={downloadAll}>
          Download All ({results.length})
        </button>
      </div>

      <div className="rg-grid">
        {results.map((img, i) => (
          <div key={i} className="rg-card">
            <div className="rg-img-wrap" onClick={() => setPreview(img)}>
              <img src={src(img)} alt={name(img)} className="rg-img" loading="lazy" />
              <div className="rg-hover">Click to preview</div>
            </div>
            <div className="rg-meta">
              <div className="rg-meta-left">
                <span className="rg-name">{name(img)}</span>
                <span className="rg-dims">{w(img)} x {h(img)}</span>
              </div>
              <button className="rg-dl" onClick={() => download(img)} title="Download">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1v9m0 0L5 7m3 3l3-3M2 12v1a2 2 0 002 2h8a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <div className="rg-modal" onClick={() => setPreview(null)}>
          <div className="rg-modal-body" onClick={e => e.stopPropagation()}>
            <button className="rg-modal-close" onClick={() => setPreview(null)}>x</button>
            <img src={src(preview)} alt={name(preview)} className="rg-modal-img" />
            <div className="rg-modal-info">
              <span>{name(preview)} &middot; {w(preview)} x {h(preview)}</span>
              <button className="rg-dl" onClick={() => download(preview)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1v9m0 0L5 7m3 3l3-3M2 12v1a2 2 0 002 2h8a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResultsGrid