import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportFiltersDto, ReportType } from './dto/report-filters.dto';
import * as ExcelJS from 'exceljs';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generate report based on type and filters
   */
  async generateReport(
    userId: number,
    userRole: string,
    filters: ReportFiltersDto,
  ): Promise<any> {
    this.logger.log(`Generating ${filters.reportType} report for user ${userId}`);

    // Build base where clause based on filters
    const baseWhere = this.buildWhereClause(userId, userRole, filters);

    let data: any[];

    switch (filters.reportType) {
      case ReportType.BETS:
        data = await this.getBetsReport(baseWhere, filters);
        break;
      case ReportType.WIN_LOSS:
        data = await this.getWinLossReport(baseWhere, filters);
        break;
      case ReportType.COMMISSIONS:
        data = await this.getCommissionsReport(baseWhere, filters);
        break;
      case ReportType.AGENT_PERFORMANCE:
        data = await this.getAgentPerformanceReport(userId, userRole, filters);
        break;
      case ReportType.WEEKLY_SUMMARY:
        data = await this.getWeeklySummaryReport(userId, userRole, filters);
        break;
      case ReportType.DRAW_RESULTS:
        data = await this.getDrawResultsReport(filters);
        break;
      default:
        throw new BadRequestException('Invalid report type');
    }

    return data;
  }

  /**
   * Export report to Excel
   */
  async exportToExcel(
    userId: number,
    userRole: string,
    filters: ReportFiltersDto,
  ): Promise<Buffer> {
    const data = await this.generateReport(userId, userRole, filters);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(this.getReportTitle(filters.reportType));

    // Add headers and data based on report type
    switch (filters.reportType) {
      case ReportType.BETS:
        this.formatBetsSheet(worksheet, data);
        break;
      case ReportType.WIN_LOSS:
        this.formatWinLossSheet(worksheet, data);
        break;
      case ReportType.COMMISSIONS:
        this.formatCommissionsSheet(worksheet, data);
        break;
      case ReportType.AGENT_PERFORMANCE:
        this.formatAgentPerformanceSheet(worksheet, data);
        break;
      case ReportType.WEEKLY_SUMMARY:
        this.formatWeeklySummarySheet(worksheet, data);
        break;
      case ReportType.DRAW_RESULTS:
        this.formatDrawResultsSheet(worksheet, data);
        break;
    }

    // Style the worksheet
    this.styleWorksheet(worksheet);

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Build where clause based on user role and filters
   */
  private buildWhereClause(userId: number, userRole: string, filters: ReportFiltersDto): any {
    const where: any = {};

    // Apply role-based filtering
    if (userRole === 'AGENT') {
      where.userId = userId;
    } else if (userRole === 'MODERATOR') {
      where.moderatorId = userId;
    }
    // ADMIN can see all

    // Apply date filters
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {
        ...(filters.fromDate && { gte: new Date(filters.fromDate) }),
        ...(filters.toDate && { lte: new Date(filters.toDate) }),
      };
    }

    // Apply user filter (admin/moderator only)
    if (filters.userId && (userRole === 'ADMIN' || userRole === 'MODERATOR')) {
      where.userId = filters.userId;
    }

    // Apply provider filter
    if (filters.providerId) {
      where.providerId = filters.providerId;
    }

    // Apply status filter
    if (filters.status) {
      where.status = filters.status;
    }

    return where;
  }

  /**
   * Report 1: Bets Report
   */
  private async getBetsReport(where: any, filters: ReportFiltersDto): Promise<any[]> {
    return await this.prisma.bet.findMany({
      where,
      include: {
        user: {
          select: {
            username: true,
            fullName: true,
          },
        },
        provider: {
          select: {
            name: true,
            code: true,
          },
        },
        result: {
          select: {
            drawNumber: true,
            winningNumbers: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1000, // Limit for performance
    });
  }

  /**
   * Report 2: Win/Loss Report
   */
  private async getWinLossReport(where: any, filters: ReportFiltersDto): Promise<any[]> {
    const stats = await this.prisma.bet.groupBy({
      by: ['status', 'userId'],
      where,
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
    });

    // Enrich with user details
    const enriched = await Promise.all(
      stats.map(async (stat) => {
        const user = await this.prisma.user.findUnique({
          where: { id: stat.userId },
          select: { username: true, fullName: true },
        });

        return {
          username: user?.username,
          fullName: user?.fullName,
          status: stat.status,
          betCount: stat._count.id,
          totalAmount: stat._sum.totalAmount,
        };
      }),
    );

    return enriched;
  }

  /**
   * Report 3: Commissions Report
   */
  private async getCommissionsReport(where: any, filters: ReportFiltersDto): Promise<any[]> {
    // Remove userId from where for commissions (use different filtering)
    const commissionWhere: any = { ...where };
    delete commissionWhere.userId;
    delete commissionWhere.providerId;
    delete commissionWhere.status;

    return await this.prisma.commission.findMany({
      where: commissionWhere,
      include: {
        user: {
          select: {
            username: true,
            fullName: true,
          },
        },
        bet: {
          select: {
            betNumber: true,
            totalAmount: true,
            user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1000,
    });
  }

  /**
   * Report 4: Agent Performance Report
   */
  private async getAgentPerformanceReport(
    userId: number,
    userRole: string,
    filters: ReportFiltersDto,
  ): Promise<any[]> {
    // Get downline users based on role
    const users = await this.prisma.user.findMany({
      where: {
        ...(userRole === 'AGENT' && { uplineId: userId }),
        ...(userRole === 'MODERATOR' && { moderatorId: userId }),
        // ADMIN sees all
        role: { in: ['AGENT', 'MODERATOR'] },
        active: true,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        weeklyLimit: true,
        weeklyUsed: true,
        commissionRate: true,
      },
    });

    // Get stats for each user
    const performance = await Promise.all(
      users.map(async (user) => {
        const bets = await this.prisma.bet.aggregate({
          where: {
            userId: user.id,
            ...(filters.fromDate && { createdAt: { gte: new Date(filters.fromDate) } }),
            ...(filters.toDate && { createdAt: { lte: new Date(filters.toDate) } }),
          },
          _sum: {
            totalAmount: true,
          },
          _count: {
            id: true,
          },
        });

        const commissions = await this.prisma.commission.aggregate({
          where: {
            userId: user.id,
            ...(filters.fromDate && { createdAt: { gte: new Date(filters.fromDate) } }),
            ...(filters.toDate && { createdAt: { lte: new Date(filters.toDate) } }),
          },
          _sum: {
            commissionAmount: true,
          },
        });

        return {
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          weeklyLimit: user.weeklyLimit,
          weeklyUsed: user.weeklyUsed,
          weeklyRemaining: new Decimal(user.weeklyLimit).sub(user.weeklyUsed).toNumber(),
          totalBets: bets._count.id,
          totalBetAmount: bets._sum.totalAmount || 0,
          totalCommissions: commissions._sum.commissionAmount || 0,
          commissionRate: user.commissionRate,
        };
      }),
    );

    return performance;
  }

  /**
   * Report 5: Weekly Summary Report
   */
  private async getWeeklySummaryReport(
    userId: number,
    userRole: string,
    filters: ReportFiltersDto,
  ): Promise<any[]> {
    const users = await this.prisma.user.findMany({
      where: {
        ...(userRole === 'AGENT' && { id: userId }),
        ...(userRole === 'MODERATOR' && { moderatorId: userId }),
        // ADMIN sees all
        role: { in: ['AGENT', 'MODERATOR'] },
        active: true,
      },
      select: {
        username: true,
        fullName: true,
        role: true,
        weeklyLimit: true,
        weeklyUsed: true,
      },
      orderBy: {
        username: 'asc',
      },
    });

    return users.map((user) => ({
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      weeklyLimit: user.weeklyLimit,
      weeklyUsed: user.weeklyUsed,
      weeklyRemaining: new Decimal(user.weeklyLimit).sub(user.weeklyUsed).toNumber(),
      utilizationPercent: user.weeklyLimit
        ? (new Decimal(user.weeklyUsed).div(user.weeklyLimit).mul(100).toNumber())
        : 0,
    }));
  }

  /**
   * Report 6: Draw Results Report
   */
  private async getDrawResultsReport(filters: ReportFiltersDto): Promise<any[]> {
    return await this.prisma.drawResult.findMany({
      where: {
        ...(filters.providerId && { providerId: filters.providerId }),
        ...(filters.fromDate && { drawDate: { gte: new Date(filters.fromDate) } }),
        ...(filters.toDate && { drawDate: { lte: new Date(filters.toDate) } }),
      },
      include: {
        provider: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        drawDate: 'desc',
      },
      take: 1000,
    });
  }

  private getReportTitle(reportType: ReportType | undefined): string {
    const titles = {
      [ReportType.BETS]: 'Bets Report',
      [ReportType.WIN_LOSS]: 'Win-Loss Report',
      [ReportType.COMMISSIONS]: 'Commissions Report',
      [ReportType.AGENT_PERFORMANCE]: 'Agent Performance Report',
      [ReportType.WEEKLY_SUMMARY]: 'Weekly Summary Report',
      [ReportType.DRAW_RESULTS]: 'Draw Results Report',
    };
    return titles[reportType || ReportType.BETS];
  }

  private formatBetsSheet(worksheet: ExcelJS.Worksheet, data: any[]) {
    worksheet.columns = [
      { header: 'Bet ID', key: 'id', width: 10 },
      { header: 'Username', key: 'username', width: 15 },
      { header: 'Full Name', key: 'fullName', width: 20 },
      { header: 'Provider', key: 'provider', width: 15 },
      { header: 'Bet Number', key: 'betNumber', width: 12 },
      { header: 'Bet Type', key: 'betType', width: 12 },
      { header: 'Amount', key: 'totalAmount', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Draw Date', key: 'drawDate', width: 15 },
      { header: 'Created At', key: 'createdAt', width: 20 },
    ];

    data.forEach((bet) => {
      worksheet.addRow({
        id: bet.id,
        username: bet.user.username,
        fullName: bet.user.fullName,
        provider: bet.provider.name,
        betNumber: bet.betNumber,
        betType: bet.betType,
        totalAmount: bet.totalAmount,
        status: bet.status,
        drawDate: bet.drawDate,
        createdAt: bet.createdAt,
      });
    });
  }

  private formatWinLossSheet(worksheet: ExcelJS.Worksheet, data: any[]) {
    worksheet.columns = [
      { header: 'Username', key: 'username', width: 15 },
      { header: 'Full Name', key: 'fullName', width: 20 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Bet Count', key: 'betCount', width: 12 },
      { header: 'Total Amount', key: 'totalAmount', width: 15 },
    ];

    data.forEach((row) => {
      worksheet.addRow(row);
    });
  }

  private formatCommissionsSheet(worksheet: ExcelJS.Worksheet, data: any[]) {
    worksheet.columns = [
      { header: 'Commission ID', key: 'id', width: 12 },
      { header: 'Username', key: 'username', width: 15 },
      { header: 'Full Name', key: 'fullName', width: 20 },
      { header: 'Bet ID', key: 'betId', width: 10 },
      { header: 'Bet Owner', key: 'betOwner', width: 15 },
      { header: 'Commission Rate', key: 'commissionRate', width: 15 },
      { header: 'Commission Amount', key: 'commissionAmount', width: 18 },
      { header: 'Created At', key: 'createdAt', width: 20 },
    ];

    data.forEach((commission) => {
      worksheet.addRow({
        id: commission.id,
        username: commission.user.username,
        fullName: commission.user.fullName,
        betId: commission.betId,
        betOwner: commission.bet.user.username,
        commissionRate: commission.commissionRate,
        commissionAmount: commission.commissionAmount,
        createdAt: commission.createdAt,
      });
    });
  }

  private formatAgentPerformanceSheet(worksheet: ExcelJS.Worksheet, data: any[]) {
    worksheet.columns = [
      { header: 'Username', key: 'username', width: 15 },
      { header: 'Full Name', key: 'fullName', width: 20 },
      { header: 'Role', key: 'role', width: 12 },
      { header: 'Weekly Limit', key: 'weeklyLimit', width: 15 },
      { header: 'Weekly Used', key: 'weeklyUsed', width: 15 },
      { header: 'Remaining', key: 'weeklyRemaining', width: 15 },
      { header: 'Total Bets', key: 'totalBets', width: 12 },
      { header: 'Total Bet Amount', key: 'totalBetAmount', width: 18 },
      { header: 'Total Commissions', key: 'totalCommissions', width: 18 },
      { header: 'Commission Rate', key: 'commissionRate', width: 15 },
    ];

    data.forEach((row) => {
      worksheet.addRow(row);
    });
  }

  private formatWeeklySummarySheet(worksheet: ExcelJS.Worksheet, data: any[]) {
    worksheet.columns = [
      { header: 'Username', key: 'username', width: 15 },
      { header: 'Full Name', key: 'fullName', width: 20 },
      { header: 'Role', key: 'role', width: 12 },
      { header: 'Weekly Limit', key: 'weeklyLimit', width: 15 },
      { header: 'Weekly Used', key: 'weeklyUsed', width: 15 },
      { header: 'Remaining', key: 'weeklyRemaining', width: 15 },
      { header: 'Utilization %', key: 'utilizationPercent', width: 15 },
    ];

    data.forEach((row) => {
      worksheet.addRow(row);
    });
  }

  private formatDrawResultsSheet(worksheet: ExcelJS.Worksheet, data: any[]) {
    worksheet.columns = [
      { header: 'Result ID', key: 'id', width: 10 },
      { header: 'Provider', key: 'provider', width: 15 },
      { header: 'Draw Number', key: 'drawNumber', width: 15 },
      { header: 'Draw Date', key: 'drawDate', width: 15 },
      { header: 'Winning Numbers', key: 'winningNumbers', width: 30 },
      { header: 'Special Numbers', key: 'specialNumbers', width: 20 },
    ];

    data.forEach((result) => {
      worksheet.addRow({
        id: result.id,
        provider: result.provider.name,
        drawNumber: result.drawNumber,
        drawDate: result.drawDate,
        winningNumbers: result.winningNumbers,
        specialNumbers: result.specialNumbers || '',
      });
    });
  }

  private styleWorksheet(worksheet: ExcelJS.Worksheet) {
    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Add borders
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });
  }
}
