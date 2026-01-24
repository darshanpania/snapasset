import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals'

// Import logger
const logger = (await import('../../utils/logger.js')).default

describe('Logger Utility', () => {
  let consoleLogSpy, consoleWarnSpy, consoleErrorSpy

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  it('logs info messages', () => {
    logger.info('Test message')
    
    expect(consoleLogSpy).toHaveBeenCalled()
    expect(consoleLogSpy.mock.calls[0][0]).toContain('INFO')
    expect(consoleLogSpy.mock.calls[0][0]).toContain('Test message')
  })

  it('logs warnings', () => {
    logger.warn('Warning message')
    
    expect(consoleWarnSpy).toHaveBeenCalled()
    expect(consoleWarnSpy.mock.calls[0][0]).toContain('WARN')
    expect(consoleWarnSpy.mock.calls[0][0]).toContain('Warning message')
  })

  it('logs errors', () => {
    logger.error('Error message')
    
    expect(consoleErrorSpy).toHaveBeenCalled()
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('ERROR')
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('Error message')
  })

  it('includes timestamp in log messages', () => {
    logger.info('Test')
    
    const logMessage = consoleLogSpy.mock.calls[0][0]
    // Should match ISO timestamp format
    expect(logMessage).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })

  it('includes metadata in logs', () => {
    logger.info('Test message', { userId: '123', action: 'test' })
    
    const logMessage = consoleLogSpy.mock.calls[0][0]
    expect(logMessage).toContain('userId')
    expect(logMessage).toContain('123')
  })
})