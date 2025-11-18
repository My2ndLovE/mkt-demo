import { registerAs } from '@nestjs/config';

/**
 * JWT configuration
 *
 * Provides JWT authentication settings including:
 * - Secret keys for signing and verification
 * - Token expiration times
 * - Token issuer and audience
 * - Refresh token configuration
 *
 * @returns {Object} JWT configuration object
 */
export default registerAs('jwt', () => ({
  /**
   * JWT secret key for signing tokens
   * IMPORTANT: This should be a strong, random string in production
   * @default 'lottery-sandbox-secret-key-change-in-production'
   */
  secret: process.env.JWT_SECRET || 'lottery-sandbox-secret-key-change-in-production',

  /**
   * JWT access token expiration time
   * Format: number + unit (s, m, h, d)
   * Examples: '60s', '15m', '1h', '7d'
   * @default '15m' (15 minutes)
   */
  accessTokenExpiration: process.env.JWT_ACCESS_TOKEN_EXPIRATION || '15m',

  /**
   * JWT refresh token secret key
   * Should be different from access token secret
   * @default 'lottery-sandbox-refresh-secret-key-change-in-production'
   */
  refreshSecret:
    process.env.JWT_REFRESH_SECRET || 'lottery-sandbox-refresh-secret-key-change-in-production',

  /**
   * JWT refresh token expiration time
   * @default '7d' (7 days)
   */
  refreshTokenExpiration: process.env.JWT_REFRESH_TOKEN_EXPIRATION || '7d',

  /**
   * JWT token issuer
   * Identifies who issued the token
   * @default 'lottery-sandbox-api'
   */
  issuer: process.env.JWT_ISSUER || 'lottery-sandbox-api',

  /**
   * JWT token audience
   * Identifies who the token is intended for
   * @default 'lottery-sandbox-app'
   */
  audience: process.env.JWT_AUDIENCE || 'lottery-sandbox-app',

  /**
   * JWT algorithm
   * @default 'HS256'
   */
  algorithm: process.env.JWT_ALGORITHM || 'HS256',

  /**
   * Enable token verification
   * @default true
   */
  verifyToken: process.env.JWT_VERIFY_TOKEN !== 'false',

  /**
   * Ignore token expiration (for development/testing only)
   * @default false
   */
  ignoreExpiration: process.env.JWT_IGNORE_EXPIRATION === 'true',

  /**
   * Clock tolerance in seconds
   * Allows for small time differences between servers
   * @default 0
   */
  clockTolerance: parseInt(process.env.JWT_CLOCK_TOLERANCE || '0', 10),

  /**
   * Include user metadata in token payload
   * @default true
   */
  includeUserMetadata: process.env.JWT_INCLUDE_USER_METADATA !== 'false',

  /**
   * Maximum token age in seconds
   * Additional check beyond expiration
   * @default null (disabled)
   */
  maxAge: process.env.JWT_MAX_AGE ? parseInt(process.env.JWT_MAX_AGE, 10) : null,

  /**
   * Cookie configuration for refresh tokens
   */
  cookie: {
    /**
     * Cookie name for refresh token
     * @default 'refreshToken'
     */
    name: process.env.JWT_COOKIE_NAME || 'refreshToken',

    /**
     * Cookie HTTP-only flag
     * Prevents JavaScript access to cookie
     * @default true
     */
    httpOnly: process.env.JWT_COOKIE_HTTP_ONLY !== 'false',

    /**
     * Cookie secure flag
     * Requires HTTPS in production
     * @default true in production, false in development
     */
    secure: process.env.JWT_COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',

    /**
     * Cookie SameSite attribute
     * @default 'strict'
     */
    sameSite: (process.env.JWT_COOKIE_SAME_SITE as 'strict' | 'lax' | 'none') || 'strict',

    /**
     * Cookie domain
     * @default undefined (current domain)
     */
    domain: process.env.JWT_COOKIE_DOMAIN || undefined,

    /**
     * Cookie path
     * @default '/'
     */
    path: process.env.JWT_COOKIE_PATH || '/',

    /**
     * Cookie max age in milliseconds
     * @default 604800000 (7 days)
     */
    maxAge: parseInt(process.env.JWT_COOKIE_MAX_AGE || '604800000', 10),
  },
}));
