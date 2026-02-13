import { jest } from '@jest/globals'

// Mock Supabase client
export const mockSupabaseClient = {
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockResolvedValue({ data: [], error: null }),
    insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
    update: jest.fn().mockResolvedValue({ data: {}, error: null }),
    delete: jest.fn().mockResolvedValue({ data: {}, error: null }),
  }),
  storage: {
    from: jest.fn().mockReturnValue({
      upload: jest.fn().mockResolvedValue({ data: { path: 'test.png' }, error: null }),
      download: jest.fn().mockResolvedValue({ data: Buffer.from('image'), error: null }),
      remove: jest.fn().mockResolvedValue({ data: {}, error: null }),
    }),
  },
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
  },
}

// Mock createClient function
export const mockCreateClient = jest.fn().mockReturnValue(mockSupabaseClient)