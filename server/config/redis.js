/**
 * Redis Configuration
 * Supports Redis, Upstash Redis, or in-memory fallback
 */

import Redis from 'ioredis'

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
}

// For Upstash Redis (Railway, Heroku, etc.)
if (process.env.REDIS_URL) {
  // Parse Redis URL
  const url = new URL(process.env.REDIS_URL)
  redisConfig.host = url.hostname
  redisConfig.port = parseInt(url.port) || 6379
  if (url.password) {
    redisConfig.password = url.password
  }
  // Enable TLS for Upstash
  if (url.protocol === 'rediss:') {
    redisConfig.tls = {
      rejectUnauthorized: false
    }
  }
}

export let redisClient = null
export let isRedisAvailable = false

/**
 * Initialize Redis connection
 */
export async function initRedis() {
  try {
    redisClient = new Redis(redisConfig)

    redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error:', err.message)
      isRedisAvailable = false
    })

    redisClient.on('connect', () => {
      console.log('✅ Redis connected')
      isRedisAvailable = true
    })

    // Test connection
    await redisClient.ping()
    console.log('🔗 Redis connection established')
    return redisClient
  } catch (error) {
    console.warn('⚠️  Redis not available, using in-memory queue fallback')
    console.warn('   Error:', error.message)
    isRedisAvailable = false
    return null
  }
}

/**
 * Close Redis connection
 */
export async function closeRedis() {
  if (redisClient) {
    await redisClient.quit()
    console.log('🔌 Redis connection closed')
  }
}

export default redisClient