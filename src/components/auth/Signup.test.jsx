import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../tests/utils/test-utils'
import Signup from './Signup'
import * as AuthContext from '../../contexts/AuthContext'

describe('Signup Component', () => {
  const mockSignUp = vi.fn()
  const mockSignInWithProvider = vi.fn()

  beforeEach(() => {
    mockSignUp.mockClear()
    mockSignInWithProvider.mockClear()
    
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      signUp: mockSignUp,
      signInWithProvider: mockSignInWithProvider,
      user: null,
      loading: false,
      error: null,
    })
  })

  it('renders signup form', () => {
    render(<Signup />)
    
    expect(screen.getByText(/create account/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  it('validates all required fields', async () => {
    render(<Signup />)
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/all fields are required/i)).toBeInTheDocument()
    })
  })

  it('validates password length', async () => {
    render(<Signup />)
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: '12345' },
    })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: '12345' },
    })
    
    const termsCheckbox = screen.getByRole('checkbox')
    fireEvent.click(termsCheckbox)
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
    })
  })

  it('validates password confirmation match', async () => {
    render(<Signup />)
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'different' },
    })
    
    const termsCheckbox = screen.getByRole('checkbox')
    fireEvent.click(termsCheckbox)
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
  })

  it('validates terms acceptance', async () => {
    render(<Signup />)
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    })
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/you must accept the terms/i)).toBeInTheDocument()
    })
  })

  it('calls signUp with correct data when form is valid', async () => {
    mockSignUp.mockResolvedValue({ error: null })
    
    render(<Signup />)
    
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'John Doe' },
    })
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    })
    
    const termsCheckbox = screen.getByRole('checkbox')
    fireEvent.click(termsCheckbox)
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        expect.objectContaining({
          full_name: 'John Doe',
        })
      )
    })
  })

  it('shows success message after signup', async () => {
    mockSignUp.mockResolvedValue({ error: null })
    
    render(<Signup />)
    
    // Fill valid form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('checkbox'))
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/account created/i)).toBeInTheDocument()
      expect(screen.getByText(/check your email to verify/i)).toBeInTheDocument()
    })
  })

  it('displays error from signup service', async () => {
    mockSignUp.mockResolvedValue({ error: { message: 'Email already exists' } })
    
    render(<Signup />)
    
    // Fill valid form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'existing@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('checkbox'))
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument()
    })
  })

  it('calls social signup when social button clicked', async () => {
    mockSignInWithProvider.mockResolvedValue({ error: null })
    
    render(<Signup />)
    
    const googleButton = screen.getAllByText(/google/i)[1] // Second one is in signup section
    fireEvent.click(googleButton)
    
    await waitFor(() => {
      expect(mockSignInWithProvider).toHaveBeenCalledWith('google')
    })
  })

  it('has link to login page', () => {
    render(<Signup />)
    
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument()
    expect(screen.getByText(/sign in/i)).toBeInTheDocument()
  })
})