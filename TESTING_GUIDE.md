# SnapAsset Testing Guide

## 🎯 Overview

Complete guide to testing in SnapAsset with examples and best practices.

---

## 🚀 Quick Start

### Run All Tests

```bash
# Frontend tests
npm test

# Backend tests
cd server && npm test
```

### Watch Mode (Development)

```bash
# Frontend
npm run test:watch

# Backend
cd server && npm run test:watch
```

### Coverage Reports

```bash
# Frontend
npm run test:coverage
open coverage/index.html

# Backend
cd server && npm run test:coverage
open coverage/index.html
```

---

## 📚 Frontend Testing

### Test Files

| Component | Test File | Tests |
|-----------|-----------|-------|
| PromptInput | `PromptInput.test.jsx` | 10 |
| PlatformPresets | `PlatformPresets.test.jsx` | 9 |
| ResultsGrid | `ResultsGrid.test.jsx` | 10 |
| Login | `auth/Login.test.jsx` | 12 |
| Signup | `auth/Signup.test.jsx` | 9 |
| UserProfile | `auth/UserProfile.test.jsx` | 10 |
| AuthContext | `AuthContext.test.jsx` | 10 |
| ProtectedRoute | `auth/ProtectedRoute.test.jsx` | 3 |

**Total:** 73+ tests

### Example Test

```jsx
import { render, screen, fireEvent } from '../tests/utils/test-utils'
import PromptInput from './PromptInput'

test('updates character count when typing', async () => {
  const mockOnGenerate = vi.fn()
  render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
  
  const textarea = screen.getByPlaceholderText(/describe your image/i)
  fireEvent.change(textarea, { target: { value: 'Test prompt' } })
  
  expect(screen.getByText('11/500')).toBeInTheDocument()
})
```

### Running Specific Tests

```bash
# Run tests for specific component
npm test PromptInput

# Run tests matching pattern
npm test auth

# Run single test file
npm test src/components/PromptInput.test.jsx
```

---

## 📚 Backend Testing

### Test Files

| Module | Test File | Tests |
|--------|-----------|-------|
| Server | `index.test.js` | 6 |
| Image Routes | `routes/images.test.js` | 15 |
| Image Service | `services/imageService.test.js` | 12 |
| Error Handler | `middleware/errorHandler.test.js` | 8 |
| Logger | `tests/unit/logger.test.js` | 5 |
| Integration | `tests/integration/api.integration.test.js` | 5 |

**Total:** 51+ tests

### Example Test

```javascript
import request from 'supertest'
import app from '../index.js'

test('POST /api/generate returns images', async () => {
  const response = await request(app)
    .post('/api/generate')
    .send({
      prompt: 'A beautiful sunset',
      presets: ['instagram-post']
    })
    .expect(200)
  
  expect(response.body.success).toBe(true)
  expect(response.body.images).toBeDefined()
})
```

### Running Specific Tests

```bash
cd server

# Run tests for specific file
npm test images.test

# Run tests matching pattern
npm test routes

# Run single test file
npm test routes/images.test.js
```

---

## 🤖 Mocking

### Frontend Mocks

**Supabase:**
```javascript
import { mockSupabase } from '../tests/mocks/supabase'

// Mock is automatically applied
// Use in tests:
expect(mockSupabase.auth.signIn).toHaveBeenCalled()
```

**API Calls:**
```javascript
import { setupFetchMock, mockFetchError } from '../tests/mocks/api'

setupFetchMock() // Mock successful responses
mockFetchError('Custom error') // Mock error
```

### Backend Mocks

**OpenAI:**
```javascript
jest.unstable_mockModule('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    images: { generate: jest.fn().mockResolvedValue({...}) }
  }))
}))
```

**Sharp:**
```javascript
import { mockSharp, resetSharpMock } from './tests/mocks/sharp'

// Reset between tests
beforeEach(() => resetSharpMock())
```

---

## 📊 Coverage Goals

### Current Coverage

**Frontend:**
- Lines: 80%+
- Functions: 80%+
- Branches: 80%+
- Statements: 80%+

**Backend:**
- Lines: 80%+
- Functions: 80%+
- Branches: 80%+
- Statements: 80%+

### Coverage Reports

**HTML Reports:**
- Frontend: `coverage/index.html`
- Backend: `server/coverage/index.html`

**LCOV (for CI):**
- Frontend: `coverage/lcov.info`
- Backend: `server/coverage/lcov.info`

---

## 🔄 CI/CD Integration

### GitHub Actions Workflow

**File:** `.github/workflows/test.yml`

**Jobs:**
1. **frontend-tests** - Run frontend test suite
2. **backend-tests** - Run backend test suite
3. **test-summary** - Aggregate results

**Features:**
- Matrix testing (Node 18.x, 20.x)
- Coverage upload to Codecov
- Artifact uploads
- PR comments with coverage diff

### Running in CI

Tests run automatically on:
- Push to main/develop
- Pull requests
- Feature branch pushes

---

## 📝 Writing New Tests

### Frontend Component Test Template

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../tests/utils/test-utils'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('renders component', () => {
    render(<MyComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  it('handles user interaction', async () => {
    const mockHandler = vi.fn()
    render(<MyComponent onAction={mockHandler} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(mockHandler).toHaveBeenCalled()
  })
})
```

### Backend API Test Template

```javascript
import { describe, it, expect } from '@jest/globals'
import request from 'supertest'
import app from '../index.js'

describe('API Endpoint', () => {
  it('returns expected response', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .expect(200)
    
    expect(response.body).toHaveProperty('success', true)
    expect(response.body).toHaveProperty('data')
  })

  it('validates input', async () => {
    await request(app)
      .post('/api/endpoint')
      .send({ invalid: 'data' })
      .expect(400)
  })
})
```

---

## ✅ Testing Checklist

### Before Committing

- [ ] All tests passing locally
- [ ] Coverage meets thresholds (80%)
- [ ] New features have tests
- [ ] Edge cases covered
- [ ] Error handling tested
- [ ] No console.errors in tests
- [ ] Mocks properly reset
- [ ] Async operations handled

### Test Coverage

- [ ] Happy path (success scenarios)
- [ ] Error cases
- [ ] Edge cases
- [ ] Input validation
- [ ] Loading states
- [ ] User interactions
- [ ] API calls
- [ ] State updates

---

## 🐛 Common Issues

### "Module not found" in tests
**Solution:** Check import paths, use path aliases in vitest.config.js

### "fetch is not defined"
**Solution:** Mock fetch in setup.js or use setupFetchMock()

### "Cannot find module" with ES modules
**Solution:** Use `jest.unstable_mockModule` before importing

### Tests pass locally but fail in CI
**Solution:** Check environment variables, timeouts, async handling

### Coverage lower than expected
**Solution:** Check excluded files, add missing test cases

---

## 📚 Best Practices

### DO:
- ✅ Test user behavior, not implementation
- ✅ Use descriptive test names
- ✅ Keep tests focused and simple
- ✅ Mock external dependencies
- ✅ Clean up after tests
- ✅ Test error scenarios
- ✅ Use semantic queries

### DON'T:
- ❌ Test implementation details
- ❌ Make tests dependent on each other
- ❌ Use arbitrary timeouts
- ❌ Test library code
- ❌ Skip cleanup
- ❌ Ignore failing tests

---

## 🚀 Advanced Topics

### Custom Matchers

Extend jest-dom with custom matchers:

```javascript
expect.extend({
  toBeValidImage(received) {
    const pass = received.url && received.width && received.height
    return {
      pass,
      message: () => `Expected valid image object`,
    }
  },
})
```

### Snapshot Testing

```jsx
it('matches snapshot', () => {
  const { container } = render(<MyComponent />)
  expect(container).toMatchSnapshot()
})
```

### Performance Testing

```javascript
it('completes within time limit', async () => {
  const start = Date.now()
  await myAsyncFunction()
  const duration = Date.now() - start
  
  expect(duration).toBeLessThan(1000) // 1 second
})
```

---

## 📊 Monitoring Coverage

### Local Development

```bash
# Generate and view coverage
npm run test:coverage
open coverage/index.html
```

### CI/CD

- Coverage uploaded to Codecov
- Reports in PR comments
- Historical tracking
- Badge in README

### Coverage Badge

Add to README.md:
```markdown
[![codecov](https://codecov.io/gh/darshanpania/snapasset/branch/main/graph/badge.svg)](https://codecov.io/gh/darshanpania/snapasset)
```

---

## 🔧 Debugging Tests

### Vitest UI

```bash
npm run test:ui
```

Opens interactive UI at http://localhost:51204

### Debug Output

```javascript
import { screen, debug } from '@testing-library/react'

// Print DOM
screen.debug()

// Print specific element
screen.debug(screen.getByRole('button'))
```

### Verbose Mode

```bash
# Frontend
npm test -- --reporter=verbose

# Backend
cd server && npm run test:verbose
```

---

## 📚 Resources

### Documentation
- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/)
- [Jest Docs](https://jestjs.io/)
- [Supertest Docs](https://github.com/visionmedia/supertest)

### Testing Guides
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing Best Practices](https://testingjavascript.com/)
- [React Testing Tutorial](https://www.robinwieruch.de/react-testing-library/)

---

## ✅ Test Statistics

**Frontend:**
- Component Tests: 73+
- Coverage: 80%+
- Test Files: 8
- Mocks: 2
- Helpers: 2

**Backend:**
- API Tests: 51+
- Coverage: 80%+
- Test Files: 6
- Mocks: 4
- Helpers: 2

**Total:** 124+ tests across frontend and backend

---

## 🎉 Summary

SnapAsset has comprehensive testing with:
- ✅ 124+ automated tests
- ✅ 80%+ code coverage
- ✅ CI/CD integration
- ✅ Multiple test types (unit, integration)
- ✅ Proper mocking
- ✅ Coverage reporting
- ✅ Best practices followed

**Run `npm test` to start testing!** 🚀

---

Built with ❤️ by Darshan Pania
