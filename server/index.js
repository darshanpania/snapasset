import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import imageRoutes from './routes/images.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import logger from './utils/logger.js'

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
  logger.info('Supabase client initialized')
} else {
  logger.warn('Supabase credentials not configured. Some features will be limited.')
}

// Make supabase available to routes
app.locals.supabase = supabase

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true
}))
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    supabaseConnected: !!supabase,
    openaiConfigured: !!process.env.OPENAI_API_KEY
  })
})

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'SnapAsset API',
    version: '0.1.0',
    endpoints: {
      health: 'GET /health - Health check',
      api: 'GET /api - API information',
      generate: 'POST /api/generate - Generate images from prompt',
      upload: 'POST /api/images/upload - Upload image',
      platforms: 'GET /api/platforms - Get available platforms'
    },
    documentation: 'https://github.com/darshanpania/snapasset'
  })
})

// API Routes
app.use('/api', imageRoutes)

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 SnapAsset API Server running on port ${PORT}`)
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`)
  logger.info(`🔗 API info: http://localhost:${PORT}/api`)
  
  if (!process.env.OPENAI_API_KEY) {
    logger.warn('⚠️  OpenAI API key not configured. Image generation will not work.')
  }
  
  if (!supabase) {
    logger.warn('⚠️  Supabase not configured. Storage features will be limited.')
  }
})

export default app