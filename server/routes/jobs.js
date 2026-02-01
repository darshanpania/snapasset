/**
 * Job Management API Routes
 * Endpoints for creating, monitoring, and managing background jobs
 */

import express from 'express'
import { imageGenerationQueue, fileCleanupQueue } from '../config/queue.js'
import logger from '../utils/logger.js'

const router = express.Router()

/**
 * Create a new image generation job
 * POST /api/jobs/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const { userId, prompt, platforms, imageType } = req.body

    // Validation
    if (!userId || !prompt) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['userId', 'prompt'],
      })
    }

    // Generate unique generation ID
    const generationId = `gen_${Date.now()}_${Math.random().toString(36).substring(7)}`

    // Add job to queue
    const job = await imageGenerationQueue.add(
      {
        userId,
        generationId,
        prompt,
        platforms,
        imageType,
      },
      {
        priority: 2,
        removeOnComplete: 100,
        attempts: 3,
      }
    )

    logger.info('Image generation job created', {
      jobId: job.id,
      userId,
      generationId,
    })

    res.status(202).json({
      jobId: job.id,
      generationId,
      status: 'queued',
      message: 'Job created successfully',
      estimatedTime: '2-5 minutes',
    })
  } catch (error) {
    logger.error('Failed to create generation job', { error: error.message })
    res.status(500).json({
      error: 'Failed to create job',
      message: error.message,
    })
  }
})

/**
 * Get job status
 * GET /api/jobs/:jobId
 */
router.get('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params

    // Try to find job in image generation queue
    let job = await imageGenerationQueue.getJob(jobId)
    let queueType = 'image-generation'

    // If not found, try cleanup queue
    if (!job) {
      job = await fileCleanupQueue.getJob(jobId)
      queueType = 'file-cleanup'
    }

    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        jobId,
      })
    }

    const state = await job.getState()
    const progress = typeof job.progress === 'function' ? await job.progress() : job.progress

    res.json({
      jobId: job.id,
      queue: queueType,
      status: state,
      progress: progress || 0,
      data: job.data,
      attemptsMade: job.attemptsMade,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
    })
  } catch (error) {
    logger.error('Failed to get job status', { error: error.message })
    res.status(500).json({
      error: 'Failed to get job status',
      message: error.message,
    })
  }
})

/**
 * Get job result
 * GET /api/jobs/:jobId/result
 */
router.get('/:jobId/result', async (req, res) => {
  try {
    const { jobId } = req.params

    const job = await imageGenerationQueue.getJob(jobId)

    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        jobId,
      })
    }

    const state = await job.getState()

    if (state !== 'completed') {
      return res.status(400).json({
        error: 'Job not completed',
        status: state,
        message: 'Job is still processing or has failed',
      })
    }

    // Wait for job to finish and get result
    const result = await job.finished()

    res.json({
      jobId: job.id,
      status: 'completed',
      result,
    })
  } catch (error) {
    logger.error('Failed to get job result', { error: error.message })
    res.status(500).json({
      error: 'Failed to get job result',
      message: error.message,
    })
  }
})

/**
 * Retry a failed job
 * POST /api/jobs/:jobId/retry
 */
router.post('/:jobId/retry', async (req, res) => {
  try {
    const { jobId } = req.params

    const job = await imageGenerationQueue.getJob(jobId)

    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        jobId,
      })
    }

    const state = await job.getState()

    if (state !== 'failed') {
      return res.status(400).json({
        error: 'Job is not in failed state',
        status: state,
        message: 'Only failed jobs can be retried',
      })
    }

    // Retry the job
    await job.retry()

    logger.info('Job retried', { jobId: job.id })

    res.json({
      jobId: job.id,
      status: 'retrying',
      message: 'Job has been queued for retry',
    })
  } catch (error) {
    logger.error('Failed to retry job', { error: error.message })
    res.status(500).json({
      error: 'Failed to retry job',
      message: error.message,
    })
  }
})

/**
 * Cancel a job
 * DELETE /api/jobs/:jobId
 */
router.delete('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params

    const job = await imageGenerationQueue.getJob(jobId)

    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        jobId,
      })
    }

    const state = await job.getState()

    if (state === 'completed') {
      return res.status(400).json({
        error: 'Cannot cancel completed job',
        status: state,
      })
    }

    // Remove the job
    await job.remove()

    logger.info('Job cancelled', { jobId: job.id })

    res.json({
      jobId: job.id,
      status: 'cancelled',
      message: 'Job has been cancelled',
    })
  } catch (error) {
    logger.error('Failed to cancel job', { error: error.message })
    res.status(500).json({
      error: 'Failed to cancel job',
      message: error.message,
    })
  }
})

/**
 * Get queue statistics
 * GET /api/jobs/stats/overview
 */
router.get('/stats/overview', async (req, res) => {
  try {
    const imageGenCounts = await imageGenerationQueue.getJobCounts()
    const cleanupCounts = await fileCleanupQueue.getJobCounts()

    res.json({
      imageGeneration: imageGenCounts,
      fileCleanup: cleanupCounts,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('Failed to get queue stats', { error: error.message })
    res.status(500).json({
      error: 'Failed to get statistics',
      message: error.message,
    })
  }
})

/**
 * Get jobs by status
 * GET /api/jobs?status=waiting,active
 */
router.get('/', async (req, res) => {
  try {
    const { status = 'waiting,active', limit = 10 } = req.query
    const statuses = status.split(',')

    const jobs = await imageGenerationQueue.getJobs(statuses, 0, parseInt(limit))

    const jobsWithStatus = await Promise.all(
      jobs.map(async (job) => ({
        jobId: job.id,
        status: await job.getState(),
        data: job.data,
        progress: typeof job.progress === 'function' ? await job.progress() : job.progress,
        timestamp: job.timestamp,
      }))
    )

    res.json({
      jobs: jobsWithStatus,
      total: jobs.length,
      statuses,
    })
  } catch (error) {
    logger.error('Failed to list jobs', { error: error.message })
    res.status(500).json({
      error: 'Failed to list jobs',
      message: error.message,
    })
  }
})

/**
 * Trigger manual cleanup
 * POST /api/jobs/cleanup
 */
router.post('/cleanup', async (req, res) => {
  try {
    const { type = 'all', olderThanDays = 30 } = req.body

    const job = await fileCleanupQueue.add(
      { type, olderThanDays },
      {
        priority: 3,
      }
    )

    logger.info('Cleanup job created', {
      jobId: job.id,
      type,
      olderThanDays,
    })

    res.status(202).json({
      jobId: job.id,
      type,
      status: 'queued',
      message: 'Cleanup job created',
    })
  } catch (error) {
    logger.error('Failed to create cleanup job', { error: error.message })
    res.status(500).json({
      error: 'Failed to create cleanup job',
      message: error.message,
    })
  }
})

export default router