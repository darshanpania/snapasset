import { vi } from 'vitest'

// Mock react-router-dom
const mockNavigate = vi.fn()
const mockLocation = {
  pathname: '/',
  search: '',
  hash: '',
  state: null,
}

export const mockRouter = {
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  Navigate: ({ to }) => null,
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: ({ element }) => element,
}

export { mockNavigate }