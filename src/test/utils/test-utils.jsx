import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import { vi } from 'vitest'

// Custom render function that includes providers
export function renderWithProviders(
  ui,
  {
    route = '/',
    authValue = null,
    ...renderOptions
  } = {}
) {
  window.history.pushState({}, 'Test page', route)

  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}

// Mock authenticated user
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  email_confirmed_at: '2026-01-24T00:00:00Z',
  created_at: '2026-01-24T00:00:00Z',
  last_sign_in_at: '2026-01-24T00:00:00Z',
  user_metadata: {
    full_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
  },
}

// Mock session
export const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  user: mockUser,
}

// Helper to wait for async updates
export const waitForLoadingToFinish = () => 
  new Promise((resolve) => setTimeout(resolve, 0))

// Helper to create mock platform presets
export const createMockPreset = (overrides = {}) => ({
  id: 'test-preset',
  name: 'Test Platform',
  icon: '🧪',
  category: 'social',
  dimensions: [
    { label: 'Standard', width: 1080, height: 1080 }
  ],
  ...overrides,
})

// Helper to create mock generated images
export const createMockGeneratedImage = (overrides = {}) => ({
  preset: {
    id: 'instagram-post',
    name: 'Instagram Post',
    width: 1080,
    height: 1080,
    icon: '📷',
  },
  url: 'data:image/png;base64,mockdata',
  size: 245000,
  timestamp: '2026-01-24T14:00:00Z',
  ...overrides,
})

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { renderWithProviders as render }