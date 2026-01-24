import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from './test/utils/test-utils'
import App from './App'

describe('App Component', () => {
  it('renders without crashing', () => {
    renderWithProviders(<App />)
    // App should render without errors
    expect(document.body).toBeInTheDocument()
  })

  it('renders AuthProvider', () => {
    const { container } = renderWithProviders(<App />)
    expect(container).toBeTruthy()
  })
})