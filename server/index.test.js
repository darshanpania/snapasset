import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'

// Mock dependencies
jest.unstable_mockModule('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({
    auth: { getUser: jest.fn() },
    from: jest.fn(),
    storage: { from: jest.fn() },
  }),
}))

jest.unstable_mockModule('./routes/images.js', () => ({
  default: jest.fn((req, res) => res.json({ success: true })),
}))

const app = (await import('./index.js')).default

describe('Express Server', () => {
  describe('GET /health', () => {
    it('returns health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)

      expect(response.body).toHaveProperty('status', 'ok')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('uptime')
      expect(response.body).toHaveProperty('environment')
    })

    it('includes service connection status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)

      expect(response.body).toHaveProperty('supabaseConnected')
      expect(response.body).toHaveProperty('openaiConfigured')
    })
  })

  describe('GET /api', () => {
    it('returns API information', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200)

      expect(response.body).toHaveProperty('message', 'SnapAsset API')
      expect(response.body).toHaveProperty('version')
      expect(response.body).toHaveProperty('endpoints')
    })

    it('lists available endpoints', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200)

      expect(response.body.endpoints).toHaveProperty('health')
      expect(response.body.endpoints).toHaveProperty('generate')
      expect(response.body.endpoints).toHaveProperty('platforms')
    })
  })

  describe('404 Handler', () => {
    it('returns 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error', 'Route not found')
      expect(response.body).toHaveProperty('path')
    })
  })

  describe('CORS', () => {
    it('sets CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173')

      expect(response.headers).toHaveProperty('access-control-allow-origin')
    })
  })

  describe('Security Headers', () => {
    it('sets security headers with helmet', async () => {
      const response = await request(app).get('/health')

      expect(response.headers).toHaveProperty('x-content-type-options')
      expect(response.headers).toHaveProperty('x-frame-options')
    })
  })
})