import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, QueryAuditDto } from './dtos';

/**
 * Audit Service
 *
 * Provides comprehensive audit logging (T159-T169)
 *
 * Features:
 * - Immutable append-only audit trail
 * - Captures user actions and system events
 * - Records IP address and user agent
 * - JSON metadata for action-specific details
 * - Search and filtering capabilities
 *
 * Business Rules:
 * - All audit logs are immutable (no updates/deletes)
 * - Logs retained indefinitely for compliance
 * - System actions have null userId
 * - Sensitive data should not be logged in plaintext
 *
 * Critical Actions to Log:
 * - BET_PLACED, BET_CANCELLED
 * - AGENT_CREATED, AGENT_UPDATED, AGENT_DELETED
 * - LIMIT_ADJUSTED, WEEKLY_RESET
 * - RESULT_SYNCED, RESULT_MANUAL_ENTRY
 * - PASSWORD_CHANGED, LOGIN, LOGOUT
 * - COMMISSION_CALCULATED
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log an audit event (T159)
   *
   * @param action - Action type
   * @param userId - User ID (null for system actions)
   * @param metadata - Action-specific details (JSON)
   * @param ipAddress - Client IP address (optional)
   * @param userAgent - Client user agent (optional)
   * @returns Created audit log
   */
  async log(
    action: AuditAction,
    userId: number | null,
    metadata: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      const auditLog = await this.prisma.auditLog.create({
        data: {
          action,
          userId,
          metadata: JSON.stringify(metadata),
          ipAddress,
          userAgent,
        },
      });

      this.logger.log(
        `Audit: ${action} by user ${userId || 'SYSTEM'} - ${JSON.stringify(metadata).substring(0, 100)}`,
      );

      return auditLog;
    } catch (error) {
      // Don't fail the operation if audit logging fails
      this.logger.error(
        `Failed to create audit log: ${action}`,
        error instanceof Error ? error.stack : String(error),
      );
      return null;
    }
  }

  /**
   * Get audit logs with filtering and pagination (T160)
   *
   * @param query - Query parameters
   * @returns Paginated audit logs
   */
  async findAll(query: QueryAuditDto) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (query.userId !== undefined) {
      where.userId = query.userId;
    }

    if (query.action) {
      where.action = query.action;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    if (query.search) {
      where.metadata = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    // Get total count
    const total = await this.prisma.auditLog.count({ where });

    // Get audit logs
    const logs = await this.prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    return {
      data: logs.map((log) => ({
        id: log.id,
        action: log.action,
        userId: log.userId,
        user: log.user || null,
        metadata: JSON.parse(log.metadata),
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get audit logs for a specific user (T161)
   *
   * @param userId - User ID
   * @param query - Query parameters
   * @returns User's audit logs
   */
  async findByUser(userId: number, query: QueryAuditDto) {
    return this.findAll({ ...query, userId });
  }

  /**
   * Get recent audit logs (T162)
   *
   * @param limit - Number of logs to retrieve
   * @returns Recent audit logs
   */
  async findRecent(limit = 100) {
    const logs = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      userId: log.userId,
      user: log.user || null,
      metadata: JSON.parse(log.metadata),
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    }));
  }

  /**
   * Get audit statistics (T163)
   *
   * @returns Audit statistics
   */
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());
    thisWeek.setHours(0, 0, 0, 0);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalCount, todayCount, weekCount, monthCount, actionCounts] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.count({ where: { createdAt: { gte: today } } }),
      this.prisma.auditLog.count({ where: { createdAt: { gte: thisWeek } } }),
      this.prisma.auditLog.count({ where: { createdAt: { gte: thisMonth } } }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      total: totalCount,
      today: todayCount,
      thisWeek: weekCount,
      thisMonth: monthCount,
      topActions: actionCounts.map((item) => ({
        action: item.action,
        count: item._count.action,
      })),
    };
  }
}
