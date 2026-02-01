/**
 * Job Queue Client Service
 * Frontend service for interacting with background job API
 */

import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/**
 * Create a new image generation job
 */
export async function createGenerationJob(userId, prompt, platforms, imageType = 'vivid') {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/jobs/generate`, {
      userId,
      prompt,
      platforms,
      imageType,
    })

    return response.data
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to create generation job'
    )
  }
}

/**
 * Get job status
 */
export async function getJobStatus(jobId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/jobs/${jobId}`)
    return response.data
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to get job status'
    )
  }
}

/**
 * Get job result
 */
export async function getJobResult(jobId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/jobs/${jobId}/result`)
    return response.data
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to get job result'
    )
  }
}

/**
 * Retry a failed job
 */
export async function retryJob(jobId) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/jobs/${jobId}/retry`)
    return response.data
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to retry job'
    )
  }
}

/**
 * Cancel a job
 */
export async function cancelJob(jobId) {
  try {
    const response = await axios.delete(`${API_BASE_URL}/api/jobs/${jobId}`)
    return response.data
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to cancel job'
    )
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/jobs/stats/overview`)
    return response.data
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to get queue stats'
    )
  }
}

/**
 * Subscribe to job status updates via SSE
 */
export function subscribeToJobUpdates(jobId, callbacks = {}) {
  const eventSource = new EventSource(`${API_BASE_URL}/api/sse/jobs/${jobId}`)

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data)

    // Handle different event types
    switch (data.type) {
      case 'connected':
        callbacks.onConnected?.(data)
        break
      case 'update':
        callbacks.onUpdate?.(data)
        break
      case 'final':
        callbacks.onComplete?.(data)
        eventSource.close()
        break
      case 'error':
        callbacks.onError?.(data)
        break
      default:
        callbacks.onMessage?.(data)
    }
  }

  eventSource.onerror = (error) => {
    callbacks.onError?.(error)
    eventSource.close()
  }

  // Return function to close connection
  return () => eventSource.close()
}

/**
 * Subscribe to queue statistics via SSE
 */
export function subscribeToQueueStats(callback) {
  const eventSource = new EventSource(`${API_BASE_URL}/api/sse/stats`)

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.type === 'stats') {
      callback(data)
    }
  }

  eventSource.onerror = (error) => {
    console.error('Queue stats SSE error:', error)
    eventSource.close()
  }

  return () => eventSource.close()
}

/**
 * Poll job status until completion
 */
export async function waitForJob(jobId, onProgress, pollInterval = 2000) {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const status = await getJobStatus(jobId)

        // Update progress callback
        onProgress?.(status)

        // Check if job is done
        if (status.status === 'completed') {
          const result = await getJobResult(jobId)
          resolve(result)
        } else if (status.status === 'failed') {
          reject(new Error(status.failedReason || 'Job failed'))
        } else {
          // Continue polling
          setTimeout(poll, pollInterval)
        }
      } catch (error) {
        reject(error)
      }
    }

    poll()
  })
}

export default {
  createGenerationJob,
  getJobStatus,
  getJobResult,
  retryJob,
  cancelJob,
  getQueueStats,
  subscribeToJobUpdates,
  subscribeToQueueStats,
  waitForJob,
}