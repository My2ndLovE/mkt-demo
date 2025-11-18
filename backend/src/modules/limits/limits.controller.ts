import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { LimitsService } from './limits.service';
import { UpdateLimitDto, QueryLimitDto, CheckLimitDto } from './dtos';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * Limits Controller
 *
 * Manages betting limits (T114-T125)
 *
 * Endpoints:
 * - GET /limits/me - Get current user's limits
 * - POST /limits/check - Check if bet amount within limits
 * - GET /limits/all - Get all users' limits (admin)
 * - PATCH /limits/:userId - Update user's limits (admin)
 * - GET /limits/reset-logs - Get limit reset logs (admin)
 *
 * Role Access:
 * - Authenticated: Get own limits, check limits
 * - Admin: View all limits, update limits, view reset logs
 */
@ApiTags('limits')
@Controller('limits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LimitsController {
  constructor(private readonly limitsService: LimitsService) {}

  /**
   * Get current user's betting limits (T118)
   */
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user betting limits',
    description: "Returns the authenticated user's weekly limit information.",
  })
  @ApiResponse({ status: 200, description: 'Limits retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getMyLimits(@CurrentUser() user: any) {
    return this.limitsService.getMyLimits(user.id);
  }

  /**
   * Check if bet amount is within limits (T114)
   */
  @Post('check')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Check if bet amount is within limits',
    description: "Validates if a bet amount is within the user's weekly limit.",
  })
  @ApiResponse({ status: 200, description: 'Limit check completed' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  checkLimit(@CurrentUser() user: any, @Body() checkLimitDto: CheckLimitDto) {
    return this.limitsService.checkLimit(user.id, checkLimitDto.amount);
  }

  /**
   * Get all users' limits with filtering (T121)
   * Admin only
   */
  @Get('all')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all users betting limits',
    description: "Admin only. Returns all users' limit information with optional filtering.",
  })
  @ApiResponse({ status: 200, description: 'Limits retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  getAllLimits(@Query() query: QueryLimitDto) {
    return this.limitsService.getAllLimits(query);
  }

  /**
   * Update user's betting limits (T119-T120)
   * Admin only
   */
  @Patch(':userId')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update user betting limits',
    description: "Admin only. Updates a user's weekly limit or used amount.",
  })
  @ApiParam({ name: 'userId', description: 'User ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Limits updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  updateLimits(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateLimitDto: UpdateLimitDto,
    @CurrentUser() user: any,
  ) {
    return this.limitsService.updateLimits(userId, updateLimitDto, user.id);
  }

  /**
   * Get recent limit reset logs (T122)
   * Admin only
   */
  @Get('reset-logs')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get limit reset logs',
    description: 'Admin only. Returns recent weekly limit reset operation logs.',
  })
  @ApiResponse({ status: 200, description: 'Reset logs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  getResetLogs(@Query('limit', ParseIntPipe) limit?: number) {
    return this.limitsService.getResetLogs(limit);
  }
}
