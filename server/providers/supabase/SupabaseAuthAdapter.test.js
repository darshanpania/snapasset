import SupabaseAuthAdapter from './SupabaseAuthAdapter.js'

describe('SupabaseAuthAdapter', () => {
  let adapter
  let mockSupabaseClient

  beforeEach(() => {
    mockSupabaseClient = {
      auth: {
        getUser: vi.fn(),
      },
    }
    adapter = new SupabaseAuthAdapter(mockSupabaseClient)
  })

  describe('constructor', () => {
    it('stores the supabase client instance', () => {
      expect(adapter.supabase).toBe(mockSupabaseClient)
    })
  })

  describe('verifyToken', () => {
    it('calls supabase.auth.getUser with the token and returns user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'authenticated',
      }
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await adapter.verifyToken('valid-token-abc')

      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledWith('valid-token-abc')
      expect(result).toEqual(mockUser)
    })

    it('throws "Invalid token" when supabase returns an error', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Token expired' },
      })

      await expect(adapter.verifyToken('expired-token'))
        .rejects
        .toThrow('Invalid token')
    })

    it('throws "Invalid token" when user is null with no error', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await expect(adapter.verifyToken('bad-token'))
        .rejects
        .toThrow('Invalid token')
    })
  })
})
