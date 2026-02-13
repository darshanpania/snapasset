import express from 'express';
import { imageGenerationQueue } from '../config/queue.js';
import { authMiddleware } from '../middleware/auth.js';
import { isAdmin } from '../middleware/admin.js';

const router = express.Router();

// Apply authentication to all queue routes
router.use(authMiddleware);

/**
 * @swagger
 * /api/queue/stats:
 *   get:
 *     summary: Get queue statistics
 *     tags: [Queue]
 *     responses:
 *       200:
 *         description: Queue statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 waiting:
 *                   type: integer
 *                 active:
 *                   type: integer
 *                 completed:
 *                   type: integer
 *                 failed:
 *                   type: integer
 *                 delayed:
 *                   type: integer
 */
router.get('/stats', async (req, res) => {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      imageGenerationQueue.getWaitingCount(),
      imageGenerationQueue.getActiveCount(),
      imageGenerationQueue.getCompletedCount(),
      imageGenerationQueue.getFailedCount(),
      imageGenerationQueue.getDelayedCount(),
    ]);

    res.json({
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting queue stats:', error);
    res.status(500).json({ error: 'Failed to get queue statistics' });
  }
});

/**
 * @swagger
 * /api/queue/pause:
 *   post:
 *     summary: Pause the queue
 *     tags: [Queue]
 *     responses:
 *       200:
 *         description: Queue paused
 */
router.post('/pause', isAdmin, async (req, res) => {
  try {
    await imageGenerationQueue.pause();
    res.json({
      message: 'Queue paused successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error pausing queue:', error);
    res.status(500).json({ error: 'Failed to pause queue' });
  }
});

/**
 * @swagger
 * /api/queue/resume:
 *   post:
 *     summary: Resume the queue
 *     tags: [Queue]
 *     responses:
 *       200:
 *         description: Queue resumed
 */
router.post('/resume', isAdmin, async (req, res) => {
  try {
    await imageGenerationQueue.resume();
    res.json({
      message: 'Queue resumed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error resuming queue:', error);
    res.status(500).json({ error: 'Failed to resume queue' });
  }
});

/**
 * @swagger
 * /api/queue/clean:
 *   post:
 *     summary: Clean old jobs from queue
 *     tags: [Queue]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               grace:
 *                 type: integer
 *                 description: Grace period in milliseconds
 *                 default: 86400000
 *               status:
 *                 type: string
 *                 enum: [completed, failed]
 *                 default: completed
 *     responses:
 *       200:
 *         description: Queue cleaned
 */
router.post('/clean', isAdmin, async (req, res) => {
  try {
    const { grace = 86400000, status = 'completed' } = req.body; // 24 hours default

    const cleaned = await imageGenerationQueue.clean(grace, status);

    res.json({
      message: `Cleaned ${cleaned.length} ${status} jobs`,
      cleaned: cleaned.length,
      status,
      grace,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error cleaning queue:', error);
    res.status(500).json({ error: 'Failed to clean queue' });
  }
});

export default router;