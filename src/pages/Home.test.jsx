import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders, mockUser } from '../test/utils/test-utils'
import Home from './Home'
import * as AuthContext from '../contexts/AuthContext'
import { adaptationApi } from '../services/api'

vi.mock('../services/api', () => ({
  adaptationApi: {
    createProject: vi.fn(),
    getProject: vi.fn(),
    updateSetup: vi.fn(),
  },
}))

describe('Home Component', () => {
  const mockSignOut = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    adaptationApi.getProject.mockResolvedValue({
      data: {
        id: 'ap1',
        name: 'Spring Launch',
        preservation_intent: [],
        settings: {
          output_size_limit_bytes: 1048576,
        },
        requested_outputs: [],
        source_asset: {
          original_filename: 'creative.png',
          mime_type: 'image/png',
          public_url: '/storage/adaptation-source-assets/test/creative.png',
        },
      },
    })
    adaptationApi.updateSetup.mockResolvedValue({
      data: {
        id: 'ap1',
        name: 'Spring Launch',
        preservation_intent: ['brand'],
        settings: {
          output_size_limit_bytes: 512000,
        },
        requested_outputs: [
          {
            id: 'out1',
            preset_id: 'instagram-story',
            label: 'Instagram Story',
            aspect_ratio: '9:16',
            target_width: 1080,
            target_height: 1920,
            generation_strategy: 'adapt',
            max_file_size_bytes: 512000,
          },
          {
            id: 'out2',
            preset_id: 'instagram-post',
            label: 'Instagram Feed',
            aspect_ratio: '1:1',
            target_width: 1080,
            target_height: 1080,
            generation_strategy: 'adapt',
            max_file_size_bytes: 512000,
          },
        ],
        source_asset: {
          original_filename: 'creative.png',
          mime_type: 'image/png',
          public_url: '/storage/adaptation-source-assets/test/creative.png',
        },
      },
    })
  })

  it('renders the creative adaptation hero shell', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      signOut: mockSignOut,
    })

    renderWithProviders(<Home />)

    expect(screen.getByText('Creative Adaptation Studio')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /make one ad fit every placement/i })).toBeInTheDocument()
    expect(screen.getByText(/upload your creative, pick the sizes you need/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /upload creative/i })).toBeInTheDocument()
    expect(screen.getByText(/drop a file here or browse/i)).toBeInTheDocument()
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

    expect(screen.getByRole('button', { name: /create project/i })).toBeDisabled()
  })

  it('loads a saved project when visiting an adaptation URL', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockUser,
      signOut: mockSignOut,
    })

    renderWithProviders(
      <Routes>
        <Route path="/adaptations/:projectId" element={<Home />} />
      </Routes>,
      { route: '/adaptations/ap1' },
    )

    expect(await screen.findByText('Spring Launch')).toBeInTheDocument()
    expect(screen.getByText(/saved and reopenable at this url/i)).toBeInTheDocument()
    expect(adaptationApi.getProject).toHaveBeenCalledWith('ap1')
  })

  it('saves project setup for a loaded project', async () => {
    const user = userEvent.setup()

    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockUser,
      signOut: mockSignOut,
    })

    renderWithProviders(
      <Routes>
        <Route path="/adaptations/:projectId" element={<Home />} />
      </Routes>,
      { route: '/adaptations/ap1' },
    )

    await screen.findByText('Spring Launch')
    await user.click(screen.getByRole('button', { name: /500 kb/i }))
    await user.click(screen.getByRole('button', { name: /save project setup/i }))

    expect(adaptationApi.updateSetup).toHaveBeenCalledWith('ap1', expect.objectContaining({
      output_size_limit_bytes: 512000,
      preservation_intent: ['brand'],
    }))
  })
})
