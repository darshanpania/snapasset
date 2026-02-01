# Job Queue Architecture

Detailed architecture documentation for SnapAsset background job processing system.

## 🏗️ System Architecture

### Component Overview

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                 CLIENT LAYER                              ┃
┃  ┌─────────────────────────────────────────┐  ┃
┃  │  React Frontend                              │  ┃
┃  │  - JobMonitor Component                      │  ┃
┃  │  - QueueDashboard Component                  │  ┃
┃  │  - useJobStatus Hook                         │  ┃
┃  └─────────────────┬────────────────────────┘  ┃
┃                  │ HTTP POST/GET                           ┃
┃                  │ SSE (Real-time)                         ┃
┗━━━━━━━━━━━━━━━━━━┴━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                     │
┏━━━━━━━━━━━━━━━━━━┴━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                  API LAYER                               ┃
┃  ┌─────────────────────────────────────────┐  ┃
┃  │  Express.js API Server                      │  ┃
┃  │                                              │  ┃
┃  │  Routes:                                     │  ┃
┃  │  ├─ POST   /api/jobs/generate                │  ┃
┃  │  ├─ GET    /api/jobs/:jobId                  │  ┃
┃  │  ├─ GET    /api/jobs/:jobId/result           │  ┃
┃  │  ├─ POST   /api/jobs/:jobId/retry            │  ┃
┃  │  ├─ DELETE /api/jobs/:jobId                  │  ┃
┃  │  ├─ GET    /api/jobs/stats/overview          │  ┃
┃  │  ├─ GET    /api/sse/jobs/:jobId (SSE)         │  ┃
┃  │  └─ GET    /api/sse/stats (SSE)               │  ┃
┃  └─────────────────────────────────────────┘  ┃
┗━━━━━━━━━━━━━━━━━━┬━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                   │
                   │ Enqueue/Dequeue
                   ↓
┏━━━━━━━━━━━━━━━━━━┴━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                 QUEUE LAYER                              ┃
┃  ┌─────────────────────────────────────────┐  ┃
┃  │  Bull Queue Manager                         │  ┃
┃  │                                              │  ┃
┃  │  Queues:                                     │  ┃
┃  │  ├─ image-generation (Priority: 2)          │  ┃
┃  │  │  • Concurrency: 2                          │  ┃
┃  │  │  • Timeout: 5 minutes                     │  ┃
┃  │  │  • Retries: 3                             │  ┃
┃  │  └─ file-cleanup (Priority: 1)              │  ┃
┃  │     • Concurrency: 1                          │  ┃
┃  │     • Timeout: 1 minute                       │  ┃
┃  └─────────────────────────────────────────┘  ┃
┃                     │                                   ┃
┃  ┌──────────────────┴──────────────────────┐  ┃
┃  │         Redis Storage                         │  ┃
┃  │  • Persistent job data                       │  ┃
┃  │  • Job state tracking                        │  ┃
┃  │  • Distributed lock management               │  ┃
┃  └─────────────────────────────────────────┘  ┃
┗━━━━━━━━━━━━━━━━━━┬━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                   │
                   │ Pull Jobs
                   ↓
┏━━━━━━━━━━━━━━━━━━┴━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                WORKER LAYER                             ┃
┃  ┌─────────────────────────────────────────┐  ┃
┃  │  Worker Process 1                           │  ┃
┃  │  - Image Processor (2 concurrent)           │  ┃
┃  │  - Cleanup Processor (1 concurrent)         │  ┃
┃  └─────────────────────────────────────────┘  ┃
┃  ┌─────────────────────────────────────────┐  ┃
┃  │  Worker Process N (Scalable)                │  ┃
┃  └─────────────────────────────────────────┘  ┃
┗━━━━━━━━━━━━━━━━━━┬━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                   │
                   │ API Calls
                   ↓
┏━━━━━━━━━━━━━━━━━━┴━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃              EXTERNAL SERVICES                          ┃
┃  ┌─────────────────────────────────────────┐  ┃
┃  │  OpenAI DALL-E 3                            │  ┃
┃  │  - AI image generation                      │  ┃
┃  └─────────────────────────────────────────┘  ┃
┃  ┌─────────────────────────────────────────┐  ┃
┃  │  Supabase                                   │  ┃
┃  │  - Storage (image files)                    │  ┃
┃  │  - Database (metadata)                      │  ┃
┃  └─────────────────────────────────────────┘  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

## Job Lifecycle

### States

1. **waiting**: Job queued, waiting for worker
2. **active**: Job being processed by worker
3. **completed**: Job finished successfully
4. **failed**: Job failed after all retries
5. **delayed**: Job scheduled for future
6. **paused**: Queue paused

### State Transitions

```
waiting → active → completed
              │
              ↓ (on error)
            failed
              │
              ↓ (retry)
            waiting
```

## Scalability

### Horizontal Scaling

**Add more workers**:
- Each worker connects to same Redis
- Bull handles distributed locking
- Jobs distributed automatically
- No code changes needed

**Example**:
```bash
# Start 3 workers
node workers/index.js  # Worker 1
node workers/index.js  # Worker 2
node workers/index.js  # Worker 3
```

**Result**: 6 concurrent image generation jobs (2 per worker)

### Vertical Scaling

**Increase concurrency**:
```javascript
// In workers/index.js
imageGenerationQueue.process(5, processImageGeneration) // 5 concurrent
```

**Trade-offs**:
- ✅ More throughput
- ❌ Higher memory usage
- ❌ Higher CPU usage

### Queue Partitioning

**Premium users**:
```javascript
const premiumQueue = createQueue('premium-generation')
premiumQueue.process(5, processImageGeneration) // Higher concurrency
```

**Free users**:
```javascript
const freeQueue = createQueue('free-generation')
freeQueue.process(1, processImageGeneration) // Limited concurrency
```

## Fault Tolerance

### Worker Failures

**Problem**: Worker crashes mid-job

**Solution**:
- Job marked as "stalled" after 30s
- Automatic recovery by another worker
- Max 2 stalls before failing

### Redis Failures

**Problem**: Redis connection lost

**Solution**:
- Automatic reconnection (3 retries)
- Falls back to in-memory queue
- Logs warning for monitoring

### External API Failures

**Problem**: OpenAI or Supabase unavailable

**Solution**:
- Job fails and retries (3 attempts)
- Exponential backoff
- Error logged for debugging

## Performance Optimization

### 1. Reduce Job Data Size

❌ **Bad**:
```javascript
await queue.add({
  largeImageBuffer: buffer, // 10MB
  metadata: {...huge object...}
})
```

✅ **Good**:
```javascript
// Store large data in database/storage first
const imageId = await saveToStorage(buffer)
await queue.add({
  imageId,  // Just reference
  userId,
  generationId,
})
```

### 2. Batch Operations

❌ **Bad**:
```javascript
for (const prompt of prompts) {
  await queue.add({ prompt })
}
```

✅ **Good**:
```javascript
const jobs = prompts.map(prompt => queue.add({ prompt }))
await Promise.all(jobs)
```

### 3. Connection Pooling

```javascript
// In redis.js
const redisClient = new Redis({
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
})
```

## Security

### Job Data Validation

```javascript
import { validateGenerationJobData } from './utils/jobHelpers.js'

const { isValid, errors } = validateGenerationJobData(jobData)
if (!isValid) {
  throw new Error(errors.join(', '))
}
```

### Rate Limiting

```javascript
import rateLimit from 'express-rate-limit'

const createJobLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 jobs per 15 minutes
  message: 'Too many jobs created, please try again later',
})

app.post('/api/jobs/generate', createJobLimiter, async (req, res) => {
  // ...
})
```

### Authentication

```javascript
import { verifyToken } from './middleware/auth.js'

app.post('/api/jobs/generate', verifyToken, async (req, res) => {
  const userId = req.user.id
  // ...
})
```

## Monitoring & Alerts

### Metrics to Track

1. **Queue Depth**
   ```javascript
   const counts = await queue.getJobCounts()
   if (counts.waiting > 50) {
     alert('Queue backing up!')
   }
   ```

2. **Job Duration**
   ```javascript
   const duration = job.finishedOn - job.processedOn
   if (duration > 300000) { // 5 minutes
     alert('Job took too long')
   }
   ```

3. **Failure Rate**
   ```javascript
   const failureRate = counts.failed / (counts.completed + counts.failed)
   if (failureRate > 0.1) { // > 10%
     alert('High failure rate')
   }
   ```

### Integration with Monitoring Tools

**Datadog**:
```javascript
import { StatsD } from 'node-dogstatsd'

const dogstatsd = new StatsD()

queue.on('completed', () => {
  dogstatsd.increment('jobs.completed')
})

queue.on('failed', () => {
  dogstatsd.increment('jobs.failed')
})
```

**Prometheus**:
```javascript
import client from 'prom-client'

const jobCounter = new client.Counter({
  name: 'jobs_processed_total',
  help: 'Total number of jobs processed',
  labelNames: ['status'],
})

queue.on('completed', () => {
  jobCounter.inc({ status: 'completed' })
})
```

## Data Retention

### Job Cleanup Strategy

```javascript
// Daily cleanup
setInterval(async () => {
  // Keep last 100 completed jobs
  await queue.clean(3600000, 'completed', 100)

  // Keep failed jobs for 7 days
  await queue.clean(7 * 24 * 3600000, 'failed')
}, 24 * 3600000) // Run daily
```

### Storage Cleanup

```javascript
// Weekly cleanup of old files
fileCleanupQueue.add(
  { type: 'all', olderThanDays: 30 },
  {
    repeat: { cron: '0 3 * * 0' }, // 3 AM every Sunday
  }
)
```

## Cost Optimization

### Redis Costs

**Free Tier** (Upstash):
- 10,000 commands/day
- 256MB storage
- Sufficient for ~1,000 jobs/day

**Paid Tier**:
- $0.20 per 100K commands
- For 100K jobs/month: ~$20/month

### Worker Costs

**Railway**:
- $5/month per worker
- Start with 1 worker
- Scale based on demand

**Estimate**:
- 1 worker: $5/month (handles ~700 jobs/day)
- 3 workers: $15/month (handles ~2,100 jobs/day)

## Summary

✅ **Scalable**: Horizontal and vertical scaling  
✅ **Reliable**: Persistent storage with Redis  
✅ **Resilient**: Automatic retries and recovery  
✅ **Observable**: Comprehensive monitoring  
✅ **Secure**: Validation and authentication  
✅ **Cost-effective**: Optimize resource usage  

The architecture is designed for production scale! 🚀