import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../tests/utils/test-utils'
import UserProfile from './UserProfile'
import * as AuthContext from '../../contexts/AuthContext'

const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  email_confirmed_at: '2026-01-24T14:00:00Z',
  created_at: '2026-01-24T14:00:00Z',
  last_sign_in_at: '2026-01-24T14:00:00Z',
  user_metadata: {
    full_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
  },
}

describe('UserProfile Component', () => {
  const mockUpdateProfile = vi.fn()
  const mockSignOut = vi.fn()
  const mockNavigate = vi.fn()

  beforeEach(() => {
    mockUpdateProfile.mockClear()
    mockSignOut.mockClear()
    mockNavigate.mockClear()
    
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockUser,
      updateProfile: mockUpdateProfile,
      signOut: mockSignOut,
      loading: false,
      error: null,
    })
    
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom')
      return {
        ...actual,
        useNavigate: () => mockNavigate,
      }
    })
  })

  it('renders user profile', () => {
    render(<UserProfile />)
    
    expect(screen.getByText(/my profile/i)).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('shows email verification badge', () => {
    render(<UserProfile />)
    
    expect(screen.getByText(/verified/i)).toBeInTheDocument()
  })

  it('displays user avatar', () => {
    render(<UserProfile />)
    
    const avatar = screen.getByAltText(/profile/i)
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('enters edit mode when edit button clicked', async () => {
    render(<UserProfile />)
    
    const editButton = screen.getByText(/edit profile/i)
    fireEvent.click(editButton)
    
    await waitFor(() => {
      expect(screen.getByText(/save changes/i)).toBeInTheDocument()
      expect(screen.getByText(/cancel/i)).toBeInTheDocument()
    })
  })

  it('allows editing full name', async () => {
    render(<UserProfile />)
    
    fireEvent.click(screen.getByText(/edit profile/i))
    
    const nameInput = screen.getByDisplayValue('Test User')
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } })
    
    expect(nameInput.value).toBe('Updated Name')
  })

  it('calls updateProfile when save clicked', async () => {
    mockUpdateProfile.mockResolvedValue({ error: null })
    
    render(<UserProfile />)
    
    fireEvent.click(screen.getByText(/edit profile/i))
    
    const nameInput = screen.getByDisplayValue('Test User')
    fireEvent.change(nameInput, { target: { value: 'New Name' } })
    
    const saveButton = screen.getByText(/save changes/i)
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name: 'New Name',
        })
      )
    })
  })

  it('shows success message after profile update', async () => {
    mockUpdateProfile.mockResolvedValue({ error: null })
    
    render(<UserProfile />)
    
    fireEvent.click(screen.getByText(/edit profile/i))
    fireEvent.click(screen.getByText(/save changes/i))
    
    await waitFor(() => {
      expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument()
    })
  })

  it('cancels edit mode', async () => {
    render(<UserProfile />)
    
    fireEvent.click(screen.getByText(/edit profile/i))
    
    const nameInput = screen.getByDisplayValue('Test User')
    fireEvent.change(nameInput, { target: { value: 'Changed' } })
    
    const cancelButton = screen.getByText(/cancel/i)
    fireEvent.click(cancelButton)
    
    await waitFor(() => {
      expect(screen.getByText(/edit profile/i)).toBeInTheDocument()
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })
  })

  it('calls signOut when sign out clicked', async () => {
    mockSignOut.mockResolvedValue({ error: null })
    
    render(<UserProfile />)
    
    const signOutButton = screen.getByText(/sign out/i)
    fireEvent.click(signOutButton)
    
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled()
    })
  })

  it('returns null when no user', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      updateProfile: mockUpdateProfile,
      signOut: mockSignOut,
      loading: false,
      error: null,
    })
    
    const { container } = render(<UserProfile />)
    expect(container.firstChild).toBeNull()
  })

  it('displays account creation date', () => {
    render(<UserProfile />)
    
    expect(screen.getByText(/january 24, 2026/i)).toBeInTheDocument()
  })
})