import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn']
        : ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // Security: Helmet middleware
  app.use(helmet());

  // Global prefix for all routes
  app.setGlobalPrefix('api/v1');

  // CORS configuration
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:5173',
    'http://localhost:4280',
  ];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger API documentation (development only)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Multi-Level Agent Lottery Sandbox API')
      .setDescription(
        'RESTful API for Multi-Level Agent Lottery Sandbox System supporting Malaysian and Singapore lottery providers',
      )
      .setVersion('1.0.0')
      .addBearerAuth()
      .addTag('Authentication', 'User authentication and token management')
      .addTag('Service Providers', 'Lottery service provider configuration')
      .addTag('Agents', 'Agent management and hierarchy operations')
      .addTag('Bets', 'Bet placement, cancellation, and querying')
      .addTag('Weekly Limits', 'Weekly quota management and allocation')
      .addTag('Draw Results', 'Lottery draw results and synchronization')
      .addTag('Commissions', 'Commission calculation and distribution')
      .addTag('Reports', 'Business intelligence and analytics reports')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    console.log('\n📚 Swagger documentation available at: http://localhost:3000/api/docs\n');
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`\n🚀 Application is running on: http://localhost:${port}/api/v1`);
  console.log(`📊 Health check: http://localhost:${port}/api/v1/health\n`);
}

bootstrap();
