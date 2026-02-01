/**
 * Job Routes Integration Tests
 * Tests for job management API endpoints
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals'
import request from 'supertest'
import express from 'express'
import jobRoutes from '../routes/jobs.js'

// Mock queue
const mockQueue = {
  add: jest.fn().mockResolvedValue({
    id: '1',
    data: {},
  }),
  getJob: jest.fn(),
  getJobCounts: jest.fn().mockResolvedValue({
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
  }),
  getJobs: jest.fn().mockResolvedValue([]),
}

// Mock config/queue.js
jest.unstable_mockModule('../config/queue.js', () => ({
  imageGenerationQueue: mockQueue,
  fileCleanupQueue: mockQueue,
}))

// Create test app
const app = express()
app.use(express.json())
app.use('/api/jobs', jobRoutes)

describe('Job API Routes', () => {
  describe('POST /api/jobs/generate', () => {
    it('should create a new generation job', async () => {
      const response = await request(app)
        .post('/api/jobs/generate')
        .send({
          userId: 'user-123',
          prompt: 'Test prompt',
          platforms: ['instagram-post'],
        })
        .expect(202)

      expect(response.body).toHaveProperty('jobId')
      expect(response.body).toHaveProperty('generationId')
      expect(response.body.status).toBe('queued')
    })

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/jobs/generate')
        .send({
          // Missing userId and prompt
          platforms: ['instagram-post'],
        })
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should accept optional imageType', async () => {
      const response = await request(app)
        .post('/api/jobs/generate')
        .send({
          userId: 'user-123',
          prompt: 'Test',
          imageType: 'natural',
        })
        .expect(202)

      expect(response.body).toHaveProperty('jobId')
    })
  })

  describe('GET /api/jobs/:jobId', () => {
    it('should return job status when job exists', async () => {
      mockQueue.getJob.mockResolvedValueOnce({
        id: '1',
        data: { userId: 'user-123' },
        getState: jest.fn().mockResolvedValue('active'),
        progress: 50,
        attemptsMade: 0,
      })

      const response = await request(app)
        .get('/api/jobs/1')
        .expect(200)

      expect(response.body).toHaveProperty('jobId')
      expect(response.body).toHaveProperty('status')
    })

    it('should return 404 for non-existent job', async () => {
      mockQueue.getJob.mockResolvedValueOnce(null)

      const response = await request(app)
        .get('/api/jobs/non-existent')
        .expect(404)

      expect(response.body.error).toBe('Job not found')
    })
  })

  describe('GET /api/jobs/stats/overview', () => {
    it('should return queue statistics', async () => {
      const response = await request(app)
        .get('/api/jobs/stats/overview')
        .expect(200)

      expect(response.body).toHaveProperty('imageGeneration')
      expect(response.body).toHaveProperty('fileCleanup')
      expect(response.body).toHaveProperty('timestamp')
    })
  })

  describe('POST /api/jobs/:jobId/retry', () => {
    it('should retry a failed job', async () => {
      const mockJob = {
        id: '1',
        getState: jest.fn().mockResolvedValue('failed'),
        retry: jest.fn().mockResolvedValue(undefined),
      }

      mockQueue.getJob.mockResolvedValueOnce(mockJob)

      const response = await request(app)
        .post('/api/jobs/1/retry')
        .expect(200)

      expect(response.body.status).toBe('retrying')
      expect(mockJob.retry).toHaveBeenCalled()
    })

    it('should reject retry for non-failed jobs', async () => {
      const mockJob = {
        id: '1',
        getState: jest.fn().mockResolvedValue('completed'),
      }

      mockQueue.getJob.mockResolvedValueOnce(mockJob)

      const response = await request(app)
        .post('/api/jobs/1/retry')
        .expect(400)

      expect(response.body.error).toContain('not in failed state')
    })
  })

  describe('DELETE /api/jobs/:jobId', () => {
    it('should cancel a job', async () => {
      const mockJob = {
        id: '1',
        getState: jest.fn().mockResolvedValue('waiting'),
        remove: jest.fn().mockResolvedValue(undefined),
      }

      mockQueue.getJob.mockResolvedValueOnce(mockJob)

      const response = await request(app)
        .delete('/api/jobs/1')
        .expect(200)

      expect(response.body.status).toBe('cancelled')
      expect(mockJob.remove).toHaveBeenCalled()
    })

    it('should reject cancel for completed jobs', async () => {
      const mockJob = {
        id: '1',
        getState: jest.fn().mockResolvedValue('completed'),
      }

      mockQueue.getJob.mockResolvedValueOnce(mockJob)

      const response = await request(app)
        .delete('/api/jobs/1')
        .expect(400)

      expect(response.body.error).toContain('Cannot cancel completed job')
    })
  })
})