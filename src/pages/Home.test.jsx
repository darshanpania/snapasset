import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockUser } from '../test/utils/test-utils'
import Home from './Home'
import * as AuthContext from '../contexts/AuthContext'

describe('Home Component', () => {
  const mockSignOut = vi.fn()
  const mockNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('renders home page', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      signOut: mockSignOut,
    })
    
    renderWithProviders(<Home />)
    
    expect(screen.getByText('📸 SnapAsset')).toBeInTheDocument()
    expect(screen.getByText(/AI-Powered Multi-Platform Image Generator/i)).toBeInTheDocument()
  })

  it('shows sign in/up buttons when not authenticated', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      signOut: mockSignOut,
    })
    
    renderWithProviders(<Home />)
    
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('shows user menu when authenticated', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockUser,
      signOut: mockSignOut,
    })
    
    renderWithProviders(<Home />)
    
    expect(screen.getByText(mockUser.email)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('allows entering a prompt', async () => {
    const user = userEvent.setup()
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      signOut: mockSignOut,
    })
    
    renderWithProviders(<Home />)
    
    const textarea = screen.getByPlaceholderText(/describe the image/i)
    await user.type(textarea, 'A beautiful sunset')
    
    expect(textarea).toHaveValue('A beautiful sunset')
  })

  it('allows selecting platform presets', async () => {
    const user = userEvent.setup()
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      signOut: mockSignOut,
    })
    
    renderWithProviders(<Home />)
    
    const instagramCard = screen.getByText('Instagram Post').closest('.preset-card')
    await user.click(instagramCard)
    
    expect(instagramCard).toHaveClass('selected')
  })

  it('shows error when generating without prompt', async () => {
    const user = userEvent.setup()
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      signOut: mockSignOut,
    })
    
    renderWithProviders(<Home />)
    
    await user.click(screen.getByRole('button', { name: /generate images/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a prompt/i)).toBeInTheDocument()
    })
  })

  it('shows error when generating without presets', async () => {
    const user = userEvent.setup()
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      signOut: mockSignOut,
    })
    
    renderWithProviders(<Home />)
    
    const textarea = screen.getByPlaceholderText(/describe the image/i)
    await user.type(textarea, 'A beautiful sunset')
    await user.click(screen.getByRole('button', { name: /generate images/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/please select at least one platform/i)).toBeInTheDocument()
    })
  })

  it('generates images successfully', async () => {
    const user = userEvent.setup()
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      signOut: mockSignOut,
    })
    
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        images: [
          {
            preset: { name: 'Instagram Post', width: 1080, height: 1080 },
            url: 'data:image/png;base64,test',
          }
        ],
      }),
    })
    
    renderWithProviders(<Home />)
    
    await user.type(screen.getByPlaceholderText(/describe the image/i), 'Test prompt')
    await user.click(screen.getByText('Instagram Post').closest('.preset-card'))
    await user.click(screen.getByRole('button', { name: /generate images/i }))
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/generate',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })
  })

  it('displays character count for prompt', async () => {
    const user = userEvent.setup()
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      signOut: mockSignOut,
    })
    
    renderWithProviders(<Home />)
    
    const textarea = screen.getByPlaceholderText(/describe the image/i)
    await user.type(textarea, 'Hello')
    
    expect(screen.getByText('5 / 1000')).toBeInTheDocument()
  })
})