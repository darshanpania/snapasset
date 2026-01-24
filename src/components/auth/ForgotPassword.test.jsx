import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/utils/test-utils'
import ForgotPassword from './ForgotPassword'
import * as AuthContext from '../../contexts/AuthContext'

describe('ForgotPassword Component', () => {
  const mockResetPassword = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      resetPassword: mockResetPassword,
      loading: false,
      error: null,
    })
  })

  it('renders forgot password form', () => {
    renderWithProviders(<ForgotPassword />)
    
    expect(screen.getByText('Reset Password')).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
  })

  it('handles password reset request', async () => {
    const user = userEvent.setup()
    mockResetPassword.mockResolvedValue({ error: null })
    
    renderWithProviders(<ForgotPassword />)
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))
    
    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('test@example.com')
      expect(screen.getByText(/check your email for a password reset link/i)).toBeInTheDocument()
    })
  })

  it('shows error for empty email', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<ForgotPassword />)
    
    await user.click(screen.getByRole('button', { name: /send reset link/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    })
    expect(mockResetPassword).not.toHaveBeenCalled()
  })

  it('clears email field after successful submission', async () => {
    const user = userEvent.setup()
    mockResetPassword.mockResolvedValue({ error: null })
    
    renderWithProviders(<ForgotPassword />)
    
    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'test@example.com')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))
    
    await waitFor(() => {
      expect(emailInput).toHaveValue('')
    })
  })

  it('shows link back to login', () => {
    renderWithProviders(<ForgotPassword />)
    
    const loginLink = screen.getByRole('link', { name: /sign in/i })
    expect(loginLink).toBeInTheDocument()
    expect(loginLink).toHaveAttribute('href', '/auth/login')
  })
})