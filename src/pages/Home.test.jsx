import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockUser } from '../test/utils/test-utils'
import Home from './Home'
import * as AuthContext from '../contexts/AuthContext'

describe('Home Component', () => {
  const mockSignOut = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the creative adaptation hero shell', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      signOut: mockSignOut,
    })

    renderWithProviders(<Home />)

    expect(screen.getByText('Creative Adaptation Studio')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /turn one ad creative into every format you need/i })).toBeInTheDocument()
    expect(screen.getByText(/upload your existing asset, choose the placements you need/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /upload creative/i })).toBeInTheDocument()
    expect(screen.getByText(/upload your approved creative/i)).toBeInTheDocument()
  })

  it('shows sign in and get started actions when unauthenticated', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      signOut: mockSignOut,
    })

    renderWithProviders(<Home />)

    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('shows authenticated controls when signed in', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockUser,
      signOut: mockSignOut,
    })

    renderWithProviders(<Home />)

    expect(screen.getByText(mockUser.email)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('allows selecting preservation intent and targets', async () => {
    const user = userEvent.setup()

    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      signOut: mockSignOut,
    })

    renderWithProviders(<Home />)

    const headlineIntent = screen.getByRole('button', { name: /headline legibility/i })
    const leaderboardTarget = screen.getByRole('button', { name: /leaderboard/i })

    await user.click(headlineIntent)
    await user.click(leaderboardTarget)

    expect(headlineIntent).toHaveClass('active')
    expect(leaderboardTarget).toHaveClass('selected')
    expect(screen.getByText('3 placements')).toBeInTheDocument()
  })

  it('starts with the project action disabled before upload', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      signOut: mockSignOut,
    })

    renderWithProviders(<Home />)

    expect(screen.getByRole('button', { name: /start project/i })).toBeDisabled()
  })
})
