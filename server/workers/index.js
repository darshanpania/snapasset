/**
 * Worker Process Entry Point
 * Starts background job processors
 */

import dotenv from 'dotenv'
import { initRedis } from '../config/redis.js'
import { initQueues, imageGenerationQueue, fileCleanupQueue } from '../config/queue.js'
import { processImageGeneration } from './imageProcessor.js'
import { processCleanup } from './cleanupProcessor.js'
import logger from '../utils/logger.js'

// Load environment variables
dotenv.config()

// Graceful shutdown handler
let isShuttingDown = false

async function shutdown() {
  if (isShuttingDown) return
  isShuttingDown = true

  console.log('\n🛑 Shutting down workers gracefully...')

  try {
    // Close queues
    if (imageGenerationQueue) {
      await imageGenerationQueue.close()
      console.log('✅ Image generation queue closed')
    }
    if (fileCleanupQueue) {
      await fileCleanupQueue.close()
      console.log('✅ File cleanup queue closed')
    }

    // Close Redis connection
    const { closeRedis } = await import('../config/redis.js')
    await closeRedis()

    console.log('👋 Workers stopped successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error during shutdown:', error)
    process.exit(1)
  }
}

// Handle shutdown signals
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack })
  shutdown()
})
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise })
})

/**
 * Start worker processes
 */
async function startWorkers() {
  try {
    console.log('🚀 Starting SnapAsset Workers...')
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)

    // Initialize Redis
    await initRedis()

    // Initialize queues
    const queues = initQueues()

    // Configure image generation processor
    console.log('⚙️  Configuring image generation processor...')
    queues.imageGenerationQueue.process(2, async (job) => {
      return await processImageGeneration(job)
    })

    // Configure cleanup processor
    console.log('⚙️  Configuring cleanup processor...')
    queues.fileCleanupQueue.process(1, async (job) => {
      return await processCleanup(job)
    })

    // Event handlers for image generation queue
    queues.imageGenerationQueue.on('completed', (job, result) => {
      logger.info('Job completed', {
        jobId: job.id,
        queue: 'image-generation',
        result,
      })
    })

    queues.imageGenerationQueue.on('failed', (job, err) => {
      logger.error('Job failed', {
        jobId: job.id,
        queue: 'image-generation',
        error: err.message,
        attempts: job.attemptsMade,
      })
    })

    queues.imageGenerationQueue.on('stalled', (job) => {
      logger.warn('Job stalled', {
        jobId: job.id,
        queue: 'image-generation',
      })
    })

    // Event handlers for cleanup queue
    queues.fileCleanupQueue.on('completed', (job, result) => {
      logger.info('Cleanup job completed', {
        jobId: job.id,
        result,
      })
    })

    queues.fileCleanupQueue.on('failed', (job, err) => {
      logger.error('Cleanup job failed', {
        jobId: job.id,
        error: err.message,
      })
    })

    // Schedule recurring cleanup job (daily)
    const cleanupCron = '0 2 * * *' // 2 AM daily
    console.log(`⏰ Scheduling daily cleanup job (${cleanupCron})`)
    queues.fileCleanupQueue.add(
      { type: 'all', olderThanDays: 30 },
      {
        repeat: { cron: cleanupCron },
        jobId: 'daily-cleanup',
      }
    )

    console.log('✅ Workers started successfully')
    console.log('📊 Processing jobs...')
    console.log('   - Image Generation: 2 concurrent jobs')
    console.log('   - File Cleanup: 1 concurrent job')
    console.log('\n💡 Press Ctrl+C to stop\n')
  } catch (error) {
    console.error('❌ Failed to start workers:', error)
    process.exit(1)
  }
}

// Start workers
startWorkers().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})