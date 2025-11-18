export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api/v1',

  // Database
  database: {
    url: process.env.DATABASE_URL,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-secret-in-production',
    expiresIn: process.env.JWT_EXPIRATION || '15m',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
  },

  // Encryption
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'change-this-32-char-key-in-prod',
    keyVaultUrl: process.env.KEY_VAULT_URL,
  },

  // Caching
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '300', 10),
    max: parseInt(process.env.CACHE_MAX || '100', 10),
  },

  // Rate Limiting
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },

  // Third-party APIs
  magayo: {
    apiUrl: process.env.MAGAYO_API_URL,
    apiKey: process.env.MAGAYO_API_KEY,
  },

  // Azure
  azure: {
    timeZone: process.env.WEBSITE_TIME_ZONE || 'Asia/Kuala_Lumpur',
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  },
});
