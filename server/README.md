# SnapAsset Server - Background Job Processing

Comprehensive background job processing system for SnapAsset using Bull queue with Redis.

## 🎯 Features

- **Job Queue System**: Bull + Redis for reliable job processing
- **In-Memory Fallback**: Works without Redis for development
- **Image Generation**: Async AI image generation with DALL-E
- **Job Status Tracking**: Real-time job progress updates
- **Retry Logic**: Automatic retry with exponential backoff
- **Priority System**: Priority-based job processing
- **Cleanup Jobs**: Automatic cleanup of old files
- **Real-time Updates**: Server-Sent Events (SSE) for live status
- **Monitoring**: Comprehensive job statistics and health checks
- **Structured Logging**: Winston logger for all events

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Redis (optional, will use in-memory fallback)
- Supabase account
- OpenAI API key

### Installation

```bash
cd server
npm install
```

### Configuration

1. Copy environment variables:
```bash
cp .env.example .env
```

2. Update `.env` with your credentials:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
OPENAI_API_KEY=your-openai-key

# For Redis (optional):
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Running with Docker (Recommended)

```bash
# Start Redis
docker-compose up -d

# Redis will be available at localhost:6379
# Redis UI at http://localhost:8081
```

### Start Development

```bash
# Terminal 1: Start API server
npm run dev

# Terminal 2: Start worker process
npm run worker:dev
```

## 📡 API Endpoints

### Job Management

#### Create Image Generation Job
```bash
POST /api/jobs/generate
Content-Type: application/json

{
  "userId": "user-123",
  "prompt": "A beautiful sunset over mountains",
  "platforms": ["instagram-post", "twitter-post"],
  "imageType": "vivid"
}

Response:
{
  "jobId": "1",
  "generationId": "gen_1234567890_abc",
  "status": "queued",
  "message": "Job created successfully",
  "estimatedTime": "2-5 minutes"
}
```

#### Get Job Status
```bash
GET /api/jobs/:jobId

Response:
{
  "jobId": "1",
  "queue": "image-generation",
  "status": "active",
  "progress": 45,
  "data": {...},
  "attemptsMade": 0
}
```

#### Get Job Result
```bash
GET /api/jobs/:jobId/result

Response:
{
  "jobId": "1",
  "status": "completed",
  "result": {
    "success": true,
    "generationId": "gen_123",
    "images": [...],
    "totalImages": 2
  }
}
```

#### Retry Failed Job
```bash
POST /api/jobs/:jobId/retry

Response:
{
  "jobId": "1",
  "status": "retrying",
  "message": "Job has been queued for retry"
}
```

#### Cancel Job
```bash
DELETE /api/jobs/:jobId

Response:
{
  "jobId": "1",
  "status": "cancelled"
}
```

#### Get Queue Statistics
```bash
GET /api/jobs/stats/overview

Response:
{
  "imageGeneration": {
    "waiting": 3,
    "active": 2,
    "completed": 145,
    "failed": 5
  },
  "fileCleanup": {
    "waiting": 0,
    "active": 1,
    "completed": 10,
    "failed": 0
  }
}
```

### Real-time Updates (SSE)

#### Job Status Updates
```javascript
const eventSource = new EventSource('/api/sse/jobs/1')

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log('Job update:', data)
  // data = { type: 'update', jobId: '1', status: 'active', progress: 45 }
}

eventSource.addEventListener('error', (error) => {
  console.error('SSE error:', error)
})
```

#### Queue Statistics Stream
```javascript
const statsSource = new EventSource('/api/sse/stats')

statsSource.onmessage = (event) => {
  const stats = JSON.parse(event.data)
  console.log('Queue stats:', stats)
}
```

## 🏗️ Architecture

### Job Flow

```
Client Request
    ↓
API Server (POST /api/jobs/generate)
    ↓
Job Queue (Bull + Redis)
    ↓
Worker Process
    ↓
1. Generate image (DALL-E)
2. Download image
3. Resize for platforms
4. Upload to Supabase Storage
5. Save metadata to database
    ↓
Job Completed
    ↓
Client Receives Result (via SSE or polling)
```

### Components

1. **API Server** (`index.js`)
   - Express server
   - Job management endpoints
   - SSE for real-time updates

2. **Worker Process** (`workers/index.js`)
   - Job processors
   - Concurrent job execution
   - Automatic retries

3. **Job Processors**
   - `imageProcessor.js` - AI image generation
   - `cleanupProcessor.js` - File cleanup

4. **Queue Configuration** (`config/queue.js`)
   - Bull queue setup
   - In-memory fallback
   - Job options

5. **Redis Configuration** (`config/redis.js`)
   - Redis connection
   - Health checks
   - Failover handling

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 🔧 Configuration Options

### Job Options

```javascript
// In config/queue.js
const jobOptions = {
  attempts: 3,              // Retry attempts
  backoff: {
    type: 'exponential',    // Retry strategy
    delay: 2000,            // Initial delay (ms)
  },
  timeout: 300000,          // Job timeout (5 minutes)
  priority: 2,              // Higher = more priority
  removeOnComplete: 100,    // Keep last 100 completed
  removeOnFail: 200,        // Keep last 200 failed
}
```

### Queue Settings

```javascript
// Worker concurrency
imageGenerationQueue.process(2, processImageGeneration) // 2 concurrent
fileCleanupQueue.process(1, processCleanup)             // 1 concurrent
```

## 📊 Monitoring

### Health Check

```bash
GET /health

Response:
{
  "status": "ok",
  "uptime": 3600,
  "services": {
    "supabase": true,
    "redis": true,
    "queues": {
      "imageGeneration": { "waiting": 2, "active": 1 },
      "fileCleanup": { "waiting": 0, "active": 0 }
    }
  }
}
```

### Redis UI

Access Redis Commander at http://localhost:8081 to:
- View all queues
- Monitor job progress
- Inspect job data
- View failed jobs
- Manage job lifecycle

### Logs

Logs are stored in `server/logs/`:
- `combined.log` - All logs
- `error.log` - Errors only
- `exceptions.log` - Uncaught exceptions
- `rejections.log` - Unhandled promise rejections

## 🚢 Deployment

### Railway Deployment

1. Add Redis service in Railway dashboard
2. Copy `REDIS_URL` from Railway
3. Set environment variables:

```bash
REDIS_URL=redis://default:password@redis.railway.internal:6379
OPENAI_API_KEY=your-key
SUPABASE_URL=your-url
SUPABASE_SERVICE_KEY=your-key
```

4. Deploy:
```bash
git push railway main
```

5. Start worker:
```bash
railway run npm run worker
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | API server port (default: 3001) |
| `NODE_ENV` | No | Environment (development/production) |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `REDIS_HOST` | No | Redis host (default: localhost) |
| `REDIS_PORT` | No | Redis port (default: 6379) |
| `REDIS_PASSWORD` | No | Redis password |
| `REDIS_URL` | No | Full Redis URL (overrides host/port) |
| `LOG_LEVEL` | No | Log level (debug/info/warn/error) |

## 🐛 Troubleshooting

### Redis Connection Issues

If Redis connection fails, the system automatically falls back to in-memory queue:

```
⚠️  Redis not available, using in-memory queue fallback
```

For production, always use Redis for reliability.

### Job Stuck in Processing

Jobs have a 5-minute timeout. Stalled jobs are automatically detected and retried:

```javascript
// In config/queue.js
stalledInterval: 30000,  // Check every 30s
maxStalledCount: 2,      // Max 2 stalls before failing
```

### High Memory Usage

Increase job cleanup:

```javascript
removeOnComplete: 50,   // Reduce from 100
removeOnFail: 100,      // Reduce from 200
```

## 📚 Documentation

- [Bull Queue Documentation](https://github.com/OptimalBits/bull)
- [Redis Documentation](https://redis.io/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [OpenAI API](https://platform.openai.com/docs/)
- [Supabase Documentation](https://supabase.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/job-queue`)
3. Commit changes (`git commit -am 'Add job queue'`)
4. Push to branch (`git push origin feature/job-queue`)
5. Create Pull Request

## 📝 License

MIT License - see LICENSE file for details