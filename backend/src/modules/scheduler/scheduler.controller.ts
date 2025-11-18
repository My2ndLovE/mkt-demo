import { Controller, Post, Get, UseGuards, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SchedulerService } from './scheduler.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../../common/decorators/current-user.decorator';

@ApiTags('scheduler')
@Controller('scheduler')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SchedulerController {
  constructor(private schedulerService: SchedulerService) {}

  @Post('reset-limits')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Manually trigger weekly limit reset (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Reset completed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        count: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async triggerManualReset(@CurrentUser() user: CurrentUserData) {
    const result = await this.schedulerService.triggerManualReset(user.id);

    return {
      ...result,
      message: result.success
        ? `Successfully reset limits for ${result.count} users`
        : `Reset failed: ${result.error}`,
    };
  }

  @Get('reset-history')
  @Roles('ADMIN', 'MODERATOR')
  @ApiOperation({ summary: 'Get limit reset history' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of records to retrieve (default: 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Reset history retrieved',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          resetDate: { type: 'string', format: 'date-time' },
          success: { type: 'boolean' },
          usersAffected: { type: 'number' },
          errorMessage: { type: 'string', nullable: true },
          metadata: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  async getResetHistory(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.schedulerService.getResetHistory(limitNum);
  }
}
