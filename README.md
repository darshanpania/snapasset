# SnapAsset 🎨

**AI-Powered Multi-Platform Asset Generator**

Generate stunning AI images optimized for 20+ social media platforms instantly using DALL-E 3.

## ✨ Features

### Core Features
- 🤖 **AI Image Generation** - Powered by OpenAI DALL-E 3
- 🎯 **20+ Platform Presets** - Instagram, Twitter, Facebook, LinkedIn, YouTube, and more
- 🔄 **Automatic Resizing** - Smart cropping for each platform
- 📦 **Batch Download** - Download all sizes as ZIP
- 💾 **Cloud Storage** - Secure storage via Supabase

### Advanced Features
- 🔐 **Authentication** - 5 auth methods (email, magic link, Google, GitHub, Discord)
- 📊 **Generation History** - Track all your creations
- ⚙️ **Background Jobs** - Async processing with Bull queue
- 🔴 **Real-time Updates** - Live job status via Server-Sent Events
- 🔁 **Auto-Retry** - Intelligent retry logic for failed jobs
- 📊 **Queue Dashboard** - Monitor job processing in real-time

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Redis (optional, uses in-memory fallback)
- Supabase account
- OpenAI API key

### Installation

```bash
# Clone repository
git clone https://github.com/darshanpania/snapasset.git
cd snapasset

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

### Configuration

**Frontend** (`.env`):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3001
```

**Backend** (`server/.env`):
```env
PORT=3001
NODE_ENV=development

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

OPENAI_API_KEY=sk-your-openai-key

# Optional: Redis for production
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Run Development

```bash
# Terminal 1: Start frontend
npm run dev

# Terminal 2: Start API server
cd server
npm run dev

# Terminal 3: Start worker process
cd server
npm run worker:dev

# Optional: Start Redis (with Docker)
docker-compose up -d
```

Access:
- **Frontend**: http://localhost:5173
- **API**: http://localhost:3001
- **Redis UI**: http://localhost:8081

## 🎨 Usage

### 1. Generate Images

```javascript
import { createGenerationJob } from './services/jobQueue'

// Create job
const { jobId, generationId } = await createGenerationJob(
  userId,
  'A beautiful sunset over mountains',
  ['instagram-post', 'twitter-post', 'facebook-post'],
  'vivid'
)

console.log('Job created:', jobId)
```

### 2. Monitor Progress (Real-time)

```javascript
import { subscribeToJobUpdates } from './services/jobQueue'

const unsubscribe = subscribeToJobUpdates(jobId, {
  onUpdate: (data) => {
    console.log(`Progress: ${data.progress}%`)
  },
  onComplete: (data) => {
    console.log('Images ready!', data.result.images)
  },
})
```

### 3. Use React Component

```jsx
import JobMonitor from './components/jobs/JobMonitor'

function MyComponent() {
  const [jobId, setJobId] = useState(null)

  return (
    <div>
      {jobId && (
        <JobMonitor
          jobId={jobId}
          onComplete={(result) => setImages(result.images)}
        />
      )}
    </div>
  )
}
```

## 📚 Documentation

- **[Job Queue Guide](server/docs/JOB_QUEUE_GUIDE.md)** - Comprehensive job queue documentation
- **[Architecture](server/docs/ARCHITECTURE.md)** - System architecture details
- **[API Reference](server/README.md)** - Complete API documentation
- **[Deployment Guide](#deployment)** - Production deployment instructions

## 🧩 Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client
- **Supabase Client** - Auth & database

### Backend
- **Node.js + Express** - API server
- **Bull** - Job queue
- **Redis/IORedis** - Queue storage
- **OpenAI** - DALL-E 3 integration
- **Sharp** - Image processing
- **Supabase** - Auth, database, storage
- **Winston** - Logging

### Infrastructure
- **Supabase** - Backend as a Service
- **Railway** - Deployment platform
- **Redis** - Queue persistence
- **GitHub Actions** - CI/CD

## ⚙️ Job Queue System

### Why Background Jobs?

Image generation takes 2-5 minutes:
- 🔴 **Without queue**: Request timeout, poor UX
- ✅ **With queue**: Instant response, real-time updates

### Architecture

1. **API Server**: Receives requests, enqueues jobs
2. **Redis**: Stores job queue persistently
3. **Worker**: Processes jobs in background
4. **SSE**: Real-time updates to client

### Features

✅ **Async Processing** - Non-blocking operations  
✅ **Auto-Retry** - 3 attempts with exponential backoff  
✅ **Priority Queue** - Premium users get faster processing  
✅ **Real-time Updates** - Live progress via SSE  
✅ **Job Monitoring** - Built-in statistics dashboard  
✅ **Cleanup Jobs** - Automatic old file cleanup  
✅ **Scalable** - Add workers as needed  

### API Endpoints

```bash
# Create job
POST /api/jobs/generate

# Get status
GET /api/jobs/:jobId

# Real-time updates
GET /api/sse/jobs/:jobId

# Queue stats
GET /api/jobs/stats/overview
```

See [Server README](server/README.md) for complete API documentation.

## 🧪 Testing

### Run Tests

```bash
# Frontend tests
npm test
npm run test:coverage

# Backend tests
cd server
npm test
npm run test:coverage
```

### Test Coverage

- **Frontend**: 73+ tests, 85%+ coverage
- **Backend**: 51+ tests, 80%+ coverage
- **Job Queue**: Comprehensive integration tests
- **Total**: 124+ automated tests

## 🚀 Deployment

### Railway (Recommended)

**1. Add Redis Service**
```bash
# In Railway dashboard
# Add Redis plugin
# Copy REDIS_URL
```

**2. Deploy API Server**
```bash
# Connect GitHub repo
# Set environment variables
# Deploy automatically
```

**3. Deploy Worker**
```bash
# Create new service
# Use railway.worker.json config
# Start command: cd server && npm run worker
```

**4. Environment Variables**
```env
NODE_ENV=production
REDIS_URL=rediss://...
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...
ALLOWED_ORIGINS=https://your-app.com
```

### Manual Deployment

See [Deployment Guide](server/docs/DEPLOYMENT.md) for detailed instructions.

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "ok",
  "uptime": 3600,
  "services": {
    "supabase": true,
    "redis": true,
    "queues": {
      "imageGeneration": { "waiting": 2, "active": 1 }
    }
  }
}
```

### Queue Dashboard

Access real-time queue statistics:
```jsx
import QueueDashboard from './components/jobs/QueueDashboard'

function AdminPage() {
  return <QueueDashboard />
}
```

### Logs

**Development**:
```bash
cd server
npm run dev
# Logs to console
```

**Production**:
```bash
# View logs
tail -f server/logs/combined.log
tail -f server/logs/error.log
```

## 🐛 Troubleshooting

### Jobs Not Processing

**Check**:
1. Worker process running?
2. Redis connected?
3. OpenAI API key valid?

**Fix**:
```bash
# Restart worker
npm run worker

# Check Redis
redis-cli ping

# View logs
tail -f logs/error.log
```

### High Queue Depth

**Symptom**: Many jobs waiting

**Solution**: Add more workers
```bash
# Start additional worker
node server/workers/index.js
```

## 📝 Project Structure

```
snapasset/
├── src/                      # Frontend React app
│   ├── components/
│   │   ├── auth/            # Authentication components
│   │   └── jobs/            # Job monitoring components
│   ├── hooks/               # React hooks (useJobStatus)
│   ├── services/            # API services (jobQueue)
│   └── contexts/            # React contexts (AuthContext)
├── server/                  # Backend API
│   ├── config/              # Configuration
│   │   ├── redis.js        # Redis setup
│   │   └── queue.js        # Queue configuration
│   ├── routes/              # API routes
│   │   ├── jobs.js         # Job management
│   │   └── sse.js          # Real-time updates
│   ├── workers/             # Job processors
│   │   ├── index.js        # Worker entry point
│   │   ├── imageProcessor.js
│   │   └── cleanupProcessor.js
│   ├── utils/               # Utilities
│   │   ├── logger.js       # Winston logger
│   │   └── jobHelpers.js   # Job utilities
│   ├── __tests__/           # Tests
│   └── docs/                # Documentation
├── docker-compose.yml       # Redis local setup
└── railway.json             # Railway deployment config
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 👤 Author

**Darshan Pania**
- GitHub: [@darshanpania](https://github.com/darshanpania)

## 🚀 Roadmap

- [x] Core image generation
- [x] Platform presets (20+)
- [x] Authentication system
- [x] Database integration
- [x] Storage system
- [x] Testing infrastructure
- [x] **Background job processing**
- [ ] API documentation (Swagger)
- [ ] Project management
- [ ] Analytics dashboard
- [ ] Premium features

## ⭐ Show Your Support

Give a ⭐ if this project helped you!

## 💬 Support

For issues and questions:
- 🐛 [GitHub Issues](https://github.com/darshanpania/snapasset/issues)
- 📧 Email: support@snapasset.com

---

**Built with ❤️ using React, Node.js, OpenAI, and Supabase**