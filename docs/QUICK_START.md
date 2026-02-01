# Quick Start Guide

Get started with SnapAsset API in 5 minutes.

## Prerequisites

- Node.js 18+
- Redis (or use in-memory queue)
- Supabase account
- OpenAI API key

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/darshanpania/snapasset.git
cd snapasset/server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3001
NODE_ENV=development

# Supabase (get from https://app.supabase.com)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# OpenAI (get from https://platform.openai.com)
OPENAI_API_KEY=sk-xxxxx

# Redis (optional - will use memory if not provided)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 4. Start Redis (Optional)

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**Docker:**
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

**Skip Redis:**
If you don't start Redis, the queue will use in-memory storage (fine for development).

### 5. Start Server

```bash
# Terminal 1: Start API server
npm run dev

# Terminal 2: Start worker
npm run worker
```

You should see:
```
🚀 SnapAsset API Server
📝 Environment: development
🌐 Server: http://localhost:3001
📚 API Docs: http://localhost:3001/api-docs
🔗 Health: http://localhost:3001/health
```

## First API Call

### 1. Check Health

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "uptime": 5.234,
  "environment": "development",
  "services": {
    "supabase": true,
    "redis": true,
    "openai": true
  }
}
```

### 2. Create Your First Job

```bash
curl -X POST http://localhost:3001/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "prompt": "A beautiful sunset over mountains",
    "platforms": ["instagram-post"]
  }'
```

Response:
```json
{
  "jobId": "gen-1706102400-abc123",
  "status": "queued",
  "message": "Job created successfully",
  "estimatedTime": "15 seconds"
}
```

### 3. Check Job Status

```bash
curl http://localhost:3001/api/jobs/gen-1706102400-abc123
```

Response (while processing):
```json
{
  "jobId": "gen-1706102400-abc123",
  "status": "active",
  "progress": 45,
  "logs": [
    "Starting DALL-E image generation...",
    "Image generated successfully",
    "Processing Instagram Post..."
  ],
  "createdAt": "2026-01-24T10:00:00Z"
}
```

Response (completed):
```json
{
  "jobId": "gen-1706102400-abc123",
  "status": "completed",
  "progress": 100,
  "result": {
    "success": true,
    "generationId": "uuid-here",
    "images": [
      {
        "platform": "Instagram Post",
        "url": "https://storage.supabase.co/...",
        "width": 1080,
        "height": 1080,
        "size": 245000
      }
    ]
  },
  "finishedAt": "2026-01-24T10:00:35Z"
}
```

## Interactive Documentation

Open http://localhost:3001/api-docs in your browser to:

- 📖 Browse all endpoints
- 🧪 Test API calls interactively
- 📑 View request/response examples
- 📝 Copy code snippets
- ⬇️ Download OpenAPI spec

## Real-time Updates

Monitor job progress in real-time:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Job Monitor</title>
</head>
<body>
  <h1>Job Progress</h1>
  <div id="status">Connecting...</div>
  <div id="progress">0%</div>
  <div id="logs"></div>

  <script>
    const jobId = 'gen-1706102400-abc123';
    const eventSource = new EventSource(
      `http://localhost:3001/api/sse/jobs/${jobId}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      document.getElementById('status').textContent = data.status;
      document.getElementById('progress').textContent = data.progress + '%';
      
      if (data.type === 'done') {
        console.log('Completed!', data.result);
        eventSource.close();
      }
    };
  </script>
</body>
</html>
```

## Using with Frontend

### React Example

```jsx
import { useState, useEffect } from 'react';

function ImageGenerator() {
  const [jobId, setJobId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [images, setImages] = useState([]);

  async function generateImages() {
    const response = await fetch('http://localhost:3001/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        prompt: 'A beautiful sunset',
        platforms: ['instagram-post', 'twitter-post'],
      }),
    });

    const { jobId } = await response.json();
    setJobId(jobId);
  }

  useEffect(() => {
    if (!jobId) return;

    const eventSource = new EventSource(
      `http://localhost:3001/api/sse/jobs/${jobId}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      setProgress(data.progress);
      
      if (data.type === 'done' && data.result) {
        setImages(data.result.images);
        eventSource.close();
      }
    };

    return () => eventSource.close();
  }, [jobId]);

  return (
    <div>
      <button onClick={generateImages}>Generate</button>
      {progress > 0 && <progress value={progress} max="100" />}
      {images.map(img => (
        <img key={img.url} src={img.url} alt={img.platform} />
      ))}
    </div>
  );
}
```

## Available Platforms

| Platform | ID | Dimensions |
|----------|----|------------|
| Instagram Post | `instagram-post` | 1080x1080 |
| Instagram Story | `instagram-story` | 1080x1920 |
| Twitter Post | `twitter-post` | 1200x675 |
| Twitter Header | `twitter-header` | 1500x500 |
| Facebook Post | `facebook-post` | 1200x630 |
| Facebook Cover | `facebook-cover` | 820x312 |
| LinkedIn Post | `linkedin-post` | 1200x627 |
| YouTube Thumbnail | `youtube-thumbnail` | 1280x720 |

## Testing

Run the test suite:

```bash
npm test
```

With coverage:

```bash
npm run test:coverage
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment instructions.

## Next Steps

1. 📖 Read the [API Guide](./API_GUIDE.md)
2. 🛡️ Review [Security Guide](./SECURITY.md)
3. ⚡ Check [Performance Guide](./PERFORMANCE.md)
4. 🚀 Deploy to [Railway](./DEPLOYMENT.md#railway-deployment)
5. 📊 Set up [Monitoring](./DEPLOYMENT.md#monitoring--scaling)

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use different port
PORT=3002 npm run dev
```

### Redis Connection Failed

```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# Or skip Redis (use memory)
unset REDIS_HOST
npm run dev
```

### OpenAI API Error

```bash
# Verify API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Check quota
# Go to: https://platform.openai.com/usage
```

### Worker Not Processing

```bash
# Make sure worker is running
npm run worker

# Check worker logs
# Should see: "🎨 Image generation worker started"
```

## Getting Help

- 📚 Documentation: http://localhost:3001/api-docs
- 🐛 Issues: https://github.com/darshanpania/snapasset/issues
- 💬 Discussions: https://github.com/darshanpania/snapasset/discussions
- ✉️ Email: support@snapasset.com

## What's Next?

Now that your API is running:

1. ✅ Create jobs via API
2. ✅ Monitor with SSE
3. ✅ Test different platforms
4. ✅ Integrate with frontend
5. ✅ Deploy to production

Happy coding! 🎉