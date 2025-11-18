import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import * as compression from 'compression';
import helmet from 'helmet';

/**
 * Bootstrap the NestJS application
 *
 * This is the entry point for the Multi-Level Agent Lottery Sandbox System.
 * It configures global settings including:
 * - CORS with environment-based origins
 * - Global validation pipes with transformation and whitelisting
 * - Security headers via Helmet
 * - Response compression
 * - Global exception filters
 * - Logging and transformation interceptors
 * - Rate limiting (configured in app.module.ts)
 *
 * @returns {Promise<void>}
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  // Create NestJS application instance
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Get configuration service
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3000);
  const environment = configService.get<string>('app.environment', 'development');
  const allowedOrigins = configService.get<string[]>('app.allowedOrigins', [
    'http://localhost:3001',
  ]);

  // Set global prefix for all routes
  app.setGlobalPrefix('api/v1');

  // Enable CORS with environment-based configuration
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin) || environment === 'development') {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
    maxAge: 3600, // 1 hour
  });

  // Apply security headers
  app.use(
    helmet({
      contentSecurityPolicy: environment === 'production',
      crossOriginEmbedderPolicy: environment === 'production',
    }),
  );

  // Enable response compression
  app.use(compression());

  // Global validation pipe with strict settings
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties exist
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Convert types automatically
      },
      disableErrorMessages: environment === 'production', // Hide error details in production
      validationError: {
        target: false, // Don't expose target class in errors
        value: false, // Don't expose value in errors
      },
    }),
  );

  // Global exception filter for consistent error handling
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global interceptors for logging and response transformation
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // Start the server
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
  logger.log(`📊 Environment: ${environment}`);
  logger.log(`🌐 CORS Origins: ${allowedOrigins.join(', ')}`);
  logger.log(`🔒 Security: Helmet enabled`);
  logger.log(`📦 Compression: Enabled`);
  logger.log(`✅ Health Check: http://localhost:${port}/health`);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  const logger = new Logger('UncaughtException');
  logger.error('Uncaught Exception:', error.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  const logger = new Logger('UnhandledRejection');
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Bootstrap the application
bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application:', error.stack);
  process.exit(1);
});
