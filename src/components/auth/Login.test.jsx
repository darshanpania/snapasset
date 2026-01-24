import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/utils/test-utils'
import Login from './Login'
import * as AuthContext from '../../contexts/AuthContext'

describe('Login Component', () => {
  const mockSignIn = vi.fn()
  const mockSignInWithMagicLink = vi.fn()
  const mockSignInWithProvider = vi.fn()
  const mockNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock useAuth hook
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      signIn: mockSignIn,
      signInWithMagicLink: mockSignInWithMagicLink,
      signInWithProvider: mockSignInWithProvider,
      loading: false,
      error: null,
    })

    // Mock useNavigate
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom')
      return {
        ...actual,
        useNavigate: () => mockNavigate,
      }
    })
  })

  it('renders login form', () => {
    renderWithProviders(<Login />)
    
    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('handles email/password login', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ error: null })
    
    renderWithProviders(<Login />)
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('shows error for empty email', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<Login />)
    
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    })
  })

  it('toggles magic link mode', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<Login />)
    
    const checkbox = screen.getByRole('checkbox', { name: /use magic link/i })
    await user.click(checkbox)
    
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument()
  })

  it('handles magic link submission', async () => {
    const user = userEvent.setup()
    mockSignInWithMagicLink.mockResolvedValue({ error: null })
    
    renderWithProviders(<Login />)
    
    await user.click(screen.getByRole('checkbox', { name: /use magic link/i }))
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.click(screen.getByRole('button', { name: /send magic link/i }))
    
    await waitFor(() => {
      expect(mockSignInWithMagicLink).toHaveBeenCalledWith('test@example.com')
      expect(screen.getByText(/check your email for the magic link/i)).toBeInTheDocument()
    })
  })

  it('handles social login', async () => {
    const user = userEvent.setup()
    mockSignInWithProvider.mockResolvedValue({ error: null })
    
    renderWithProviders(<Login />)
    
    const googleButton = screen.getByRole('button', { name: /google/i })
    await user.click(googleButton)
    
    await waitFor(() => {
      expect(mockSignInWithProvider).toHaveBeenCalledWith('google')
    })
  })

  it('displays error message on failed login', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ 
      error: { message: 'Invalid credentials' } 
    })
    
    renderWithProviders(<Login />)
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })

  it('disables form while loading', async () => {
    const user = userEvent.setup()
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))
    
    renderWithProviders(<Login />)
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    
    expect(screen.getByLabelText(/email/i)).toBeDisabled()
    expect(screen.getByLabelText(/password/i)).toBeDisabled()
  })

  it('shows link to signup page', () => {
    renderWithProviders(<Login />)
    
    const signupLink = screen.getByRole('link', { name: /sign up/i })
    expect(signupLink).toBeInTheDocument()
    expect(signupLink).toHaveAttribute('href', '/auth/signup')
  })

  it('shows link to forgot password', () => {
    renderWithProviders(<Login />)
    
    const forgotLink = screen.getByRole('link', { name: /forgot password/i })
    expect(forgotLink).toBeInTheDocument()
    expect(forgotLink).toHaveAttribute('href', '/auth/forgot-password')
  })
})