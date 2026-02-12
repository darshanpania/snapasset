import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import request from 'supertest'
import express from 'express'
import imageRoutes from '../routes/images.js'

// Mock dependencies
jest.unstable_mockModule('../services/imageService.js', () => ({
  generateImagesFromPrompt: jest.fn(),
  getPlatformPresets: jest.fn(),
}))

jest.unstable_mockModule('../utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}))

const { generateImagesFromPrompt, getPlatformPresets } = await import('../services/imageService.js')

// Create test app
const createTestApp = () => {
  const app = express()
  app.use(express.json())
  app.locals.supabase = { auth: { getUser: jest.fn() } }
  app.use('/api', imageRoutes)
  return app
}

describe('Image Routes', () => {
  let app

  beforeEach(() => {
    app = createTestApp()
    jest.clearAllMocks()
  })

  describe('GET /api/platforms', () => {
    it('returns platform presets', async () => {
      const mockPresets = [
        { id: 'instagram-post', name: 'Instagram Post', width: 1080, height: 1080 },
        { id: 'twitter-post', name: 'Twitter Post', width: 1200, height: 675 },
      ]
      
      getPlatformPresets.mockReturnValue(mockPresets)

      const response = await request(app)
        .get('/api/platforms')
        .expect(200)

      expect(response.body).toEqual({
        success: true,
        platforms: mockPresets,
        count: 2,
      })
    })

    it('handles errors gracefully', async () => {
      getPlatformPresets.mockImplementation(() => {
        throw new Error('Database error')
      })

      const response = await request(app)
        .get('/api/platforms')
        .expect(500)

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to fetch platform presets',
      })
    })
  })

  describe('POST /api/generate', () => {
    it('generates images successfully', async () => {
      const mockImages = [
        {
          preset: { id: 'instagram-post', name: 'Instagram Post' },
          url: 'data:image/png;base64,mockdata',
          size: 250000,
        },
      ]
      
      generateImagesFromPrompt.mockResolvedValue(mockImages)

      const response = await request(app)
        .post('/api/generate')
        .send({
          prompt: 'A beautiful sunset',
          presets: ['instagram-post'],
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.images).toEqual(mockImages)
      expect(response.body.count).toBe(1)
    })

    it('validates prompt is required', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          presets: ['instagram-post'],
        })
        .expect(400)

      expect(response.body).toEqual({
        success: false,
        error: 'Prompt is required and must be a non-empty string',
      })
    })

    it('validates prompt is not empty', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          prompt: '   ',
          presets: ['instagram-post'],
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('validates presets are required', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          prompt: 'Test prompt',
        })
        .expect(400)

      expect(response.body).toEqual({
        success: false,
        error: 'At least one preset must be selected',
      })
    })

    it('validates presets is an array', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          prompt: 'Test prompt',
          presets: 'not-an-array',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('validates maximum 10 presets', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          prompt: 'Test prompt',
          presets: Array(11).fill('instagram-post'),
        })
        .expect(400)

      expect(response.body).toEqual({
        success: false,
        error: 'Maximum 10 presets allowed per request',
      })
    })

    it('handles API key not configured error', async () => {
      generateImagesFromPrompt.mockRejectedValue(new Error('OpenAI API key not configured'))

      const response = await request(app)
        .post('/api/generate')
        .send({
          prompt: 'Test prompt',
          presets: ['instagram-post'],
        })
        .expect(503)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('not configured')
    })

    it('handles rate limit error', async () => {
      generateImagesFromPrompt.mockRejectedValue(new Error('OpenAI rate limit exceeded'))

      const response = await request(app)
        .post('/api/generate')
        .send({
          prompt: 'Test prompt',
          presets: ['instagram-post'],
        })
        .expect(429)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Rate limit')
    })

    it('handles general errors', async () => {
      generateImagesFromPrompt.mockRejectedValue(new Error('Unknown error'))

      const response = await request(app)
        .post('/api/generate')
        .send({
          prompt: 'Test prompt',
          presets: ['instagram-post'],
        })
        .expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Failed to generate images. Please try again.')
    })
  })

  describe('POST /api/images/upload', () => {
    it('validates file is provided', async () => {
      const response = await request(app)
        .post('/api/images/upload')
        .expect(400)

      expect(response.body).toEqual({
        success: false,
        error: 'No image file provided',
      })
    })

    it('handles missing Supabase configuration', async () => {
      app.locals.supabase = null

      const response = await request(app)
        .post('/api/images/upload')
        .attach('image', Buffer.from('fake-image'), 'test.png')
        .expect(503)

      expect(response.body).toEqual({
        success: false,
        error: 'Storage service not configured',
      })
    })
  })
})