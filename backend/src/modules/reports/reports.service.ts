import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { SafeJsonParser } from '../../common/utils/safe-json-parser.util';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * A-1: Agent Bet Summary Report
   * Shows betting activity summary for an agent
   */
  async getAgentBetSummary(agentId: number, query: ReportQueryDto) {
    const where: Record<string, unknown> = { agentId };

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(
          query.startDate,
        );
      }
      if (query.endDate) {
        (where.createdAt as Record<string, unknown>).lte = new Date(
          query.endDate,
        );
      }
    }

    const bets = await this.prisma.bet.findMany({
      where,
      select: {
        id: true,
        receiptNumber: true,
        numbers: true,
        gameType: true,
        betType: true,
        amount: true,
        providers: true,
        status: true,
        results: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const summary = {
      totalBets: bets.length,
      totalAmount: bets.reduce((sum, bet) => sum + Number(bet.amount), 0),
      byStatus: {
        pending: bets.filter((b) => b.status === 'PENDING').length,
        won: bets.filter((b) => b.status === 'WON').length,
        lost: bets.filter((b) => b.status === 'LOST').length,
        partial: bets.filter((b) => b.status === 'PARTIAL').length,
        cancelled: bets.filter((b) => b.status === 'CANCELLED').length,
      },
      byGameType: this.groupBy(bets, 'gameType'),
      byBetType: this.groupBy(bets, 'betType'),
      bets: bets.map((b) => ({
        ...b,
        amount: Number(b.amount),
        providers: SafeJsonParser.parseArray<string>(b.providers),
        results: SafeJsonParser.parseArray(b.results),
      })),
    };

    return summary;
  }

  /**
   * A-2: Agent Win/Loss Report
   * Shows detailed win/loss analysis for an agent
   */
  async getAgentWinLoss(agentId: number, query: ReportQueryDto) {
    const where: Record<string, unknown> = {
      agentId,
      status: { in: ['WON', 'LOST', 'PARTIAL'] }, // Only settled bets
    };

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(
          query.startDate,
        );
      }
      if (query.endDate) {
        (where.createdAt as Record<string, unknown>).lte = new Date(
          query.endDate,
        );
      }
    }

    const bets = await this.prisma.bet.findMany({
      where,
      select: {
        id: true,
        receiptNumber: true,
        numbers: true,
        gameType: true,
        betType: true,
        amount: true,
        status: true,
        results: true,
        createdAt: true,
      },
    });

    const winLossData = bets.map((bet) => {
      const results = SafeJsonParser.parseArray<{ winAmount: number }>(bet.results);
      const totalWin = results.reduce(
        (sum: number, r: { winAmount: number }) => sum + r.winAmount,
        0,
      );
      const netProfitLoss = totalWin - Number(bet.amount);

      return {
        receiptNumber: bet.receiptNumber,
        numbers: bet.numbers,
        gameType: bet.gameType,
        betType: bet.betType,
        betAmount: Number(bet.amount),
        winAmount: totalWin,
        netProfitLoss,
        status: bet.status,
        createdAt: bet.createdAt,
      };
    });

    const summary = {
      totalBets: bets.length,
      totalBetAmount: bets.reduce((sum, b) => sum + Number(b.amount), 0),
      totalWinAmount: winLossData.reduce((sum, w) => sum + w.winAmount, 0),
      totalProfitLoss: winLossData.reduce((sum, w) => sum + w.netProfitLoss, 0),
      winRate:
        bets.length > 0
          ? (bets.filter((b) => b.status === 'WON' || b.status === 'PARTIAL')
              .length /
              bets.length) *
            100
          : 0,
      details: winLossData,
    };

    return summary;
  }

  /**
   * A-3: Agent Commission Report
   * Shows commission earnings for an agent
   */
  async getAgentCommission(agentId: number, query: ReportQueryDto) {
    const where: Record<string, unknown> = { agentId };

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(
          query.startDate,
        );
      }
      if (query.endDate) {
        (where.createdAt as Record<string, unknown>).lte = new Date(
          query.endDate,
        );
      }
    }

    const commissions = await this.prisma.commission.findMany({
      where,
      include: {
        bet: {
          select: {
            receiptNumber: true,
            numbers: true,
            gameType: true,
            amount: true,
          },
        },
        sourceAgent: {
          select: {
            username: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const byLevel = commissions.reduce(
      (acc, c) => {
        const level = c.level;
        if (!acc[level]) {
          acc[level] = { count: 0, total: 0, details: [] };
        }
        acc[level].count++;
        acc[level].total += Number(c.commissionAmt);
        acc[level].details.push({
          betReceiptNumber: c.bet.receiptNumber,
          sourceAgent: c.sourceAgent.username,
          commissionRate: Number(c.commissionRate),
          betAmount: Number(c.bet.amount),
          profitLoss: Number(c.profitLoss),
          commissionAmount: Number(c.commissionAmt),
          createdAt: c.createdAt,
        });
        return acc;
      },
      {} as Record<
        number,
        {
          count: number;
          total: number;
          details: Array<{
            betReceiptNumber: string;
            sourceAgent: string;
            commissionRate: number;
            betAmount: number;
            profitLoss: number;
            commissionAmount: number;
            createdAt: Date;
          }>;
        }
      >,
    );

    const summary = {
      totalCommissions: commissions.length,
      totalAmount: commissions.reduce(
        (sum, c) => sum + Number(c.commissionAmt),
        0,
      ),
      averageCommission:
        commissions.length > 0
          ? commissions.reduce((sum, c) => sum + Number(c.commissionAmt), 0) /
            commissions.length
          : 0,
      byLevel,
    };

    return summary;
  }

  /**
   * B-1: Moderator Hierarchy Report
   * Shows complete downline structure with statistics
   */
  async getModeratorHierarchy(moderatorId: number, query: ReportQueryDto) {
    const moderator = await this.prisma.user.findUnique({
      where: { id: moderatorId },
      include: {
        downlines: {
          select: {
            id: true,
            username: true,
            fullName: true,
            role: true,
            active: true,
            weeklyLimit: true,
            currentLimit: true,
            commissionRate: true,
            createdAt: true,
          },
        },
      },
    });

    if (!moderator) {
      throw new Error('Moderator not found');
    }

    // Recursively build hierarchy tree with stats
    const buildTree = async (userId: number): Promise<unknown> => {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          downlines: {
            select: {
              id: true,
              username: true,
              fullName: true,
              role: true,
              active: true,
              weeklyLimit: true,
              currentLimit: true,
              commissionRate: true,
              createdAt: true,
            },
          },
        },
      });

      if (!user) return null;

      // Get stats for this user
      const stats = await this.getUserStats(userId, query);

      const downlines = await Promise.all(
        user.downlines.map(async (d) => await buildTree(d.id)),
      );

      return {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        active: user.active,
        weeklyLimit: Number(user.weeklyLimit),
        currentLimit: Number(user.currentLimit),
        commissionRate: Number(user.commissionRate),
        createdAt: user.createdAt,
        stats,
        downlines,
      };
    };

    const hierarchyTree = await buildTree(moderatorId);

    return {
      moderator: {
        id: moderator.id,
        username: moderator.username,
        fullName: moderator.fullName,
        role: moderator.role,
      },
      hierarchy: hierarchyTree,
    };
  }

  /**
   * B-2: Moderator Financial Summary
   * Shows aggregated financial data for moderator's downline
   */
  async getModeratorFinancialSummary(
    moderatorId: number,
    query: ReportQueryDto,
  ) {
    // Get all downline IDs (recursive)
    const downlineIds = await this.getDownlineIds(moderatorId);
    downlineIds.push(moderatorId); // Include moderator

    const where: Record<string, unknown> = {
      agentId: { in: downlineIds },
    };

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(
          query.startDate,
        );
      }
      if (query.endDate) {
        (where.createdAt as Record<string, unknown>).lte = new Date(
          query.endDate,
        );
      }
    }

    // Aggregate bets
    const bets = await this.prisma.bet.findMany({
      where,
      select: {
        id: true,
        agentId: true,
        amount: true,
        status: true,
        results: true,
      },
    });

    const betStats = {
      totalBets: bets.length,
      totalAmount: bets.reduce((sum, b) => sum + Number(b.amount), 0),
      byStatus: {
        pending: bets.filter((b) => b.status === 'PENDING').length,
        won: bets.filter((b) => b.status === 'WON').length,
        lost: bets.filter((b) => b.status === 'LOST').length,
        partial: bets.filter((b) => b.status === 'PARTIAL').length,
        cancelled: bets.filter((b) => b.status === 'CANCELLED').length,
      },
    };

    // Calculate total win amounts
    const totalWin = bets.reduce((sum, bet) => {
      const results = SafeJsonParser.parseArray<{ winAmount: number }>(bet.results);
      return (
        sum +
        results.reduce(
          (s: number, r: { winAmount: number }) => s + r.winAmount,
          0,
        )
      );
    }, 0);

    const netProfitLoss = totalWin - betStats.totalAmount;

    // Aggregate commissions
    const commissions = await this.prisma.commission.findMany({
      where: {
        agentId: { in: downlineIds },
        ...(query.startDate || query.endDate
          ? {
              createdAt: {
                ...(query.startDate
                  ? { gte: new Date(query.startDate) }
                  : {}),
                ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
              },
            }
          : {}),
      },
      select: {
        commissionAmt: true,
        level: true,
      },
    });

    const commissionStats = {
      totalCommissions: commissions.length,
      totalAmount: commissions.reduce(
        (sum, c) => sum + Number(c.commissionAmt),
        0,
      ),
      byLevel: commissions.reduce(
        (acc, c) => {
          const level = c.level;
          if (!acc[level]) {
            acc[level] = { count: 0, total: 0 };
          }
          acc[level].count++;
          acc[level].total += Number(c.commissionAmt);
          return acc;
        },
        {} as Record<number, { count: number; total: number }>,
      ),
    };

    // Get user counts
    const users = await this.prisma.user.findMany({
      where: { id: { in: downlineIds } },
      select: { role: true, active: true },
    });

    const userStats = {
      totalUsers: users.length,
      active: users.filter((u) => u.active).length,
      inactive: users.filter((u) => !u.active).length,
      byRole: {
        agents: users.filter((u) => u.role === 'AGENT').length,
        moderators: users.filter((u) => u.role === 'MODERATOR').length,
        admins: users.filter((u) => u.role === 'ADMIN').length,
      },
    };

    return {
      period: {
        startDate: query.startDate || null,
        endDate: query.endDate || null,
      },
      bets: betStats,
      winnings: {
        totalWinAmount: totalWin,
        netProfitLoss,
      },
      commissions: commissionStats,
      users: userStats,
    };
  }

  /**
   * B-3: Admin System Overview
   * Shows system-wide statistics and health metrics
   */
  async getAdminSystemOverview(query: ReportQueryDto) {
    const where: Record<string, unknown> = {};

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(
          query.startDate,
        );
      }
      if (query.endDate) {
        (where.createdAt as Record<string, unknown>).lte = new Date(
          query.endDate,
        );
      }
    }

    // User statistics
    const totalUsers = await this.prisma.user.count();
    const activeUsers = await this.prisma.user.count({
      where: { active: true },
    });
    const usersByRole = await this.prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    // Bet statistics
    const totalBets = await this.prisma.bet.count({ where });
    const betsByStatus = await this.prisma.bet.groupBy({
      by: ['status'],
      where,
      _count: true,
      _sum: { amount: true },
    });

    const bets = await this.prisma.bet.findMany({
      where,
      select: { amount: true, results: true },
    });

    const totalBetAmount = bets.reduce(
      (sum, b) => sum + Number(b.amount),
      0,
    );
    const totalWinAmount = bets.reduce((sum, bet) => {
      const results = SafeJsonParser.parseArray<{ winAmount: number }>(bet.results);
      return (
        sum +
        results.reduce(
          (s: number, r: { winAmount: number }) => s + r.winAmount,
          0,
        )
      );
    }, 0);

    // Commission statistics
    const totalCommissions = await this.prisma.commission.count({
      where: {
        ...(query.startDate || query.endDate
          ? {
              createdAt: {
                ...(query.startDate
                  ? { gte: new Date(query.startDate) }
                  : {}),
                ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
              },
            }
          : {}),
      },
    });

    const commissions = await this.prisma.commission.findMany({
      where: {
        ...(query.startDate || query.endDate
          ? {
              createdAt: {
                ...(query.startDate
                  ? { gte: new Date(query.startDate) }
                  : {}),
                ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
              },
            }
          : {}),
      },
      select: { commissionAmt: true },
    });

    const totalCommissionAmount = commissions.reduce(
      (sum, c) => sum + Number(c.commissionAmt),
      0,
    );

    // Provider statistics
    const providers = await this.prisma.serviceProvider.findMany({
      select: { code: true, name: true, active: true },
    });

    // Recent limit resets
    const recentResets = await this.prisma.limitResetLog.findMany({
      take: 10,
      orderBy: { resetDate: 'desc' },
    });

    return {
      period: {
        startDate: query.startDate || null,
        endDate: query.endDate || null,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        byRole: usersByRole.map((r) => ({
          role: r.role,
          count: r._count,
        })),
      },
      bets: {
        total: totalBets,
        totalAmount: totalBetAmount,
        byStatus: betsByStatus.map((s) => ({
          status: s.status,
          count: s._count,
          amount: Number(s._sum.amount || 0),
        })),
      },
      winnings: {
        totalWinAmount,
        netProfitLoss: totalWinAmount - totalBetAmount,
        houseEdge:
          totalBetAmount > 0
            ? ((totalBetAmount - totalWinAmount) / totalBetAmount) * 100
            : 0,
      },
      commissions: {
        total: totalCommissions,
        totalAmount: totalCommissionAmount,
      },
      providers: {
        total: providers.length,
        active: providers.filter((p) => p.active).length,
        list: providers,
      },
      systemHealth: {
        recentResets: recentResets.map((r) => ({
          date: r.resetDate,
          success: r.success,
          usersAffected: r.usersAffected,
        })),
        lastSuccessfulReset: recentResets.find((r) => r.success)?.resetDate,
      },
    };
  }

  /**
   * Export report to Excel format
   */
  async exportToExcel(reportData: unknown, reportName: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(reportName);

    // Flatten and add data
    if (Array.isArray(reportData)) {
      if (reportData.length > 0) {
        const headers = Object.keys(reportData[0]);
        worksheet.addRow(headers);
        reportData.forEach((row) => {
          worksheet.addRow(Object.values(row));
        });
      }
    } else if (typeof reportData === 'object' && reportData !== null) {
      // For nested objects, create multiple sheets or flatten
      worksheet.addRow(['Key', 'Value']);
      Object.entries(reportData).forEach(([key, value]) => {
        worksheet.addRow([key, JSON.stringify(value)]);
      });
    }

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.columns.forEach((column) => {
      if (column) {
        column.width = 15;
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as Buffer;
  }

  /**
   * Helper: Get user stats for hierarchy report
   */
  private async getUserStats(userId: number, query: ReportQueryDto) {
    const where: Record<string, unknown> = { agentId: userId };

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(
          query.startDate,
        );
      }
      if (query.endDate) {
        (where.createdAt as Record<string, unknown>).lte = new Date(
          query.endDate,
        );
      }
    }

    const bets = await this.prisma.bet.findMany({
      where,
      select: { amount: true, status: true },
    });

    const commissions = await this.prisma.commission.findMany({
      where: {
        agentId: userId,
        ...(query.startDate || query.endDate
          ? {
              createdAt: {
                ...(query.startDate
                  ? { gte: new Date(query.startDate) }
                  : {}),
                ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
              },
            }
          : {}),
      },
      select: { commissionAmt: true },
    });

    return {
      totalBets: bets.length,
      totalBetAmount: bets.reduce((sum, b) => sum + Number(b.amount), 0),
      totalCommissions: commissions.reduce(
        (sum, c) => sum + Number(c.commissionAmt),
        0,
      ),
      activeBets: bets.filter((b) => b.status === 'PENDING').length,
    };
  }

  /**
   * Helper: Get all downline IDs recursively
   */
  private async getDownlineIds(userId: number): Promise<number[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { downlines: { select: { id: true } } },
    });

    if (!user || user.downlines.length === 0) {
      return [];
    }

    const directDownlines = user.downlines.map((d) => d.id);
    const nestedDownlines = await Promise.all(
      directDownlines.map((id) => this.getDownlineIds(id)),
    );

    return [...directDownlines, ...nestedDownlines.flat()];
  }

  /**
   * Helper: Group array by key
   */
  private groupBy(array: Array<Record<string, unknown>>, key: string) {
    return array.reduce(
      (acc, item) => {
        const groupKey = String(item[key]);
        if (!acc[groupKey]) {
          acc[groupKey] = { count: 0, total: 0 };
        }
        acc[groupKey].count++;
        acc[groupKey].total += Number(item.amount || 0);
        return acc;
      },
      {} as Record<string, { count: number; total: number }>,
    );
  }
}
