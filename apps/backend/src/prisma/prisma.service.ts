import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      errorFormat: 'pretty',
    });

    // Row-level security middleware
    this.setupRowLevelSecurity();
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connection established');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database', error);
      throw error;
    }
  }

  /**
   * Setup row-level security middleware
   * Filters data based on moderatorId for MODERATOR and AGENT roles
   */
  private setupRowLevelSecurity() {
    // Models that have moderatorId and need RLS
    const modelsWithRLS = ['user', 'bet', 'commission', 'auditLog'];

    this.$use(async (params, next) => {
      // Get current user context from async local storage (set by request)
      const currentUser = (params as any).currentUser;

      // Skip RLS if no user context or user is ADMIN
      if (!currentUser || currentUser.role === 'ADMIN') {
        return next(params);
      }

      // Apply RLS only to models with moderatorId
      if (!modelsWithRLS.includes(params.model?.toLowerCase() || '')) {
        return next(params);
      }

      const moderatorId = currentUser.role === 'MODERATOR'
        ? currentUser.id
        : currentUser.moderatorId;

      // Skip if no moderatorId (shouldn't happen for MODERATOR/AGENT)
      if (!moderatorId) {
        return next(params);
      }

      // Apply moderatorId filter to queries
      if (params.action === 'findUnique' || params.action === 'findFirst') {
        params.args.where = {
          ...params.args.where,
          moderatorId,
        };
      } else if (params.action === 'findMany') {
        if (!params.args) {
          params.args = {};
        }
        params.args.where = {
          ...params.args.where,
          moderatorId,
        };
      } else if (params.action === 'count') {
        params.args.where = {
          ...params.args.where,
          moderatorId,
        };
      } else if (params.action === 'aggregate' || params.action === 'groupBy') {
        params.args.where = {
          ...params.args.where,
          moderatorId,
        };
      } else if (params.action === 'update' || params.action === 'updateMany') {
        params.args.where = {
          ...params.args.where,
          moderatorId,
        };
      } else if (params.action === 'delete' || params.action === 'deleteMany') {
        params.args.where = {
          ...params.args.where,
          moderatorId,
        };
      }

      return next(params);
    });

    this.logger.log('🔒 Row-level security middleware enabled');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }

  /**
   * Clean database (for testing only!)
   * NEVER call this in production
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production!');
    }

    // Delete in correct order to avoid foreign key constraints
    await this.$transaction([
      this.auditLog.deleteMany(),
      this.commission.deleteMany(),
      this.bet.deleteMany(),
      this.drawResult.deleteMany(),
      this.refreshToken.deleteMany(),
      this.limitResetLog.deleteMany(),
      // Delete users last (due to self-referential relations)
      this.user.deleteMany({ where: { role: 'AGENT' } }),
      this.user.deleteMany({ where: { role: 'MODERATOR' } }),
      this.user.deleteMany({ where: { role: 'ADMIN' } }),
      this.serviceProvider.deleteMany(),
    ]);

    this.logger.warn('⚠️ Database cleaned (development only)');
  }
}
