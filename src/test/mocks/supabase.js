import { vi } from 'vitest'

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(() => 
      Promise.resolve({ 
        data: { session: null }, 
        error: null 
      })
    ),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } }
    })),
    signUp: vi.fn((credentials) =>
      Promise.resolve({
        data: {
          user: {
            id: 'test-user-id',
            email: credentials.email,
            user_metadata: credentials.options?.data || {},
          },
          session: null,
        },
        error: null,
      })
    ),
    signInWithPassword: vi.fn((credentials) =>
      Promise.resolve({
        data: {
          user: {
            id: 'test-user-id',
            email: credentials.email,
            email_confirmed_at: '2026-01-24T00:00:00Z',
            user_metadata: {},
          },
          session: {
            access_token: 'test-access-token',
            refresh_token: 'test-refresh-token',
          },
        },
        error: null,
      })
    ),
    signInWithOtp: vi.fn(() =>
      Promise.resolve({
        data: {},
        error: null,
      })
    ),
    signInWithOAuth: vi.fn(() =>
      Promise.resolve({
        data: { url: 'https://provider.com/oauth' },
        error: null,
      })
    ),
    signOut: vi.fn(() =>
      Promise.resolve({
        error: null,
      })
    ),
    updateUser: vi.fn((updates) =>
      Promise.resolve({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: updates.data || {},
          },
        },
        error: null,
      })
    ),
    resetPasswordForEmail: vi.fn(() =>
      Promise.resolve({
        data: {},
        error: null,
      })
    ),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
    update: vi.fn(() => Promise.resolve({ data: [], error: null })),
    delete: vi.fn(() => Promise.resolve({ data: [], error: null })),
  })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      download: vi.fn(() => Promise.resolve({ data: new Blob(), error: null })),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/image.png' } })),
    })),
  },
}

// Mock the Supabase module
vi.mock('../services/supabase', () => ({
  supabase: mockSupabaseClient,
}))

export { mockSupabaseClient }