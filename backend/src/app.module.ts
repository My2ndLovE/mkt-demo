import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

// Configuration imports
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import cacheConfig from './config/cache.config';

// Module imports
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BetsModule } from './modules/bets/bets.module';
import { ResultsModule } from './modules/results/results.module';
import { CommissionsModule } from './modules/commissions/commissions.module';
import { LimitsModule } from './modules/limits/limits.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AuditModule } from './modules/audit/audit.module';

/**
 * Root application module for the Multi-Level Agent Lottery Sandbox System
 *
 * This module orchestrates all feature modules and global configurations:
 * - Configuration management via ConfigModule
 * - Rate limiting via ThrottlerModule (100 requests/minute per IP)
 * - Database access via PrismaService
 * - Authentication and authorization
 * - Business logic modules (bets, results, commissions, etc.)
 * - Audit logging and reporting
 *
 * @module AppModule
 */
@Module({
  imports: [
    // Global configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: [appConfig, databaseConfig, jwtConfig, cacheConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting: 100 requests per minute per IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // Time window in milliseconds (1 minute)
        limit: 100, // Maximum number of requests within the time window
      },
    ]),

    // Feature modules
    AuthModule,
    UsersModule,
    BetsModule,
    ResultsModule,
    CommissionsModule,
    LimitsModule,
    ProvidersModule,
    ReportsModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    // Apply throttler guard globally to all routes
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [PrismaService],
})
export class AppModule {}
