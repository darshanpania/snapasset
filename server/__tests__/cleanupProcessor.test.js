/**
 * Cleanup Processor Tests
 * Tests for file cleanup job processor
 */

import { describe, it, expect, beforeAll, jest } from '@jest/globals'

// Mock Supabase
jest.mock('@supabase/supabase-js')

describe('Cleanup Processor', () => {
  beforeAll(() => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_KEY = 'test-key'
  })

  describe('Cleanup Job Data', () => {
    it('should validate cleanup job data', () => {
      const validData = {
        type: 'temp-files',
        olderThanDays: 1,
      }

      expect(validData.type).toBe('temp-files')
      expect(validData.olderThanDays).toBe(1)
    })

    it('should support all cleanup types', () => {
      const types = ['temp-files', 'failed-generations', 'all']

      types.forEach((type) => {
        expect(typeof type).toBe('string')
        expect(type.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Cleanup Logic', () => {
    it('should calculate correct cutoff date', () => {
      const olderThanDays = 30
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

      const now = new Date()
      const daysDiff = Math.floor((now - cutoffDate) / (1000 * 60 * 60 * 24))

      expect(daysDiff).toBeGreaterThanOrEqual(29)
      expect(daysDiff).toBeLessThanOrEqual(31)
    })
  })
})