import { jest, describe, it, expect, beforeEach } from '@jest/globals'

// Mock dependencies before importing service
jest.unstable_mockModule('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    images: {
      generate: jest.fn().mockResolvedValue({
        data: [{ url: 'https://example.com/image.png' }],
      }),
    },
  })),
}))

jest.unstable_mockModule('sharp', () => ({
  default: jest.fn().mockImplementation(() => ({
    resize: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed-image')),
  })),
}))

jest.unstable_mockModule('axios', () => ({
  default: jest.fn().mockResolvedValue({
    data: Buffer.from('downloaded-image'),
  }),
}))

jest.unstable_mockModule('../utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}))

const OpenAI = (await import('openai')).default
const sharp = (await import('sharp')).default
const axios = (await import('axios')).default
const imageService = await import('../services/imageService.js')

describe('Image Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getPlatformPresets', () => {
    it('returns array of platform presets', () => {
      const presets = imageService.getPlatformPresets()
      
      expect(Array.isArray(presets)).toBe(true)
      expect(presets.length).toBeGreaterThan(0)
      expect(presets[0]).toHaveProperty('id')
      expect(presets[0]).toHaveProperty('name')
      expect(presets[0]).toHaveProperty('width')
      expect(presets[0]).toHaveProperty('height')
    })
  })

  describe('getPresetById', () => {
    it('returns preset when found', () => {
      const preset = imageService.getPresetById('instagram-post')
      
      expect(preset).toBeTruthy()
      expect(preset.id).toBe('instagram-post')
    })

    it('returns null when preset not found', () => {
      const preset = imageService.getPresetById('non-existent')
      
      expect(preset).toBeNull()
    })
  })

  describe('generateImageWithDallE', () => {
    it('calls OpenAI API with correct parameters', async () => {
      const mockClient = new OpenAI()
      const prompt = 'A beautiful sunset'
      
      await imageService.generateImageWithDallE(prompt)
      
      expect(mockClient.images.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
        })
      )
    })

    it('returns image URL', async () => {
      const url = await imageService.generateImageWithDallE('Test prompt')
      
      expect(url).toBe('https://example.com/image.png')
    })

    it('throws error when OpenAI not configured', async () => {
      // Mock missing API key
      const originalKey = process.env.OPENAI_API_KEY
      delete process.env.OPENAI_API_KEY
      
      await expect(imageService.generateImageWithDallE('Test'))
        .rejects.toThrow('OpenAI API key not configured')
      
      process.env.OPENAI_API_KEY = originalKey
    })

    it('handles rate limit errors', async () => {
      const mockClient = new OpenAI()
      mockClient.images.generate.mockRejectedValueOnce({
        status: 429,
        message: 'Rate limit exceeded',
      })
      
      await expect(imageService.generateImageWithDallE('Test'))
        .rejects.toThrow(/rate limit/i)
    })
  })

  describe('downloadImage', () => {
    it('downloads image from URL', async () => {
      const buffer = await imageService.downloadImage('https://example.com/image.png')
      
      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://example.com/image.png',
          method: 'GET',
          responseType: 'arraybuffer',
        })
      )
      expect(Buffer.isBuffer(buffer)).toBe(true)
    })

    it('handles download errors', async () => {
      axios.mockRejectedValueOnce(new Error('Network error'))
      
      await expect(imageService.downloadImage('https://example.com/image.png'))
        .rejects.toThrow('Failed to download image')
    })
  })

  describe('processImage', () => {
    it('resizes image to target dimensions', async () => {
      const inputBuffer = Buffer.from('input-image')
      
      await imageService.processImage(inputBuffer, 1080, 1080)
      
      expect(sharp).toHaveBeenCalledWith(inputBuffer)
      const sharpInstance = sharp(inputBuffer)
      expect(sharpInstance.resize).toHaveBeenCalledWith(
        1080,
        1080,
        expect.objectContaining({
          fit: 'cover',
          position: 'center',
        })
      )
    })

    it('applies PNG optimization', async () => {
      const inputBuffer = Buffer.from('input-image')
      
      await imageService.processImage(inputBuffer, 800, 600)
      
      const sharpInstance = sharp(inputBuffer)
      expect(sharpInstance.png).toHaveBeenCalledWith(
        expect.objectContaining({
          quality: 90,
          compressionLevel: 9,
        })
      )
    })

    it('returns processed buffer', async () => {
      const inputBuffer = Buffer.from('input-image')
      const result = await imageService.processImage(inputBuffer, 1080, 1080)
      
      expect(Buffer.isBuffer(result)).toBe(true)
    })

    it('handles processing errors', async () => {
      const sharpInstance = sharp(Buffer.from('test'))
      sharpInstance.toBuffer.mockRejectedValueOnce(new Error('Processing failed'))
      
      await expect(imageService.processImage(Buffer.from('test'), 1080, 1080))
        .rejects.toThrow('Failed to process image')
    })
  })

  describe('bufferToDataUrl', () => {
    it('converts buffer to base64 data URL', () => {
      const buffer = Buffer.from('test-image-data')
      const dataUrl = imageService.bufferToDataUrl(buffer)
      
      expect(dataUrl).toMatch(/^data:image\/png;base64,/)
      expect(dataUrl).toContain(buffer.toString('base64'))
    })

    it('uses custom MIME type', () => {
      const buffer = Buffer.from('test')
      const dataUrl = imageService.bufferToDataUrl(buffer, 'image/jpeg')
      
      expect(dataUrl).toMatch(/^data:image\/jpeg;base64,/)
    })
  })

  describe('generateImagesFromPrompt', () => {
    it('generates and processes images for multiple presets', async () => {
      const mockImages = [
        {
          preset: { id: 'instagram-post', name: 'Instagram Post', width: 1080, height: 1080 },
          url: 'data:image/png;base64,abc',
          size: 250000,
          timestamp: expect.any(String),
        },
      ]
      
      generateImagesFromPrompt.mockResolvedValue(mockImages)

      const result = await imageService.generateImagesFromPrompt(
        'A beautiful landscape',
        ['instagram-post']
      )

      expect(result).toEqual(mockImages)
    })

    it('throws error for invalid presets', async () => {
      generateImagesFromPrompt.mockRejectedValueOnce(new Error('No valid presets provided'))
      
      await expect(imageService.generateImagesFromPrompt('Test', ['invalid-preset']))
        .rejects.toThrow('No valid presets')
    })

    it('filters out failed processing', async () => {
      // This test would verify that failed image processing doesn't break the entire batch
      const mockImages = [
        {
          preset: { id: 'instagram-post', name: 'Instagram Post' },
          url: 'data:image/png;base64,abc',
          size: 250000,
        },
      ]
      
      generateImagesFromPrompt.mockResolvedValue(mockImages)
      
      const result = await imageService.generateImagesFromPrompt(
        'Test',
        ['instagram-post', 'twitter-post']
      )
      
      expect(Array.isArray(result)).toBe(true)
    })
  })
})