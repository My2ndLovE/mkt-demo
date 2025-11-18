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
