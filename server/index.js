import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { initRedis } from './config/redis.js'
import { initQueues } from './config/queue.js'
import logger from './utils/logger.js'
import jobRoutes from './routes/jobs.js'
import sseRoutes from './routes/sse.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

let supabase = null
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey)
} else {
  logger.warn('Supabase credentials not configured. Some features will be limited.')
}

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true
}))
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', async (req, res) => {
  const { redisClient, isRedisAvailable } = await import('./config/redis.js')
  const { imageGenerationQueue, fileCleanupQueue } = await import('./config/queue.js')

  let queueHealth = {
    imageGeneration: 'unknown',
    fileCleanup: 'unknown',
  }

  try {
    if (imageGenerationQueue) {
      const counts = await imageGenerationQueue.getJobCounts()
      queueHealth.imageGeneration = counts
    }
    if (fileCleanupQueue) {
      const counts = await fileCleanupQueue.getJobCounts()
      queueHealth.fileCleanup = counts
    }
  } catch (error) {
    logger.error('Error checking queue health', { error: error.message })
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    services: {
      supabase: !!supabase,
      redis: isRedisAvailable,
      queues: queueHealth,
    },
  })
})

// API Routes
app.get('/api', (req, res) => {
  res.json({
    message: 'SnapAsset API with Background Job Processing',
    version: '0.2.0',
    endpoints: {
      health: '/health',
      api: '/api',
      jobs: '/api/jobs',
      sse: '/api/sse',
    },
    documentation: 'https://github.com/darshanpania/snapasset#api',
  })
})

// Mount job routes
app.use('/api/jobs', jobRoutes)

// Mount SSE routes
app.use('/api/sse', sseRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
  })
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  })
})

// Initialize services and start server
async function startServer() {
  try {
    // Initialize Redis
    await initRedis()

    // Initialize queues
    initQueues()

    // Start server
    app.listen(PORT, () => {
      logger.info('SnapAsset API Server started', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        supabaseConnected: !!supabase,
      })
      console.log(`\n🚀 SnapAsset API Server running on port ${PORT}`)
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`🔗 Health check: http://localhost:${PORT}/health`)
      console.log(`🔗 API info: http://localhost:${PORT}/api`)
      if (!supabase) {
        console.log('⚠️  Warning: Supabase not configured')
      }
      console.log('\n💡 API Endpoints:')
      console.log('   POST   /api/jobs/generate - Create image generation job')
      console.log('   GET    /api/jobs/:jobId - Get job status')
      console.log('   GET    /api/jobs/:jobId/result - Get job result')
      console.log('   POST   /api/jobs/:jobId/retry - Retry failed job')
      console.log('   DELETE /api/jobs/:jobId - Cancel job')
      console.log('   GET    /api/jobs/stats/overview - Get queue statistics')
      console.log('   GET    /api/sse/jobs/:jobId - Real-time job updates (SSE)')
      console.log('   GET    /api/sse/stats - Real-time queue stats (SSE)')
      console.log('\n👷 Worker Process:')
      console.log('   Run: npm run worker (or npm run worker:dev for development)')
      console.log()
    })
  } catch (error) {
    logger.error('Failed to start server', { error: error.message })
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  const { closeRedis } = await import('./config/redis.js')
  await closeRedis()
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully')
  const { closeRedis } = await import('./config/redis.js')
  await closeRedis()
  process.exit(0)
})

// Start the server
startServer()

export default app