import { Controller, Get, Query, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { QueryAuditDto } from './dtos';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

/**
 * Audit Controller
 *
 * Provides audit log access (T159-T169)
 *
 * Endpoints:
 * - GET /audit - List all audit logs (admin)
 * - GET /audit/user/:userId - Get user activity log (admin)
 * - GET /audit/recent - Get recent audit logs (admin)
 * - GET /audit/stats - Get audit statistics (admin)
 *
 * Role Access:
 * - Admin: View all audit logs and statistics
 *
 * Note: Audit log creation is done automatically by AuditService
 * (not exposed as API endpoint)
 */
@ApiTags('audit')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Get all audit logs with filtering (T160)
   * Admin only
   */
  @Get()
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all audit logs',
    description: 'Admin only. Returns paginated list of audit logs with optional filtering.',
  })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  findAll(@Query() query: QueryAuditDto) {
    return this.auditService.findAll(query);
  }

  /**
   * Get audit logs for a specific user (T161)
   * Admin only
   */
  @Get('user/:userId')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user activity logs',
    description: 'Admin only. Returns audit logs for a specific user.',
  })
  @ApiParam({ name: 'userId', description: 'User ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'User audit logs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  findByUser(@Param('userId', ParseIntPipe) userId: number, @Query() query: QueryAuditDto) {
    return this.auditService.findByUser(userId, query);
  }

  /**
   * Get recent audit logs (T162)
   * Admin only
   */
  @Get('recent')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get recent audit logs',
    description: 'Admin only. Returns the most recent audit logs.',
  })
  @ApiResponse({ status: 200, description: 'Recent audit logs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  findRecent(@Query('limit', ParseIntPipe) limit?: number) {
    return this.auditService.findRecent(limit);
  }

  /**
   * Get audit statistics (T163)
   * Admin only
   */
  @Get('stats')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get audit statistics',
    description: 'Admin only. Returns aggregate audit statistics.',
  })
  @ApiResponse({ status: 200, description: 'Audit statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  getStats() {
    return this.auditService.getStats();
  }
}
