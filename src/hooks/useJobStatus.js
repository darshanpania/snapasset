/**
 * React Hook for Job Status Monitoring
 * Real-time job status updates using SSE
 */

import { useState, useEffect, useCallback } from 'react'
import { subscribeToJobUpdates, getJobStatus } from '../services/jobQueue'

/**
 * Hook for monitoring job status with real-time updates
 */
export function useJobStatus(jobId) {
  const [status, setStatus] = useState(null)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!jobId) {
      setLoading(false)
      return
    }

    // Get initial status
    getJobStatus(jobId)
      .then((data) => {
        setStatus(data.status)
        setProgress(data.progress || 0)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })

    // Subscribe to real-time updates
    const unsubscribe = subscribeToJobUpdates(jobId, {
      onConnected: () => {
        console.log('Connected to job updates:', jobId)
      },
      onUpdate: (data) => {
        setStatus(data.status)
        setProgress(data.progress || 0)
      },
      onComplete: (data) => {
        setStatus(data.status)
        setProgress(100)
        setResult(data.result)
      },
      onError: (err) => {
        setError(err.error || 'Connection error')
      },
    })

    // Cleanup on unmount
    return () => {
      unsubscribe()
    }
  }, [jobId])

  return {
    status,
    progress,
    loading,
    error,
    result,
    isCompleted: status === 'completed',
    isFailed: status === 'failed',
    isProcessing: status === 'active' || status === 'waiting',
  }
}

/**
 * Hook for queue statistics
 */
export function useQueueStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const { getQueueStats } = await import('../services/jobQueue')
      const data = await getQueueStats()
      setStats(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [])

  return {
    stats,
    loading,
    error,
    refresh,
  }
}

export default useJobStatus