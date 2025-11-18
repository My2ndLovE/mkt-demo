import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryCommissionDto } from './dtos';
import Decimal from 'decimal.js';

/**
 * Commission calculation result for a single upline
 */
interface CommissionEntry {
  agentId: number;
  betId: number;
  sourceAgentId: number;
  commissionRate: number;
  betAmount: number;
  profitLoss: number;
  commissionAmt: number;
  level: number;
}

/**
 * Upline in the hierarchy chain
 */
interface UplineChainMember {
  id: number;
  commissionRate: number;
  level: number;
}

/**
 * Commissions Service
 *
 * Handles multi-level commission calculations and distribution (T126-T141)
 *
 * CRITICAL ALGORITHM (R4 from research.md):
 * 1. Get upline chain using recursive CTE
 * 2. Calculate commission for each level
 * 3. Commission = profit/loss * (commissionRate / 100)
 * 4. Each level gets commission from remaining amount
 * 5. Stop when remaining amount is negligible (< 0.01)
 *
 * Business Rules:
 * - Commissions calculated on both wins and losses
 * - Negative commission on agent wins (upline loses)
 * - Positive commission on agent losses (upline wins)
 * - Uses decimal.js for precision (prevent floating point errors)
 * - Hierarchy traversal depth unlimited
 * - Batch insert for performance
 */
@Injectable()
export class CommissionsService {
  private readonly logger = new Logger(CommissionsService.name);
  private readonly PRECISION = 2; // Decimal places for money
  private readonly MIN_REMAINING = 0.01; // Stop calculation threshold

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate and create commissions for a bet (T126-T134)
   *
   * Called after bet result is determined
   *
   * @param betId - Bet ID
   * @param profitLoss - Profit/loss amount (+ for win, - for loss)
   * @returns Array of created commissions
   */
  async calculateCommissions(betId: number, profitLoss: number): Promise<any[]> {
    // Get bet details
    const bet = await this.prisma.bet.findUnique({
      where: { id: betId },
      include: {
        agent: {
          select: {
            id: true,
            username: true,
            uplineId: true,
          },
        },
      },
    });

    if (!bet) {
      throw new NotFoundException(`Bet with ID '${betId}' not found`);
    }

    if (!bet.agent.uplineId) {
      this.logger.log(`No upline for bet ${betId}, no commissions to calculate`);
      return [];
    }

    // Get upline chain using recursive query
    const uplineChain = await this.getUplineChain(bet.agentId);

    if (uplineChain.length === 0) {
      this.logger.log(`Empty upline chain for bet ${betId}, no commissions to calculate`);
      return [];
    }

    // Calculate commissions for each level
    const commissions = this.calculateCommissionEntries(
      bet.id,
      bet.agentId,
      Number(bet.amount),
      profitLoss,
      uplineChain,
    );

    if (commissions.length === 0) {
      this.logger.log(`No commissions to create for bet ${betId}`);
      return [];
    }

    // Batch insert commissions
    await this.prisma.commission.createMany({
      data: commissions,
    });

    this.logger.log(
      `Created ${commissions.length} commission records for bet ${betId}. ` +
        `Total commission: ${commissions.reduce((sum, c) => sum + c.commissionAmt, 0).toFixed(2)}`,
    );

    return commissions;
  }

  /**
   * Calculate commission entries for all uplines in the chain
   *
   * Uses decimal.js for precise floating-point arithmetic
   *
   * @param betId - Bet ID
   * @param sourceAgentId - Agent who placed the bet
   * @param betAmount - Original bet amount
   * @param profitLoss - Profit/loss amount (+ for win, - for loss)
   * @param uplineChain - Array of uplines with commission rates
   * @returns Array of commission entries
   * @private
   */
  private calculateCommissionEntries(
    betId: number,
    sourceAgentId: number,
    betAmount: number,
    profitLoss: number,
    uplineChain: UplineChainMember[],
  ): CommissionEntry[] {
    const commissions: CommissionEntry[] = [];

    // Use Decimal.js for precise calculations
    let remainingAmount = new Decimal(profitLoss);

    for (const [index, upline] of uplineChain.entries()) {
      // Stop if remaining amount is negligible
      if (remainingAmount.abs().lessThan(this.MIN_REMAINING)) {
        break;
      }

      // Calculate commission: remaining * (rate / 100)
      const rate = new Decimal(upline.commissionRate);
      const commissionAmt = remainingAmount.times(rate.dividedBy(100));

      commissions.push({
        agentId: upline.id,
        betId,
        sourceAgentId,
        commissionRate: upline.commissionRate,
        betAmount,
        profitLoss: Number(remainingAmount.toFixed(this.PRECISION)),
        commissionAmt: Number(commissionAmt.toFixed(this.PRECISION)),
        level: index + 1,
      });

      // Subtract commission from remaining amount for next level
      remainingAmount = remainingAmount.minus(commissionAmt);
    }

    return commissions;
  }

  /**
   * Get upline chain for a user using recursive CTE (T135)
   *
   * Returns all uplines from direct parent to root, with commission rates
   *
   * @param userId - User ID
   * @returns Array of uplines in hierarchy order
   * @private
   */
  private async getUplineChain(userId: number): Promise<UplineChainMember[]> {
    // SQL Server recursive CTE to get upline chain
    const result = await this.prisma.$queryRaw<UplineChainMember[]>`
      WITH UplineChain AS (
        -- Base case: direct upline
        SELECT
          u.id,
          u.commissionRate,
          1 AS level
        FROM users u
        WHERE u.id = (SELECT uplineId FROM users WHERE id = ${userId})

        UNION ALL

        -- Recursive case: uplines of uplines
        SELECT
          u.id,
          u.commissionRate,
          uc.level + 1 AS level
        FROM users u
        INNER JOIN UplineChain uc ON u.id = (SELECT uplineId FROM users WHERE id = uc.id)
        WHERE uc.level < 100 -- Prevent infinite recursion
      )
      SELECT
        id,
        CAST(commissionRate AS FLOAT) AS commissionRate,
        level
      FROM UplineChain
      ORDER BY level ASC;
    `;

    return result;
  }

  /**
   * Get commissions earned by the current user (T136)
   *
   * Returns paginated list of commissions with bet details
   *
   * @param userId - User ID
   * @param query - Query parameters
   * @returns Paginated commissions
   */
  async getMyCommissions(userId: number, query: QueryCommissionDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { agentId: userId };

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    // Get total count
    const total = await this.prisma.commission.count({ where });

    // Get commissions
    const commissions = await this.prisma.commission.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        bet: {
          select: {
            id: true,
            gameType: true,
            betType: true,
            numbers: true,
            amount: true,
            status: true,
            drawDate: true,
            receiptNumber: true,
          },
        },
        sourceAgent: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    // Transform data
    const data = commissions.map((commission) => ({
      id: commission.id,
      level: commission.level,
      commissionRate: Number(commission.commissionRate),
      betAmount: Number(commission.betAmount),
      profitLoss: Number(commission.profitLoss),
      commissionAmt: Number(commission.commissionAmt),
      createdAt: commission.createdAt,
      bet: {
        id: commission.bet.id,
        gameType: commission.bet.gameType,
        betType: commission.bet.betType,
        numbers: commission.bet.numbers,
        amount: Number(commission.bet.amount),
        status: commission.bet.status,
        drawDate: commission.bet.drawDate,
        receiptNumber: commission.bet.receiptNumber,
      },
      sourceAgent: {
        id: commission.sourceAgent.id,
        username: commission.sourceAgent.username,
        fullName: commission.sourceAgent.fullName,
      },
    }));

    // Calculate summary
    const summary = await this.calculateCommissionSummary(userId, {
      startDate: query.startDate,
      endDate: query.endDate,
    });

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      summary,
    };
  }

  /**
   * Get commissions from a specific downline (T137)
   *
   * @param userId - Current user ID
   * @param downlineId - Downline user ID
   * @param query - Query parameters
   * @returns Commissions from the specified downline
   */
  async getDownlineCommissions(userId: number, downlineId: number, query: QueryCommissionDto) {
    // Verify that downlineId is actually a downline of userId
    const isDownline = await this.verifyDownlineRelationship(userId, downlineId);

    if (!isDownline) {
      throw new BadRequestException(`User ${downlineId} is not a downline of user ${userId}`);
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      agentId: userId,
      sourceAgentId: downlineId,
    };

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    // Get total count
    const total = await this.prisma.commission.count({ where });

    // Get commissions
    const commissions = await this.prisma.commission.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        bet: {
          select: {
            id: true,
            gameType: true,
            betType: true,
            numbers: true,
            amount: true,
            status: true,
            drawDate: true,
            receiptNumber: true,
          },
        },
        sourceAgent: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    // Transform data
    const data = commissions.map((commission) => ({
      id: commission.id,
      level: commission.level,
      commissionRate: Number(commission.commissionRate),
      betAmount: Number(commission.betAmount),
      profitLoss: Number(commission.profitLoss),
      commissionAmt: Number(commission.commissionAmt),
      createdAt: commission.createdAt,
      bet: commission.bet,
    }));

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Calculate commission summary for a user (T138)
   *
   * @param userId - User ID
   * @param filters - Optional date filters
   * @returns Commission summary
   * @private
   */
  private async calculateCommissionSummary(
    userId: number,
    filters?: { startDate?: string; endDate?: string },
  ) {
    const where: any = { agentId: userId };

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    const result = await this.prisma.commission.aggregate({
      where,
      _sum: {
        commissionAmt: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      totalCommission: Number(result._sum.commissionAmt || 0),
      totalBets: result._count.id,
    };
  }

  /**
   * Verify that targetUserId is a downline of userId
   *
   * @param userId - Parent user ID
   * @param targetUserId - Potential downline user ID
   * @returns True if targetUserId is a downline of userId
   * @private
   */
  private async verifyDownlineRelationship(userId: number, targetUserId: number): Promise<boolean> {
    // Use recursive CTE to check if targetUserId is in userId's downline tree
    const result = await this.prisma.$queryRaw<Array<{ exists: number }>>`
      WITH DownlineTree AS (
        -- Base case: direct downlines
        SELECT id
        FROM users
        WHERE uplineId = ${userId}

        UNION ALL

        -- Recursive case: downlines of downlines
        SELECT u.id
        FROM users u
        INNER JOIN DownlineTree dt ON u.uplineId = dt.id
        WHERE dt.id IS NOT NULL
      )
      SELECT CAST(CASE WHEN EXISTS (SELECT 1 FROM DownlineTree WHERE id = ${targetUserId}) THEN 1 ELSE 0 END AS INT) AS [exists];
    `;

    return result[0]?.exists === 1;
  }

  /**
   * Get commission statistics for admin dashboard (T139)
   *
   * @returns Commission statistics
   */
  async getCommissionStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay()); // Start of week (Sunday)
    thisWeek.setHours(0, 0, 0, 0);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get aggregate statistics
    const [totalStats, todayStats, weekStats, monthStats] = await Promise.all([
      this.prisma.commission.aggregate({
        _sum: { commissionAmt: true },
        _count: { id: true },
      }),
      this.prisma.commission.aggregate({
        where: { createdAt: { gte: today } },
        _sum: { commissionAmt: true },
        _count: { id: true },
      }),
      this.prisma.commission.aggregate({
        where: { createdAt: { gte: thisWeek } },
        _sum: { commissionAmt: true },
        _count: { id: true },
      }),
      this.prisma.commission.aggregate({
        where: { createdAt: { gte: thisMonth } },
        _sum: { commissionAmt: true },
        _count: { id: true },
      }),
    ]);

    return {
      total: {
        amount: Number(totalStats._sum.commissionAmt || 0),
        count: totalStats._count.id,
      },
      today: {
        amount: Number(todayStats._sum.commissionAmt || 0),
        count: todayStats._count.id,
      },
      thisWeek: {
        amount: Number(weekStats._sum.commissionAmt || 0),
        count: weekStats._count.id,
      },
      thisMonth: {
        amount: Number(monthStats._sum.commissionAmt || 0),
        count: monthStats._count.id,
      },
    };
  }
}
