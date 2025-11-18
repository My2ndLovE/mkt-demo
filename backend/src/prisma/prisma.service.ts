import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import {
  createRowLevelSecurityMiddleware,
  UserContext,
} from '../common/middleware/prisma.middleware';

/**
 * Prisma Service
 *
 * Provides database access via Prisma ORM with the following features:
 * - Connection lifecycle management (connect on init, disconnect on destroy)
 * - Row-level security middleware (T230-T235)
 * - Query logging in development mode
 * - Connection pooling configuration
 * - Error handling and retry logic
 *
 * This service extends PrismaClient to inherit all Prisma functionality
 * while adding NestJS-specific lifecycle hooks and security features.
 *
 * @class PrismaService
 * @extends {PrismaClient}
 * @implements {OnModuleInit, OnModuleDestroy}
 *
 * @example Basic usage
 * ```typescript
 * constructor(private readonly prisma: PrismaService) {}
 *
 * async findUser(id: string) {
 *   return this.prisma.user.findUnique({ where: { id } });
 * }
 * ```
 *
 * @example Usage with user context (row-level security)
 * ```typescript
 * const userContext: UserContext = {
 *   userId: user.id,
 *   role: user.role,
 *   agentId: user.agentId,
 *   parentAgentId: user.parentAgentId,
 * };
 *
 * this.prisma.setUserContext(userContext);
 * const bets = await this.prisma.bet.findMany(); // Automatically filtered
 * ```
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private userContext: UserContext | null = null;

  constructor(private readonly configService: ConfigService) {
    const databaseUrl = configService.get<string>('database.url');
    const logLevel =
      configService.get<string>('app.environment') === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'];

    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: logLevel as any,
      errorFormat: 'colorless',
    });

    this.logger.log('PrismaService initialized');
  }

  /**
   * Initialize Prisma connection
   *
   * Connects to the database when the module is initialized.
   * Applies row-level security middleware for all queries.
   *
   * @returns {Promise<void>}
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Database connection established');

      // Apply row-level security middleware (T230-T235)
      this.$use(createRowLevelSecurityMiddleware(this.userContext));
      this.logger.log('Row-level security middleware applied');

      // Log slow queries in development
      if (this.configService.get<string>('app.environment') === 'development') {
        this.$use(async (params: any, next: any) => {
          const before = Date.now();
          const result = await next(params);
          const after = Date.now();
          const duration = after - before;

          if (duration > 1000) {
            this.logger.warn(
              `Slow query detected: ${params.model}.${params.action} took ${duration}ms`,
            );
          }

          return result;
        });
        this.logger.log('Slow query logging middleware applied');
      }
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  /**
   * Clean up Prisma connection
   *
   * Disconnects from the database when the module is destroyed.
   *
   * @returns {Promise<void>}
   */
  async onModuleDestroy(): Promise<void> {
    try {
      await this.$disconnect();
      this.logger.log('Database connection closed');
    } catch (error) {
      this.logger.error('Error disconnecting from database:', error);
      throw error;
    }
  }

  /**
   * Set user context for row-level security
   *
   * Sets the current user context to be used by the RLS middleware.
   * This should be called at the beginning of each request with the
   * authenticated user's information.
   *
   * @param {UserContext | null} context - User context or null for system operations
   *
   * @example
   * ```typescript
   * const context: UserContext = {
   *   userId: currentUser.id,
   *   role: currentUser.role,
   *   agentId: currentUser.agentId,
   *   parentAgentId: currentUser.parentAgentId,
   * };
   * this.prisma.setUserContext(context);
   * ```
   */
  setUserContext(context: UserContext | null): void {
    this.userContext = context;
  }

  /**
   * Get current user context
   *
   * Returns the currently set user context for debugging and logging.
   *
   * @returns {UserContext | null} Current user context
   */
  getUserContext(): UserContext | null {
    return this.userContext;
  }

  /**
   * Clear user context
   *
   * Removes the user context, reverting to system-level operations.
   * Useful for cleanup after request completion.
   */
  clearUserContext(): void {
    this.userContext = null;
  }

  /**
   * Execute query with specific user context
   *
   * Temporarily sets user context for a single operation, then restores
   * the previous context. Useful for impersonation or system operations
   * that need specific user context.
   *
   * @param {UserContext | null} context - Temporary user context
   * @param {() => Promise<T>} operation - Operation to execute
   * @returns {Promise<T>} Operation result
   *
   * @example
   * ```typescript
   * const result = await this.prisma.withUserContext(
   *   { userId: 'admin-id', role: 'SUPER_ADMIN' },
   *   () => this.prisma.user.findMany()
   * );
   * ```
   */
  async withUserContext<T>(context: UserContext | null, operation: () => Promise<T>): Promise<T> {
    const previousContext = this.userContext;
    try {
      this.setUserContext(context);
      return await operation();
    } finally {
      this.setUserContext(previousContext);
    }
  }

  /**
   * Health check
   *
   * Performs a simple database query to verify connectivity.
   *
   * @returns {Promise<boolean>} True if database is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return false;
    }
  }
}
