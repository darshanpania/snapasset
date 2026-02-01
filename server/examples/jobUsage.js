/**
 * Job Queue Usage Examples
 * Examples of how to use the job queue system
 */

import { imageGenerationQueue, fileCleanupQueue } from '../config/queue.js'
import logger from '../utils/logger.js'

/**
 * Example 1: Create a simple image generation job
 */
export async function example1_createSimpleJob() {
  const job = await imageGenerationQueue.add({
    userId: 'user-123',
    generationId: 'gen-456',
    prompt: 'A beautiful sunset over mountains',
    platforms: ['instagram-post', 'twitter-post'],
    imageType: 'vivid',
  })

  console.log('Job created:', job.id)
  return job
}

/**
 * Example 2: Create a high-priority job
 */
export async function example2_createPriorityJob() {
  const job = await imageGenerationQueue.add(
    {
      userId: 'premium-user-789',
      generationId: 'gen-urgent',
      prompt: 'Urgent marketing asset needed',
      platforms: ['instagram-post'],
    },
    {
      priority: 5, // Higher priority
    }
  )

  console.log('Priority job created:', job.id)
  return job
}

/**
 * Example 3: Monitor job progress
 */
export async function example3_monitorJobProgress(jobId) {
  const job = await imageGenerationQueue.getJob(jobId)

  if (!job) {
    console.log('Job not found')
    return
  }

  console.log('Job status:', await job.getState())
  console.log('Job progress:', job.progress)
  console.log('Attempts:', job.attemptsMade)

  // Wait for job to complete
  try {
    const result = await job.finished()
    console.log('Job completed!', result)
    return result
  } catch (error) {
    console.error('Job failed:', error.message)
    throw error
  }
}

/**
 * Example 4: Retry a failed job
 */
export async function example4_retryFailedJob(jobId) {
  const job = await imageGenerationQueue.getJob(jobId)

  if (!job) {
    throw new Error('Job not found')
  }

  const state = await job.getState()

  if (state !== 'failed') {
    throw new Error('Only failed jobs can be retried')
  }

  await job.retry()
  console.log('Job queued for retry:', job.id)
}

/**
 * Example 5: Cancel a waiting job
 */
export async function example5_cancelJob(jobId) {
  const job = await imageGenerationQueue.getJob(jobId)

  if (!job) {
    throw new Error('Job not found')
  }

  await job.remove()
  console.log('Job cancelled:', job.id)
}

/**
 * Example 6: Get queue statistics
 */
export async function example6_getQueueStats() {
  const counts = await imageGenerationQueue.getJobCounts()

  console.log('Queue Statistics:')
  console.log('  Waiting:', counts.waiting)
  console.log('  Active:', counts.active)
  console.log('  Completed:', counts.completed)
  console.log('  Failed:', counts.failed)

  return counts
}

/**
 * Example 7: Batch job creation
 */
export async function example7_createBatchJobs(userId, prompts) {
  const jobs = []

  for (const prompt of prompts) {
    const job = await imageGenerationQueue.add({
      userId,
      generationId: `gen_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      prompt,
      platforms: ['instagram-post'],
    })

    jobs.push(job)
  }

  console.log(`Created ${jobs.length} jobs`)
  return jobs
}

/**
 * Example 8: Schedule recurring cleanup
 */
export async function example8_scheduleCleanup() {
  const job = await fileCleanupQueue.add(
    {
      type: 'all',
      olderThanDays: 30,
    },
    {
      repeat: {
        cron: '0 2 * * *', // 2 AM daily
      },
      jobId: 'daily-cleanup', // Prevents duplicates
    }
  )

  console.log('Scheduled cleanup job:', job.id)
  return job
}

/**
 * Example 9: Clean old completed jobs
 */
export async function example9_cleanOldJobs() {
  const oneHour = 3600000

  // Clean completed jobs older than 1 hour
  await imageGenerationQueue.clean(oneHour, 'completed')

  // Clean failed jobs older than 24 hours
  await imageGenerationQueue.clean(oneHour * 24, 'failed')

  console.log('Old jobs cleaned')
}

/**
 * Example 10: Error handling
 */
export async function example10_handleJobErrors(jobId) {
  try {
    const job = await imageGenerationQueue.getJob(jobId)

    if (!job) {
      throw new Error('Job not found')
    }

    const state = await job.getState()

    if (state === 'failed') {
      logger.error('Job failed', {
        jobId: job.id,
        failedReason: job.failedReason,
        attempts: job.attemptsMade,
        data: job.data,
      })

      // Optionally notify user
      // await sendFailureNotification(job.data.userId, job.failedReason)
    }
  } catch (error) {
    logger.error('Error handling job', { error: error.message })
  }
}

// Export all examples
export default {
  example1_createSimpleJob,
  example2_createPriorityJob,
  example3_monitorJobProgress,
  example4_retryFailedJob,
  example5_cancelJob,
  example6_getQueueStats,
  example7_createBatchJobs,
  example8_scheduleCleanup,
  example9_cleanOldJobs,
  example10_handleJobErrors,
}