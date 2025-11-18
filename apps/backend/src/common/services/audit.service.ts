import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogData {
  userId: number;
  action: string;
  entity: string;
  entityId?: number;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  moderatorId?: number;
}

/**
 * Audit logging service
 * Tracks all sensitive operations for compliance and security
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create an audit log entry
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          details: data.details ? JSON.stringify(data.details) : null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          moderatorId: data.moderatorId,
          timestamp: new Date(),
        },
      });

      this.logger.debug(
        `Audit: ${data.action} on ${data.entity}${data.entityId ? `#${data.entityId}` : ''} by user ${data.userId}`,
      );
    } catch (error) {
      // Don't throw - audit logging should not break the main operation
      this.logger.error('Failed to create audit log', error);
    }
  }

  /**
   * Log user login
   */
  async logLogin(userId: number, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      userId,
      action: 'LOGIN',
      entity: 'User',
      entityId: userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log user logout
   */
  async logLogout(userId: number, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      userId,
      action: 'LOGOUT',
      entity: 'User',
      entityId: userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log bet placement
   */
  async logBetPlaced(
    userId: number,
    betId: number,
    details: Record<string, any>,
    moderatorId?: number,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'BET_PLACED',
      entity: 'Bet',
      entityId: betId,
      details,
      moderatorId,
    });
  }

  /**
   * Log bet cancellation
   */
  async logBetCancelled(
    userId: number,
    betId: number,
    details: Record<string, any>,
    moderatorId?: number,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'BET_CANCELLED',
      entity: 'Bet',
      entityId: betId,
      details,
      moderatorId,
    });
  }

  /**
   * Log draw result creation/update
   */
  async logDrawResult(
    userId: number,
    drawResultId: number,
    action: 'CREATED' | 'UPDATED',
    details?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      userId,
      action: `DRAW_RESULT_${action}`,
      entity: 'DrawResult',
      entityId: drawResultId,
      details,
    });
  }

  /**
   * Log service provider changes (admin only)
   */
  async logProviderChange(
    userId: number,
    providerId: number,
    action: 'CREATED' | 'UPDATED' | 'DELETED',
    details?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      userId,
      action: `PROVIDER_${action}`,
      entity: 'ServiceProvider',
      entityId: providerId,
      details,
    });
  }

  /**
   * Log user creation (sub-agent)
   */
  async logUserCreated(
    creatorId: number,
    newUserId: number,
    details: Record<string, any>,
    moderatorId?: number,
  ): Promise<void> {
    await this.log({
      userId: creatorId,
      action: 'USER_CREATED',
      entity: 'User',
      entityId: newUserId,
      details,
      moderatorId,
    });
  }

  /**
   * Log weekly limit reset
   */
  async logLimitReset(userId: number, details?: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      action: 'LIMIT_RESET',
      entity: 'User',
      details,
    });
  }
}
