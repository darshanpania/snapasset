import express from 'express'
import multer from 'multer'
import { generateImagesFromPrompt, getPlatformPresets } from '../services/imageService.js'
import logger from '../utils/logger.js'

const router = express.Router()

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'))
    }
  }
})

// Get available platform presets
router.get('/platforms', (req, res) => {
  try {
    const presets = getPlatformPresets()
    res.json({
      success: true,
      platforms: presets,
      count: presets.length
    })
  } catch (error) {
    logger.error('Error fetching platforms:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch platform presets'
    })
  }
})

// Generate images from text prompt
router.post('/generate', async (req, res) => {
  try {
    const { prompt, presets } = req.body

    // Validation
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required and must be a non-empty string'
      })
    }

    if (!presets || !Array.isArray(presets) || presets.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one preset must be selected'
      })
    }

    if (presets.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 presets allowed per request'
      })
    }

    logger.info(`Generating images for prompt: "${prompt.substring(0, 50)}..." with ${presets.length} presets`)

    // Generate images
    const result = await generateImagesFromPrompt(prompt, presets)

    res.json({
      success: true,
      prompt: prompt,
      images: result,
      count: result.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Error generating images:', error)
    
    if (error.message.includes('API key')) {
      return res.status(503).json({
        success: false,
        error: 'Image generation service not configured. Please contact administrator.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }

    if (error.message.includes('rate limit')) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }

    res.status(500).json({
      success: false,
      error: 'Failed to generate images. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// Upload and process image
router.post('/images/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      })
    }

    const supabase = req.app.locals.supabase
    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: 'Storage service not configured'
      })
    }

    logger.info(`Image upload received: ${req.file.originalname} (${req.file.size} bytes)`)

    // TODO: Implement upload to Supabase Storage
    // This is a placeholder for future implementation
    res.json({
      success: true,
      message: 'Image upload endpoint - implementation pending',
      file: {
        name: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
      }
    })

  } catch (error) {
    logger.error('Error uploading image:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to upload image',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

export default router