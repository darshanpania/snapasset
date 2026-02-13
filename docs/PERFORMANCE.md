# Performance Optimization Guide

Guide to optimizing SnapAsset API performance.

## Table of Contents

- [Architecture](#architecture)
- [Queue Optimization](#queue-optimization)
- [Image Processing](#image-processing)
- [Caching](#caching)
- [Database](#database)
- [Monitoring](#monitoring)

## Architecture

### Recommended Setup

**Production:**
- 1-2 API servers (load balanced)
- 2-5 worker processes
- Redis cluster (if high traffic)
- CDN for image delivery

**Scaling Thresholds:**

| Metric | Add Worker | Add API Server |
|--------|-----------|----------------|
| Jobs waiting | > 50 | N/A |
| Active jobs | > 10/worker | N/A |
| CPU usage | > 80% | > 70% |
| Memory usage | > 80% | > 80% |
| Response time | N/A | > 500ms |

## Queue Optimization

### Concurrency

```javascript
// In imageWorker.js
imageGenerationQueue.process(
  5, // Process 5 jobs concurrently
  async (job) => {
    // Job processing
  }
);
```

**Guidelines:**
- Start with 2-3 concurrent jobs per worker
- Monitor CPU and memory
- Scale up if resources available
- Max: 10 concurrent jobs per worker

### Priority Queues

```javascript
// High priority for premium users
await imageGenerationQueue.add(jobData, {
  priority: 1, // Lower = higher priority
});

// Normal priority
await imageGenerationQueue.add(jobData, {
  priority: 5,
});
```

### Job Timeouts

```javascript
await imageGenerationQueue.add(jobData, {
  timeout: 300000, // 5 minutes max
});
```

### Retry Strategy

```javascript
// Exponential backoff
defaultJobOptions: {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000, // Start with 2s, then 4s, 8s
  },
}
```

## Image Processing

### Sharp Optimization

```javascript
// Optimize Sharp settings
const resized = await sharp(buffer)
  .resize(width, height, {
    fit: 'cover',
    position: 'attention', // Smart cropping
  })
  .png({
    quality: 90,
    compressionLevel: 9,
    adaptiveFiltering: true,
    palette: true, // Reduce colors for smaller size
  })
  .toBuffer({ resolveWithObject: false });
```

### WebP Format

```javascript
// Use WebP for smaller files (30-50% reduction)
const webp = await sharp(buffer)
  .resize(width, height)
  .webp({ quality: 85 })
  .toBuffer();
```

### Parallel Processing

```javascript
// Process all platforms in parallel
const results = await Promise.all(
  platforms.map(async (platform) => {
    const resized = await resizeImage(originalImage, platform);
    const uploaded = await uploadToStorage(resized, path);
    return uploaded;
  })
);
```

### Memory Management

```javascript
// Stream large images
import stream from 'stream';
import { pipeline } from 'stream/promises';

const transform = sharp()
  .resize(width, height)
  .png();

await pipeline(
  imageStream,
  transform,
  uploadStream
);
```

## Caching

### Redis Caching

```javascript
import { redisClient } from '../config/queue.js';

// Cache generation results
async function cacheResult(generationId, result) {
  await redisClient.setex(
    `generation:${generationId}`,
    3600, // 1 hour TTL
    JSON.stringify(result)
  );
}

// Get from cache
async function getCachedResult(generationId) {
  const cached = await redisClient.get(`generation:${generationId}`);
  return cached ? JSON.parse(cached) : null;
}
```

### HTTP Caching

```javascript
// Cache job status responses
app.get('/api/jobs/:jobId', async (req, res) => {
  const job = await getJob(req.params.jobId);
  
  if (job.status === 'completed') {
    // Cache completed jobs for 1 hour
    res.set('Cache-Control', 'public, max-age=3600');
  } else {
    // Don't cache active jobs
    res.set('Cache-Control', 'no-cache');
  }
  
  res.json(job);
});
```

### CDN Caching

```javascript
// Set aggressive caching for generated images
await supabase.storage
  .from('generated-images')
  .upload(path, buffer, {
    cacheControl: '31536000', // 1 year
  });
```

## Database

### Query Optimization

```sql
-- Use indexes
CREATE INDEX idx_generations_user_created 
  ON generations(user_id, created_at DESC);

-- Limit results
SELECT * FROM generations 
WHERE user_id = $1 
ORDER BY created_at DESC 
LIMIT 20;

-- Use explain to analyze
EXPLAIN ANALYZE SELECT ...;
```

### Connection Pooling

```javascript
// Supabase handles pooling automatically
// But for custom connections:
const pool = new Pool({
  max: 20, // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Batch Operations

```javascript
// Insert multiple images at once
const { data, error } = await supabase
  .from('generated_images')
  .insert(images); // Array of images
```

## Monitoring

### Key Metrics

**API Server:**
- Request rate (req/s)
- Response time (ms)
- Error rate (%)
- CPU usage (%)
- Memory usage (MB)

**Worker:**
- Jobs processed/min
- Average job duration
- Failed job rate
- Worker CPU/memory

**Queue:**
- Queue depth
- Processing rate
- Failed jobs
- Stalled jobs

### Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| API response time | < 200ms | > 1000ms |
| Job processing | < 60s | > 300s |
| Queue depth | < 50 | > 200 |
| Error rate | < 1% | > 5% |
| Worker CPU | < 70% | > 90% |
| Memory usage | < 512MB | > 1GB |

### Alerting

```javascript
// Set up alerts
const ALERTS = {
  highErrorRate: (rate) => rate > 0.05,
  slowResponse: (time) => time > 1000,
  queueBacklog: (depth) => depth > 100,
};

setInterval(async () => {
  const stats = await getStats();
  
  if (ALERTS.queueBacklog(stats.queueDepth)) {
    sendAlert('Queue backlog detected', stats);
  }
}, 60000);
```

## Load Testing

### Artillery

```yaml
# load-test.yml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 10
      name: "Sustained load"
    - duration: 60
      arrivalRate: 20
      name: "High load"

scenarios:
  - name: "Create and monitor job"
    flow:
      - post:
          url: "/api/jobs"
          json:
            userId: "test-user"
            prompt: "Test image"
            platforms:
              - "instagram-post"
          capture:
            - json: "$.jobId"
              as: "jobId"
      - get:
          url: "/api/jobs/{{ jobId }}"
      - think: 5
      - get:
          url: "/api/jobs/{{ jobId }}"
```

Run:
```bash
npm install -g artillery
arteillery run load-test.yml
```

### Results Analysis

```
Summary:
  Scenarios launched: 1000
  Scenarios completed: 995
  Requests completed: 2995
  RPS sent: 16.64
  Request latency:
    min: 45
    max: 1230
    median: 156
    p95: 345
    p99: 567
  Scenario duration:
    min: 501
    max: 15234
    median: 5123
    p95: 8934
    p99: 12456
```

**Targets:**
- p95 response time < 500ms
- Error rate < 1%
- RPS > 10

## Optimization Tips

### 1. Enable Compression

```javascript
import compression from 'compression';

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
}));
```

### 2. Use Clustering

```javascript
import cluster from 'cluster';
import os from 'os';

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  // Start Express server
  app.listen(PORT);
}
```

### 3. Optimize Logging

```javascript
// Use structured logging
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'combined.log' 
    }),
  ],
});

// In production, reduce logging
if (process.env.NODE_ENV === 'production') {
  logger.level = 'warn';
}
```

### 4. Database Connection Pooling

```javascript
// Supabase client with pooling
const supabase = createClient(url, key, {
  db: {
    pool: {
      min: 2,
      max: 10,
    },
  },
  auth: {
    persistSession: false, // Don't persist in server
  },
});
```

### 5. Job Deduplication

```javascript
// Prevent duplicate jobs
await imageGenerationQueue.add(jobData, {
  jobId: `${userId}-${hash(prompt)}-${platforms.join('-')}`,
  removeOnComplete: true,
});
```

## Benchmarks

### Target Performance

**API Endpoints:**
- GET /health: < 10ms
- POST /api/jobs: < 100ms
- GET /api/jobs/:id: < 50ms
- GET /api/queue/stats: < 30ms

**Job Processing:**
- DALL-E generation: 10-20s
- Single platform resize: 0.5-2s
- Upload to storage: 1-3s
- Total per platform: 2-5s
- Total for 5 platforms: 25-35s

### Bottlenecks

1. **DALL-E API** - Slowest part (10-20s)
   - Can't be optimized
   - Use caching for duplicate prompts

2. **Image Download** - 1-3s
   - Use streams
   - Parallelize when possible

3. **Image Resize** - 0.5-2s per platform
   - Process platforms in parallel
   - Use Sharp efficiently

4. **Storage Upload** - 1-3s per image
   - Upload in parallel
   - Use multipart upload for large files

## Cost Optimization

### OpenAI Costs

- DALL-E 3 Standard: $0.040 per image
- DALL-E 3 HD: $0.080 per image

**Strategies:**
- Cache frequently requested images
- Batch similar requests
- Use standard quality when HD not needed

### Storage Costs

- Supabase: $0.021 per GB/month
- Bandwidth: $0.09 per GB

**Strategies:**
- Compress images (WebP)
- Set up CDN caching
- Clean old images regularly
- Use lower quality for thumbnails

### Redis Costs

- Railway: $5/month (500MB)
- Redis Cloud: Free tier (30MB)

**Strategies:**
- Clean completed jobs regularly
- Use short TTLs for cache
- Monitor memory usage

## Support

- Performance issues: https://github.com/darshanpania/snapasset/issues
- Email: support@snapasset.com