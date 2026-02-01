/**
 * Queue Statistics Dashboard
 * Real-time monitoring of job queue statistics
 */

import React, { useState, useEffect } from 'react'
import { subscribeToQueueStats } from '../../services/jobQueue'
import './QueueDashboard.css'

function QueueDashboard() {
  const [stats, setStats] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    // Subscribe to real-time stats
    const unsubscribe = subscribeToQueueStats((data) => {
      setStats(data)
      setConnected(true)
    })

    return () => {
      unsubscribe()
      setConnected(false)
    }
  }, [])

  if (!stats) {
    return (
      <div className="queue-dashboard loading">
        <div className="spinner"></div>
        <p>Loading queue statistics...</p>
      </div>
    )
  }

  const renderQueueStats = (queueName, queueStats) => (
    <div className="queue-card" key={queueName}>
      <h3>{queueName === 'imageGeneration' ? '🎨 Image Generation' : '🧹 File Cleanup'}</h3>
      <div className="stats-grid">
        <div className="stat-item waiting">
          <div className="stat-value">{queueStats.waiting || 0}</div>
          <div className="stat-label">Waiting</div>
        </div>
        <div className="stat-item active">
          <div className="stat-value">{queueStats.active || 0}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-item completed">
          <div className="stat-value">{queueStats.completed || 0}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-item failed">
          <div className="stat-value">{queueStats.failed || 0}</div>
          <div className="stat-label">Failed</div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="queue-dashboard">
      <div className="dashboard-header">
        <h2>📊 Queue Dashboard</h2>
        <div className="connection-status">
          <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`}></span>
          <span>{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      <div className="queues-container">
        {stats.imageGeneration && renderQueueStats('imageGeneration', stats.imageGeneration)}
        {stats.fileCleanup && renderQueueStats('fileCleanup', stats.fileCleanup)}
      </div>

      <div className="dashboard-footer">
        <p className="last-update">
          Last updated: {new Date(stats.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}

export default QueueDashboard