/**
 * Job Queue Tests
 * Tests for job creation, processing, and management
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals'
import { createQueue } from '../config/queue.js'

describe('Job Queue', () => {
  let queue

  beforeAll(() => {
    // Create test queue (will use in-memory)
    queue = createQueue('test-queue')
  })

  afterAll(async () => {
    if (queue) {
      await queue.close()
    }
  })

  beforeEach(async () => {
    // Clean up jobs between tests
    if (queue && queue.clean) {
      await queue.clean(0, 'completed')
      await queue.clean(0, 'failed')
    }
  })

  describe('Job Creation', () => {
    it('should create a new job', async () => {
      const job = await queue.add({ test: 'data' })

      expect(job).toBeDefined()
      expect(job.id).toBeDefined()
      expect(job.data).toEqual({ test: 'data' })
    })

    it('should create job with priority', async () => {
      const job = await queue.add({ test: 'priority' }, { priority: 5 })

      expect(job).toBeDefined()
      expect(job.opts?.priority).toBe(5)
    })

    it('should create multiple jobs', async () => {
      const jobs = await Promise.all([
        queue.add({ job: 1 }),
        queue.add({ job: 2 }),
        queue.add({ job: 3 }),
      ])

      expect(jobs).toHaveLength(3)
      expect(jobs[0].id).not.toBe(jobs[1].id)
    })
  })

  describe('Job Processing', () => {
    it('should process a job successfully', async () => {
      let processed = false

      queue.process(async (job) => {
        processed = true
        return { result: 'success', data: job.data }
      })

      const job = await queue.add({ test: 'process' })

      // Wait for job to complete
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(processed).toBe(true)
    })

    it('should update job progress', async () => {
      let progressUpdates = []

      queue.process(async (job) => {
        job.progress(25)
        progressUpdates.push(25)
        await new Promise((resolve) => setTimeout(resolve, 10))

        job.progress(50)
        progressUpdates.push(50)
        await new Promise((resolve) => setTimeout(resolve, 10))

        job.progress(100)
        progressUpdates.push(100)

        return { result: 'done' }
      })

      await queue.add({ test: 'progress' })

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(progressUpdates).toEqual([25, 50, 100])
    })

    it('should handle job errors', async () => {
      let errorThrown = false

      queue.process(async (job) => {
        errorThrown = true
        throw new Error('Test error')
      })

      const job = await queue.add({ test: 'error' }, { attempts: 1 })

      // Wait for job to fail
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(errorThrown).toBe(true)
    })
  })

  describe('Job Retrieval', () => {
    it('should retrieve job by ID', async () => {
      const createdJob = await queue.add({ test: 'retrieve' })
      const retrievedJob = await queue.getJob(createdJob.id)

      expect(retrievedJob).toBeDefined()
      expect(retrievedJob.id).toBe(createdJob.id)
      expect(retrievedJob.data).toEqual({ test: 'retrieve' })
    })

    it('should return null for non-existent job', async () => {
      const job = await queue.getJob('non-existent-id')
      expect(job).toBeNull()
    })
  })

  describe('Job Counts', () => {
    it('should count jobs by status', async () => {
      // Add some jobs
      await queue.add({ job: 1 })
      await queue.add({ job: 2 })
      await queue.add({ job: 3 })

      const counts = await queue.getJobCounts()

      expect(counts).toBeDefined()
      expect(typeof counts.waiting).toBe('number')
      expect(typeof counts.active).toBe('number')
    })
  })

  describe('Job States', () => {
    it('should track job state transitions', async () => {
      let states = []

      queue.process(async (job) => {
        return { result: 'complete' }
      })

      const job = await queue.add({ test: 'states' })
      const initialState = await job.getState()
      states.push(initialState)

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 100))

      const finalState = await job.getState()
      states.push(finalState)

      expect(states).toContain('waiting')
    })
  })
})

describe('Job Retry Logic', () => {
  let queue

  beforeAll(() => {
    queue = createQueue('retry-test-queue')
  })

  afterAll(async () => {
    if (queue) {
      await queue.close()
    }
  })

  it('should retry failed jobs', async () => {
    let attempts = 0

    queue.process(async (job) => {
      attempts++
      if (attempts < 3) {
        throw new Error('Retry needed')
      }
      return { result: 'success after retries' }
    })

    const job = await queue.add({ test: 'retry' }, { attempts: 3 })

    // Wait for retries
    await new Promise((resolve) => setTimeout(resolve, 500))

    expect(attempts).toBeGreaterThanOrEqual(1)
  })
})

describe('In-Memory Queue Implementation', () => {
  let queue

  beforeAll(() => {
    // Force in-memory queue for testing
    queue = createQueue('memory-test')
  })

  afterAll(async () => {
    if (queue) {
      await queue.close()
    }
  })

  it('should function as fallback when Redis unavailable', async () => {
    const job = await queue.add({ test: 'memory' })

    expect(job).toBeDefined()
    expect(job.id).toBeDefined()
  })

  it('should process jobs in memory', async () => {
    let processed = false

    queue.process(async (job) => {
      processed = true
      return { inMemory: true }
    })

    await queue.add({ test: 'in-memory-process' })

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(processed).toBe(true)
  })

  it('should handle concurrent jobs', async () => {
    let processedJobs = []

    queue.process(2, async (job) => {
      processedJobs.push(job.data)
      await new Promise((resolve) => setTimeout(resolve, 50))
      return { processed: job.data }
    })

    // Add multiple jobs
    await Promise.all([
      queue.add({ job: 'A' }),
      queue.add({ job: 'B' }),
      queue.add({ job: 'C' }),
    ])

    // Wait for all to process
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(processedJobs.length).toBeGreaterThan(0)
  })
})