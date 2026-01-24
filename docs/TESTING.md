# Testing Documentation for SnapAsset

## 🧪 Overview

Comprehensive testing infrastructure for both frontend and backend of SnapAsset.

---

## Frontend Testing

### 🛠️ Stack

- **Vitest** - Fast, Vite-native test runner
- **React Testing Library** - Component testing utilities
- **Happy DOM** - Lightweight DOM implementation
- **@testing-library/jest-dom** - Custom matchers
- **@testing-library/user-event** - User interaction simulation

### 📝 Configuration

**vitest.config.js:**
```javascript
{
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/tests/setup.js'],
    coverage: {
      provider: 'v8',
      threshold: { all: 80 }
    }
  }
}
```

### 📁 Test Structure

```
src/
├── tests/
│   ├── setup.js                  # Global test setup
│   ├── mocks/
│   │   ├── supabase.js           # Supabase mocks
│   │   └── api.js                # API mocks
│   └── utils/
│       └── test-utils.jsx        # Custom render function
├── components/
│   ├── PromptInput.jsx
│   ├── PromptInput.test.jsx      # Component tests
│   ├── PlatformPresets.jsx
│   ├── PlatformPresets.test.jsx
│   ├── ResultsGrid.jsx
│   └── ResultsGrid.test.jsx
└── contexts/
    ├── AuthContext.jsx
    └── AuthContext.test.jsx
```

### 🏃 Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests once
npm run test:run

# Generate coverage report
npm run test:coverage

# Open Vitest UI
npm run test:ui
```

### 📊 Coverage Thresholds

- **Lines:** 80%
- **Functions:** 80%
- **Branches:** 80%
- **Statements:** 80%

### ✅ Tests Implemented

#### PromptInput Component (10 tests)
- ✅ Renders component
- ✅ Displays character count
- ✅ Updates count on typing
- ✅ Enforces max character limit
- ✅ Validates empty prompt
- ✅ Validates minimum length
- ✅ Calls onGenerate with correct data
- ✅ Disables during generation
- ✅ Shows loading state
- ✅ Has all style options

#### PlatformPresets Component (9 tests)
- ✅ Renders component
- ✅ Shows selection summary
- ✅ Expands categories
- ✅ Toggles platform selection
- ✅ Filters by search
- ✅ Clears search
- ✅ Disables when generating
- ✅ Shows clear all button
- ✅ Handles select all

#### ResultsGrid Component (10 tests)
- ✅ Returns null for empty results
- ✅ Renders results grid
- ✅ Displays correct count
- ✅ Shows dimensions
- ✅ Displays file sizes
- ✅ Has download buttons
- ✅ Opens preview modal
- ✅ Closes modal
- ✅ Formats file sizes
- ✅ Handles downloads

#### Auth Components (15+ tests)
- ✅ Login component tests
- ✅ Signup component tests
- ✅ UserProfile component tests
- ✅ ProtectedRoute component tests
- ✅ AuthContext tests

**Total Frontend Tests:** 44+

---

## Backend Testing

### 🛠️ Stack

- **Jest** - Comprehensive test framework
- **Supertest** - HTTP assertion library
- **Mock modules** - For external services

### 📝 Configuration

**jest.config.js:**
```javascript
{
  testEnvironment: 'node',
  coverageThreshold: {
    global: { all: 80 }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
}
```

### 📁 Test Structure

```
server/
├── tests/
│   ├── setup.js                    # Test configuration
│   ├── mocks/
│   │   ├── openai.js               # OpenAI mocks
│   │   ├── sharp.js                # Sharp mocks
│   │   ├── supabase.js             # Supabase mocks
│   │   └── axios.js                # Axios mocks
│   ├── integration/
│   │   └── api.integration.test.js # End-to-end tests
│   └── unit/
│       └── logger.test.js          # Unit tests
├── routes/
│   ├── images.js
│   └── images.test.js              # Route tests
├── services/
│   ├── imageService.js
│   └── imageService.test.js        # Service tests
├── middleware/
│   ├── errorHandler.js
│   └── errorHandler.test.js        # Middleware tests
└── index.test.js                    # Server tests
```

### 🏃 Running Tests

```bash
cd server

# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Generate coverage
npm run test:coverage

# Verbose output
npm run test:verbose
```

### ✅ Tests Implemented

#### API Routes Tests (15+ tests)
- ✅ GET /api/platforms
- ✅ POST /api/generate validation
- ✅ POST /api/generate success
- ✅ POST /api/images/upload
- ✅ Error handling
- ✅ Rate limiting errors
- ✅ Service configuration errors

#### Image Service Tests (12+ tests)
- ✅ getPlatformPresets()
- ✅ getPresetById()
- ✅ generateImageWithDallE()
- ✅ downloadImage()
- ✅ processImage()
- ✅ bufferToDataUrl()
- ✅ generateImagesFromPrompt()
- ✅ Error handling

#### Middleware Tests (8+ tests)
- ✅ Error handler
- ✅ Multer errors
- ✅ Validation errors
- ✅ 404 handler
- ✅ Development vs production errors

#### Server Tests (6+ tests)
- ✅ Health check endpoint
- ✅ API info endpoint
- ✅ 404 handling
- ✅ CORS headers
- ✅ Security headers

#### Integration Tests (5+ tests)
- ✅ End-to-end image generation
- ✅ Complete validation flow
- ✅ Error handling flow

**Total Backend Tests:** 46+

---

## 🎯 Test Coverage

### Coverage Reports

Generated in multiple formats:
- **Text** - Terminal output
- **HTML** - Interactive browser view
- **LCOV** - For CI/CD integration
- **JSON** - For programmatic access

### Viewing Coverage

**Frontend:**
```bash
npm run test:coverage
open coverage/index.html
```

**Backend:**
```bash
cd server
npm run test:coverage
open coverage/index.html
```

---

## 🤖 Mocking Strategy

### Frontend Mocks

**Supabase:**
- Mock auth methods
- Mock database queries
- Mock storage operations

**API Calls:**
- Mock fetch responses
- Mock success/error scenarios

**Browser APIs:**
- Mock matchMedia
- Mock IntersectionObserver
- Mock scrollIntoView

### Backend Mocks

**OpenAI:**
- Mock DALL-E image generation
- Mock rate limit errors
- Mock API key errors

**Sharp:**
- Mock image processing
- Mock resize operations
- Mock format conversions

**Axios:**
- Mock image downloads
- Mock network errors

**Supabase:**
- Mock database operations
- Mock storage operations

---

## 📝 Writing Tests

### Frontend Test Example

```jsx
import { render, screen, fireEvent } from '../tests/utils/test-utils'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('handles user interaction', async () => {
    const mockHandler = vi.fn()
    render(<MyComponent onClick={mockHandler} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(mockHandler).toHaveBeenCalled()
  })
})
```

### Backend Test Example

```javascript
import request from 'supertest'
import app from '../index.js'

describe('API Endpoint', () => {
  it('returns 200 OK', async () => {
    const response = await request(app)
      .get('/api/test')
      .expect(200)

    expect(response.body).toHaveProperty('success', true)
  })
})
```

---

## 🔄 CI/CD Integration

### GitHub Actions

**Workflow:** `.github/workflows/test.yml`

**Runs on:**
- Push to main, develop
- Pull requests
- Feature branches

**Matrix Testing:**
- Node 18.x
- Node 20.x

**Steps:**
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Run linter
5. Run tests
6. Generate coverage
7. Upload to Codecov
8. Upload artifacts

### Coverage Tracking

- **Codecov integration** - Tracks coverage over time
- **Coverage artifacts** - Downloadable reports
- **PR comments** - Coverage diff on pull requests

---

## 📊 Test Scripts

### Frontend

```json
{
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage",
  "test:watch": "vitest watch"
}
```

### Backend

```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:verbose": "jest --verbose"
}
```

---

## ✅ Best Practices

### General
1. **Arrange-Act-Assert** pattern
2. **One assertion per test** (when possible)
3. **Descriptive test names**
4. **Test behavior, not implementation**
5. **Mock external dependencies**

### Frontend
1. **Use semantic queries** (getByRole, getByLabelText)
2. **Avoid testing implementation details**
3. **Test user interactions**
4. **Use waitFor for async**
5. **Clean up after tests**

### Backend
1. **Test all HTTP methods**
2. **Test success and error cases**
3. **Validate request/response**
4. **Mock external APIs**
5. **Test edge cases**

---

## 🐛 Troubleshooting

### Common Issues

**Tests timing out:**
- Increase timeout in jest/vitest config
- Check for unresolved promises
- Ensure async operations complete

**Mocks not working:**
- Check mock is defined before import
- Use `jest.unstable_mockModule` for ES modules
- Clear mocks between tests

**Coverage not accurate:**
- Exclude test files in coverage config
- Ensure all source files are included
- Check for untested branches

**React Testing Library errors:**
- Use appropriate queries
- Wait for async updates with `waitFor`
- Clean up with `cleanup()`

---

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Jest Documentation](https://jestjs.io/)
- [Supertest GitHub](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## 🚀 Next Steps

1. **Write more tests** - Increase coverage
2. **Add E2E tests** - Use Playwright/Cypress
3. **Performance tests** - Load testing
4. **Visual regression** - Screenshot comparison
5. **Accessibility tests** - axe-core integration

---

**Testing infrastructure complete!** 🎉

Run `npm test` to start testing!
