import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected');
    this.enableRowLevelSecurity();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🔌 Database disconnected');
  }

  /**
   * Enable Row-Level Security (RLS) via Prisma Middleware
   * Implements AD-003: Moderator data isolation
   */
  private enableRowLevelSecurity() {
    this.$use(async (params, next) => {
      // Skip RLS for migrations and seeds
      if (process.env.SKIP_RLS === 'true') {
        return next(params);
      }

      // Get current user from async local storage (will be set by interceptor)
      const currentUser = (global as Record<string, unknown>).currentUser as {
        id: number;
        role: string;
        moderatorId?: number;
      } | undefined;

      if (!currentUser) {
        return next(params);
      }

      // Admin bypasses RLS
      if (currentUser.role === 'ADMIN') {
        return next(params);
      }

      // Models that require RLS
      const modelsWithIsolation = ['User', 'Bet', 'Commission'];

      if (modelsWithIsolation.includes(params.model || '')) {
        const moderatorId =
          currentUser.role === 'MODERATOR' ? currentUser.id : currentUser.moderatorId;

        // Apply filter to read operations
        if (params.action.startsWith('find') || params.action === 'count') {
          params.args = params.args || {};
          params.args.where = {
            ...params.args.where,
            moderatorId,
          };
        }

        // Validate write operations
        if (['create', 'update', 'upsert'].includes(params.action)) {
          const data = params.args.data;
          if (data && data.moderatorId && data.moderatorId !== moderatorId) {
            throw new Error('Cannot access data from other moderators');
          }

          // Auto-set moderatorId for creates
          if (params.action === 'create' && !data.moderatorId) {
            params.args.data.moderatorId = moderatorId;
          }
        }
      }

      return next(params);
    });
  }

  /**
   * Clean disconnection handling
   */
  async enableShutdownHooks() {
    process.on('beforeExit', async () => {
      await this.$disconnect();
    });
  }
}
