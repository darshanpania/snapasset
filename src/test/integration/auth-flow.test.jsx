import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../utils/test-utils'
import Login from '../../components/auth/Login'
import Signup from '../../components/auth/Signup'
import * as AuthContext from '../../contexts/AuthContext'

describe('Authentication Integration Flow', () => {
  const mockSignUp = vi.fn()
  const mockSignIn = vi.fn()
  const mockSignOut = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('completes full signup and login flow', async () => {
    const user = userEvent.setup()
    
    // Test signup
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      signUp: mockSignUp,
      signIn: mockSignIn,
      signOut: mockSignOut,
      signInWithProvider: vi.fn(),
      loading: false,
      error: null,
    })
    
    mockSignUp.mockResolvedValue({ error: null })
    
    const { unmount } = renderWithProviders(<Signup />)
    
    await user.type(screen.getByLabelText(/email/i), 'newuser@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')
    await user.click(screen.getByRole('checkbox', { name: /agree to the terms/i }))
    await user.click(screen.getByRole('button', { name: /create account/i }))
    
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalled()
    })
    
    unmount()
    
    // Test login
    mockSignIn.mockResolvedValue({ error: null })
    
    renderWithProviders(<Login />)
    
    await user.type(screen.getByLabelText(/email/i), 'newuser@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('newuser@example.com', 'password123')
    })
  })

  it('handles authentication errors gracefully', async () => {
    const user = userEvent.setup()
    
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      signIn: mockSignIn,
      signInWithMagicLink: vi.fn(),
      signInWithProvider: vi.fn(),
      loading: false,
      error: null,
    })
    
    mockSignIn.mockResolvedValue({ 
      error: { message: 'Network error' } 
    })
    
    renderWithProviders(<Login />)
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    })
  })
})