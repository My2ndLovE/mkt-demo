import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportQueryDto, PaginationMetadata } from './dto/report-query.dto';
import { SafeJsonParser } from '../../common/utils/safe-json-parser.util';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * A-1: Agent Bet Summary Report
   * Shows betting activity summary for an agent
   * FIX C-5: Added pagination support
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

    // Calculate pagination
    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || 100, 1000); // Max 1000 records
    const skip = (page - 1) * pageSize;

    // Get total count for pagination metadata
    const totalCount = await this.prisma.bet.count({ where });

    // Get paginated bets
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
      skip,
      take: pageSize,
    });

    // Calculate summary statistics (still based on total, not paginated)
    const statusCounts = await this.prisma.bet.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    const totalAmount = await this.prisma.bet.aggregate({
      where,
      _sum: { amount: true },
    });

    const summary = {
      totalBets: totalCount,
      totalAmount: Number(totalAmount._sum.amount || 0),
      byStatus: {
        pending: statusCounts.find((s) => s.status === 'PENDING')?._count || 0,
        won: statusCounts.find((s) => s.status === 'WON')?._count || 0,
        lost: statusCounts.find((s) => s.status === 'LOST')?._count || 0,
        partial: statusCounts.find((s) => s.status === 'PARTIAL')?._count || 0,
        cancelled: statusCounts.find((s) => s.status === 'CANCELLED')?._count || 0,
      },
      byGameType: this.groupBy(bets, 'gameType'),
      byBetType: this.groupBy(bets, 'betType'),
      bets: bets.map((b) => ({
        ...b,
        amount: Number(b.amount),
        providers: SafeJsonParser.parseArray<string>(b.providers),
        results: SafeJsonParser.parseArray(b.results),
      })),
      pagination: this.buildPaginationMetadata(page, pageSize, totalCount),
    };

    return summary;
  }

  /**
   * A-2: Agent Win/Loss Report
   * Shows detailed win/loss analysis for an agent
   * FIX C-5: Added pagination to prevent memory exhaustion
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

    // FIX C-5: Add pagination
    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || 100, 1000);
    const skip = (page - 1) * pageSize;

    // Get total count for pagination metadata
    const totalCount = await this.prisma.bet.count({ where });

    // Get paginated bets
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
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    });

    // Map paginated bets to win/loss data
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

    // Calculate summary stats across ALL records (not just current page)
    const [statusCounts, betStats] = await Promise.all([
      this.prisma.bet.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      this.prisma.bet.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    const totalBetAmount = Number(betStats._sum.amount || 0);
    const wonCount = statusCounts.find((s) => s.status === 'WON')?._count || 0;
    const partialCount = statusCounts.find((s) => s.status === 'PARTIAL')?._count || 0;
    const winRate = totalCount > 0 ? ((wonCount + partialCount) / totalCount) * 100 : 0;

    return {
      summary: {
        totalBets: totalCount,
        totalBetAmount,
        winRate,
      },
      details: winLossData,
      pagination: this.buildPaginationMetadata(page, pageSize, totalCount),
    };
  }

  /**
   * A-3: Agent Commission Report
   * Shows commission earnings for an agent
   * FIX C-5: Added pagination to prevent memory exhaustion
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

    // FIX C-5: Add pagination
    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || 100, 1000);
    const skip = (page - 1) * pageSize;

    // Get total count for pagination metadata
    const totalCount = await this.prisma.commission.count({ where });

    // Get paginated commissions
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
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    });

    // Map paginated commissions to detailed records
    const commissionDetails = commissions.map((c) => ({
      betReceiptNumber: c.bet.receiptNumber,
      sourceAgent: c.sourceAgent.username,
      level: c.level,
      commissionRate: Number(c.commissionRate),
      betAmount: Number(c.bet.amount),
      profitLoss: Number(c.profitLoss),
      commissionAmount: Number(c.commissionAmt),
      createdAt: c.createdAt,
    }));

    // Calculate summary stats across ALL records (not just current page)
    const [levelCounts, commissionStats] = await Promise.all([
      this.prisma.commission.groupBy({
        by: ['level'],
        where,
        _count: true,
        _sum: { commissionAmt: true },
      }),
      this.prisma.commission.aggregate({
        where,
        _sum: { commissionAmt: true },
        _avg: { commissionAmt: true },
      }),
    ]);

    const byLevel = levelCounts.reduce(
      (acc, level) => {
        acc[level.level] = {
          count: level._count,
          total: Number(level._sum.commissionAmt || 0),
        };
        return acc;
      },
      {} as Record<number, { count: number; total: number }>,
    );

    return {
      summary: {
        totalCommissions: totalCount,
        totalAmount: Number(commissionStats._sum.commissionAmt || 0),
        averageCommission: Number(commissionStats._avg.commissionAmt || 0),
        byLevel,
      },
      details: commissionDetails,
      pagination: this.buildPaginationMetadata(page, pageSize, totalCount),
    };
  }

  /**
   * B-1: Moderator Hierarchy Report
   * Shows complete downline structure with statistics
   * FIX C-3: Optimized to avoid N+1 query problem with batch loading
   */
  async getModeratorHierarchy(moderatorId: number, query: ReportQueryDto) {
    const moderator = await this.prisma.user.findUnique({
      where: { id: moderatorId },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
      },
    });

    if (!moderator) {
      throw new Error('Moderator not found');
    }

    // FIX C-3: Batch load entire subtree in 3 queries instead of N+1
    // Step 1: Get all downline IDs
    const allDownlineIds = await this.getDownlineIds(moderatorId);
    allDownlineIds.push(moderatorId); // Include moderator themselves

    // Step 2: Batch load all users in the hierarchy (1 query)
    const allUsers = await this.prisma.user.findMany({
      where: { id: { in: allDownlineIds } },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        active: true,
        weeklyLimit: true,
        currentLimit: true,
        commissionRate: true,
        uplineId: true,
        createdAt: true,
      },
    });

    // Step 3: Batch load all stats (bets + commissions) in 2 queries
    const dateFilter = this.buildDateFilter(query);

    const [allBets, allCommissions] = await Promise.all([
      this.prisma.bet.findMany({
        where: {
          agentId: { in: allDownlineIds },
          ...dateFilter,
        },
        select: { agentId: true, amount: true, status: true },
      }),
      this.prisma.commission.findMany({
        where: {
          agentId: { in: allDownlineIds },
          ...dateFilter,
        },
        select: { agentId: true, commissionAmt: true },
      }),
    ]);

    // Step 4: Build lookup maps for O(1) access
    const userMap = new Map(allUsers.map((u) => [u.id, u]));

    // Build stats map
    const statsMap = new Map<
      number,
      {
        totalBets: number;
        totalBetAmount: number;
        totalCommissions: number;
        activeBets: number;
      }
    >();

    allDownlineIds.forEach((id) => {
      const userBets = allBets.filter((b) => b.agentId === id);
      const userCommissions = allCommissions.filter((c) => c.agentId === id);

      statsMap.set(id, {
        totalBets: userBets.length,
        totalBetAmount: userBets.reduce((sum, b) => sum + Number(b.amount), 0),
        totalCommissions: userCommissions.reduce(
          (sum, c) => sum + Number(c.commissionAmt),
          0,
        ),
        activeBets: userBets.filter((b) => b.status === 'PENDING').length,
      });
    });

    // Step 5: Build tree structure in memory (NO DB calls)
    const buildTree = (userId: number): unknown => {
      const user = userMap.get(userId);
      if (!user) return null;

      // Find all children of this user
      const children = allUsers.filter((u) => u.uplineId === userId);

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
        stats:
          statsMap.get(userId) ||
          {
            totalBets: 0,
            totalBetAmount: 0,
            totalCommissions: 0,
            activeBets: 0,
          },
        downlines: children.map((c) => buildTree(c.id)).filter((c) => c !== null),
      };
    };

    return {
      moderator: {
        id: moderator.id,
        username: moderator.username,
        fullName: moderator.fullName,
        role: moderator.role,
      },
      hierarchy: buildTree(moderatorId),
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

    // FIX C-5: Bet statistics - use aggregation instead of loading all records
    const [totalBets, betsByStatus, betAmountStats] = await Promise.all([
      this.prisma.bet.count({ where }),
      this.prisma.bet.groupBy({
        by: ['status'],
        where,
        _count: true,
        _sum: { amount: true },
      }),
      this.prisma.bet.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    // Total bet amount from aggregation
    const totalBetAmount = Number(betAmountStats._sum.amount || 0);

    // Win amount calculation - still need to load results field
    // NOTE: Consider adding a 'winAmount' column to Bet table for better performance
    const betsWithResults = await this.prisma.bet.findMany({
      where,
      select: { results: true },
    });

    const totalWinAmount = betsWithResults.reduce((sum, bet) => {
      const results = SafeJsonParser.parseArray<{ winAmount: number }>(bet.results);
      return (
        sum +
        results.reduce(
          (s: number, r: { winAmount: number }) => s + r.winAmount,
          0,
        )
      );
    }, 0);

    // FIX C-5: Commission statistics - use aggregation instead of loading all records
    const commissionWhere = {
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
    };

    const [totalCommissions, commissionStats] = await Promise.all([
      this.prisma.commission.count({ where: commissionWhere }),
      this.prisma.commission.aggregate({
        where: commissionWhere,
        _sum: { commissionAmt: true },
      }),
    ]);

    const totalCommissionAmount = Number(commissionStats._sum.commissionAmt || 0);

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

  /**
   * Helper: Build pagination metadata
   * FIX C-5: Centralized pagination logic
   */
  private buildPaginationMetadata(
    page: number,
    pageSize: number,
    totalRecords: number,
  ): PaginationMetadata {
    const totalPages = Math.ceil(totalRecords / pageSize);

    return {
      page,
      pageSize,
      totalPages,
      totalRecords,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  /**
   * Helper: Build date filter for queries
   * Reduces code duplication across report methods
   */
  private buildDateFilter(query: ReportQueryDto): {
    createdAt?: { gte?: Date; lte?: Date };
  } {
    if (!query.startDate && !query.endDate) {
      return {};
    }

    return {
      createdAt: {
        ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
        ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
      },
    };
  }
}
