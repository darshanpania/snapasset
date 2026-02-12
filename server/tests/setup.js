// Test setup file
import { jest } from '@jest/globals'

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.PORT = '3002'
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_KEY = 'test-service-key'
process.env.OPENAI_API_KEY = 'sk-test-key'
process.env.ALLOWED_ORIGINS = 'http://localhost:5173'

// Increase timeout for slow tests
jest.setTimeout(10000)

// Suppress console during tests (optional)
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
}

// Clean up after all tests
afterAll(() => {
  // Cleanup code here if needed
})