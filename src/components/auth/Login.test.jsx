import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../tests/utils/test-utils'
import Login from './Login'
import * as AuthContext from '../../contexts/AuthContext'

describe('Login Component', () => {
  const mockSignIn = vi.fn()
  const mockSignInWithMagicLink = vi.fn()
  const mockSignInWithProvider = vi.fn()
  const mockNavigate = vi.fn()

  beforeEach(() => {
    mockSignIn.mockClear()
    mockSignInWithMagicLink.mockClear()
    mockSignInWithProvider.mockClear()
    mockNavigate.mockClear()
    
    // Mock useAuth hook
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      signIn: mockSignIn,
      signInWithMagicLink: mockSignInWithMagicLink,
      signInWithProvider: mockSignInWithProvider,
      user: null,
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
    render(<Login />)
    
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('shows password field by default', () => {
    render(<Login />)
    
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('hides password field when magic link is selected', async () => {
    render(<Login />)
    
    const magicLinkCheckbox = screen.getByLabelText(/use magic link instead/i)
    fireEvent.click(magicLinkCheckbox)
    
    await waitFor(() => {
      expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
    })
  })

  it('displays social login buttons', () => {
    render(<Login />)
    
    expect(screen.getByText(/google/i)).toBeInTheDocument()
    expect(screen.getByText(/github/i)).toBeInTheDocument()
    expect(screen.getByText(/discord/i)).toBeInTheDocument()
  })

  it('validates email is required', async () => {
    mockSignIn.mockResolvedValue({ error: null })
    
    render(<Login />)
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    })
  })

  it('validates password is required for email login', async () => {
    mockSignIn.mockResolvedValue({ error: null })
    
    render(<Login />)
    
    const emailInput = screen.getByLabelText(/email/i)
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('calls signIn with correct credentials', async () => {
    mockSignIn.mockResolvedValue({ error: null })
    
    render(<Login />)
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    })
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('calls signInWithMagicLink when magic link is used', async () => {
    mockSignInWithMagicLink.mockResolvedValue({ error: null })
    
    render(<Login />)
    
    const magicLinkCheckbox = screen.getByLabelText(/use magic link instead/i)
    fireEvent.click(magicLinkCheckbox)
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    
    const submitButton = screen.getByRole('button', { name: /send magic link/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignInWithMagicLink).toHaveBeenCalledWith('test@example.com')
    })
  })

  it('shows success message after magic link sent', async () => {
    mockSignInWithMagicLink.mockResolvedValue({ error: null })
    
    render(<Login />)
    
    const magicLinkCheckbox = screen.getByLabelText(/use magic link instead/i)
    fireEvent.click(magicLinkCheckbox)
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    
    const submitButton = screen.getByRole('button', { name: /send magic link/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/check your email for the magic link/i)).toBeInTheDocument()
    })
  })

  it('displays error from auth service', async () => {
    mockSignIn.mockResolvedValue({ error: { message: 'Invalid credentials' } })
    
    render(<Login />)
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrong' },
    })
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })

  it('calls social login when social button clicked', async () => {
    mockSignInWithProvider.mockResolvedValue({ error: null })
    
    render(<Login />)
    
    const googleButton = screen.getByText(/google/i)
    fireEvent.click(googleButton)
    
    await waitFor(() => {
      expect(mockSignInWithProvider).toHaveBeenCalledWith('google')
    })
  })

  it('disables form during submission', async () => {
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(<Login />)
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password' },
    })
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)
    
    expect(screen.getByLabelText(/email/i)).toBeDisabled()
    expect(screen.getByLabelText(/password/i)).toBeDisabled()
    expect(submitButton).toBeDisabled()
  })

  it('has link to signup page', () => {
    render(<Login />)
    
    expect(screen.getByText(/sign up/i)).toBeInTheDocument()
  })

  it('has link to forgot password', () => {
    render(<Login />)
    
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
  })
})