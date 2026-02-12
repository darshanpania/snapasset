import express from 'express';
import { imageGenerationQueue } from '../config/queue.js';

const router = express.Router();

/**
 * @swagger
 * /api/jobs:
 *   post:
 *     summary: Create a new image generation job
 *     tags: [Jobs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - prompt
 *               - platforms
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               prompt:
 *                 type: string
 *                 example: "A beautiful sunset over mountains"
 *               platforms:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [instagram-post, instagram-story, twitter-post, facebook-post]
 *                 example: ["instagram-post", "twitter-post"]
 *               options:
 *                 type: object
 *                 properties:
 *                   quality:
 *                     type: string
 *                     enum: [standard, hd]
 *                   style:
 *                     type: string
 *                     enum: [vivid, natural]
 *     responses:
 *       201:
 *         description: Job created successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
  try {
    const { userId, prompt, platforms, options } = req.body;

    // Validation
    if (!userId || !prompt || !platforms || platforms.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['userId', 'prompt', 'platforms'],
      });
    }

    // Add job to queue
    const job = await imageGenerationQueue.add(
      {
        userId,
        prompt,
        platforms,
        options: options || {},
      },
      {
        jobId: `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        priority: options?.priority || 3,
      }
    );

    res.status(201).json({
      jobId: job.id,
      status: 'queued',
      message: 'Job created successfully',
      estimatedTime: `${platforms.length * 15} seconds`,
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

/**
 * @swagger
 * /api/jobs/{jobId}:
 *   get:
 *     summary: Get job status and details
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job details
 *       404:
 *         description: Job not found
 */
router.get('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await imageGenerationQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const state = await job.getState();
    const progress = job._progress;
    const logs = await job.log();

    let result = null;
    if (state === 'completed') {
      result = job.returnvalue;
    }

    let failedReason = null;
    if (state === 'failed') {
      failedReason = job.failedReason;
    }

    res.json({
      jobId: job.id,
      status: state,
      progress: progress || 0,
      data: job.data,
      result,
      failedReason,
      attempts: job.attemptsMade,
      maxAttempts: job.opts.attempts,
      createdAt: new Date(job.timestamp),
      processedAt: job.processedOn ? new Date(job.processedOn) : null,
      finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
      logs: logs || [],
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job status' });
  }
});

/**
 * @swagger
 * /api/jobs/{jobId}/retry:
 *   post:
 *     summary: Retry a failed job
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job retried
 *       404:
 *         description: Job not found
 */
router.post('/:jobId/retry', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await imageGenerationQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    await job.retry();

    res.json({
      jobId: job.id,
      status: 'retrying',
      message: 'Job has been queued for retry',
    });
  } catch (error) {
    console.error('Error retrying job:', error);
    res.status(500).json({ error: 'Failed to retry job' });
  }
});

/**
 * @swagger
 * /api/jobs/{jobId}/cancel:
 *   delete:
 *     summary: Cancel a job
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job cancelled
 *       404:
 *         description: Job not found
 */
router.delete('/:jobId/cancel', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await imageGenerationQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    await job.remove();

    res.json({
      jobId: job.id,
      status: 'cancelled',
      message: 'Job cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling job:', error);
    res.status(500).json({ error: 'Failed to cancel job' });
  }
});

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: List all jobs (with pagination)
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [waiting, active, completed, failed]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of jobs
 */
router.get('/', async (req, res) => {
  try {
    const { status = 'active', limit = 20 } = req.query;

    let jobs = [];

    switch (status) {
      case 'waiting':
        jobs = await imageGenerationQueue.getWaiting(0, limit - 1);
        break;
      case 'active':
        jobs = await imageGenerationQueue.getActive(0, limit - 1);
        break;
      case 'completed':
        jobs = await imageGenerationQueue.getCompleted(0, limit - 1);
        break;
      case 'failed':
        jobs = await imageGenerationQueue.getFailed(0, limit - 1);
        break;
      default:
        jobs = await imageGenerationQueue.getJobs([status], 0, limit - 1);
    }

    const jobDetails = await Promise.all(
      jobs.map(async (job) => ({
        jobId: job.id,
        status: await job.getState(),
        progress: job._progress || 0,
        data: job.data,
        createdAt: new Date(job.timestamp),
      }))
    );

    res.json({
      jobs: jobDetails,
      count: jobDetails.length,
      status,
    });
  } catch (error) {
    console.error('Error listing jobs:', error);
    res.status(500).json({ error: 'Failed to list jobs' });
  }
});

export default router;