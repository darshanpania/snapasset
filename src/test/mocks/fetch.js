import { vi } from 'vitest'

// Mock fetch for API calls
global.fetch = vi.fn((url, options) => {
  // Mock successful image generation
  if (url.includes('/api/generate')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        success: true,
        images: [
          {
            preset: {
              id: 'instagram-post',
              name: 'Instagram Post',
              width: 1080,
              height: 1080,
              icon: '📷',
            },
            url: 'data:image/png;base64,mockbase64data',
            size: 245000,
            timestamp: '2026-01-24T14:00:00Z',
          },
        ],
        count: 1,
      }),
    })
  }

  // Mock platforms endpoint
  if (url.includes('/api/platforms')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        success: true,
        platforms: [],
        count: 0,
      }),
    })
  }

  // Default mock response
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
  })
})

export { fetch }