/**
 * Simple logger utility
 */

const isDevelopment = process.env.NODE_ENV !== 'production'

class Logger {
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString()
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : ''
    return `[${timestamp}] [${level}] ${message} ${metaStr}`
  }

  info(message, meta = {}) {
    console.log(this.formatMessage('INFO', message, meta))
  }

  warn(message, meta = {}) {
    console.warn(this.formatMessage('WARN', message, meta))
  }

  error(message, meta = {}) {
    console.error(this.formatMessage('ERROR', message, meta))
  }

  debug(message, meta = {}) {
    if (isDevelopment) {
      console.debug(this.formatMessage('DEBUG', message, meta))
    }
  }
}

export default new Logger()