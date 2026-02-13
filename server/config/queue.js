import dotenv from 'dotenv';

dotenv.config();

const useRedis = !!(process.env.REDIS_HOST);

/**
 * In-memory job queue fallback when Redis is not available.
 * Implements the same interface as Bull so routes work unchanged.
 */
class InMemoryQueue {
  constructor(name) {
    this.name = name;
    this.jobs = new Map();
    this.listeners = {};
  }

  async add(data, opts = {}) {
    const id = opts.jobId || `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const job = {
      id,
      data,
      opts,
      _progress: 0,
      timestamp: Date.now(),
      processedOn: null,
      finishedOn: null,
      returnvalue: null,
      failedReason: null,
      attemptsMade: 0,
      _state: 'waiting',
      getState: async () => job._state,
      log: async () => [],
      retry: async () => { job._state = 'waiting'; },
      remove: async () => { this.jobs.delete(id); },
    };
    this.jobs.set(id, job);
    console.log(`[InMemoryQueue] Job ${id} added to ${this.name}`);
    return job;
  }

  async getJob(jobId) {
    return this.jobs.get(jobId) || null;
  }

  async getWaiting(start = 0, end = 19) {
    return this._getByState('waiting', start, end);
  }

  async getActive(start = 0, end = 19) {
    return this._getByState('active', start, end);
  }

  async getCompleted(start = 0, end = 19) {
    return this._getByState('completed', start, end);
  }

  async getFailed(start = 0, end = 19) {
    return this._getByState('failed', start, end);
  }

  async getJobs(states, start = 0, end = 19) {
    const all = [...this.jobs.values()].filter(j => states.includes(j._state));
    return all.slice(start, end + 1);
  }

  async getJobCounts() {
    const counts = { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
    for (const job of this.jobs.values()) {
      if (counts[job._state] !== undefined) counts[job._state]++;
    }
    return counts;
  }

  async close() {}

  on() {}

  _getByState(state, start, end) {
    const filtered = [...this.jobs.values()].filter(j => j._state === state);
    return filtered.slice(start, end + 1);
  }
}

let imageGenerationQueue;
let redisClient = null;

if (useRedis) {
  try {
    const { default: Queue } = await import('bull');
    const { default: Redis } = await import('ioredis');

    const redisConfig = {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };

    redisClient = new Redis(redisConfig);

    imageGenerationQueue = new Queue('image-generation', {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
      settings: {
        stalledInterval: 30000,
        maxStalledCount: 2,
      },
    });

    imageGenerationQueue.on('active', (job) => {
      console.log(`Job ${job.id} started processing`);
    });

    imageGenerationQueue.on('completed', (job) => {
      console.log(`Job ${job.id} completed successfully`);
    });

    imageGenerationQueue.on('failed', (job, err) => {
      console.error(`Job ${job.id} failed:`, err.message);
    });

    imageGenerationQueue.on('stalled', (job) => {
      console.warn(`Job ${job.id} has stalled`);
    });

    imageGenerationQueue.on('error', (error) => {
      console.error('Queue error:', error);
    });

    console.log('✅ Redis-backed job queue initialized');
  } catch (error) {
    console.warn('⚠️  Failed to connect to Redis, falling back to in-memory queue:', error.message);
    imageGenerationQueue = new InMemoryQueue('image-generation');
    redisClient = null;
  }
} else {
  console.log('ℹ️  Redis not configured — using in-memory job queue');
  imageGenerationQueue = new InMemoryQueue('image-generation');
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Closing queue connections...');
  if (imageGenerationQueue.close) await imageGenerationQueue.close();
  if (redisClient) redisClient.disconnect();
});

export { imageGenerationQueue, redisClient };
export default { imageGenerationQueue, redisClient };