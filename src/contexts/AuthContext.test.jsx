import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'
import { mockSupabase, mockUser, mockSession } from '../tests/mocks/supabase'

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('provides auth context', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    expect(result.current).toHaveProperty('user')
    expect(result.current).toHaveProperty('session')
    expect(result.current).toHaveProperty('loading')
    expect(result.current).toHaveProperty('signIn')
    expect(result.current).toHaveProperty('signUp')
    expect(result.current).toHaveProperty('signOut')
  })

  it('initializes with loading state', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    expect(result.current.loading).toBe(true)
  })

  it('loads user session on mount', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.session).toEqual(mockSession)
  })

  it('signUp creates new user', async () => {
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    const response = await result.current.signUp('test@example.com', 'password123')

    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com',
        password: 'password123',
      })
    )
    expect(response.error).toBeNull()
  })

  it('signIn authenticates user', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null,
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    const response = await result.current.signIn('test@example.com', 'password123')

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
    expect(response.error).toBeNull()
  })

  it('signInWithMagicLink sends magic link', async () => {
    mockSupabase.auth.signInWithOtp.mockResolvedValueOnce({
      data: {},
      error: null,
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    const response = await result.current.signInWithMagicLink('test@example.com')

    expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com',
      })
    )
    expect(response.error).toBeNull()
  })

  it('signInWithProvider initiates OAuth', async () => {
    mockSupabase.auth.signInWithOAuth.mockResolvedValueOnce({
      data: {},
      error: null,
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    const response = await result.current.signInWithProvider('google')

    expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'google',
      })
    )
    expect(response.error).toBeNull()
  })

  it('signOut logs out user', async () => {
    mockSupabase.auth.signOut.mockResolvedValueOnce({ error: null })

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    const response = await result.current.signOut()

    expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    expect(response.error).toBeNull()
  })

  it('updateProfile updates user metadata', async () => {
    mockSupabase.auth.updateUser.mockResolvedValueOnce({
      data: { user: { ...mockUser, user_metadata: { full_name: 'Updated Name' } } },
      error: null,
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    const response = await result.current.updateProfile({ full_name: 'Updated Name' })

    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { full_name: 'Updated Name' },
      })
    )
    expect(response.error).toBeNull()
  })

  it('handles errors gracefully', async () => {
    const errorMessage = 'Authentication failed'
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { message: errorMessage },
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    const response = await result.current.signIn('test@example.com', 'wrong')

    expect(response.error).toBeTruthy()
    expect(response.error.message).toBe(errorMessage)
  })
})