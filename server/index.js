import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import path from 'path'
import { fileURLToPath } from 'url'

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const isProduction = process.env.NODE_ENV === 'production'

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

let supabase = null
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey)
} else {
  console.warn('⚠️  Supabase credentials not configured. Some features will be limited.')
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false,
  crossOriginEmbedderPolicy: false
}))

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:5173',
  'http://localhost:3000'
]

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))

// Logging middleware
if (isProduction) {
  app.use(morgan('combined'))
} else {
  app.use(morgan('dev'))
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Request tracking middleware
app.use((req, res, next) => {
  req.requestId = Math.random().toString(36).substring(7)
  req.startTime = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - req.startTime
    if (duration > 1000) {
      console.warn(`⚠️ Slow request: ${req.method} ${req.path} - ${duration}ms`)
    }
  })
  
  next()
})

// Health check endpoint - Basic
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Detailed health check endpoint
app.get('/health/detailed', async (req, res) => {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'snapasset-api',
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime()),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
    },
    checks: {
      supabase: 'unknown',
      api: 'ok'
    }
  }

  // Check Supabase connection
  if (supabase) {
    try {
      const { error } = await supabase.from('profiles').select('count').limit(1).single()
      healthCheck.checks.supabase = error ? 'error' : 'ok'
      if (error && error.code !== 'PGRST116') { // Ignore "no rows" error
        healthCheck.checks.supabase = 'error'
      }
    } catch (error) {
      healthCheck.checks.supabase = 'error'
      console.error('Supabase health check failed:', error.message)
    }
  } else {
    healthCheck.checks.supabase = 'not_configured'
  }

  // Determine overall status
  const hasErrors = Object.values(healthCheck.checks).some(status => status === 'error')
  healthCheck.status = hasErrors ? 'degraded' : 'ok'

  const statusCode = hasErrors ? 503 : 200
  res.status(statusCode).json(healthCheck)
})

// Readiness probe for Railway
app.get('/ready', async (req, res) => {
  // Check if essential services are ready
  const checks = {
    server: true,
    supabase: false
  }

  if (supabase) {
    try {
      await supabase.from('profiles').select('count').limit(1)
      checks.supabase = true
    } catch (error) {
      console.error('Readiness check - Supabase not ready:', error.message)
    }
  } else {
    checks.supabase = true // Skip if not configured
  }

  const isReady = Object.values(checks).every(check => check)
  const statusCode = isReady ? 200 : 503

  res.status(statusCode).json({
    ready: isReady,
    checks,
    timestamp: new Date().toISOString()
  })
})

// Liveness probe for Railway
app.get('/live', (req, res) => {
  res.json({
    alive: true,
    timestamp: new Date().toISOString()
  })
})

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'SnapAsset API',
    version: '0.1.0',
    description: 'AI-powered image generation for multiple platforms',
    endpoints: {
      health: '/health',
      healthDetailed: '/health/detailed',
      ready: '/ready',
      live: '/live',
      api: '/api',
      generate: '/api/generate',
      upload: '/api/images/upload'
    },
    documentation: process.env.API_DOCS_URL || 'Coming soon'
  })
})

// Placeholder route for image generation
app.post('/api/generate', async (req, res) => {
  try {
    // TODO: Implement image generation logic
    res.json({
      message: 'Image generation endpoint',
      status: 'not_implemented',
      note: 'This endpoint will handle image generation requests'
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      requestId: req.requestId
    })
  }
})

// Placeholder route for image uploads
app.post('/api/images/upload', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        error: 'Supabase not configured',
        message: 'Please configure SUPABASE_URL and SUPABASE_SERVICE_KEY'
      })
    }

    // TODO: Implement image upload to Supabase Storage
    res.json({
      message: 'Image upload endpoint',
      status: 'not_implemented',
      note: 'This endpoint will handle image uploads to Supabase Storage'
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      requestId: req.requestId
    })
  }
})

// Serve static files in production
if (isProduction) {
  const distPath = path.join(__dirname, '..', 'dist')
  
  // Serve static assets
  app.use(express.static(distPath, {
    maxAge: '1y',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      // Cache static assets aggressively
      if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      }
    }
  }))

  // SPA fallback - serve index.html for all other routes
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next()
    }
    
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) {
        res.status(500).send('Error loading application')
      }
    })
  })
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack)
  
  const errorResponse = {
    error: 'Something went wrong',
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  }

  if (!isProduction) {
    errorResponse.message = err.message
    errorResponse.stack = err.stack
  }

  res.status(err.status || 500).json(errorResponse)
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    requestId: req.requestId
  })
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Performing graceful shutdown...')
  
  server.close(() => {
    console.log('Server closed. Exiting process.')
    process.exit(0)
  })

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout')
    process.exit(1)
  }, 30000)
})

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('╔══════════════════════════════════════════╗')
  console.log('║      🚀 SnapAsset API Server             ║')
  console.log('╚══════════════════════════════════════════╝')
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 Port: ${PORT}`)
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`)
  console.log(`🔗 API info: http://0.0.0.0:${PORT}/api`)
  
  if (isProduction) {
    console.log(`📦 Serving static files from dist/`)
  }
  
  if (!supabase) {
    console.log('⚠️  Warning: Supabase not configured')
  } else {
    console.log('✅ Supabase connected')
  }
  
  console.log('═════════════════════════════════════════════')
})

export default app
