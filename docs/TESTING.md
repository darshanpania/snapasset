# Frontend Testing Guide for SnapAsset

## 🎯 Overview

Comprehensive testing infrastructure for the SnapAsset frontend using Vitest, React Testing Library, and Happy DOM.

---

## 📦 What's Included

### Testing Stack

1. **Vitest** - Lightning-fast unit test framework
   - Vite-native (shares config)
   - Hot module replacement
   - ESM and TypeScript support
   - Jest-compatible API

2. **React Testing Library** - Component testing
   - Tests components as users interact with them
   - Encourages accessibility
   - No implementation details

3. **Happy DOM** - Browser environment simulation
   - Lightweight alternative to jsdom
   - Fast execution
   - Good enough for most tests

4. **Testing Library User Event** - User interaction simulation
   - Simulates real user behavior
   - Keyboard, mouse, clipboard events
   - Async by default

5. **Jest DOM** - Custom matchers
   - `toBeInTheDocument()`
   - `toHaveClass()`
   - `toBeDisabled()`
   - Many more

---

## 📁 File Structure

```
src/
├── test/
│   ├── setup.js                    # Global test setup
│   ├── mocks/
│   │   ├── supabase.js              # Supabase client mock
│   │   ├── fetch.js                 # Fetch API mock
│   │   └── router.js                # React Router mock
│   ├── utils/
│   │   └── test-utils.jsx           # Custom render functions
│   ├── integration/
│   │   └── auth-flow.test.jsx       # Integration tests
│   └── example-components/
│       ├── PromptInput.test.jsx
│       ├── PlatformPresets.test.jsx
│       └── ResultsGrid.test.jsx
├── components/
│   └── auth/
│       ├── Login.jsx
│       ├── Login.test.jsx           # Component tests
│       ├── Signup.jsx
│       ├── Signup.test.jsx
│       └── ...
├── contexts/
│   ├── AuthContext.jsx
│   └── AuthContext.test.jsx
├── pages/
│   ├── Home.jsx
│   └── Home.test.jsx
└── App.test.jsx
```

---

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
```

All testing dependencies are in `package.json`:
- `vitest`
- `@testing-library/react`
- `@testing-library/user-event`
- `@testing-library/jest-dom`
- `@vitest/coverage-v8`
- `@vitest/ui`
- `happy-dom`

### Run Tests

```bash
# Watch mode (recommended for development)
npm test

# Run once
npm run test:run

# With coverage
npm run test:coverage

# With UI
npm run test:ui
```

---

## 📋 Test Categories

### 1. Unit Tests

Test individual components in isolation.

**Example:**
```javascript
// Login.test.jsx
it('renders login form', () => {
  render(<Login />)
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
})
```

**Files:**
- All `.test.jsx` files in `src/components/`
- All `.test.jsx` files in `src/contexts/`
- All `.test.js` files in `src/services/`

### 2. Integration Tests

Test multiple components working together.

**Example:**
```javascript
// auth-flow.test.jsx
it('completes signup and login flow', async () => {
  // Test full user journey
})
```

**Files:**
- `src/test/integration/*.test.jsx`

### 3. Example Tests

Example tests for components that may be implemented differently.

**Files:**
- `src/test/example-components/*.test.jsx`

---

## 📝 Writing Tests

### Basic Component Test

```javascript
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test/utils/test-utils'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    renderWithProviders(<MyComponent />)
    
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })
})
```

### Testing User Interactions

```javascript
import userEvent from '@testing-library/user-event'

it('handles button click', async () => {
  const user = userEvent.setup()
  const mockFn = vi.fn()
  
  renderWithProviders(<MyComponent onClick={mockFn} />)
  
  await user.click(screen.getByRole('button'))
  
  expect(mockFn).toHaveBeenCalled()
})
```

### Testing Async Behavior

```javascript
import { waitFor } from '@testing-library/react'

it('loads data', async () => {
  renderWithProviders(<MyComponent />)
  
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument()
  })
})
```

### Testing Forms

```javascript
it('submits form', async () => {
  const user = userEvent.setup()
  const mockSubmit = vi.fn()
  
  renderWithProviders(<MyForm onSubmit={mockSubmit} />)
  
  await user.type(screen.getByLabelText(/email/i), 'test@example.com')
  await user.type(screen.getByLabelText(/password/i), 'password123')
  await user.click(screen.getByRole('button', { name: /submit/i }))
  
  await waitFor(() => {
    expect(mockSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
  })
})
```

### Testing Error States

```javascript
it('shows error message', async () => {
  const mockFn = vi.fn().mockRejectedValue(new Error('Failed'))
  
  renderWithProviders(<MyComponent onAction={mockFn} />)
  
  await user.click(screen.getByRole('button'))
  
  await waitFor(() => {
    expect(screen.getByText(/failed/i)).toBeInTheDocument()
  })
})
```

### Testing with Auth Context

```javascript
import * as AuthContext from '../contexts/AuthContext'
import { mockUser } from '../test/utils/test-utils'

it('renders for authenticated user', () => {
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
    user: mockUser,
    loading: false,
  })
  
  renderWithProviders(<MyComponent />)
  
  expect(screen.getByText(mockUser.email)).toBeInTheDocument()
})
```

---

## 🧰 Mocking

### Mock Supabase

```javascript
import { mockSupabaseClient } from '../test/mocks/supabase'

mockSupabaseClient.auth.signIn.mockResolvedValue({
  data: { user: mockUser },
  error: null,
})
```

### Mock Fetch

```javascript
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ data: 'test' }),
})
```

### Mock Router

```javascript
const mockNavigate = vi.fn()

vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))
```

---

## 📊 Coverage Configuration

### Coverage Thresholds

Set in `vitest.config.js`:

```javascript
coverage: {
  lines: 80,
  functions: 80,
  branches: 80,
  statements: 80,
}
```

### Excluded from Coverage

- `node_modules/`
- `src/test/`
- `**/*.config.js`
- `dist/`
- `.cache/`

### Coverage Reports

Generated in `coverage/` directory:
- `coverage/index.html` - Interactive HTML report
- `coverage/lcov.info` - LCOV format for CI
- `coverage/coverage-final.json` - JSON format

---

## 🤖 CI/CD Integration

### GitHub Actions Workflow

File: `.github/workflows/test.yml`

**Runs on:**
- Push to main, develop, feature branches
- Pull requests to main, develop

**Matrix:**
- Node.js 18.x
- Node.js 20.x

**Steps:**
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Run linter
5. Run tests
6. Generate coverage
7. Upload to Codecov
8. Comment coverage on PR

### Codecov Integration

Optional coverage reporting to Codecov:

1. Sign up at [codecov.io](https://codecov.io)
2. Connect GitHub repository
3. Coverage automatically uploaded on CI runs
4. Get coverage badges for README

---

## 🔍 Query Priorities

React Testing Library query priorities (use in order):

1. **Accessible to everyone:**
   - `getByRole`
   - `getByLabelText`
   - `getByPlaceholderText`
   - `getByText`

2. **Semantic queries:**
   - `getByAltText`
   - `getByTitle`

3. **Test IDs (last resort):**
   - `getByTestId`

**Example:**
```javascript
// Good
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText('Email')

// Avoid
screen.getByTestId('submit-button')
```

---

## ✨ Assertions

### Common Matchers

```javascript
// Presence
expect(element).toBeInTheDocument()
expect(element).not.toBeInTheDocument()

// Visibility
expect(element).toBeVisible()
expect(element).not.toBeVisible()

// State
expect(button).toBeDisabled()
expect(button).toBeEnabled()
expect(checkbox).toBeChecked()

// Content
expect(element).toHaveTextContent('Hello')
expect(input).toHaveValue('test@example.com')

// Classes
expect(element).toHaveClass('active')
expect(element).not.toHaveClass('disabled')

// Attributes
expect(link).toHaveAttribute('href', '/login')

// Functions
expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledWith('arg')
expect(mockFn).toHaveBeenCalledTimes(2)
```

---

## 🛠️ Test Utilities

### Custom Render Function

`renderWithProviders` wraps components with necessary providers:

```javascript
import { renderWithProviders } from './test/utils/test-utils'

renderWithProviders(<MyComponent />, {
  route: '/custom-route',  // Set initial route
  authValue: mockUser,      // Mock authenticated user
})
```

**Provides:**
- `BrowserRouter` for routing
- `AuthProvider` for authentication
- Custom initial route

### Mock Data Helpers

```javascript
import { 
  mockUser, 
  mockSession, 
  createMockPreset,
  createMockGeneratedImage,
} from './test/utils/test-utils'

// Use in tests
const user = mockUser
const preset = createMockPreset({ name: 'Custom Platform' })
const image = createMockGeneratedImage()
```

---

## 🎭 Mocking Guide

### Mocking Supabase

**Automatic:** Supabase is mocked globally in `src/test/mocks/supabase.js`

**Customize for specific test:**
```javascript
import { mockSupabaseClient } from '../test/mocks/supabase'

mockSupabaseClient.auth.signIn.mockResolvedValue({
  data: { user: customUser },
  error: null,
})
```

### Mocking Fetch

**Automatic:** Fetch is mocked globally in `src/test/mocks/fetch.js`

**Customize for specific test:**
```javascript
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ data: 'custom' }),
})
```

### Mocking Context

```javascript
import * as AuthContext from '../contexts/AuthContext'

vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
  user: mockUser,
  signOut: vi.fn(),
  loading: false,
})
```

### Mocking Router

```javascript
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => ({
  ...await vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))
```

---

## 🧪 Testing Patterns

### Testing Forms

```javascript
it('validates and submits form', async () => {
  const user = userEvent.setup()
  const mockSubmit = vi.fn()
  
  render(<LoginForm onSubmit={mockSubmit} />)
  
  // Fill form
  await user.type(screen.getByLabelText(/email/i), 'test@example.com')
  await user.type(screen.getByLabelText(/password/i), 'password123')
  
  // Submit
  await user.click(screen.getByRole('button', { name: /submit/i }))
  
  // Assert
  await waitFor(() => {
    expect(mockSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
  })
})
```

### Testing Loading States

```javascript
it('shows loading spinner', async () => {
  const slowFn = vi.fn(() => 
    new Promise(resolve => setTimeout(resolve, 1000))
  )
  
  render(<MyComponent onAction={slowFn} />)
  
  await user.click(screen.getByRole('button'))
  
  // Should show loading
  expect(screen.getByText(/loading/i)).toBeInTheDocument()
  
  // Wait for completion
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
  })
})
```

### Testing Error States

```javascript
it('displays error message', async () => {
  const mockFn = vi.fn().mockRejectedValue(
    new Error('Something went wrong')
  )
  
  render(<MyComponent onAction={mockFn} />)
  
  await user.click(screen.getByRole('button'))
  
  await waitFor(() => {
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })
})
```

### Testing Conditional Rendering

```javascript
it('renders different UI based on auth state', () => {
  // Not authenticated
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: null })
  const { rerender } = render(<MyComponent />)
  expect(screen.getByText('Sign In')).toBeInTheDocument()
  
  // Authenticated
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: mockUser })
  rerender(<MyComponent />)
  expect(screen.getByText('Welcome')).toBeInTheDocument()
})
```

### Testing Accessibility

```javascript
it('is accessible', () => {
  render(<MyComponent />)
  
  // Has proper labels
  expect(screen.getByLabelText('Email')).toBeInTheDocument()
  
  // Has proper roles
  expect(screen.getByRole('button')).toBeInTheDocument()
  
  // Has alt text
  expect(screen.getByAltText('Profile')).toBeInTheDocument()
})
```

---

## 📊 Coverage Reports

### Generate Coverage

```bash
npm run test:coverage
```

### View Reports

**Terminal Output:**
```
----------------|---------|----------|---------|---------|-------------------
File            | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------------|---------|----------|---------|---------|-------------------
All files       |   85.23 |    78.45 |   82.11 |   85.67 |
 components/    |   88.12 |    81.23 |   85.45 |   88.92 |
  Login.jsx     |   92.34 |    87.12 |   90.23 |   93.12 |
  Signup.jsx    |   84.56 |    75.89 |   81.23 |   85.34 |
 contexts/      |   90.45 |    85.23 |   88.12 |   91.23 |
----------------|---------|----------|---------|---------|-------------------
```

**HTML Report:**
```bash
open coverage/index.html
```

Interactive report showing:
- Overall coverage percentages
- File-by-file breakdown
- Line-by-line highlighting
- Uncovered lines in red

---

## 🐛 Debugging Tests

### 1. Use `screen.debug()`

```javascript
it('debugs component', () => {
  render(<MyComponent />)
  
  screen.debug() // Prints current DOM
  
  // Or debug specific element
  screen.debug(screen.getByRole('button'))
})
```

### 2. Use Testing Playground

```javascript
it('uses testing playground', () => {
  render(<MyComponent />)
  
  screen.logTestingPlaygroundURL()
  // Opens https://testing-playground.com with your DOM
})
```

### 3. Use VS Code Debugger

In `package.json`:
```json
{
  "scripts": {
    "test:debug": "vitest --inspect-brk --no-coverage"
  }
}
```

Then:
1. Set breakpoint in test
2. Run `npm run test:debug`
3. Attach VS Code debugger

### 4. Filter Tests

```bash
# Run specific file
npm test -- Login.test.jsx

# Run tests matching pattern
npm test -- --grep="authentication"

# Run only one test
it.only('runs this test only', () => { ... })

# Skip a test
it.skip('skips this test', () => { ... })
```

---

## ✅ Best Practices

### 1. Test Behavior, Not Implementation

```javascript
// Good - tests what user sees
expect(screen.getByText('Welcome')).toBeInTheDocument()

// Bad - tests implementation details
expect(wrapper.state().isLoggedIn).toBe(true)
```

### 2. Use Accessible Queries

```javascript
// Good - uses roles and labels
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText('Email')

// Bad - uses test IDs
screen.getByTestId('submit-btn')
```

### 3. Await Async Updates

```javascript
// Good - waits for updates
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument()
})

// Bad - doesn't wait
expect(screen.getByText('Success')).toBeInTheDocument()
```

### 4. Clean Up

```javascript
afterEach(() => {
  cleanup()          // Unmount components
  vi.clearAllMocks() // Clear mocks
})
```

### 5. Organize Tests

```javascript
describe('MyComponent', () => {
  describe('when logged in', () => {
    it('shows user menu', () => { ... })
  })
  
  describe('when logged out', () => {
    it('shows sign in button', () => { ... })
  })
})
```

---

## 📝 Test Checklist

For each component, test:

- [ ] Renders without crashing
- [ ] Displays expected content
- [ ] Handles user interactions
- [ ] Shows loading states
- [ ] Displays error messages
- [ ] Validates form inputs
- [ ] Calls callbacks with correct args
- [ ] Updates on prop changes
- [ ] Handles edge cases
- [ ] Is accessible
- [ ] Works on mobile (responsive)

---

## 🚀 Advanced Topics

### Testing Custom Hooks

```javascript
import { renderHook, waitFor } from '@testing-library/react'

it('custom hook works', async () => {
  const { result } = renderHook(() => useMyHook())
  
  expect(result.current.value).toBe(0)
  
  act(() => {
    result.current.increment()
  })
  
  expect(result.current.value).toBe(1)
})
```

### Testing Context

```javascript
it('provides context value', () => {
  const { result } = renderHook(() => useMyContext(), {
    wrapper: MyContextProvider,
  })
  
  expect(result.current).toHaveProperty('value')
})
```

### Snapshot Testing

```javascript
it('matches snapshot', () => {
  const { container } = render(<MyComponent />)
  expect(container.firstChild).toMatchSnapshot()
})
```

---

## 📚 Resources

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Cheatsheet](https://testing-library.com/docs/react-testing-library/cheatsheet)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [User Event Docs](https://testing-library.com/docs/user-event/intro)

---

## 🆘 Support

If you encounter issues:

1. Check error message carefully
2. Review component implementation
3. Check mock configuration
4. Use `screen.debug()` to inspect DOM
5. Consult testing-library.com docs
6. Ask in GitHub discussions

---

**Testing infrastructure ready!** 🎉

Write tests, run them, see coverage, and maintain quality!
