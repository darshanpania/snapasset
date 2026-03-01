# SnapAsset API Server

Backend API for SnapAsset - AI-powered image generation and optimization.

## Features

### 🎨 Image Generation

- DALL-E 3 integration for AI image generation
- Automatic resizing for 8+ social media platforms
- High-quality image optimization with Sharp

### 🔄 Job Queue System

- Bull queue with Redis backend
- Concurrent job processing
- Automatic retry with exponential backoff
- Job progress tracking
- Real-time updates via Server-Sent Events

### 📚 API Documentation

- Complete OpenAPI 3.0 specification
- Interactive Swagger UI
- Postman collection generation
- Request/response examples

### 🔒 Security & Performance

- Rate limiting
- Helmet security headers
- CORS configuration
- Error handling
- Request logging

## Quick Start

### Prerequisites

- Node.js 18+
- Redis (for job queue, optional - falls back to in-memory)
- OpenAI API key (for image generation)
- Supabase account **OR** nothing (local SQLite mode works out of the box)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### Configuration

The server supports two database modes that are auto-detected:

**Local mode** (default - no external services needed):

```env
PORT=3001
NODE_ENV=development
JWT_SECRET=change-me-to-a-random-string-at-least-32-characters
OPENAI_API_KEY=your-openai-key
```

**Supabase mode** (cloud PostgreSQL + storage):

```env
PORT=3001
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
OPENAI_API_KEY=your-openai-key
REDIS_HOST=localhost
REDIS_PORT=6379
```

When `SUPABASE_URL` is set, the server uses Supabase for database, auth, and storage. Otherwise it automatically falls back to SQLite + local filesystem + JWT auth.

### Running the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start

# Start worker process
npm run worker
```

In local mode, the server creates a `data/` directory containing `snapasset.db` (SQLite) and `storage/` (uploaded files). Auth endpoints are available at `/api/auth` (register, login, me).

### Docker Setup

```bash
# Build image
docker build -t snapasset-api .

# Run with Docker Compose
docker-compose up
```

## API Endpoints

### Health Check

```
GET /health
```

### Job Management

```
POST   /api/jobs           # Create new job
GET    /api/jobs/:jobId    # Get job status
GET    /api/jobs           # List jobs
POST   /api/jobs/:jobId/retry   # Retry failed job
DELETE /api/jobs/:jobId/cancel  # Cancel job
```

### Real-time Updates

```
GET /api/sse/jobs/:jobId   # Subscribe to job updates (SSE)
```

### Queue Management

```
GET  /api/queue/stats      # Get queue statistics
POST /api/queue/pause      # Pause queue
POST /api/queue/resume     # Resume queue
POST /api/queue/clean      # Clean old jobs
```

### Documentation

```
GET /api-docs              # Swagger UI
GET /api-docs/openapi.json # OpenAPI spec
GET /api-docs/postman      # Postman collection
```

## Usage Examples

### Create Image Generation Job

```javascript
const response = await fetch('http://localhost:3001/api/jobs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId: 'user-uuid-here',
    prompt: 'A beautiful sunset over mountains',
    platforms: ['instagram-post', 'twitter-post', 'facebook-post'],
    options: {
      quality: 'hd',
      style: 'vivid',
    },
  }),
});

const { jobId } = await response.json();
console.log('Job created:', jobId);
```

### Monitor Job Progress (SSE)

```javascript
const eventSource = new EventSource(`http://localhost:3001/api/sse/jobs/${jobId}`);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Progress:', data.progress + '%');

  if (data.type === 'done') {
    console.log('Completed!', data.result);
    eventSource.close();
  }
};
```

### Get Job Status

```javascript
const response = await fetch(`http://localhost:3001/api/jobs/${jobId}`);
const job = await response.json();

console.log('Status:', job.status);
console.log('Progress:', job.progress);
if (job.result) {
  console.log('Images:', job.result.images);
}
```

## Architecture

### Components

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP/SSE
       ↓
┌─────────────┐
│ Express API │
└──────┬──────┘
       │
       ├─→ Job Creation → Bull Queue → Redis
       │                     ↓
       │              ┌──────────────┐
       │              │ Image Worker │
       │              └──────┬───────┘
       │                     │
       │                     ├─→ OpenAI DALL-E
       │                     ├─→ Sharp (resize)
       │                     └─→ Supabase Storage
       │
       └─→ SSE Updates ←──── Job Progress
```

### Job Flow

1. Client submits job via POST /api/jobs
2. Job added to Bull queue in Redis
3. Worker picks up job from queue
4. Worker generates image with DALL-E
5. Worker resizes for each platform
6. Worker uploads to Supabase Storage
7. Worker saves metadata to database
8. Client receives real-time updates via SSE
9. Job completes with image URLs

### Queue Features

- **Concurrency**: Multiple workers can process jobs
- **Retry Logic**: Failed jobs retry with exponential backoff
- **Priority**: Jobs can have priority levels
- **Monitoring**: Real-time stats and metrics
- **Persistence**: Jobs survive server restarts (Redis)

## Platform Presets

Supported platforms with exact dimensions:

| Platform          | Preset ID           | Dimensions |
| ----------------- | ------------------- | ---------- |
| Instagram Post    | `instagram-post`    | 1080x1080  |
| Instagram Story   | `instagram-story`   | 1080x1920  |
| Twitter Post      | `twitter-post`      | 1200x675   |
| Twitter Header    | `twitter-header`    | 1500x500   |
| Facebook Post     | `facebook-post`     | 1200x630   |
| Facebook Cover    | `facebook-cover`    | 820x312    |
| LinkedIn Post     | `linkedin-post`     | 1200x627   |
| YouTube Thumbnail | `youtube-thumbnail` | 1280x720   |

## Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Job Creation**: 20 jobs per hour
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Error Codes

| Code                  | Description                       |
| --------------------- | --------------------------------- |
| `INVALID_REQUEST`     | Missing or invalid request data   |
| `UNAUTHORIZED`        | Invalid or missing authentication |
| `RATE_LIMIT_EXCEEDED` | Too many requests                 |
| `JOB_LIMIT_EXCEEDED`  | Too many jobs created             |
| `JOB_NOT_FOUND`       | Job ID doesn't exist              |
| `INTERNAL_ERROR`      | Server error                      |

## Monitoring

### Queue Statistics

```bash
curl http://localhost:3001/api/queue/stats
```

Response:

```json
{
  "waiting": 5,
  "active": 2,
  "completed": 150,
  "failed": 3,
  "delayed": 0,
  "total": 160
}
```

### Health Check

```bash
curl http://localhost:3001/health
```

Response:

```json
{
  "status": "ok",
  "uptime": 3600,
  "environment": "production",
  "services": {
    "supabase": true,
    "redis": true,
    "openai": true
  }
}
```

## Development

### Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## Deployment

### Railway

1. Connect repository
2. Add environment variables
3. Deploy automatically on push

### Docker

```bash
# Build
docker build -t snapasset-api .

# Run
docker run -p 3001:3001 --env-file .env snapasset-api
```

### Environment Variables

**Always required:**

- `OPENAI_API_KEY` - For image generation

**Local mode (default):**

- `JWT_SECRET` - Secret for signing JWT tokens (min 32 chars)
- `LOCAL_DATA_DIR` - Data directory (default: `./data`)

**Supabase mode:**

- `SUPABASE_URL` - Supabase project URL (triggers Supabase mode)
- `SUPABASE_SERVICE_KEY` - Supabase service role key

**Optional:**

- `PORT` (default: 3001)
- `NODE_ENV` (default: development)
- `DB_PROVIDER` - Force `local` or `supabase` (auto-detected if omitted)
- `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` - For job queue

## Troubleshooting

### Redis Connection Issues

```bash
# Check Redis is running
redis-cli ping

# View Redis logs
redis-cli monitor
```

### Job Stuck in Queue

```bash
# Check active jobs
curl http://localhost:3001/api/queue/stats

# Restart worker
npm run worker
```

### Worker Not Processing

1. Check Redis connection
2. Verify worker is running
3. Check worker logs
4. Restart worker process

## License

MIT

## Support

- Documentation: http://localhost:3001/api-docs
- GitHub: https://github.com/darshanpania/snapasset
- Issues: https://github.com/darshanpania/snapasset/issues
