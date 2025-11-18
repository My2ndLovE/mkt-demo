import { Controller, Get, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { DateRangeDto } from './dtos';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * Reports Controller
 *
 * Generates comprehensive reports and analytics (T170-T183)
 *
 * Endpoints:
 * - GET /reports/sales - Total sales by date range
 * - GET /reports/commissions - Total commissions earned
 * - GET /reports/downlines - Downline performance
 * - GET /reports/win-loss - Win/loss summary
 * - GET /reports/popular-numbers - Most bet numbers
 * - GET /reports/dashboard - Dashboard summary
 *
 * Role Access:
 * - Authenticated: View own data + downlines
 * - Agents see own hierarchy data
 * - Admin sees all data
 */
@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Get sales report (T170-T173)
   */
  @Get('sales')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get sales report',
    description: 'Returns total sales summary by date range with status breakdown.',
  })
  @ApiResponse({ status: 200, description: 'Sales report retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getSalesReport(@CurrentUser() user: any, @Query() dateRange: DateRangeDto) {
    return this.reportsService.getSalesReport(user.id, dateRange);
  }

  /**
   * Get commissions report (T174-T176)
   */
  @Get('commissions')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get commissions report',
    description: 'Returns total commissions earned by date range with level breakdown.',
  })
  @ApiResponse({ status: 200, description: 'Commissions report retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getCommissionsReport(@CurrentUser() user: any, @Query() dateRange: DateRangeDto) {
    return this.reportsService.getCommissionsReport(user.id, dateRange);
  }

  /**
   * Get downline performance report (T177-T179)
   */
  @Get('downlines')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get downline performance report',
    description: 'Returns sales and commission performance of direct downlines.',
  })
  @ApiResponse({ status: 200, description: 'Downline report retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getDownlineReport(@CurrentUser() user: any, @Query() dateRange: DateRangeDto) {
    return this.reportsService.getDownlineReport(user.id, dateRange);
  }

  /**
   * Get win/loss summary (T180-T181)
   */
  @Get('win-loss')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get win/loss summary',
    description: 'Returns win/loss breakdown by game type and bet type.',
  })
  @ApiResponse({ status: 200, description: 'Win/loss report retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getWinLossReport(@CurrentUser() user: any, @Query() dateRange: DateRangeDto) {
    return this.reportsService.getWinLossReport(user.id, dateRange);
  }

  /**
   * Get popular numbers (T182-T183)
   */
  @Get('popular-numbers')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get popular numbers',
    description: 'Returns most frequently bet numbers by date range.',
  })
  @ApiResponse({ status: 200, description: 'Popular numbers retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getPopularNumbers(
    @Query() dateRange: DateRangeDto,
    @Query('limit', ParseIntPipe) limit?: number,
  ) {
    return this.reportsService.getPopularNumbers(dateRange, limit);
  }

  /**
   * Get dashboard summary (T184)
   */
  @Get('dashboard')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get dashboard summary',
    description: 'Returns quick stats for dashboard (today, this week, this month).',
  })
  @ApiResponse({ status: 200, description: 'Dashboard summary retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getDashboardSummary(@CurrentUser() user: any) {
    return this.reportsService.getDashboardSummary(user.id);
  }
}
