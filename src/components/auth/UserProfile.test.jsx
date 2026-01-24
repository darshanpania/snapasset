import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockUser } from '../../test/utils/test-utils'
import UserProfile from './UserProfile'
import * as AuthContext from '../../contexts/AuthContext'

describe('UserProfile Component', () => {
  const mockUpdateProfile = vi.fn()
  const mockSignOut = vi.fn()
  const mockNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockUser,
      updateProfile: mockUpdateProfile,
      signOut: mockSignOut,
      loading: false,
      error: null,
    })
  })

  it('renders user profile information', () => {
    renderWithProviders(<UserProfile />)
    
    expect(screen.getByText('My Profile')).toBeInTheDocument()
    expect(screen.getByText(mockUser.email)).toBeInTheDocument()
    expect(screen.getByText(mockUser.user_metadata.full_name)).toBeInTheDocument()
  })

  it('shows verified badge for confirmed email', () => {
    renderWithProviders(<UserProfile />)
    
    expect(screen.getByText(/verified/i)).toBeInTheDocument()
  })

  it('enters edit mode when clicking edit button', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<UserProfile />)
    
    await user.click(screen.getByRole('button', { name: /edit profile/i }))
    
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('updates profile successfully', async () => {
    const user = userEvent.setup()
    mockUpdateProfile.mockResolvedValue({ error: null })
    
    renderWithProviders(<UserProfile />)
    
    await user.click(screen.getByRole('button', { name: /edit profile/i }))
    
    const nameInput = screen.getByDisplayValue(mockUser.user_metadata.full_name)
    await user.clear(nameInput)
    await user.type(nameInput, 'Updated Name')
    
    await user.click(screen.getByRole('button', { name: /save changes/i }))
    
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name: 'Updated Name',
        })
      )
    })
  })

  it('cancels editing without saving', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<UserProfile />)
    
    await user.click(screen.getByRole('button', { name: /edit profile/i }))
    
    const nameInput = screen.getByDisplayValue(mockUser.user_metadata.full_name)
    await user.clear(nameInput)
    await user.type(nameInput, 'New Name')
    
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    
    expect(mockUpdateProfile).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument()
  })

  it('handles sign out', async () => {
    const user = userEvent.setup()
    mockSignOut.mockResolvedValue({ error: null })
    
    renderWithProviders(<UserProfile />)
    
    await user.click(screen.getByRole('button', { name: /^sign out$/i }))
    
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled()
    })
  })

  it('returns null when no user is logged in', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      updateProfile: mockUpdateProfile,
      signOut: mockSignOut,
      loading: false,
      error: null,
    })
    
    const { container } = renderWithProviders(<UserProfile />)
    
    expect(container.firstChild).toBeNull()
  })
})