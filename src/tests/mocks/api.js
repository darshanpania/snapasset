import { vi } from 'vitest'

// Mock generated images response
export const mockGeneratedImages = [
  {
    preset: {
      id: 'instagram-post',
      name: 'Instagram Post',
      icon: '📷',
      width: 1080,
      height: 1080,
    },
    url: 'data:image/png;base64,mockImageData',
    size: 250000,
    timestamp: '2026-01-24T14:00:00Z',
  },
  {
    preset: {
      id: 'twitter-post',
      name: 'Twitter Post',
      icon: '🐦',
      width: 1200,
      height: 675,
    },
    url: 'data:image/png;base64,mockImageData',
    size: 180000,
    timestamp: '2026-01-24T14:00:00Z',
  },
]

// Mock platform presets response
export const mockPlatformPresets = [
  {
    id: 'instagram-post',
    name: 'Instagram Post',
    platform: 'Instagram',
    icon: '📷',
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
  },
  {
    id: 'twitter-post',
    name: 'Twitter Post',
    platform: 'Twitter',
    icon: '🐦',
    width: 1200,
    height: 675,
    aspectRatio: '16:9',
  },
]

// Mock fetch for API calls
export const mockFetch = vi.fn()

export function setupFetchMock() {
  global.fetch = mockFetch
  
  // Default successful response
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      success: true,
      images: mockGeneratedImages,
      count: mockGeneratedImages.length,
    }),
  })
}

export function mockFetchError(error = 'API Error') {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({
      success: false,
      error: error,
    }),
  })
}

export function resetFetchMock() {
  mockFetch.mockReset()
  setupFetchMock()
}