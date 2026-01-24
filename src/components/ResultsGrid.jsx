import { useState } from 'react'
import './ResultsGrid.css'

const ResultsGrid = ({ results, isGenerating }) => {
  const [selectedImage, setSelectedImage] = useState(null)

  if (!results || results.length === 0) {
    return null
  }

  const handleDownload = (result) => {
    // TODO: Implement actual download
    console.log('Download:', result)
    alert(`Download feature coming soon!\nPlatform: ${result.platform}\nSize: ${result.width}x${result.height}px`)
  }

  const handleDownloadAll = () => {
    // TODO: Implement download all as ZIP
    console.log('Download all results')
    alert('Download all as ZIP feature coming soon!')
  }

  const totalSize = results.reduce((sum, r) => sum + (r.fileSize || 0), 0)
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="results-grid-container">
      <div className="results-header">
        <h2>🎉 Generated Images</h2>
        <div className="results-summary">
          <span className="result-count">{results.length} image{results.length !== 1 ? 's' : ''}</span>
          {totalSize > 0 && (
            <span className="total-size">{formatFileSize(totalSize)}</span>
          )}
          <button 
            className="download-all-btn"
            onClick={handleDownloadAll}
            disabled={isGenerating}
          >
            📦 Download All
          </button>
        </div>
      </div>

      <div className="results-grid">
        {results.map((result, index) => (
          <div key={index} className="result-card">
            <div className="image-wrapper">
              <img 
                src={result.url || result.thumbnail || 'https://via.placeholder.com/400x400/667eea/ffffff?text=Generated+Image'} 
                alt={`${result.platform} - ${result.width}x${result.height}`}
                onClick={() => setSelectedImage(result)}
                loading="lazy"
              />
              <div className="image-overlay">
                <button 
                  className="preview-btn"
                  onClick={() => setSelectedImage(result)}
                  aria-label="Preview"
                >
                  👁️
                </button>
              </div>
            </div>
            
            <div className="result-info">
              <div className="platform-info">
                <span className="platform-icon">{result.icon || '🖼️'}</span>
                <div>
                  <h4>{result.platform}</h4>
                  {result.label && <p className="dimension-label">{result.label}</p>}
                </div>
              </div>
              
              <div className="meta-info">
                <span className="dimension">{result.width} × {result.height}px</span>
                {result.fileSize && (
                  <span className="file-size">{formatFileSize(result.fileSize)}</span>
                )}
              </div>

              <div className="actions">
                <button 
                  className="download-btn"
                  onClick={() => handleDownload(result)}
                >
                  ⬇️ Download
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {selectedImage && (
        <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="close-modal"
              onClick={() => setSelectedImage(null)}
              aria-label="Close"
            >
              ✕
            </button>
            
            <img 
              src={selectedImage.url || selectedImage.thumbnail || 'https://via.placeholder.com/800x800/667eea/ffffff?text=Preview'}
              alt={`${selectedImage.platform} preview`}
            />
            
            <div className="modal-info">
              <h3>{selectedImage.platform}</h3>
              {selectedImage.label && <p>{selectedImage.label}</p>}
              <div className="modal-meta">
                <span>📐 {selectedImage.width} × {selectedImage.height}px</span>
                {selectedImage.fileSize && (
                  <span>💾 {formatFileSize(selectedImage.fileSize)}</span>
                )}
              </div>
              <button 
                className="modal-download-btn"
                onClick={() => handleDownload(selectedImage)}
              >
                ⬇️ Download This Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResultsGrid