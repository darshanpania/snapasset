import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsService } from '../server/services/AnalyticsService.js';
import { AnalyticsEvent } from '../server/models/Analytics.js';

describe('AnalyticsService', () => {
  let analyticsService;
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(() => ({
        insert: vi.fn(() => ({ select: vi.fn() })),
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
            order: vi.fn(() => ({ limit: vi.fn() })),
            gte: vi.fn(() => ({ order: vi.fn() })),
          })),
          gte: vi.fn(() => ({ order: vi.fn() })),
        })),
      })),
    };

    analyticsService = new AnalyticsService(mockSupabase);
  });

  describe('trackEvent', () => {
    it('should track a valid event', async () => {
      const eventData = {
        user_id: 'user-123',
        event_type: 'image_generated',
        event_category: 'generation',
        platform: 'instagram',
      };

      const mockResponse = {
        data: [{ id: 'event-123', ...eventData }],
        error: null,
      };

      mockSupabase.from = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve(mockResponse)),
        })),
      }));

      const result = await analyticsService.trackEvent(eventData);

      expect(result).toEqual(mockResponse.data[0]);
    });

    it('should reject invalid event', async () => {
      const invalidEvent = {
        // Missing event_type and user_id
        event_category: 'test',
      };

      await expect(analyticsService.trackEvent(invalidEvent)).rejects.toThrow();
    });
  });

  describe('parsePeriod', () => {
    it('should parse period strings correctly', () => {
      expect(analyticsService.parsePeriod('7d')).toBe(7);
      expect(analyticsService.parsePeriod('2w')).toBe(14);
      expect(analyticsService.parsePeriod('1m')).toBe(30);
      expect(analyticsService.parsePeriod('1y')).toBe(365);
    });

    it('should default to 30 days for invalid input', () => {
      expect(analyticsService.parsePeriod('invalid')).toBe(30);
      expect(analyticsService.parsePeriod('')).toBe(30);
    });
  });

  describe('calculateTrends', () => {
    it('should calculate trends correctly', () => {
      const dailyUsage = [
        { images_generated: 5, images_downloaded: 3, api_calls: 15 },
        { images_generated: 7, images_downloaded: 5, api_calls: 20 },
        { images_generated: 10, images_downloaded: 8, api_calls: 30 },
        { images_generated: 12, images_downloaded: 10, api_calls: 35 },
      ];

      const trends = analyticsService.calculateTrends(dailyUsage, 4);

      expect(trends.imagesGenerated.trend).toBe('up');
      expect(parseFloat(trends.imagesGenerated.change)).toBeGreaterThan(0);
    });

    it('should handle empty data', () => {
      const trends = analyticsService.calculateTrends([], 0);

      expect(trends.imagesGenerated.value).toBe(0);
      expect(trends.imagesGenerated.trend).toBe('stable');
    });
  });
});

describe('AnalyticsEvent', () => {
  describe('validation', () => {
    it('should validate required fields', () => {
      const event = new AnalyticsEvent({
        user_id: 'user-123',
        event_type: 'test_event',
      });

      const validation = event.validate();
      expect(validation.isValid).toBe(true);
    });

    it('should reject missing event_type', () => {
      const event = new AnalyticsEvent({
        user_id: 'user-123',
      });

      const validation = event.validate();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Event type is required');
    });

    it('should require either user_id or session_id', () => {
      const event = new AnalyticsEvent({
        event_type: 'test',
      });

      const validation = event.validate();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Either user_id or session_id is required');
    });

    it('should accept session_id without user_id', () => {
      const event = new AnalyticsEvent({
        session_id: 'session-123',
        event_type: 'test',
      });

      const validation = event.validate();
      expect(validation.isValid).toBe(true);
    });
  });
});