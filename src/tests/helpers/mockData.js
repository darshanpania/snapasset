// Mock data for testing

export const mockPrompts = [
  'A serene mountain landscape at sunset',
  'Modern minimalist logo with geometric shapes',
  'Abstract digital art with flowing colors',
]

export const mockPlatformPresets = {
  instagram: {
    name: 'Instagram',
    icon: '📷',
    category: 'social',
    dimensions: [
      { label: 'Post (Square)', width: 1080, height: 1080 },
      { label: 'Story', width: 1080, height: 1920 },
    ],
  },
  twitter: {
    name: 'Twitter/X',
    icon: '🐦',
    category: 'social',
    dimensions: [
      { label: 'Post', width: 1200, height: 675 },
    ],
  },
}

export const mockGeneratedImages = [
  {
    platform: 'Instagram',
    label: 'Post (Square)',
    width: 1080,
    height: 1080,
    icon: '📷',
    url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    fileSize: 250000,
  },
  {
    platform: 'Twitter',
    label: 'Post',
    width: 1200,
    height: 675,
    icon: '🐦',
    url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    fileSize: 180000,
  },
]

export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  email_confirmed_at: '2026-01-24T14:00:00Z',
  created_at: '2026-01-24T14:00:00Z',
  last_sign_in_at: '2026-01-24T14:00:00Z',
  user_metadata: {
    full_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
  },
}

export const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: mockUser,
}