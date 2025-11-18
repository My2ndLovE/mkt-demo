import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { BetsModule } from './modules/bets/bets.module';
import { LimitsModule } from './modules/limits/limits.module';
import { UsersModule } from './modules/users/users.module';
import configuration from './config/configuration';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.THROTTLE_TTL) || 60000, // 1 minute
        limit: Number(process.env.THROTTLE_LIMIT) || 100, // 100 requests
      },
    ]),

    // Caching
    CacheModule.register({
      isGlobal: true,
      ttl: Number(process.env.CACHE_TTL) || 300, // 5 minutes
      max: Number(process.env.CACHE_MAX) || 100, // max items
    }),

    // Core Modules
    PrismaModule,
    AuthModule,

    // Feature Modules
    ProvidersModule,
    BetsModule,
    LimitsModule,
    UsersModule,
    // ResultsModule,
    // CommissionsModule,
    // ReportsModule,
  ],
})
export class AppModule {}
