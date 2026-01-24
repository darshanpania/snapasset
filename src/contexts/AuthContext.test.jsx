import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'
import { mockSupabaseClient } from '../test/mocks/supabase'

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

  it('initializes with null user', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
  })

  it('calls supabase signUp on signUp', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    await result.current.signUp('test@example.com', 'password123', { full_name: 'Test' })
    
    expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com',
        password: 'password123',
      })
    )
  })

  it('calls supabase signIn on signIn', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    await result.current.signIn('test@example.com', 'password123')
    
    expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
  })

  it('calls supabase signInWithOtp on magic link', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    await result.current.signInWithMagicLink('test@example.com')
    
    expect(mockSupabaseClient.auth.signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com',
      })
    )
  })

  it('calls supabase signInWithOAuth for social login', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    await result.current.signInWithProvider('google')
    
    expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'google',
      })
    )
  })

  it('calls supabase signOut on signOut', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    await result.current.signOut()
    
    expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
  })

  it('throws error when useAuth is used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth())
    }).toThrow('useAuth must be used within an AuthProvider')
  })
})