/**
 * Monitoring and Logging Middleware
 * Provides request tracking, performance monitoring, and error logging
 */

// Request tracking middleware
export function requestTracker(req, res, next) {
  req.requestId = Math.random().toString(36).substring(7)
  req.startTime = Date.now()
  
  // Log request
  const logData = {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  }
  
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[${logData.requestId}] ${logData.method} ${logData.path}`)
  }
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - req.startTime
    const responseLog = {
      ...logData,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    }
    
    // Warn on slow requests
    if (duration > 1000) {
      console.warn(`⚠️  Slow request [${req.requestId}]: ${duration}ms`)
    }
    
    // Log errors
    if (res.statusCode >= 400) {
      console.error(`❌ Error [${req.requestId}]: ${res.statusCode} - ${req.path}`)
    }
  })
  
  next()
}

// Performance monitoring middleware
export function performanceMonitor(req, res, next) {
  const start = process.hrtime.bigint()
  
  // Capture the original end method to inject the header before sending
  const originalEnd = res.end
  res.end = function (...args) {
    const end = process.hrtime.bigint()
    const duration = Number(end - start) / 1e6 // Convert to milliseconds
    
    // Set header before response is finalized
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`)
    }
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`⚠️  Performance warning: ${req.method} ${req.path} took ${duration.toFixed(2)}ms`)
    }
    
    originalEnd.apply(res, args)
  }
  
  next()
}

// Error logging middleware
export function errorLogger(err, req, res, next) {
  const errorLog = {
    requestId: req.requestId,
    error: {
      message: err.message,
      stack: err.stack,
      code: err.code,
      status: err.status || 500
    },
    request: {
      method: req.method,
      path: req.path,
      body: req.body,
      query: req.query,
      params: req.params
    },
    timestamp: new Date().toISOString()
  }
  
  // Log to console
  console.error(`❌ Error [${req.requestId}]:`, JSON.stringify(errorLog, null, 2))
  
  // TODO: Send to external logging service (Sentry, LogRocket, etc.)
  if (process.env.SENTRY_DSN) {
    // Sentry.captureException(err)
  }
  
  next(err)
}

// Health metrics collector
export class HealthMetrics {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        byStatus: {}
      },
      performance: {
        avgResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: Infinity
      },
      system: {
        startTime: Date.now(),
        uptime: 0
      }
    }
    
    this.responseTimes = []
  }
  
  recordRequest(statusCode, duration) {
    this.metrics.requests.total++
    
    if (statusCode < 400) {
      this.metrics.requests.success++
    } else {
      this.metrics.requests.errors++
    }
    
    // Track status codes
    this.metrics.requests.byStatus[statusCode] = 
      (this.metrics.requests.byStatus[statusCode] || 0) + 1
    
    // Track response times
    this.responseTimes.push(duration)
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift() // Keep last 1000
    }
    
    this.metrics.performance.avgResponseTime = 
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
    this.metrics.performance.maxResponseTime = 
      Math.max(this.metrics.performance.maxResponseTime, duration)
    this.metrics.performance.minResponseTime = 
      Math.min(this.metrics.performance.minResponseTime, duration)
  }
  
  getMetrics() {
    this.metrics.system.uptime = Math.floor((Date.now() - this.metrics.system.startTime) / 1000)
    return this.metrics
  }
  
  reset() {
    this.metrics.requests.total = 0
    this.metrics.requests.success = 0
    this.metrics.requests.errors = 0
    this.metrics.requests.byStatus = {}
    this.responseTimes = []
  }
}

// Create global metrics instance
export const metrics = new HealthMetrics()

// Metrics collection middleware
export function metricsCollector(req, res, next) {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    metrics.recordRequest(res.statusCode, duration)
  })
  
  next()
}

// Security logging
export function securityLogger(req, res, next) {
  // Log suspicious activity
  const suspiciousPatterns = [
    /\.\.\//,  // Path traversal (require the slash)
    /(\bor\b|\bunion\b)\s+(select|drop|delete|update|insert)\b/i,  // SQL injection (require SQL keyword after OR/UNION)
    /<script[\s>]/i,  // XSS attempt
    /eval\s*\(/i,  // Code injection
  ]
  
  const path = req.path.toLowerCase()
  const query = JSON.stringify(req.query).toLowerCase()
  const body = JSON.stringify(req.body).toLowerCase()
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(path) || pattern.test(query) || pattern.test(body)) {
      console.warn(`🚨 Security Warning [${req.requestId}]:`, {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('user-agent'),
        pattern: pattern.source
      })
      
      // TODO: Implement rate limiting or blocking
      break
    }
  }
  
  next()
}

// Structured logging utility
export class Logger {
  static log(level, message, meta = {}) {
    const logEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }
    
    switch (level) {
      case 'error':
        console.error(JSON.stringify(logEntry))
        break
      case 'warn':
        console.warn(JSON.stringify(logEntry))
        break
      case 'info':
        console.info(JSON.stringify(logEntry))
        break
      default:
        console.log(JSON.stringify(logEntry))
    }
  }
  
  static error(message, meta) {
    this.log('error', message, meta)
  }
  
  static warn(message, meta) {
    this.log('warn', message, meta)
  }
  
  static info(message, meta) {
    this.log('info', message, meta)
  }
  
  static debug(message, meta) {
    if (process.env.NODE_ENV !== 'production') {
      this.log('debug', message, meta)
    }
  }
}

export default {
  requestTracker,
  performanceMonitor,
  errorLogger,
  metricsCollector,
  securityLogger,
  metrics,
  Logger
}
