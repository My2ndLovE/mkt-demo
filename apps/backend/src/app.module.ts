import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';

// Import feature modules (to be created)
// import { UsersModule } from './modules/users/users.module';
// import { ProvidersModule } from './modules/providers/providers.module';
// import { BetsModule } from './modules/bets/bets.module';
// import { LimitsModule } from './modules/limits/limits.module';
// import { ResultsModule } from './modules/results/results.module';
// import { CommissionsModule } from './modules/commissions/commissions.module';
// import { ReportsModule } from './modules/reports/reports.module';
// import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting (100 requests per minute per IP)
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10) * 1000,
        limit: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      },
    ]),

    // In-memory caching (will switch to Redis for production)
    CacheModule.register({
      isGlobal: true,
      ttl: 3600, // 1 hour default TTL
      max: 100, // Maximum 100 items in cache
    }),

    // Database
    PrismaModule,

    // Authentication & Authorization
    AuthModule,

    // Feature modules (uncomment as they are implemented)
    // UsersModule,
    // ProvidersModule,
    // BetsModule,
    // LimitsModule,
    // ResultsModule,
    // CommissionsModule,
    // ReportsModule,
    // AuditModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global guards (applied to all routes except those marked @Public())
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
