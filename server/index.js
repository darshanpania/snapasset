import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

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
  console.warn('⚠️  Supabase credentials not configured. Some features will be limited.')
}

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true
}))
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    supabaseConnected: !!supabase
  })
})

// API Routes
app.get('/api', (req, res) => {
  res.json({
    message: 'SnapAsset API',
    version: '0.1.0',
    endpoints: {
      health: '/health',
      api: '/api',
      images: '/api/images (Coming soon)',
      generate: '/api/generate (Coming soon)'
    }
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
    res.status(500).json({ error: 'Internal server error' })
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
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SnapAsset API Server running on port ${PORT}`)
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 Health check: http://localhost:${PORT}/health`)
  console.log(`🔗 API info: http://localhost:${PORT}/api`)
  if (!supabase) {
    console.log('⚠️  Warning: Supabase not configured')
  }
})

export default app