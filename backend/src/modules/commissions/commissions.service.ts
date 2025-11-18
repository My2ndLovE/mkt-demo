import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CommissionsService {
  constructor(private prisma: PrismaService) {}

  async calculateAndCreateCommissions(betId: number) {
    const bet = await this.prisma.bet.findUnique({
      where: { id: betId },
      include: {
        agent: {
          include: {
            upline: true,
          },
        },
      },
    });

    if (!bet || bet.status === 'PENDING' || bet.status === 'CANCELLED') {
      return; // Only calculate for completed bets
    }

    // Calculate total profit/loss
    const results = bet.results ? JSON.parse(bet.results) : [];
    const totalWin = results.reduce(
      (sum: number, r: { winAmount: number }) => sum + r.winAmount,
      0
    );
    const profitLoss = totalWin - Number(bet.amount);

    // Get upline chain
    const uplineChain = await this.getUplineChain(bet.agentId);

    // Create commission records for each upline
    const commissions = [];
    for (let level = 0; level < uplineChain.length; level++) {
      const upline = uplineChain[level];
      const commissionRate = Number(upline.commissionRate);

      // Commission is based on the profit/loss
      const commissionAmount = (profitLoss * commissionRate) / 100;

      // Round to 2 decimal places (banker's rounding)
      const roundedCommission = Math.round(commissionAmount * 100) / 100;

      commissions.push({
        agentId: upline.id,
        betId: bet.id,
        sourceAgentId: bet.agentId,
        commissionRate,
        betAmount: Number(bet.amount),
        profitLoss,
        commissionAmt: roundedCommission,
        level: level + 1,
      });

      // Reduce profit/loss for next level
      const remainingProfitLoss = profitLoss - commissionAmount;
      if (remainingProfitLoss <= 0) break;
    }

    // Insert all commissions
    if (commissions.length > 0) {
      await this.prisma.commission.createMany({
        data: commissions,
      });

      // Audit log
      await this.prisma.auditLog.create({
        data: {
          userId: bet.agentId,
          action: 'COMMISSION_CALCULATED',
          metadata: JSON.stringify({
            betId: bet.id,
            commissionsCreated: commissions.length,
            totalCommission: commissions.reduce((sum, c) => sum + c.commissionAmt, 0),
          }),
        },
      });
    }

    return commissions;
  }

  async getCommissionsByAgent(agentId: number, filters?: { startDate?: string; endDate?: string }) {
    const where: Record<string, unknown> = { agentId };

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        (where.createdAt as Record<string, unknown>).lte = new Date(filters.endDate);
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
            providers: true,
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

    return commissions.map((c) => ({
      id: c.id,
      betId: c.betId,
      receiptNumber: c.bet.receiptNumber,
      numbers: c.bet.numbers,
      gameType: c.bet.gameType,
      providers: JSON.parse(c.bet.providers),
      sourceAgent: c.sourceAgent,
      commissionRate: Number(c.commissionRate),
      betAmount: Number(c.betAmount),
      profitLoss: Number(c.profitLoss),
      commissionAmount: Number(c.commissionAmt),
      level: c.level,
      createdAt: c.createdAt,
    }));
  }

  async getCommissionSummary(agentId: number, filters?: { startDate?: string; endDate?: string }) {
    const commissions = await this.getCommissionsByAgent(agentId, filters);

    const total = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    const count = commissions.length;
    const avgCommission = count > 0 ? total / count : 0;

    const byLevel = commissions.reduce((acc, c) => {
      const level = c.level;
      if (!acc[level]) {
        acc[level] = { count: 0, total: 0 };
      }
      acc[level].count++;
      acc[level].total += c.commissionAmount;
      return acc;
    }, {} as Record<number, { count: number; total: number }>);

    return {
      totalCommission: total,
      totalBets: count,
      averageCommission: avgCommission,
      byLevel,
    };
  }

  private async getUplineChain(agentId: number): Promise<
    Array<{
      id: number;
      commissionRate: { toNumber: () => number } | number;
    }>
  > {
    const chain = [];
    let currentAgent = await this.prisma.user.findUnique({
      where: { id: agentId },
      select: { uplineId: true },
    });

    while (currentAgent?.uplineId) {
      const upline = await this.prisma.user.findUnique({
        where: { id: currentAgent.uplineId },
        select: { id: true, commissionRate: true, uplineId: true },
      });

      if (!upline) break;

      chain.push(upline);
      currentAgent = upline;

      // Safety limit
      if (chain.length >= 100) break;
    }

    return chain;
  }
}
