import { registerAs } from '@nestjs/config';

/**
 * Application configuration
 *
 * Provides core application settings including:
 * - Server port and environment
 * - CORS allowed origins
 * - API version and metadata
 * - Application name and description
 *
 * @returns {Object} Application configuration object
 */
export default registerAs('app', () => ({
  /**
   * Application name
   */
  name: process.env.APP_NAME || 'Multi-Level Agent Lottery Sandbox',

  /**
   * Application description
   */
  description: process.env.APP_DESCRIPTION || 'Multi-level agent hierarchy lottery betting system',

  /**
   * Application version
   */
  version: process.env.APP_VERSION || '1.0.0',

  /**
   * Server port
   * @default 3000
   */
  port: parseInt(process.env.PORT || '3000', 10),

  /**
   * Application environment (development, staging, production)
   * @default 'development'
   */
  environment: process.env.NODE_ENV || 'development',

  /**
   * CORS allowed origins
   * Comma-separated list of allowed origins
   * @default ['http://localhost:3001']
   */
  allowedOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
    : ['http://localhost:3001'],

  /**
   * API prefix
   * @default 'api/v1'
   */
  apiPrefix: process.env.API_PREFIX || 'api/v1',

  /**
   * Enable Swagger documentation
   * @default true in development, false in production
   */
  enableSwagger: process.env.ENABLE_SWAGGER === 'true' || process.env.NODE_ENV === 'development',

  /**
   * Enable request logging
   * @default true
   */
  enableLogging: process.env.ENABLE_LOGGING !== 'false',

  /**
   * Enable response compression
   * @default true
   */
  enableCompression: process.env.ENABLE_COMPRESSION !== 'false',

  /**
   * Request timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10),

  /**
   * Maximum request body size
   * @default '10mb'
   */
  maxBodySize: process.env.MAX_BODY_SIZE || '10mb',

  /**
   * Timezone for application
   * @default 'UTC'
   */
  timezone: process.env.TZ || 'UTC',

  /**
   * Default locale/language
   * @default 'en'
   */
  locale: process.env.LOCALE || 'en',
}));
