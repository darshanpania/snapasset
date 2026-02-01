/**
 * Job Queue Configuration
 * Uses Bull with Redis or in-memory fallback
 */

import Bull from 'bull'
import { redisClient, isRedisAvailable } from './redis.js'

// Queue configuration
const queueConfig = {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 200,     // Keep last 200 failed jobs
  },
  settings: {
    stalledInterval: 30000, // Check for stalled jobs every 30s
    maxStalledCount: 2,     // Max times a job can be stalled before failing
  },
}

/**
 * In-Memory Queue Implementation (Fallback)
 */
class InMemoryQueue {
  constructor(name) {
    this.name = name
    this.jobs = new Map()
    this.completed = []
    this.failed = []
    this.processing = new Set()
    this.processors = []
    this.jobIdCounter = 1
  }

  async add(data, options = {}) {
    const jobId = `${this.jobIdCounter++}`
    const job = {
      id: jobId,
      data,
      opts: options,
      status: 'waiting',
      progress: 0,
      attemptsMade: 0,
      timestamp: Date.now(),
      processedOn: null,
      finishedOn: null,
      failedReason: null,
    }

    this.jobs.set(jobId, job)

    // Process job asynchronously
    setImmediate(() => this.processNext())

    return {
      id: jobId,
      data: job.data,
      progress: () => job.progress,
      getState: () => job.status,
      finished: () => new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (job.status === 'completed' || job.status === 'failed') {
            clearInterval(checkInterval)
            resolve(job.status === 'completed' ? job.returnvalue : null)
          }
        }, 100)
      }),
    }
  }

  process(concurrency, processor) {
    if (typeof concurrency === 'function') {
      processor = concurrency
      concurrency = 1
    }
    this.processors.push({ concurrency, processor })
  }

  async processNext() {
    if (this.processors.length === 0) return

    const waitingJobs = Array.from(this.jobs.values())
      .filter(j => j.status === 'waiting')
      .sort((a, b) => (b.opts.priority || 0) - (a.opts.priority || 0))

    for (const job of waitingJobs) {
      if (this.processing.size < this.processors[0].concurrency) {
        this.processJob(job)
      }
    }
  }

  async processJob(job) {
    this.processing.add(job.id)
    job.status = 'active'
    job.processedOn = Date.now()

    try {
      const processor = this.processors[0].processor
      const jobWrapper = {
        id: job.id,
        data: job.data,
        progress: (percent) => {
          job.progress = percent
        },
      }

      const result = await processor(jobWrapper)
      job.status = 'completed'
      job.finishedOn = Date.now()
      job.returnvalue = result
      this.completed.push({ id: job.id, timestamp: Date.now() })
    } catch (error) {
      job.attemptsMade++
      const maxAttempts = job.opts.attempts || 3

      if (job.attemptsMade < maxAttempts) {
        // Retry
        job.status = 'waiting'
        const delay = job.opts.backoff?.delay || 1000
        const backoffDelay = delay * Math.pow(2, job.attemptsMade - 1)
        setTimeout(() => this.processJob(job), backoffDelay)
      } else {
        job.status = 'failed'
        job.finishedOn = Date.now()
        job.failedReason = error.message
        this.failed.push({ id: job.id, timestamp: Date.now(), error: error.message })
      }
    } finally {
      this.processing.delete(job.id)
      this.processNext()
    }
  }

  async getJob(jobId) {
    const job = this.jobs.get(jobId)
    if (!job) return null

    return {
      id: job.id,
      data: job.data,
      progress: job.progress,
      getState: () => job.status,
      opts: job.opts,
      attemptsMade: job.attemptsMade,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
    }
  }

  async getJobs(types) {
    const jobs = []
    for (const [id, job] of this.jobs.entries()) {
      if (types.includes(job.status)) {
        jobs.push({
          id,
          data: job.data,
          opts: job.opts,
          progress: job.progress,
          state: job.status,
        })
      }
    }
    return jobs
  }

  async getJobCounts() {
    const counts = {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
    }

    for (const job of this.jobs.values()) {
      counts[job.status] = (counts[job.status] || 0) + 1
    }

    return counts
  }

  async clean(grace, status) {
    const now = Date.now()
    const cutoff = now - grace

    for (const [id, job] of this.jobs.entries()) {
      if (job.status === status && job.finishedOn && job.finishedOn < cutoff) {
        this.jobs.delete(id)
      }
    }
  }

  async close() {
    this.jobs.clear()
    this.completed = []
    this.failed = []
    this.processing.clear()
    this.processors = []
  }
}

/**
 * Create a queue
 */
export function createQueue(name, options = {}) {
  if (isRedisAvailable && redisClient) {
    // Use Bull with Redis
    return new Bull(name, {
      redis: redisClient,
      ...queueConfig,
      ...options,
    })
  } else {
    // Use in-memory fallback
    console.log(`📦 Creating in-memory queue: ${name}`)
    return new InMemoryQueue(name)
  }
}

// Queue instances
export let imageGenerationQueue
export let fileCleanupQueue

/**
 * Initialize all queues
 */
export function initQueues() {
  // Image generation queue
  imageGenerationQueue = createQueue('image-generation', {
    defaultJobOptions: {
      ...queueConfig.defaultJobOptions,
      timeout: 300000, // 5 minutes
      priority: 2,
    },
  })

  // File cleanup queue
  fileCleanupQueue = createQueue('file-cleanup', {
    defaultJobOptions: {
      ...queueConfig.defaultJobOptions,
      timeout: 60000, // 1 minute
      priority: 1,
    },
  })

  console.log('✅ Job queues initialized')
  return { imageGenerationQueue, fileCleanupQueue }
}

export default { createQueue, initQueues }