import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/utils/test-utils'
import Signup from './Signup'
import * as AuthContext from '../../contexts/AuthContext'

describe('Signup Component', () => {
  const mockSignUp = vi.fn()
  const mockSignInWithProvider = vi.fn()
  const mockNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      signUp: mockSignUp,
      signInWithProvider: mockSignInWithProvider,
      loading: false,
      error: null,
    })
  })

  it('renders signup form', () => {
    renderWithProviders(<Signup />)
    
    expect(screen.getByText('Create Account')).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('handles successful signup', async () => {
    const user = userEvent.setup()
    mockSignUp.mockResolvedValue({ error: null })
    
    renderWithProviders(<Signup />)
    
    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')
    await user.click(screen.getByRole('checkbox', { name: /agree to the terms/i }))
    await user.click(screen.getByRole('button', { name: /create account/i }))
    
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        expect.objectContaining({
          full_name: 'Test User',
        })
      )
    })
  })

  it('validates password length', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<Signup />)
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password$/i), '12345')
    await user.type(screen.getByLabelText(/confirm password/i), '12345')
    await user.click(screen.getByRole('checkbox', { name: /agree to the terms/i }))
    await user.click(screen.getByRole('button', { name: /create account/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
    })
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('validates password match', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<Signup />)
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'different123')
    await user.click(screen.getByRole('checkbox', { name: /agree to the terms/i }))
    await user.click(screen.getByRole('button', { name: /create account/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('requires terms acceptance', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<Signup />)
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/must accept the terms/i)).toBeInTheDocument()
    })
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('shows success message after signup', async () => {
    const user = userEvent.setup()
    mockSignUp.mockResolvedValue({ error: null })
    
    renderWithProviders(<Signup />)
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')
    await user.click(screen.getByRole('checkbox', { name: /agree to the terms/i }))
    await user.click(screen.getByRole('button', { name: /create account/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/account created/i)).toBeInTheDocument()
      expect(screen.getByText(/check your email to verify/i)).toBeInTheDocument()
    })
  })

  it('handles social signup', async () => {
    const user = userEvent.setup()
    mockSignInWithProvider.mockResolvedValue({ error: null })
    
    renderWithProviders(<Signup />)
    
    const githubButton = screen.getByRole('button', { name: /github/i })
    await user.click(githubButton)
    
    await waitFor(() => {
      expect(mockSignInWithProvider).toHaveBeenCalledWith('github')
    })
  })

  it('shows link to login page', () => {
    renderWithProviders(<Signup />)
    
    const loginLink = screen.getByRole('link', { name: /sign in/i })
    expect(loginLink).toBeInTheDocument()
    expect(loginLink).toHaveAttribute('href', '/auth/login')
  })
})