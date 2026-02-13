import request from 'supertest';
import app from '../index.js';
import { imageGenerationQueue } from '../config/queue.js';

jest.mock('../config/queue.js');

describe('Queue Management Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/queue/stats', () => {
    it('should return queue statistics', async () => {
      imageGenerationQueue.getWaitingCount.mockResolvedValue(5);
      imageGenerationQueue.getActiveCount.mockResolvedValue(2);
      imageGenerationQueue.getCompletedCount.mockResolvedValue(100);
      imageGenerationQueue.getFailedCount.mockResolvedValue(3);
      imageGenerationQueue.getDelayedCount.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/queue/stats');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 0,
        total: 110,
      });
    });
  });

  describe('POST /api/queue/pause', () => {
    it('should pause the queue', async () => {
      imageGenerationQueue.pause.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/queue/pause');

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('paused');
      expect(imageGenerationQueue.pause).toHaveBeenCalled();
    });
  });

  describe('POST /api/queue/resume', () => {
    it('should resume the queue', async () => {
      imageGenerationQueue.resume.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/queue/resume');

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('resumed');
      expect(imageGenerationQueue.resume).toHaveBeenCalled();
    });
  });

  describe('POST /api/queue/clean', () => {
    it('should clean completed jobs', async () => {
      imageGenerationQueue.clean.mockResolvedValue(['job-1', 'job-2']);

      const response = await request(app)
        .post('/api/queue/clean')
        .send({
          grace: 86400000,
          status: 'completed'
        });

      expect(response.status).toBe(200);
      expect(response.body.cleaned).toBe(2);
      expect(imageGenerationQueue.clean).toHaveBeenCalledWith(86400000, 'completed');
    });
  });
});