/**
 * Job Monitor Component
 * Real-time job status monitoring with progress bar
 */

import React from 'react'
import { useJobStatus } from '../../hooks/useJobStatus'
import './JobMonitor.css'

function JobMonitor({ jobId, onComplete, onError }) {
  const { status, progress, loading, error, result, isCompleted, isFailed } = useJobStatus(jobId)

  // Call callbacks
  React.useEffect(() => {
    if (isCompleted && result) {
      onComplete?.(result)
    }
  }, [isCompleted, result, onComplete])

  React.useEffect(() => {
    if (isFailed && error) {
      onError?.(error)
    }
  }, [isFailed, error, onError])

  if (loading) {
    return (
      <div className="job-monitor loading">
        <div className="spinner"></div>
        <p>Connecting to job...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="job-monitor error">
        <div className="error-icon">❌</div>
        <h3>Job Error</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    )
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'waiting':
        return '⏳'
      case 'active':
        return '⌛'
      case 'completed':
        return '✅'
      case 'failed':
        return '❌'
      default:
        return '🔴'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'waiting':
        return 'Queued'
      case 'active':
        return 'Processing'
      case 'completed':
        return 'Completed'
      case 'failed':
        return 'Failed'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className={`job-monitor ${status}`}>
      <div className="job-header">
        <span className="status-icon">{getStatusIcon()}</span>
        <div className="job-info">
          <h3>{getStatusText()}</h3>
          <p className="job-id">Job ID: {jobId}</p>
        </div>
      </div>

      {(status === 'waiting' || status === 'active') && (
        <div className="progress-section">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="progress-text">{Math.round(progress)}%</p>
        </div>
      )}

      {status === 'active' && (
        <div className="processing-steps">
          <p className="step">
            {progress < 10 && '🎯 Initializing...'}
            {progress >= 10 && progress < 40 && '🎨 Generating AI image...'}
            {progress >= 40 && progress < 50 && '📥 Downloading image...'}
            {progress >= 50 && progress < 90 && '🔄 Processing platforms...'}
            {progress >= 90 && '📤 Uploading to storage...'}
          </p>
        </div>
      )}

      {isCompleted && result && (
        <div className="result-section">
          <h4>✅ Generation Complete!</h4>
          <p>Generated {result.result?.totalImages || 0} images</p>
        </div>
      )}

      {isFailed && (
        <div className="error-section">
          <h4>❌ Generation Failed</h4>
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}

export default JobMonitor