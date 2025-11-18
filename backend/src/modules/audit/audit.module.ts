import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';

/**
 * Audit Module
 *
 * Provides comprehensive audit logging and monitoring (T159-T169)
 *
 * Features:
 * - Immutable append-only audit trail
 * - User activity logging
 * - System event logging
 * - Security event tracking
 * - Data change history
 * - Compliance reporting
 * - Audit log search and filtering
 *
 * Business Rules:
 * - All audit logs are immutable (no updates/deletes)
 * - Logs retained indefinitely for compliance
 * - System actions have null userId
 * - IP address and user agent captured when available
 * - JSON metadata for flexible action-specific details
 *
 * Critical Actions Logged:
 * - BET_PLACED, BET_CANCELLED
 * - AGENT_CREATED, AGENT_UPDATED, AGENT_DELETED
 * - LIMIT_ADJUSTED, WEEKLY_RESET
 * - RESULT_SYNCED, RESULT_MANUAL_ENTRY
 * - PASSWORD_CHANGED, LOGIN, LOGOUT
 * - COMMISSION_CALCULATED
 *
 * Dependencies:
 * - PrismaService: Database access
 *
 * @module AuditModule
 */
@Module({
  imports: [],
  controllers: [AuditController],
  providers: [PrismaService, AuditService],
  exports: [AuditService],
})
export class AuditModule {}
