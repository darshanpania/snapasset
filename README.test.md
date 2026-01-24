# Testing Documentation for SnapAsset

## 🧪 Test Infrastructure

This document describes the testing setup and how to run tests.

---

## 🛠️ Stack

- **Vitest** - Fast unit test framework
- **React Testing Library** - Component testing
- **Happy DOM** - Lightweight DOM implementation
- **@testing-library/user-event** - User interaction simulation
- **@testing-library/jest-dom** - Custom matchers
- **@vitest/coverage-v8** - Code coverage
- **@vitest/ui** - Interactive test UI

---

## 🚀 Running Tests

### Run all tests (watch mode)
```bash
npm test
```

### Run tests once
```bash
npm run test:run
```

### Run with coverage
```bash
npm run test:coverage
```

### Run with UI
```bash
npm run test:ui
```

### Run specific test file
```bash
npm test -- Login.test.jsx
```

### Run tests matching pattern
```bash
npm test -- --grep="authentication"
```

---

## 📊 Coverage Requirements

- **Lines:** 80%
- **Functions:** 80%
- **Branches:** 80%
- **Statements:** 80%

Coverage reports generated in `coverage/` directory.

---

## 📝 Test Files

### Authentication Tests
- `src/components/auth/Login.test.jsx` - Login component
- `src/components/auth/Signup.test.jsx` - Signup component
- `src/components/auth/UserProfile.test.jsx` - Profile component
- `src/components/auth/ProtectedRoute.test.jsx` - Route protection
- `src/components/auth/ForgotPassword.test.jsx` - Password reset
- `src/contexts/AuthContext.test.jsx` - Auth context

### Component Tests (Examples)
- `src/test/example-components/PromptInput.test.jsx`
- `src/test/example-components/PlatformPresets.test.jsx`
- `src/test/example-components/ResultsGrid.test.jsx`

### Integration Tests
- `src/test/integration/auth-flow.test.jsx`

### Service Tests
- `src/services/supabase.test.js`

### App Tests
- `src/App.test.jsx`

---

## 🧰 Test Structure

```javascript
import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/utils/test-utils'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    renderWithProviders(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('handles user interaction', async () => {
    const user = userEvent.setup()
    const mockFn = vi.fn()
    
    renderWithProviders(<MyComponent onClick={mockFn} />)
    
    await user.click(screen.getByRole('button'))
    
    await waitFor(() => {
      expect(mockFn).toHaveBeenCalled()
    })
  })
})
```

---

## 🔧 Utilities

### Test Utils (`src/test/utils/test-utils.jsx`)

**renderWithProviders:**
```javascript
import { renderWithProviders } from './test/utils/test-utils'

renderWithProviders(<MyComponent />, {
  route: '/custom-route',
  authValue: mockUser,
})
```

**Mock Data:**
```javascript
import { mockUser, mockSession, createMockPreset } from './test/utils/test-utils'

const user = mockUser
const preset = createMockPreset({ name: 'Custom' })
```

---

## 🎭 Mocks

### Supabase Mock (`src/test/mocks/supabase.js`)

Mocks all Supabase methods:
- `auth.signUp()`
- `auth.signIn()`
- `auth.signOut()`
- `from().select()`
- `storage.upload()`

### Fetch Mock (`src/test/mocks/fetch.js`)

Mocks API calls:
- `/api/generate`
- `/api/platforms`
- `/api/images/upload`

### Router Mock (`src/test/mocks/router.js`)

Mocks React Router:
- `useNavigate()`
- `useLocation()`
- `Link`
- `Navigate`

---

## ⚙️ Configuration

### vitest.config.js

```javascript
export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/test/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
})
```

---

## 🐛 Debugging Tests

### Run single test in watch mode
```bash
npm test -- Login.test.jsx
```

### Use console.log
```javascript
it('debugs component', () => {
  const { debug } = render(<MyComponent />)
  debug() // Prints DOM to console
})
```

### Use screen.logTestingPlaygroundURL
```javascript
it('debugs with playground', () => {
  render(<MyComponent />)
  screen.logTestingPlaygroundURL()
  // Opens testing-playground.com with your DOM
})
```

---

## ✅ Best Practices

1. **Test user behavior, not implementation**
   ```javascript
   // Good
   await user.click(screen.getByRole('button', { name: /submit/i }))
   
   // Avoid
   wrapper.find('.submit-button').simulate('click')
   ```

2. **Use semantic queries**
   ```javascript
   screen.getByRole('button')
   screen.getByLabelText('Email')
   screen.getByText('Welcome')
   ```

3. **Wait for async updates**
   ```javascript
   await waitFor(() => {
     expect(screen.getByText('Success')).toBeInTheDocument()
   })
   ```

4. **Clean up after tests**
   ```javascript
   afterEach(() => {
     cleanup()
     vi.clearAllMocks()
   })
   ```

5. **Mock external dependencies**
   ```javascript
   vi.mock('./services/api')
   ```

---

## 📊 Coverage Reports

### View Coverage

After running `npm run test:coverage`:

```bash
# Open HTML report
open coverage/index.html

# Or on Linux
xdg-open coverage/index.html
```

### Coverage Output

```
----------------|---------|----------|---------|---------|-------------------
File            | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------------|---------|----------|---------|---------|-------------------
All files       |   85.23 |    78.45 |   82.11 |   85.67 |
src/            |     100 |      100 |     100 |     100 |
 App.jsx        |     100 |      100 |     100 |     100 |
components/auth |   82.45 |    75.32 |   80.12 |   83.21 |
 Login.jsx      |   88.23 |    82.14 |   85.71 |   88.92 |
 Signup.jsx     |   85.67 |    78.23 |   82.35 |   86.12 |
----------------|---------|----------|---------|---------|-------------------
```

---

## 🤖 CI/CD Integration

Tests run automatically on:
- **Push** to main, develop, or feature branches
- **Pull requests** to main or develop

CI runs:
1. Install dependencies
2. Run linter
3. Run all tests
4. Generate coverage report
5. Upload to Codecov
6. Comment coverage on PR

---

## 📝 Writing Tests

### Component Test Template

```javascript
import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/utils/test-utils'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('renders without crashing', () => {
    renderWithProviders(<MyComponent />)
    expect(screen.getByText('Title')).toBeInTheDocument()
  })

  it('handles user interaction', async () => {
    const user = userEvent.setup()
    const mockFn = vi.fn()
    
    renderWithProviders(<MyComponent onAction={mockFn} />)
    
    await user.click(screen.getByRole('button'))
    
    await waitFor(() => {
      expect(mockFn).toHaveBeenCalled()
    })
  })
})
```

---

## 🔗 Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [User Event](https://testing-library.com/docs/user-event/intro)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

---

**Testing infrastructure complete!** 🎉
