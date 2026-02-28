import { useState } from 'react'
import './ResultsGrid.css'

function ResultsGrid({ results, prompt }) {
  const [selectedImage, setSelectedImage] = useState(null)

  const getImageSrc = (image) => image.image || image.url
  const getName = (image) => image.platformName || image.preset?.name || image.platform
  const getWidth = (image) => image.width || image.preset?.width
  const getHeight = (image) => image.height || image.preset?.height

  const handleDownload = (image) => {
    const link = document.createElement('a')
    link.href = getImageSrc(image)
    link.download = `${getName(image).replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadAll = () => {
    results.forEach((image, index) => {
      setTimeout(() => {
        handleDownload(image)
      }, index * 500)
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
          <h2 className="results-title">Generated Images</h2>
          <p className="results-prompt">"{prompt}"</p>
        </div>
        <button
          className="download-all-btn"
          onClick={handleDownloadAll}
        >
          Download All ({results.length})
        </button>
      </div>

      <div className="results-grid">
        {results.map((image, index) => (
          <div key={index} className="result-card">
            <div className="image-container" onClick={() => handleImageClick(image)}>
              <img
                src={getImageSrc(image)}
                alt={`${getName(image)} - ${prompt}`}
                className="result-image"
                loading="lazy"
              />
              <div className="image-overlay">
                <button className="preview-btn">Preview</button>
              </div>
            </div>

            <div className="result-info">
              <div className="info-header">
                <h4 className="result-name">{getName(image)}</h4>
              </div>

              <div className="result-details">
                <span className="detail-item">
                  {getWidth(image)} x {getHeight(image)}
                </span>
              </div>

              <button
                className="download-btn"
                onClick={() => handleDownload(image)}
              >
                Download
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
              x
            </button>
            <img
              src={getImageSrc(selectedImage)}
              alt={getName(selectedImage)}
              className="modal-image"
            />
            <div className="modal-info">
              <h3>{getName(selectedImage)}</h3>
              <p>{getWidth(selectedImage)} x {getHeight(selectedImage)}</p>
              <button
                className="modal-download-btn"
                onClick={() => handleDownload(selectedImage)}
              >
                Download Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResultsGrid