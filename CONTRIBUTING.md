# Contributing to SnapAsset

Thank you for considering contributing to SnapAsset! 🎉

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Submitting Changes](#submitting-changes)

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone.

### Our Standards

- ✅ Be respectful and inclusive
- ✅ Welcome newcomers
- ✅ Accept constructive criticism
- ✅ Focus on what's best for the community

## Getting Started

### 1. Fork the Repository

```bash
# Fork on GitHub, then clone
git clone https://github.com/YOUR_USERNAME/snapasset.git
cd snapasset
```

### 2. Set Up Development Environment

```bash
# Install dependencies
cd server
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start development
npm run dev      # Terminal 1: API server
npm run worker   # Terminal 2: Worker
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

## Development Process

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test improvements
- `chore/` - Maintenance tasks

**Examples:**
- `feature/add-video-support`
- `fix/queue-memory-leak`
- `docs/update-api-guide`

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body

footer
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

**Examples:**
```
feat(jobs): add job priority support

fix(queue): resolve memory leak in SSE connections

docs(api): update rate limiting documentation

test(jobs): add tests for retry logic
```

## Coding Standards

### JavaScript/Node.js

- Use ES6+ features
- Use async/await over callbacks
- Use const/let, never var
- Use meaningful variable names
- Add JSDoc comments for functions
- Follow existing code style

**Example:**

```javascript
/**
 * Generate image using DALL-E 3
 * @param {string} prompt - Image generation prompt
 * @param {Object} options - Generation options
 * @returns {Promise<{url: string, revisedPrompt: string}>}
 * @throws {Error} If generation fails
 */
export async function generateWithDallE(prompt, options = {}) {
  // Implementation
}
```

### Code Organization

```
server/
├── config/          # Configuration files
├── middleware/      # Express middleware
├── routes/          # API routes
├── services/        # Business logic
├── workers/         # Queue workers
├── __tests__/       # Tests
└── index.js         # Entry point
```

### Error Handling

```javascript
// Always use try/catch for async operations
try {
  const result = await someAsyncOperation();
  return result;
} catch (error) {
  // Log the error
  logger.error('Operation failed:', error);
  
  // Throw appropriate error
  throw new ApiError('Operation failed', 500, 'OPERATION_ERROR');
}
```

## Testing

### Write Tests for:

- ✅ New features
- ✅ Bug fixes
- ✅ API endpoints
- ✅ Service functions
- ✅ Error cases

### Test Structure

```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  describe('specific functionality', () => {
    it('should do something specific', async () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = await functionUnderTest(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Coverage Requirements

- Minimum 70% overall coverage
- 100% for critical paths
- All new code must have tests

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Specific file
npm test -- jobs.test.js
```

## Documentation

### Update Documentation When:

- Adding new endpoints
- Changing API behavior
- Adding new features
- Fixing bugs that affect usage

### Documentation Types

1. **Code Comments**
   - JSDoc for all exported functions
   - Inline comments for complex logic

2. **API Documentation**
   - Swagger annotations in routes
   - Update OpenAPI spec

3. **Guides**
   - Update relevant markdown files
   - Add examples

4. **README**
   - Keep README.md up to date
   - Update feature list

## Submitting Changes

### 1. Ensure Quality

```bash
# Run tests
npm test

# Check coverage
npm run test:coverage

# Lint code (if configured)
npm run lint
```

### 2. Commit Changes

```bash
git add .
git commit -m "feat(jobs): add job priority support"
```

### 3. Push to Fork

```bash
git push origin feature/your-feature-name
```

### 4. Create Pull Request

1. Go to GitHub repository
2. Click "New Pull Request"
3. Select your fork and branch
4. Fill in PR template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] Coverage maintained/improved

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Added tests
- [ ] All tests pass
```

### 5. Code Review

- Respond to review comments
- Make requested changes
- Push updates to same branch
- Request re-review

### 6. Merge

- Wait for approval
- Ensure CI passes
- Squash and merge (or rebase)

## Pull Request Guidelines

### Good PR

- ✅ Single, focused change
- ✅ Clear description
- ✅ Tests included
- ✅ Documentation updated
- ✅ Small, reviewable size (< 400 lines)
- ✅ Meaningful commits

### Avoid

- ❌ Multiple unrelated changes
- ❌ Missing tests
- ❌ Outdated documentation
- ❌ Very large PRs (> 1000 lines)
- ❌ Unclear commit messages

## Review Process

### What Reviewers Check

1. **Functionality**
   - Does it work as intended?
   - Are edge cases handled?

2. **Code Quality**
   - Is code readable?
   - Are names meaningful?
   - Is it well-structured?

3. **Tests**
   - Are there tests?
   - Do tests cover edge cases?
   - Are tests meaningful?

4. **Documentation**
   - Is it documented?
   - Are examples provided?
   - Is API doc updated?

5. **Security**
   - Any security concerns?
   - Input validation?
   - No secrets committed?

### Review Timeline

- Initial review: Within 2 business days
- Follow-up: Within 1 business day
- Merge: After approval and CI passes

## Development Tips

### Debugging

```javascript
// Use debugger
import debug from 'debug';
const log = debug('snapasset:jobs');

log('Job created:', jobId);

// Run with debug output
DEBUG=snapasset:* npm run dev
```

### Testing Locally

```bash
# Test with curl
curl -X POST http://localhost:3001/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","prompt":"test","platforms":["instagram-post"]}'

# Test SSE
curl -N http://localhost:3001/api/sse/jobs/YOUR_JOB_ID

# Monitor queue
curl http://localhost:3001/api/queue/stats
```

### Common Issues

**Issue:** Redis connection failed
**Solution:** Make sure Redis is running or unset REDIS_HOST to use memory

**Issue:** OpenAI API error
**Solution:** Check API key and quota

**Issue:** Tests failing
**Solution:** Run `npm install` and check test logs

## Issue Reports

### Good Bug Report

```markdown
**Description**
Clear description of the bug

**Steps to Reproduce**
1. Step 1
2. Step 2
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: Ubuntu 22.04
- Node: 18.17.0
- Version: 1.0.0

**Logs/Screenshots**
Relevant error logs or screenshots
```

### Good Feature Request

```markdown
**Problem**
What problem does this solve?

**Proposed Solution**
How would you solve it?

**Alternatives**
Other approaches considered?

**Additional Context**
Any other relevant information
```

## Community

### Where to Get Help

- 📚 Documentation: http://localhost:3001/api-docs
- 🐛 Bug reports: [GitHub Issues](https://github.com/darshanpania/snapasset/issues)
- 💬 Questions: [GitHub Discussions](https://github.com/darshanpania/snapasset/discussions)
- ✉️ Email: support@snapasset.com

### Ways to Contribute

- 🐛 Report bugs
- ✨ Suggest features
- 📝 Improve documentation
- 🚀 Submit pull requests
- ⭐ Star the repository
- 📣 Share with others

## Recognition

Contributors will be:
- ✅ Listed in CONTRIBUTORS.md
- ✅ Mentioned in release notes
- ✅ Thanked in changelogs

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Don't hesitate to ask! Open a discussion or issue.

Happy contributing! 🎉