import { registerAs } from '@nestjs/config';

/**
 * Database configuration
 *
 * Provides PostgreSQL database settings including:
 * - Connection URL and credentials
 * - Connection pool settings
 * - Query timeout and retry configuration
 * - SSL and encryption settings
 *
 * @returns {Object} Database configuration object
 */
export default registerAs('database', () => ({
  /**
   * Database connection URL
   * Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA
   */
  url:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/lottery_sandbox?schema=public',

  /**
   * Database host
   * @default 'localhost'
   */
  host: process.env.DB_HOST || 'localhost',

  /**
   * Database port
   * @default 5432
   */
  port: parseInt(process.env.DB_PORT || '5432', 10),

  /**
   * Database name
   * @default 'lottery_sandbox'
   */
  database: process.env.DB_NAME || 'lottery_sandbox',

  /**
   * Database username
   * @default 'postgres'
   */
  username: process.env.DB_USERNAME || 'postgres',

  /**
   * Database password
   * @default 'postgres'
   */
  password: process.env.DB_PASSWORD || 'postgres',

  /**
   * Database schema
   * @default 'public'
   */
  schema: process.env.DB_SCHEMA || 'public',

  /**
   * Enable SSL connection
   * @default false in development, true in production
   */
  ssl: process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production',

  /**
   * Connection pool minimum size
   * @default 2
   */
  poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),

  /**
   * Connection pool maximum size
   * @default 10
   */
  poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),

  /**
   * Connection timeout in milliseconds
   * @default 10000 (10 seconds)
   */
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10),

  /**
   * Query timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000', 10),

  /**
   * Idle connection timeout in milliseconds
   * Time before idle connections are closed
   * @default 600000 (10 minutes)
   */
  idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '600000', 10),

  /**
   * Connection retry attempts
   * @default 3
   */
  retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '3', 10),

  /**
   * Connection retry delay in milliseconds
   * @default 3000 (3 seconds)
   */
  retryDelay: parseInt(process.env.DB_RETRY_DELAY || '3000', 10),

  /**
   * Enable query logging
   * @default true in development, false in production
   */
  logging:
    process.env.DB_LOGGING === 'true' ||
    (process.env.NODE_ENV === 'development' && process.env.DB_LOGGING !== 'false'),

  /**
   * Enable statement timeout
   * Cancels queries that run longer than this value
   * @default 60000 (60 seconds)
   */
  statementTimeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '60000', 10),

  /**
   * Enable prepared statements
   * Improves performance for repeated queries
   * @default true
   */
  preparedStatements: process.env.DB_PREPARED_STATEMENTS !== 'false',

  /**
   * Binary data encoding
   * @default 'utf8'
   */
  encoding: process.env.DB_ENCODING || 'utf8',

  /**
   * Timezone for database connections
   * @default 'UTC'
   */
  timezone: process.env.DB_TIMEZONE || 'UTC',
}));
