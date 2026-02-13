import express from 'express';
import { imageGenerationQueue } from '../config/queue.js';

const router = express.Router();

// Store active SSE connections (jobId -> Set of response objects)
const sseConnections = new Map();

/**
 * @swagger
 * /api/sse/jobs/{jobId}:
 *   get:
 *     summary: Subscribe to real-time job updates via Server-Sent Events
 *     tags: [Real-time]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID to monitor
 *     responses:
 *       200:
 *         description: SSE stream established
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *       404:
 *         description: Job not found
 */
router.get('/jobs/:jobId', async (req, res) => {
  const { jobId } = req.params;

  try {
    const job = await imageGenerationQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', jobId })}\n\n`);

    // Store connection
    if (!sseConnections.has(jobId)) {
      sseConnections.set(jobId, new Set());
    }
    sseConnections.get(jobId).add(res);

    // Send current job status immediately
    const state = await job.getState();
    const progress = job._progress || 0;

    res.write(
      `data: ${JSON.stringify({
        type: 'status',
        jobId,
        status: state,
        progress,
        timestamp: new Date().toISOString(),
      })}\n\n`
    );

    // Monitor job progress
    const intervalId = setInterval(async () => {
      try {
        const currentState = await job.getState();
        const currentProgress = job._progress || 0;

        // Send update
        res.write(
          `data: ${JSON.stringify({
            type: 'progress',
            jobId,
            status: currentState,
            progress: currentProgress,
            timestamp: new Date().toISOString(),
          })}\n\n`
        );

        // If job is completed or failed, send final message and close
        if (currentState === 'completed' || currentState === 'failed') {
          const result = currentState === 'completed' ? job.returnvalue : null;
          const error = currentState === 'failed' ? job.failedReason : null;

          res.write(
            `data: ${JSON.stringify({
              type: 'done',
              jobId,
              status: currentState,
              progress: 100,
              result,
              error,
              timestamp: new Date().toISOString(),
            })}\n\n`
          );

          clearInterval(intervalId);
          const conns = sseConnections.get(jobId);
          if (conns) {
            conns.delete(res);
            if (conns.size === 0) sseConnections.delete(jobId);
          }
          res.end();
        }
      } catch (error) {
        console.error('Error in SSE interval:', error);
        clearInterval(intervalId);
        const conns = sseConnections.get(jobId);
        if (conns) {
          conns.delete(res);
          if (conns.size === 0) sseConnections.delete(jobId);
        }
        res.end();
      }
    }, 1000); // Check every second

    // Handle client disconnect
    req.on('close', () => {
      clearInterval(intervalId);
      const conns = sseConnections.get(jobId);
      if (conns) {
        conns.delete(res);
        if (conns.size === 0) sseConnections.delete(jobId);
      }
      console.log(`SSE connection closed for job ${jobId}`);
    });
  } catch (error) {
    console.error('SSE error:', error);
    res.status(500).json({ error: 'Failed to establish SSE connection' });
  }
});

/**
 * @swagger
 * /api/sse/health:
 *   get:
 *     summary: Check SSE service health
 *     tags: [Real-time]
 *     responses:
 *       200:
 *         description: SSE service is healthy
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    activeConnections: sseConnections.size,
    timestamp: new Date().toISOString(),
  });
});

export default router;