/**
 * Server-Sent Events (SSE) Routes
 * Real-time job status updates
 */

import express from 'express'
import { imageGenerationQueue, fileCleanupQueue } from '../config/queue.js'
import logger from '../utils/logger.js'

const router = express.Router()

// Store active SSE connections
const sseConnections = new Map()

/**
 * SSE endpoint for job status updates
 * GET /api/sse/jobs/:jobId
 */
router.get('/jobs/:jobId', async (req, res) => {
  const { jobId } = req.params

  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable buffering in nginx
  })

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', jobId })}\n\n`)

  // Store connection
  sseConnections.set(jobId, res)

  logger.info('SSE connection established', { jobId })

  // Function to send updates
  const sendUpdate = async () => {
    try {
      // Try to find job
      let job = await imageGenerationQueue.getJob(jobId)
      if (!job) {
        job = await fileCleanupQueue.getJob(jobId)
      }

      if (!job) {
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'Job not found' })}\n\n`)
        return
      }

      const state = await job.getState()
      const progress = typeof job.progress === 'function' ? await job.progress() : job.progress

      const update = {
        type: 'update',
        jobId: job.id,
        status: state,
        progress: progress || 0,
        data: job.data,
        timestamp: new Date().toISOString(),
      }

      // Send update
      res.write(`data: ${JSON.stringify(update)}\n\n`)

      // If job is completed or failed, close connection
      if (state === 'completed' || state === 'failed') {
        const result = state === 'completed' ? await job.finished() : null
        res.write(`data: ${JSON.stringify({
          type: 'final',
          jobId: job.id,
          status: state,
          result,
          failedReason: job.failedReason,
        })}\n\n`)

        // Close connection after sending final update
        setTimeout(() => {
          res.end()
          sseConnections.delete(jobId)
          logger.info('SSE connection closed', { jobId, status: state })
        }, 1000)
      }
    } catch (error) {
      logger.error('Error sending SSE update', { jobId, error: error.message })
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`)
    }
  }

  // Send updates every 2 seconds
  const interval = setInterval(sendUpdate, 2000)

  // Send first update immediately
  sendUpdate()

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(interval)
    sseConnections.delete(jobId)
    logger.info('SSE connection closed by client', { jobId })
  })
})

/**
 * SSE endpoint for queue statistics
 * GET /api/sse/stats
 */
router.get('/stats', async (req, res) => {
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  })

  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)

  logger.info('SSE stats connection established')

  // Function to send stats updates
  const sendStats = async () => {
    try {
      const imageGenCounts = await imageGenerationQueue.getJobCounts()
      const cleanupCounts = await fileCleanupQueue.getJobCounts()

      const stats = {
        type: 'stats',
        imageGeneration: imageGenCounts,
        fileCleanup: cleanupCounts,
        timestamp: new Date().toISOString(),
      }

      res.write(`data: ${JSON.stringify(stats)}\n\n`)
    } catch (error) {
      logger.error('Error sending stats update', { error: error.message })
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`)
    }
  }

  // Send updates every 5 seconds
  const interval = setInterval(sendStats, 5000)

  // Send first update immediately
  sendStats()

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(interval)
    logger.info('SSE stats connection closed by client')
  })
})

export default router