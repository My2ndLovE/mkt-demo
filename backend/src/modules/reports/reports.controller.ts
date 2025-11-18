import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
  StreamableFile,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../../common/decorators/current-user.decorator';
import {
  ReportQueryDto,
  HierarchyReportQueryDto,
  ReportFormat,
} from './dto/report-query.dto';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  /**
   * A-1: Agent Bet Summary Report
   */
  @Get('agent/bet-summary')
  @Roles('AGENT', 'MODERATOR', 'ADMIN')
  @ApiOperation({
    summary: 'Get agent bet summary report',
    description: 'Shows betting activity summary for the current agent',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ReportFormat,
    description: 'Report format (json, excel, csv)',
  })
  @ApiResponse({ status: 200, description: 'Report generated' })
  async getAgentBetSummary(
    @CurrentUser() user: CurrentUserData,
    @Query() query: ReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const report = await this.reportsService.getAgentBetSummary(
      user.id,
      query,
    );

    if (query.format === ReportFormat.EXCEL) {
      const buffer = await this.reportsService.exportToExcel(
        report.bets,
        'Agent Bet Summary',
      );
      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="agent-bet-summary-${user.username}-${new Date().toISOString().split('T')[0]}.xlsx"`,
      });
      return new StreamableFile(buffer);
    }

    return report;
  }

  /**
   * A-2: Agent Win/Loss Report
   */
  @Get('agent/win-loss')
  @Roles('AGENT', 'MODERATOR', 'ADMIN')
  @ApiOperation({
    summary: 'Get agent win/loss report',
    description: 'Shows detailed win/loss analysis for the current agent',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ReportFormat,
    description: 'Report format (json, excel, csv)',
  })
  @ApiResponse({ status: 200, description: 'Report generated' })
  async getAgentWinLoss(
    @CurrentUser() user: CurrentUserData,
    @Query() query: ReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const report = await this.reportsService.getAgentWinLoss(user.id, query);

    if (query.format === ReportFormat.EXCEL) {
      const buffer = await this.reportsService.exportToExcel(
        report.details,
        'Agent Win Loss',
      );
      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="agent-win-loss-${user.username}-${new Date().toISOString().split('T')[0]}.xlsx"`,
      });
      return new StreamableFile(buffer);
    }

    return report;
  }

  /**
   * A-3: Agent Commission Report
   */
  @Get('agent/commission')
  @Roles('AGENT', 'MODERATOR', 'ADMIN')
  @ApiOperation({
    summary: 'Get agent commission report',
    description: 'Shows commission earnings for the current agent',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ReportFormat,
    description: 'Report format (json, excel, csv)',
  })
  @ApiResponse({ status: 200, description: 'Report generated' })
  async getAgentCommission(
    @CurrentUser() user: CurrentUserData,
    @Query() query: ReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const report = await this.reportsService.getAgentCommission(
      user.id,
      query,
    );

    if (query.format === ReportFormat.EXCEL) {
      // Flatten byLevel data for Excel
      const flatData = Object.entries(report.byLevel).flatMap(
        ([level, data]) => (data as { details: unknown[] }).details,
      );
      const buffer = await this.reportsService.exportToExcel(
        flatData,
        'Agent Commission',
      );
      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="agent-commission-${user.username}-${new Date().toISOString().split('T')[0]}.xlsx"`,
      });
      return new StreamableFile(buffer);
    }

    return report;
  }

  /**
   * B-1: Moderator Hierarchy Report
   */
  @Get('moderator/hierarchy')
  @Roles('MODERATOR', 'ADMIN')
  @ApiOperation({
    summary: 'Get moderator hierarchy report',
    description: 'Shows complete downline structure with statistics',
  })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ReportFormat,
    description: 'Report format (json, excel)',
  })
  @ApiResponse({ status: 200, description: 'Report generated' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Moderators can only view own hierarchy',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getModeratorHierarchy(
    @CurrentUser() user: CurrentUserData,
    @Query() query: HierarchyReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = query.userId || user.id;

    // FIX C-4: Strict authorization check with proper exception
    if (user.role !== 'ADMIN') {
      // Moderators can ONLY view their own hierarchy
      if (userId !== user.id) {
        throw new ForbiddenException(
          'Moderators can only view their own hierarchy. Admins can view any hierarchy.',
        );
      }
    } else {
      // Admins can view any hierarchy, but validate user exists
      // This prevents exposing internal error messages
      try {
        await this.reportsService.getModeratorHierarchy(userId, {
          ...query,
          startDate: undefined,
          endDate: undefined,
        });
      } catch (error) {
        if (error.message?.includes('not found')) {
          throw new NotFoundException(
            `User ${userId} not found or is not a moderator.`,
          );
        }
        throw error;
      }
    }

    const report = await this.reportsService.getModeratorHierarchy(
      userId,
      query,
    );

    if (query.format === ReportFormat.EXCEL) {
      // Flatten hierarchy for Excel
      const flatData = this.flattenHierarchy(
        report.hierarchy as Record<string, unknown>,
      );
      const buffer = await this.reportsService.exportToExcel(
        flatData,
        'Moderator Hierarchy',
      );
      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="moderator-hierarchy-${user.username}-${new Date().toISOString().split('T')[0]}.xlsx"`,
      });
      return new StreamableFile(buffer);
    }

    return report;
  }

  /**
   * B-2: Moderator Financial Summary
   */
  @Get('moderator/financial-summary')
  @Roles('MODERATOR', 'ADMIN')
  @ApiOperation({
    summary: 'Get moderator financial summary',
    description: 'Shows aggregated financial data for moderator downline',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ReportFormat,
    description: 'Report format (json, excel)',
  })
  @ApiResponse({ status: 200, description: 'Report generated' })
  async getModeratorFinancialSummary(
    @CurrentUser() user: CurrentUserData,
    @Query() query: ReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const report =
      await this.reportsService.getModeratorFinancialSummary(user.id, query);

    if (query.format === ReportFormat.EXCEL) {
      const buffer = await this.reportsService.exportToExcel(
        report,
        'Moderator Financial Summary',
      );
      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="moderator-financial-${user.username}-${new Date().toISOString().split('T')[0]}.xlsx"`,
      });
      return new StreamableFile(buffer);
    }

    return report;
  }

  /**
   * B-3: Admin System Overview
   */
  @Get('admin/system-overview')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Get admin system overview',
    description: 'Shows system-wide statistics and health metrics',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ReportFormat,
    description: 'Report format (json, excel)',
  })
  @ApiResponse({ status: 200, description: 'Report generated' })
  async getAdminSystemOverview(
    @Query() query: ReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const report = await this.reportsService.getAdminSystemOverview(query);

    if (query.format === ReportFormat.EXCEL) {
      const buffer = await this.reportsService.exportToExcel(
        report,
        'System Overview',
      );
      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="system-overview-${new Date().toISOString().split('T')[0]}.xlsx"`,
      });
      return new StreamableFile(buffer);
    }

    return report;
  }

  /**
   * Helper: Flatten hierarchy tree for Excel export
   */
  private flattenHierarchy(
    node: Record<string, unknown>,
    level = 0,
    parentPath = '',
  ): Array<Record<string, unknown>> {
    const { downlines, stats, ...userData } = node;
    const currentPath = parentPath
      ? `${parentPath} > ${node.username}`
      : String(node.username);

    const flatNode = {
      level,
      path: currentPath,
      ...userData,
      ...(stats as Record<string, unknown>),
    };

    const result: Array<Record<string, unknown>> = [flatNode];

    if (Array.isArray(downlines) && downlines.length > 0) {
      downlines.forEach((child) => {
        result.push(
          ...this.flattenHierarchy(
            child as Record<string, unknown>,
            level + 1,
            currentPath,
          ),
        );
      });
    }

    return result;
  }
}
