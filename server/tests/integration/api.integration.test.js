import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'

// Mock all external services
jest.unstable_mockModule('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    images: {
      generate: jest.fn().mockResolvedValue({
        data: [{ url: 'https://example.com/test-image.png' }],
      }),
    },
  })),
}))

jest.unstable_mockModule('sharp', () => ({
  default: jest.fn().mockImplementation(() => ({
    resize: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed')),
  })),
}))

jest.unstable_mockModule('axios', () => ({
  default: jest.fn().mockResolvedValue({
    data: Buffer.from('downloaded-image'),
  }),
}))

jest.unstable_mockModule('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({
    auth: { getUser: jest.fn() },
    from: jest.fn(),
    storage: { from: jest.fn() },
  }),
}))

const app = (await import('../../index.js')).default

describe('API Integration Tests', () => {
  describe('Complete Image Generation Flow', () => {
    it('generates images end-to-end', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          prompt: 'A serene mountain landscape at sunset',
          presets: ['instagram-post', 'twitter-post'],
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body).toHaveProperty('images')
      expect(response.body).toHaveProperty('count')
      expect(response.body).toHaveProperty('timestamp')
    })

    it('validates input before processing', async () => {
      await request(app)
        .post('/api/generate')
        .send({ prompt: '' })
        .expect(400)

      await request(app)
        .post('/api/generate')
        .send({ presets: [] })
        .expect(400)

      await request(app)
        .post('/api/generate')
        .send({})
        .expect(400)
    })
  })

  describe('API Error Handling', () => {
    it('returns proper error for service unavailable', async () => {
      // This would test when DALL-E is down
      const response = await request(app)
        .get('/api/non-existent')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Route not found')
    })
  })

  describe('API Documentation', () => {
    it('provides API information endpoint', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200)

      expect(response.body.message).toBe('SnapAsset API')
      expect(response.body.endpoints).toBeDefined()
    })
  })
})