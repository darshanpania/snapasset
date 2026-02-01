/**
 * Job Helper Utilities
 * Utility functions for job management
 */

import logger from './logger.js'

/**
 * Generate unique generation ID
 */
export function generateGenerationId() {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return `gen_${timestamp}_${random}`
}

/**
 * Calculate estimated completion time
 */
export function estimateJobTime(platforms) {
  const baseTime = 120 // 2 minutes for DALL-E
  const platformTime = (platforms?.length || 1) * 10 // 10s per platform
  return baseTime + platformTime // in seconds
}

/**
 * Format job duration
 */
export function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

/**
 * Get job age in seconds
 */
export function getJobAge(job) {
  if (!job.timestamp) return 0
  return Math.floor((Date.now() - job.timestamp) / 1000)
}

/**
 * Check if job is stale
 */
export function isJobStale(job, maxAgeSeconds = 600) {
  return getJobAge(job) > maxAgeSeconds
}

/**
 * Calculate retry delay with exponential backoff
 */
export function calculateRetryDelay(attemptNumber, baseDelay = 2000) {
  return baseDelay * Math.pow(2, attemptNumber - 1)
}

/**
 * Validate job data
 */
export function validateGenerationJobData(data) {
  const errors = []

  if (!data.userId) {
    errors.push('userId is required')
  }

  if (!data.generationId) {
    errors.push('generationId is required')
  }

  if (!data.prompt || typeof data.prompt !== 'string') {
    errors.push('prompt is required and must be a string')
  }

  if (data.prompt && data.prompt.length > 1000) {
    errors.push('prompt must be less than 1000 characters')
  }

  if (data.platforms && !Array.isArray(data.platforms)) {
    errors.push('platforms must be an array')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Sanitize job data for logging
 */
export function sanitizeJobData(data) {
  const sanitized = { ...data }

  // Remove sensitive information
  delete sanitized.apiKey
  delete sanitized.token
  delete sanitized.secret

  // Truncate long strings
  if (sanitized.prompt && sanitized.prompt.length > 100) {
    sanitized.prompt = sanitized.prompt.substring(0, 100) + '...'
  }

  return sanitized
}

/**
 * Get job statistics
 */
export function calculateJobStats(jobs) {
  const stats = {
    total: jobs.length,
    byStatus: {},
    avgDuration: 0,
    successRate: 0,
  }

  let totalDuration = 0
  let completedCount = 0

  jobs.forEach((job) => {
    // Count by status
    const status = job.status || job.state
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1

    // Calculate duration for completed/failed jobs
    if (job.finishedOn && job.processedOn) {
      totalDuration += job.finishedOn - job.processedOn
    }

    // Count completed
    if (status === 'completed') {
      completedCount++
    }
  })

  // Calculate averages
  if (completedCount > 0) {
    stats.avgDuration = totalDuration / completedCount
    stats.successRate = (completedCount / stats.total) * 100
  }

  return stats
}

export default {
  generateGenerationId,
  estimateJobTime,
  formatDuration,
  getJobAge,
  isJobStale,
  calculateRetryDelay,
  validateGenerationJobData,
  sanitizeJobData,
  calculateJobStats,
}