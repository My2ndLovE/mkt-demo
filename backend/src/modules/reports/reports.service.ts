import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DateRangeDto } from './dtos';

/**
 * Reports Service
 *
 * Generates comprehensive reports and analytics (T170-T183)
 *
 * Features:
 * - Sales reports by date range
 * - Commission reports
 * - Downline performance
 * - Win/loss summary
 * - Popular numbers analysis
 * - Revenue analytics
 *
 * Business Rules:
 * - Use SQL aggregation for performance
 * - Reports filtered by user role (agents see own data + downlines)
 * - Admin sees all data
 * - Date ranges default to current month
 *
 * Performance:
 * - SQL aggregation queries
 * - Indexed date columns
 * - Efficient grouping
 */
@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get sales report (T170-T173)
   *
   * Total sales by date range with optional grouping
   *
   * @param userId - User ID (filters to user + downlines)
   * @param dateRange - Date range parameters
   * @returns Sales summary
   */
  async getSalesReport(userId: number, dateRange: DateRangeDto) {
    const { startDate, endDate } = this.getDateRange(dateRange);

    // Get user and all downlines
    const userIds = await this.getUserAndDownlines(userId);

    // Get bet statistics
    const [totalStats, statusBreakdown] = await Promise.all([
      this.prisma.bet.aggregate({
        where: {
          agentId: { in: userIds },
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: {
          amount: true,
          winAmount: true,
        },
        _count: {
          id: true,
        },
      }),
      this.prisma.bet.groupBy({
        by: ['status'],
        where: {
          agentId: { in: userIds },
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: {
          id: true,
        },
        _sum: {
          amount: true,
          winAmount: true,
        },
      }),
    ]);

    const totalAmount = Number(totalStats._sum.amount || 0);
    const totalWinAmount = Number(totalStats._sum.winAmount || 0);
    const totalBets = totalStats._count.id;
    const netRevenue = totalAmount - totalWinAmount;

    return {
      summary: {
        totalBets,
        totalAmount,
        totalWinAmount,
        netRevenue,
        period: {
          startDate,
          endDate,
        },
      },
      byStatus: statusBreakdown.map((item) => ({
        status: item.status,
        count: item._count.id,
        totalAmount: Number(item._sum.amount || 0),
        totalWinAmount: Number(item._sum.winAmount || 0),
      })),
    };
  }

  /**
   * Get commissions report (T174-T176)
   *
   * Total commissions earned by date range
   *
   * @param userId - User ID
   * @param dateRange - Date range parameters
   * @returns Commission summary
   */
  async getCommissionsReport(userId: number, dateRange: DateRangeDto) {
    const { startDate, endDate } = this.getDateRange(dateRange);

    const stats = await this.prisma.commission.aggregate({
      where: {
        agentId: userId,
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: {
        commissionAmt: true,
        betAmount: true,
      },
      _count: {
        id: true,
      },
    });

    const byLevel = await this.prisma.commission.groupBy({
      by: ['level'],
      where: {
        agentId: userId,
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: {
        commissionAmt: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        level: 'asc',
      },
    });

    return {
      summary: {
        totalCommission: Number(stats._sum.commissionAmt || 0),
        totalBetAmount: Number(stats._sum.betAmount || 0),
        totalBets: stats._count.id,
        period: {
          startDate,
          endDate,
        },
      },
      byLevel: byLevel.map((item) => ({
        level: item.level,
        count: item._count.id,
        totalCommission: Number(item._sum.commissionAmt || 0),
      })),
    };
  }

  /**
   * Get downline performance report (T177-T179)
   *
   * Sales and commissions by downline agents
   *
   * @param userId - User ID
   * @param dateRange - Date range parameters
   * @returns Downline performance
   */
  async getDownlineReport(userId: number, dateRange: DateRangeDto) {
    const { startDate, endDate } = this.getDateRange(dateRange);

    // Get direct downlines
    const downlines = await this.prisma.user.findMany({
      where: { uplineId: userId },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
      },
    });

    // Get stats for each downline
    const downlineStats = await Promise.all(
      downlines.map(async (downline) => {
        const [betStats, commissionStats] = await Promise.all([
          this.prisma.bet.aggregate({
            where: {
              agentId: downline.id,
              createdAt: { gte: startDate, lte: endDate },
            },
            _sum: {
              amount: true,
              winAmount: true,
            },
            _count: {
              id: true,
            },
          }),
          this.prisma.commission.aggregate({
            where: {
              sourceAgentId: downline.id,
              agentId: userId,
              createdAt: { gte: startDate, lte: endDate },
            },
            _sum: {
              commissionAmt: true,
            },
          }),
        ]);

        return {
          downline: {
            id: downline.id,
            username: downline.username,
            fullName: downline.fullName,
            role: downline.role,
          },
          sales: {
            totalBets: betStats._count.id,
            totalAmount: Number(betStats._sum.amount || 0),
            totalWinAmount: Number(betStats._sum.winAmount || 0),
            netRevenue: Number(betStats._sum.amount || 0) - Number(betStats._sum.winAmount || 0),
          },
          commissions: {
            totalCommission: Number(commissionStats._sum.commissionAmt || 0),
          },
        };
      }),
    );

    // Sort by total sales descending
    downlineStats.sort((a, b) => b.sales.totalAmount - a.sales.totalAmount);

    return {
      period: {
        startDate,
        endDate,
      },
      totalDownlines: downlines.length,
      downlines: downlineStats,
    };
  }

  /**
   * Get win/loss summary (T180-T181)
   *
   * Win/loss breakdown by provider and game type
   *
   * @param userId - User ID
   * @param dateRange - Date range parameters
   * @returns Win/loss summary
   */
  async getWinLossReport(userId: number, dateRange: DateRangeDto) {
    const { startDate, endDate } = this.getDateRange(dateRange);

    const userIds = await this.getUserAndDownlines(userId);

    // Group by game type and status
    const byGameType = await this.prisma.bet.groupBy({
      by: ['gameType', 'status'],
      where: {
        agentId: { in: userIds },
        createdAt: { gte: startDate, lte: endDate },
        status: { in: ['WON', 'LOST'] },
      },
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
        winAmount: true,
      },
    });

    // Group by bet type
    const byBetType = await this.prisma.bet.groupBy({
      by: ['betType', 'status'],
      where: {
        agentId: { in: userIds },
        createdAt: { gte: startDate, lte: endDate },
        status: { in: ['WON', 'LOST'] },
      },
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
        winAmount: true,
      },
    });

    // Calculate overall win rate
    const totalBets = byGameType.reduce((sum, item) => sum + item._count.id, 0);
    const wonBets = byGameType
      .filter((item) => item.status === 'WON')
      .reduce((sum, item) => sum + item._count.id, 0);
    const winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0;

    return {
      summary: {
        totalBets,
        wonBets,
        lostBets: totalBets - wonBets,
        winRate: winRate.toFixed(2) + '%',
        period: {
          startDate,
          endDate,
        },
      },
      byGameType: this.groupWinLossData(byGameType, 'gameType'),
      byBetType: this.groupWinLossData(byBetType, 'betType'),
    };
  }

  /**
   * Get popular numbers report (T182-T183)
   *
   * Most frequently bet numbers
   *
   * @param dateRange - Date range parameters
   * @param limit - Number of top numbers to return
   * @returns Popular numbers
   */
  async getPopularNumbers(dateRange: DateRangeDto, limit = 20) {
    const { startDate, endDate } = this.getDateRange(dateRange);

    // Safely construct SQL query using Prisma.sql to prevent SQL injection
    const popularNumbers = await this.prisma.$queryRaw<
      Array<{ numbers: string; totalBets: number; totalAmount: number }>
    >(
      Prisma.sql`
        SELECT TOP (${limit})
          numbers,
          COUNT(*) as totalBets,
          SUM(CAST(amount AS FLOAT)) as totalAmount
        FROM bets
        WHERE createdAt >= ${startDate} AND createdAt <= ${endDate}
        GROUP BY numbers
        ORDER BY COUNT(*) DESC, SUM(CAST(amount AS FLOAT)) DESC
      `
    );

    return {
      period: {
        startDate,
        endDate,
      },
      popularNumbers: popularNumbers.map((item) => ({
        number: item.numbers,
        totalBets: Number(item.totalBets),
        totalAmount: Number(item.totalAmount),
      })),
    };
  }

  /**
   * Get dashboard summary (T184)
   *
   * Quick stats for dashboard
   *
   * @param userId - User ID
   * @returns Dashboard summary
   */
  async getDashboardSummary(userId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());
    thisWeek.setHours(0, 0, 0, 0);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const userIds = await this.getUserAndDownlines(userId);

    const [todayStats, weekStats, monthStats, limits] = await Promise.all([
      this.getBetStats(userIds, today, new Date()),
      this.getBetStats(userIds, thisWeek, new Date()),
      this.getBetStats(userIds, thisMonth, new Date()),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          weeklyLimit: true,
          weeklyUsed: true,
        },
      }),
    ]);

    return {
      today: todayStats,
      thisWeek: weekStats,
      thisMonth: monthStats,
      limits: limits
        ? {
            weeklyLimit: Number(limits.weeklyLimit),
            weeklyUsed: Number(limits.weeklyUsed),
            weeklyRemaining: Number(limits.weeklyLimit) - Number(limits.weeklyUsed),
          }
        : null,
    };
  }

  /**
   * Get bet statistics for a date range
   *
   * @param userIds - Array of user IDs
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Bet statistics
   * @private
   */
  private async getBetStats(userIds: number[], startDate: Date, endDate: Date) {
    const stats = await this.prisma.bet.aggregate({
      where: {
        agentId: { in: userIds },
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: {
        amount: true,
        winAmount: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      totalBets: stats._count.id,
      totalAmount: Number(stats._sum.amount || 0),
      totalWinAmount: Number(stats._sum.winAmount || 0),
      netRevenue: Number(stats._sum.amount || 0) - Number(stats._sum.winAmount || 0),
    };
  }

  /**
   * Get user and all downlines recursively
   *
   * @param userId - User ID
   * @returns Array of user IDs (including self)
   * @private
   */
  private async getUserAndDownlines(userId: number): Promise<number[]> {
    const result = await this.prisma.$queryRaw<Array<{ id: number }>>(
      Prisma.sql`
        WITH DownlineTree AS (
          -- Base case: the user themselves
          SELECT id
          FROM users
          WHERE id = ${userId}

          UNION ALL

          -- Recursive case: all downlines
          SELECT u.id
          FROM users u
          INNER JOIN DownlineTree dt ON u.uplineId = dt.id
        )
        SELECT id FROM DownlineTree
      `
    );

    return result.map((row) => row.id);
  }

  /**
   * Get date range from DTO (defaults to current month)
   *
   * @param dateRange - Date range DTO
   * @returns Start and end dates
   * @private
   */
  private getDateRange(dateRange: DateRangeDto): { startDate: Date; endDate: Date } {
    const startDate = dateRange.startDate
      ? new Date(dateRange.startDate)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const endDate = dateRange.endDate ? new Date(dateRange.endDate) : new Date();

    return { startDate, endDate };
  }

  /**
   * Group win/loss data by a field
   *
   * @param data - Grouped data from database
   * @param field - Field name
   * @returns Grouped win/loss data
   * @private
   */
  private groupWinLossData(data: any[], field: string) {
    const grouped = new Map();

    for (const item of data) {
      const key = item[field];
      if (!grouped.has(key)) {
        grouped.set(key, {
          [field]: key,
          won: { count: 0, totalAmount: 0, totalWinAmount: 0 },
          lost: { count: 0, totalAmount: 0 },
        });
      }

      const group = grouped.get(key);
      if (item.status === 'WON') {
        group.won.count += item._count.id;
        group.won.totalAmount += Number(item._sum.amount || 0);
        group.won.totalWinAmount += Number(item._sum.winAmount || 0);
      } else {
        group.lost.count += item._count.id;
        group.lost.totalAmount += Number(item._sum.amount || 0);
      }
    }

    return Array.from(grouped.values());
  }
}
