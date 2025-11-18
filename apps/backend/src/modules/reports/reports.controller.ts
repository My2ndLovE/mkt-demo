import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { ReportFiltersDto, ExportFormat } from './dto/report-filters.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate report with filters (JSON or Excel export)' })
  @ApiResponse({ status: 200, description: 'Report generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid report type or filters' })
  async generateReport(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') userRole: string,
    @Query() filters: ReportFiltersDto,
    @Res() res: Response,
  ) {
    // Generate report based on format
    if (filters.format === ExportFormat.EXCEL) {
      const buffer = await this.reportsService.exportToExcel(userId, userRole, filters);

      // Set headers for Excel download
      const filename = `${filters.reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);

      return res.send(buffer);
    } else {
      // JSON format
      const data = await this.reportsService.generateReport(userId, userRole, filters);
      return res.json({
        reportType: filters.reportType,
        filters: {
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          userId: filters.userId,
          providerId: filters.providerId,
          status: filters.status,
        },
        data,
        generatedAt: new Date().toISOString(),
      });
    }
  }
}
