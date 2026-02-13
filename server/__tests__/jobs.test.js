import request from 'supertest';
import app from '../index.js';
import { imageGenerationQueue } from '../config/queue.js';

jest.mock('../config/queue.js');

describe('Job API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/jobs', () => {
    it('should create a new job successfully', async () => {
      const mockJob = {
        id: 'test-job-123',
        data: {}
      };

      imageGenerationQueue.add.mockResolvedValue(mockJob);

      const response = await request(app)
        .post('/api/jobs')
        .send({
          userId: 'user-123',
          prompt: 'A beautiful sunset',
          platforms: ['instagram-post']
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('jobId');
      expect(response.body.status).toBe('queued');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .send({ userId: 'user-123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields');
    });

    it('should return 400 for empty platforms array', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .send({
          userId: 'user-123',
          prompt: 'Test',
          platforms: []
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/jobs/:jobId', () => {
    it('should return job status', async () => {
      const mockJob = {
        id: 'test-job-123',
        data: { userId: 'user-123', prompt: 'Test' },
        _progress: 50,
        timestamp: Date.now(),
        getState: jest.fn().mockResolvedValue('active'),
        log: jest.fn().mockResolvedValue(['Log entry']),
        opts: { attempts: 3 },
        attemptsMade: 1,
      };

      imageGenerationQueue.getJob.mockResolvedValue(mockJob);

      const response = await request(app)
        .get('/api/jobs/test-job-123');

      expect(response.status).toBe(200);
      expect(response.body.jobId).toBe('test-job-123');
      expect(response.body.status).toBe('active');
      expect(response.body.progress).toBe(50);
    });

    it('should return 404 for non-existent job', async () => {
      imageGenerationQueue.getJob.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/jobs/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Job not found');
    });
  });

  describe('POST /api/jobs/:jobId/retry', () => {
    it('should retry a failed job', async () => {
      const mockJob = {
        id: 'test-job-123',
        retry: jest.fn().mockResolvedValue(true),
      };

      imageGenerationQueue.getJob.mockResolvedValue(mockJob);

      const response = await request(app)
        .post('/api/jobs/test-job-123/retry');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('retrying');
      expect(mockJob.retry).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/jobs/:jobId/cancel', () => {
    it('should cancel a job', async () => {
      const mockJob = {
        id: 'test-job-123',
        remove: jest.fn().mockResolvedValue(true),
      };

      imageGenerationQueue.getJob.mockResolvedValue(mockJob);

      const response = await request(app)
        .delete('/api/jobs/test-job-123/cancel');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('cancelled');
      expect(mockJob.remove).toHaveBeenCalled();
    });
  });

  describe('GET /api/jobs', () => {
    it('should list active jobs', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          data: {},
          _progress: 25,
          timestamp: Date.now(),
          getState: jest.fn().mockResolvedValue('active'),
        },
      ];

      imageGenerationQueue.getActive.mockResolvedValue(mockJobs);

      const response = await request(app)
        .get('/api/jobs?status=active');

      expect(response.status).toBe(200);
      expect(response.body.jobs).toHaveLength(1);
      expect(response.body.status).toBe('active');
    });
  });
});