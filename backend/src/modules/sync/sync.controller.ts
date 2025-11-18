import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ManualSyncDto } from './dto/sync-result.dto';

@ApiTags('sync')
@Controller('sync')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SyncController {
  constructor(private syncService: SyncService) {}

  /**
   * Manual sync trigger for specific provider and date
   */
  @Post('manual')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Manually sync results for a specific provider and date',
    description: 'Admin only - Triggers immediate result sync from external API',
  })
  @ApiBody({ type: ManualSyncDto })
  @ApiResponse({
    status: 200,
    description: 'Sync completed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        provider: { type: 'string' },
        drawDate: { type: 'string' },
        resultId: { type: 'number' },
        betsProcessed: { type: 'number' },
        error: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async manualSync(@Body() dto: ManualSyncDto) {
    return this.syncService.manualSync(
      dto.providerCode,
      dto.drawDate,
      dto.syncProvider,
    );
  }

  /**
   * Bulk sync for date range
   */
  @Post('bulk')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Bulk sync results for a date range',
    description:
      'Admin only - Sync multiple dates at once (use carefully to avoid rate limits)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['providerCode', 'startDate', 'endDate'],
      properties: {
        providerCode: {
          type: 'string',
          example: 'SG',
          description: 'Provider code',
        },
        startDate: {
          type: 'string',
          example: '2025-01-01',
          description: 'Start date (ISO 8601)',
        },
        endDate: {
          type: 'string',
          example: '2025-01-31',
          description: 'End date (ISO 8601)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk sync completed',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          provider: { type: 'string' },
          drawDate: { type: 'string' },
          resultId: { type: 'number' },
          betsProcessed: { type: 'number' },
          error: { type: 'string' },
        },
      },
    },
  })
  async bulkSync(
    @Body()
    body: {
      providerCode: string;
      startDate: string;
      endDate: string;
    },
  ) {
    return this.syncService.bulkSync(
      body.providerCode,
      body.startDate,
      body.endDate,
    );
  }

  /**
   * Check sync status for provider/date
   */
  @Get('status')
  @Roles('ADMIN', 'MODERATOR')
  @ApiOperation({
    summary: 'Check sync status for a specific provider and date',
    description: 'Verify if results have been synced for a given date',
  })
  @ApiQuery({
    name: 'providerCode',
    required: true,
    type: String,
    example: 'SG',
  })
  @ApiQuery({
    name: 'drawDate',
    required: true,
    type: String,
    example: '2025-01-18',
  })
  @ApiResponse({
    status: 200,
    description: 'Sync status retrieved',
    schema: {
      type: 'object',
      properties: {
        synced: { type: 'boolean' },
        provider: { type: 'string' },
        drawDate: { type: 'string' },
        result: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            drawNumber: { type: 'string' },
            firstPrize: { type: 'string' },
            secondPrize: { type: 'string' },
            thirdPrize: { type: 'string' },
            createdAt: { type: 'string' },
          },
        },
        message: { type: 'string' },
      },
    },
  })
  async getSyncStatus(
    @Query('providerCode') providerCode: string,
    @Query('drawDate') drawDate: string,
  ) {
    return this.syncService.getSyncStatus(providerCode, drawDate);
  }

  /**
   * Get sync history
   */
  @Get('history')
  @Roles('ADMIN', 'MODERATOR')
  @ApiOperation({
    summary: 'Get sync history',
    description: 'Retrieve history of manual and automated sync operations',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of records to retrieve (default: 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Sync history retrieved',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          action: { type: 'string' },
          metadata: { type: 'object' },
          createdAt: { type: 'string' },
        },
      },
    },
  })
  async getSyncHistory(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.syncService.getSyncHistory(limitNum);
  }

  /**
   * Trigger daily sync manually (for testing)
   */
  @Post('trigger-daily')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Manually trigger daily sync job',
    description: 'Admin only - For testing the automated daily sync',
  })
  @ApiResponse({
    status: 200,
    description: 'Daily sync triggered (runs asynchronously)',
  })
  async triggerDailySync() {
    // Trigger asynchronously
    this.syncService.handleDailySync().catch((error) => {
      console.error('Daily sync failed:', error);
    });

    return {
      message: 'Daily sync job triggered',
      note: 'Check logs and audit trail for results',
    };
  }
}
