import { vi } from 'vitest'

// Mock user object
export const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  email_confirmed_at: '2026-01-24T14:00:00Z',
  created_at: '2026-01-24T14:00:00Z',
  last_sign_in_at: '2026-01-24T14:00:00Z',
  user_metadata: {
    full_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
  },
  app_metadata: {},
}

// Mock session object
export const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
  user: mockUser,
}

// Mock Supabase auth methods
export const mockSupabaseAuth = {
  getSession: vi.fn(() => Promise.resolve({ data: { session: mockSession }, error: null })),
  signUp: vi.fn(() => Promise.resolve({ data: { user: mockUser }, error: null })),
  signInWithPassword: vi.fn(() => Promise.resolve({ data: { session: mockSession }, error: null })),
  signInWithOtp: vi.fn(() => Promise.resolve({ data: {}, error: null })),
  signInWithOAuth: vi.fn(() => Promise.resolve({ data: {}, error: null })),
  signOut: vi.fn(() => Promise.resolve({ error: null })),
  updateUser: vi.fn(() => Promise.resolve({ data: { user: mockUser }, error: null })),
  resetPasswordForEmail: vi.fn(() => Promise.resolve({ data: {}, error: null })),
  onAuthStateChange: vi.fn(() => ({
    data: {
      subscription: {
        unsubscribe: vi.fn(),
      },
    },
  })),
}

// Mock Supabase client
export const mockSupabase = {
  auth: mockSupabaseAuth,
  from: vi.fn(() => ({
    select: vi.fn(() => Promise.resolve({ data: [], error: null })),
    insert: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    update: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    delete: vi.fn(() => Promise.resolve({ data: {}, error: null })),
  })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      download: vi.fn(() => Promise.resolve({ data: new Blob(), error: null })),
      remove: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    })),
  },
}

// Mock Supabase module
vi.mock('../services/supabase', () => ({
  supabase: mockSupabase,
}))