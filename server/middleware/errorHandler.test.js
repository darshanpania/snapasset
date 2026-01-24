import { jest, describe, it, expect, beforeEach } from '@jest/globals'
import { errorHandler, notFoundHandler } from '../middleware/errorHandler.js'

describe('Error Handler Middleware', () => {
  let req, res, next

  beforeEach(() => {
    req = {
      url: '/test',
      method: 'GET',
      path: '/test',
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
    next = jest.fn()
  })

  describe('errorHandler', () => {
    it('handles multer file size errors', () => {
      const err = {
        name: 'MulterError',
        code: 'LIMIT_FILE_SIZE',
        message: 'File too large',
      }

      errorHandler(err, req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'File too large. Maximum size is 10MB.',
      })
    })

    it('handles generic multer errors', () => {
      const err = {
        name: 'MulterError',
        message: 'Invalid file type',
      }

      errorHandler(err, req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Upload error: Invalid file type',
      })
    })

    it('handles validation errors', () => {
      const err = {
        name: 'ValidationError',
        message: 'Invalid input',
      }

      errorHandler(err, req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid input',
      })
    })

    it('handles errors with custom status code', () => {
      const err = {
        statusCode: 403,
        message: 'Forbidden',
      }

      errorHandler(err, req, res, next)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        details: undefined,
      })
    })

    it('includes stack trace in development mode', () => {
      process.env.NODE_ENV = 'development'
      const err = {
        message: 'Test error',
        stack: 'Error stack trace',
      }

      errorHandler(err, req, res, next)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: 'Error stack trace',
        })
      )
    })

    it('hides stack trace in production mode', () => {
      process.env.NODE_ENV = 'production'
      const err = {
        message: 'Test error',
        stack: 'Error stack trace',
      }

      errorHandler(err, req, res, next)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: undefined,
        })
      )
    })
  })

  describe('notFoundHandler', () => {
    it('returns 404 status', () => {
      notFoundHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
    })

    it('includes request path in response', () => {
      notFoundHandler(req, res)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/test',
          method: 'GET',
        })
      )
    })

    it('returns proper error structure', () => {
      notFoundHandler(req, res)

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Route not found',
        path: '/test',
        method: 'GET',
      })
    })
  })
})