# Testing Best Practices for SnapAsset

## 🎯 Philosophy

> "Write tests. Not too many. Mostly integration." - Kent C. Dodds

### Key Principles

1. **Test behavior, not implementation**
2. **Test from the user's perspective**
3. **Prefer integration over unit tests**
4. **Keep tests simple and readable**
5. **Mock as little as possible**

---

## ✅ What to Test

### DO Test

✅ **User interactions**
```javascript
it('submits form when button clicked', async () => {
  // Test what users do
})
```

✅ **Rendering based on props**
```javascript
it('shows error message when error prop is passed', () => {
  // Test component output
})
```

✅ **Conditional logic**
```javascript
it('shows different UI for authenticated users', () => {
  // Test branching logic
})
```

✅ **Error states**
```javascript
it('displays error when API fails', async () => {
  // Test error handling
})
```

✅ **Loading states**
```javascript
it('shows spinner while loading', () => {
  // Test async states
})
```

### DON'T Test

❌ **Implementation details**
```javascript
// Bad
expect(wrapper.state().count).toBe(5)

// Good
expect(screen.getByText('Count: 5')).toBeInTheDocument()
```

❌ **Third-party libraries**
```javascript
// Don't test that React Router works
// Test that your app uses it correctly
```

❌ **Styling (mostly)**
```javascript
// Avoid testing CSS
// Test accessibility and semantic structure instead
```

---

## 📝 Test Organization

### File Naming

```
MyComponent.jsx      →  MyComponent.test.jsx
myHook.js            →  myHook.test.js
myUtility.js         →  myUtility.test.js
```

### Test Structure

```javascript
describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    // Runs before each test
  })

  afterEach(() => {
    // Runs after each test
  })

  // Grouped tests
  describe('when logged in', () => {
    it('shows user menu', () => { ... })
    it('allows logout', () => { ... })
  })

  describe('when logged out', () => {
    it('shows login button', () => { ... })
  })

  // Individual tests
  it('renders without crashing', () => { ... })
  it('handles click events', () => { ... })
})
```

### Test Naming

```javascript
// Good - descriptive
it('shows error message when email is invalid')
it('disables submit button while loading')
it('redirects to dashboard after successful login')

// Bad - unclear
it('works')
it('test 1')
it('handles input')
```

---

## 🔍 Query Selection

### Priority Order

1. **getByRole** - Best for accessibility
   ```javascript
   screen.getByRole('button', { name: /submit/i })
   screen.getByRole('textbox', { name: /email/i })
   ```

2. **getByLabelText** - For form fields
   ```javascript
   screen.getByLabelText('Email')
   screen.getByLabelText(/password/i)
   ```

3. **getByPlaceholderText** - When no label
   ```javascript
   screen.getByPlaceholderText('Enter your email')
   ```

4. **getByText** - For non-interactive elements
   ```javascript
   screen.getByText('Welcome')
   screen.getByText(/hello world/i)
   ```

5. **getByTestId** - Last resort
   ```javascript
   // Only when nothing else works
   screen.getByTestId('complex-component')
   ```

---

## ✨ Assertions

### Existence

```javascript
// Element exists
expect(element).toBeInTheDocument()

// Element doesn't exist
expect(screen.queryByText('Deleted')).not.toBeInTheDocument()
```

### Visibility

```javascript
// Element is visible
expect(element).toBeVisible()

// Element is hidden
expect(element).not.toBeVisible()
```

### State

```javascript
// Disabled/Enabled
expect(button).toBeDisabled()
expect(button).toBeEnabled()

// Checked/Unchecked
expect(checkbox).toBeChecked()
expect(checkbox).not.toBeChecked()
```

### Content

```javascript
// Text content
expect(element).toHaveTextContent('Hello')
expect(element).toHaveTextContent(/hello/i)

// Input value
expect(input).toHaveValue('test@example.com')
expect(input).toHaveValue('')
```

### Attributes & Classes

```javascript
// CSS classes
expect(element).toHaveClass('active')
expect(element).toHaveClass('btn btn-primary')

// Attributes
expect(link).toHaveAttribute('href', '/login')
expect(input).toHaveAttribute('type', 'email')
```

---

## 🧬 Common Patterns

### Pattern 1: AAA (Arrange, Act, Assert)

```javascript
it('increments counter', async () => {
  // Arrange
  const user = userEvent.setup()
  render(<Counter />)
  
  // Act
  await user.click(screen.getByRole('button', { name: /increment/i }))
  
  // Assert
  expect(screen.getByText('Count: 1')).toBeInTheDocument()
})
```

### Pattern 2: Testing Hooks

```javascript
import { renderHook, act } from '@testing-library/react'

it('custom hook increments value', () => {
  const { result } = renderHook(() => useCounter())
  
  expect(result.current.count).toBe(0)
  
  act(() => {
    result.current.increment()
  })
  
  expect(result.current.count).toBe(1)
})
```

### Pattern 3: Testing Context

```javascript
it('provides context values', () => {
  const wrapper = ({ children }) => (
    <MyContext.Provider value={{ theme: 'dark' }}>
      {children}
    </MyContext.Provider>
  )
  
  const { result } = renderHook(() => useMyContext(), { wrapper })
  
  expect(result.current.theme).toBe('dark')
})
```

---

## ⚠️ Common Mistakes

### Mistake 1: Not Waiting for Updates

```javascript
// Bad
it('shows message', () => {
  render(<Component />)
  expect(screen.getByText('Loaded')).toBeInTheDocument() // Might not be loaded yet!
})

// Good
it('shows message', async () => {
  render(<Component />)
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument()
  })
})
```

### Mistake 2: Testing Implementation

```javascript
// Bad
expect(component.state.isOpen).toBe(true)

// Good  
expect(screen.getByRole('dialog')).toBeVisible()
```

### Mistake 3: Using Wrong Query

```javascript
// Bad - will throw if not found
const element = screen.getByText('Maybe not here')
expect(element).toBeNull() // Error! getBy throws

// Good - returns null if not found
const element = screen.queryByText('Maybe not here')
expect(element).toBeNull()
```

### Mistake 4: Not Cleaning Up

```javascript
// Missing cleanup can cause test pollution
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
```

---

## 📊 Coverage Goals

### Target Coverage

- **Critical paths:** 100%
  - Authentication flows
  - Payment processing
  - Data validation

- **User features:** 80-90%
  - UI components
  - User interactions
  - Forms

- **Nice-to-haves:** 60-70%
  - Utility functions
  - Helpers
  - Constants

### Focus on Value

**High value tests:**
- User can sign in
- User can generate images
- Errors are displayed
- Forms validate input

**Low value tests:**
- CSS class names are correct
- Internal state values
- Library function behavior

---

## 🔗 Integration with Development

### Pre-commit Hook

Add to `package.json`:
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:run"
    }
  }
}
```

### Watch Mode

During development:
```bash
npm test
```

Tests re-run automatically when files change.

### Before Commit

```bash
npm run test:run && npm run test:coverage
```

Ensure all tests pass and coverage meets requirements.

---

## 🎉 Summary

**Good tests:**
- Test user behavior
- Use accessible queries
- Wait for async updates
- Are easy to read
- Focus on value
- Run fast
- Are maintainable

**Bad tests:**
- Test implementation
- Use test IDs everywhere
- Don't wait for updates
- Are hard to understand
- Test trivial things
- Are slow
- Break easily

---

**Happy testing!** 🧪
