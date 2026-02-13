import { useState } from 'react'
import './ResultsGrid.css'

function ResultsGrid({ results, prompt }) {
  const [selectedImage, setSelectedImage] = useState(null)

  const handleDownload = (image) => {
    const link = document.createElement('a')
    link.href = image.url
    link.download = `${image.preset.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadAll = () => {
    results.forEach((image, index) => {
      setTimeout(() => {
        handleDownload(image)
      }, index * 500) // Stagger downloads by 500ms
    })
  }

  const handleImageClick = (image) => {
    setSelectedImage(image)
  }

  const closeModal = () => {
    setSelectedImage(null)
  }

  return (
    <div className="results-container">
      <div className="results-header">
        <div>
          <h2 className="results-title">✨ Generated Images</h2>
          <p className="results-prompt">"{prompt}"</p>
        </div>
        <button
          className="download-all-btn"
          onClick={handleDownloadAll}
        >
          ⬇️ Download All ({results.length})
        </button>
      </div>

      <div className="results-grid">
        {results.map((image, index) => (
          <div key={index} className="result-card">
            <div className="image-container" onClick={() => handleImageClick(image)}>
              <img
                src={image.url}
                alt={`${image.preset.name} - ${prompt}`}
                className="result-image"
                loading="lazy"
              />
              <div className="image-overlay">
                <button className="preview-btn">👁️ Preview</button>
              </div>
            </div>
            
            <div className="result-info">
              <div className="info-header">
                <span className="platform-icon">{image.preset.icon}</span>
                <h4 className="result-name">{image.preset.name}</h4>
              </div>
              
              <div className="result-details">
                <span className="detail-item">
                  📐 {image.preset.width} × {image.preset.height}
                </span>
                <span className="detail-item">
                  📊 {image.preset.aspectRatio}
                </span>
              </div>

              <button
                className="download-btn"
                onClick={() => handleDownload(image)}
              >
                ⬇️ Download
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for image preview */}
      {selectedImage && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              ✕
            </button>
            <img
              src={selectedImage.url}
              alt={selectedImage.preset.name}
              className="modal-image"
            />
            <div className="modal-info">
              <h3>{selectedImage.preset.name}</h3>
              <p>{selectedImage.preset.width} × {selectedImage.preset.height} ({selectedImage.preset.aspectRatio})</p>
              <button
                className="modal-download-btn"
                onClick={() => handleDownload(selectedImage)}
              >
                ⬇️ Download Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResultsGrid