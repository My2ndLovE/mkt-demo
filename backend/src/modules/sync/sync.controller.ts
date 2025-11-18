import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  UseGuards,
  Param,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ManualSyncDto } from './dto/sync-result.dto';
import { nanoid } from 'nanoid';

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
   * FIX H-3: Bulk sync for date range (background job)
   * Returns job ID immediately, processes in background
   */
  @Post('bulk')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Bulk sync results for a date range (background job)',
    description:
      'Admin only - Starts background sync job for date range. Returns job ID immediately for progress tracking.',
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
    description: 'Bulk sync job started',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', example: 'abc123xyz' },
        message: { type: 'string', example: 'Bulk sync started' },
        statusEndpoint: { type: 'string', example: '/sync/job-status/abc123xyz' },
        totalDays: { type: 'number', example: 31 },
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
    // Generate unique job ID
    const jobId = nanoid();

    // Calculate total days for response
    const start = new Date(body.startDate);
    const end = new Date(body.endDate);
    const totalDays =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Start background job (fire and forget)
    this.syncService
      .bulkSyncBackground(
        body.providerCode,
        body.startDate,
        body.endDate,
        jobId,
      )
      .catch((error) => {
        console.error(`Bulk sync job ${jobId} failed:`, error);
      });

    // Return job ID immediately
    return {
      jobId,
      message: 'Bulk sync job started successfully',
      statusEndpoint: `/sync/job-status/${jobId}`,
      totalDays,
      estimatedDuration: `${Math.ceil((totalDays * 1.5) / 60)} minutes`,
    };
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

  /**
   * FIX H-3: Get background job status
   */
  @Get('job-status/:jobId')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Get background sync job status',
    description: 'Check progress of a background bulk sync job',
  })
  @ApiParam({
    name: 'jobId',
    description: 'Job ID returned from bulk sync endpoint',
    example: 'abc123xyz',
  })
  @ApiResponse({
    status: 200,
    description: 'Job status retrieved',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        status: { type: 'string', enum: ['running', 'completed', 'failed'] },
        provider: { type: 'string' },
        startDate: { type: 'string' },
        endDate: { type: 'string' },
        totalDays: { type: 'number' },
        completed: { type: 'number' },
        successful: { type: 'number' },
        failed: { type: 'number' },
        percentage: { type: 'number' },
        lastProcessedDate: { type: 'string' },
        startedAt: { type: 'string' },
        completedAt: { type: 'string' },
        results: { type: 'array' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobStatus(@Param('jobId') jobId: string) {
    const job = this.syncService.getJobProgress(jobId);

    if (!job) {
      throw new NotFoundException(
        `Sync job ${jobId} not found. Jobs are retained for 24 hours.`,
      );
    }

    return job;
  }

  /**
   * FIX H-3: List all background jobs
   */
  @Get('jobs')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'List all background sync jobs',
    description: 'Get list of all sync jobs (running and completed)',
  })
  @ApiResponse({
    status: 200,
    description: 'Jobs list retrieved',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          jobId: { type: 'string' },
          status: { type: 'string' },
          provider: { type: 'string' },
          totalDays: { type: 'number' },
          completed: { type: 'number' },
          percentage: { type: 'number' },
          startedAt: { type: 'string' },
          completedAt: { type: 'string' },
        },
      },
    },
  })
  async getAllJobs() {
    const jobs = this.syncService.getAllJobs();

    // Return summary view (without full results array)
    return jobs.map((job) => ({
      jobId: job.jobId,
      status: job.status,
      provider: job.provider,
      startDate: job.startDate,
      endDate: job.endDate,
      totalDays: job.totalDays,
      completed: job.completed,
      successful: job.successful,
      failed: job.failed,
      percentage: job.percentage,
      lastProcessedDate: job.lastProcessedDate,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      resultsCount: job.results.length,
    }));
  }
}
