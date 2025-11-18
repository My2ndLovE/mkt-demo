import { registerAs } from '@nestjs/config';

/**
 * Cache configuration
 *
 * Provides Redis cache settings including:
 * - Connection configuration
 * - TTL and key prefix settings
 * - Cache strategy configuration
 * - Performance optimization settings
 *
 * @returns {Object} Cache configuration object
 */
export default registerAs('cache', () => ({
  /**
   * Enable caching
   * @default true
   */
  enabled: process.env.CACHE_ENABLED !== 'false',

  /**
   * Cache store type (redis, memory)
   * @default 'redis'
   */
  store: process.env.CACHE_STORE || 'redis',

  /**
   * Redis host
   * @default 'localhost'
   */
  host: process.env.REDIS_HOST || 'localhost',

  /**
   * Redis port
   * @default 6379
   */
  port: parseInt(process.env.REDIS_PORT || '6379', 10),

  /**
   * Redis password
   * @default null
   */
  password: process.env.REDIS_PASSWORD || null,

  /**
   * Redis database index
   * @default 0
   */
  db: parseInt(process.env.REDIS_DB || '0', 10),

  /**
   * Redis connection URL (alternative to host/port)
   * Format: redis://[:password@]host[:port][/db-number]
   */
  url: process.env.REDIS_URL || null,

  /**
   * Default TTL (time-to-live) in seconds
   * @default 3600 (1 hour)
   */
  ttl: parseInt(process.env.CACHE_TTL || '3600', 10),

  /**
   * Cache key prefix
   * Useful for namespacing in shared Redis instances
   * @default 'lottery:'
   */
  keyPrefix: process.env.CACHE_KEY_PREFIX || 'lottery:',

  /**
   * Maximum number of items in cache
   * @default 1000
   */
  max: parseInt(process.env.CACHE_MAX || '1000', 10),

  /**
   * Enable TLS/SSL for Redis connection
   * @default false
   */
  tls: process.env.REDIS_TLS === 'true',

  /**
   * Redis connection timeout in milliseconds
   * @default 5000 (5 seconds)
   */
  connectionTimeout: parseInt(process.env.REDIS_CONNECTION_TIMEOUT || '5000', 10),

  /**
   * Enable Redis connection retry
   * @default true
   */
  enableRetry: process.env.REDIS_ENABLE_RETRY !== 'false',

  /**
   * Maximum retry attempts
   * @default 3
   */
  retryAttempts: parseInt(process.env.REDIS_RETRY_ATTEMPTS || '3', 10),

  /**
   * Retry delay in milliseconds
   * @default 1000 (1 second)
   */
  retryDelay: parseInt(process.env.REDIS_RETRY_DELAY || '1000', 10),

  /**
   * Keep-alive interval in milliseconds
   * @default 30000 (30 seconds)
   */
  keepAlive: parseInt(process.env.REDIS_KEEP_ALIVE || '30000', 10),

  /**
   * Cache specific TTL configurations (in seconds)
   */
  ttls: {
    /**
     * User data cache TTL
     * @default 900 (15 minutes)
     */
    user: parseInt(process.env.CACHE_TTL_USER || '900', 10),

    /**
     * Bet data cache TTL
     * @default 300 (5 minutes)
     */
    bet: parseInt(process.env.CACHE_TTL_BET || '300', 10),

    /**
     * Result data cache TTL
     * @default 3600 (1 hour)
     */
    result: parseInt(process.env.CACHE_TTL_RESULT || '3600', 10),

    /**
     * Commission data cache TTL
     * @default 1800 (30 minutes)
     */
    commission: parseInt(process.env.CACHE_TTL_COMMISSION || '1800', 10),

    /**
     * Limit data cache TTL
     * @default 600 (10 minutes)
     */
    limit: parseInt(process.env.CACHE_TTL_LIMIT || '600', 10),

    /**
     * Provider data cache TTL
     * @default 7200 (2 hours)
     */
    provider: parseInt(process.env.CACHE_TTL_PROVIDER || '7200', 10),

    /**
     * Report data cache TTL
     * @default 300 (5 minutes)
     */
    report: parseInt(process.env.CACHE_TTL_REPORT || '300', 10),

    /**
     * Session data cache TTL
     * @default 1800 (30 minutes)
     */
    session: parseInt(process.env.CACHE_TTL_SESSION || '1800', 10),
  },

  /**
   * Cache invalidation patterns
   */
  invalidation: {
    /**
     * Enable cache invalidation on write operations
     * @default true
     */
    enabled: process.env.CACHE_INVALIDATION_ENABLED !== 'false',

    /**
     * Cache invalidation strategies
     */
    strategies: {
      /**
       * Invalidate all user-related caches on user update
       * @default true
       */
      userUpdate: process.env.CACHE_INVALIDATE_USER_UPDATE !== 'false',

      /**
       * Invalidate bet caches on new bet
       * @default true
       */
      newBet: process.env.CACHE_INVALIDATE_NEW_BET !== 'false',

      /**
       * Invalidate result caches on result update
       * @default true
       */
      resultUpdate: process.env.CACHE_INVALIDATE_RESULT_UPDATE !== 'false',
    },
  },

  /**
   * Enable cache compression
   * Reduces memory usage but adds CPU overhead
   * @default false
   */
  compression: process.env.CACHE_COMPRESSION === 'true',

  /**
   * Enable cache statistics
   * @default true in development, false in production
   */
  statistics:
    process.env.CACHE_STATISTICS === 'true' ||
    (process.env.NODE_ENV === 'development' && process.env.CACHE_STATISTICS !== 'false'),
}));
