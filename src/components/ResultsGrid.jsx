import { useState } from 'react'
import JSZip from 'jszip'
import { useToast } from '../contexts/ToastContext'
import './ResultsGrid.css'

function ResultsGrid({ results, prompt }) {
  const [preview, setPreview] = useState(null)
  const [zipping, setZipping] = useState(false)
  const toast = useToast()

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
    toast.success(`Downloaded ${name(img)}`)
  }

  const downloadAllZip = async () => {
    if (results.length === 0) return
    setZipping(true)
    try {
      const zip = new JSZip()
      const folder = zip.folder('snapasset-images')

      for (let idx = 0; idx < results.length; idx++) {
        const img = results[idx]
        const imgSrc = src(img)
        const fileName = `${idx + 1}-${name(img).replace(/\s+/g, '-').toLowerCase()}.png`

        if (imgSrc.startsWith('data:')) {
          const base64 = imgSrc.split(',')[1]
          folder.file(fileName, base64, { base64: true })
        } else {
          const response = await fetch(imgSrc)
          if (!response.ok) continue
          const blob = await response.blob()
          folder.file(fileName, blob)
        }
      }

      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `snapasset-${Date.now()}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success(`Downloaded ${results.length} images as ZIP`)
    } catch (err) {
      toast.error('ZIP download failed: ' + err.message)
    } finally {
      setZipping(false)
    }
  }

  return (
    <div className="rg">
      <div className="rg-head">
        <div>
          <h2 className="rg-title">Generated Images</h2>
          <p className="rg-prompt">"{prompt}"</p>
        </div>
        <button className="rg-dl-all" onClick={downloadAllZip} disabled={zipping}>
          {zipping ? (
            <><span className="spinner-sm" /> Zipping...</>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1v9m0 0L5 7m3 3l3-3M2 12v1a2 2 0 002 2h8a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Download All as ZIP ({results.length})
            </>
          )}
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
