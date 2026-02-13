import Queue from 'bull';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

// Create Redis client for pub/sub
export const redisClient = new Redis(redisConfig);

// Create job queues
export const imageGenerationQueue = new Queue('image-generation', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 200, // Keep last 200 failed jobs
  },
  settings: {
    stalledInterval: 30000,
    maxStalledCount: 2,
  },
});

// Queue events for monitoring
imageGenerationQueue.on('active', (job) => {
  console.log(`Job ${job.id} started processing`);
});

imageGenerationQueue.on('completed', (job, result) => {
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

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Closing queue connections...');
  await imageGenerationQueue.close();
  redisClient.disconnect();
  process.exit(0);
});

export default { imageGenerationQueue, redisClient };