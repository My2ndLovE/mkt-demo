import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

/**
 * Reports Module
 *
 * Generates comprehensive reports and analytics (T170-T183)
 *
 * Features:
 * - Sales reports by date range
 * - Commission earnings reports
 * - Downline performance analysis
 * - Win/loss summary by game type and bet type
 * - Popular numbers analysis
 * - Dashboard quick stats
 * - Revenue analytics
 *
 * Business Rules:
 * - Reports filtered by user hierarchy (agents see own + downlines)
 * - Admin sees all data
 * - Date ranges default to current month
 * - Uses SQL aggregation for performance
 *
 * Performance:
 * - SQL aggregation queries with indexed columns
 * - Efficient grouping and joins
 * - Recursive CTEs for hierarchy traversal
 * - Minimal data transfer (aggregates only)
 *
 * Dependencies:
 * - PrismaService: Database access with optimized queries
 *
 * @module ReportsModule
 */
@Module({
  imports: [],
  controllers: [ReportsController],
  providers: [PrismaService, ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
