import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CreateBetDto } from './dto/create-bet.dto';
import { QueryBetsDto } from './dto/query-bets.dto';
import { createPaginatedResponse, PaginatedResponse } from '../../common/dto/pagination.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class BetsService {
  private readonly logger = new Logger(BetsService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Place a new bet
   * Validates weekly limit and creates bet record
   */
  async placeBet(userId: number, dto: CreateBetDto) {
    this.logger.log(`User ${userId} attempting to place bet`);

    // Calculate total bet amount
    const totalAmount = new Decimal(dto.amountPerProvider).mul(dto.providerIds.length);

    // Verify provider exists and is active (outside transaction for early validation)
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: dto.providerId },
    });

    if (!provider) {
      throw new NotFoundException('Service provider not found');
    }

    if (!provider.active) {
      throw new BadRequestException('Service provider is inactive');
    }

    // Create bet and update weekly usage in transaction
    // CRITICAL: Weekly limit check is inside transaction to prevent race conditions
    const bet = await this.prisma.$transaction(async (tx) => {
      // Get user with FOR UPDATE lock to prevent race conditions
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          role: true,
          weeklyLimit: true,
          weeklyUsed: true,
          moderatorId: true,
          active: true,
          fullName: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.active) {
        throw new ForbiddenException('Account is inactive');
      }

      // Check weekly limit (only for AGENT and MODERATOR roles)
      if (user.role === 'AGENT' || user.role === 'MODERATOR') {
        const newWeeklyUsed = new Decimal(user.weeklyUsed).add(totalAmount);

        if (newWeeklyUsed.greaterThan(user.weeklyLimit)) {
          const remaining = new Decimal(user.weeklyLimit).sub(user.weeklyUsed);
          throw new BadRequestException(
            `Insufficient weekly limit. Remaining: RM ${remaining.toFixed(2)}, Required: RM ${totalAmount.toFixed(2)}`,
          );
        }
      }

      // Create bet
      const newBet = await tx.bet.create({
        data: {
          userId,
          providerId: dto.providerId,
          providerIds: JSON.stringify(dto.providerIds),
          betNumber: dto.betNumber,
          betType: dto.betType,
          amountPerProvider: dto.amountPerProvider,
          totalAmount: totalAmount.toNumber(),
          drawDate: dto.drawDate ? new Date(dto.drawDate) : null,
          status: 'PENDING',
          moderatorId: user.moderatorId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
          provider: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      // Update weekly usage (only for AGENT and MODERATOR)
      if (user.role === 'AGENT' || user.role === 'MODERATOR') {
        await tx.user.update({
          where: { id: userId },
          data: {
            weeklyUsed: {
              increment: totalAmount.toNumber(),
            },
          },
        });
      }

      return { bet: newBet, moderatorId: user.moderatorId };
    });

    // Audit log (after transaction completes)
    await this.auditService.logBetPlaced(
      userId,
      bet.bet.id,
      {
        betNumber: dto.betNumber,
        betType: dto.betType,
        providers: dto.providerIds,
        totalAmount: totalAmount.toNumber(),
      },
      bet.moderatorId,
    );

    this.logger.log(`✅ Bet ${bet.bet.id} placed successfully by user ${userId}`);

    return {
      ...bet.bet,
      providerIds: JSON.parse(bet.bet.providerIds),
    };
  }

  /**
   * Cancel a pending bet
   * Only PENDING bets can be cancelled
   */
  async cancelBet(userId: number, betId: number, userRole: string) {
    this.logger.log(`User ${userId} attempting to cancel bet ${betId}`);

    // Get bet
    const bet = await this.prisma.bet.findUnique({
      where: { id: betId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!bet) {
      throw new NotFoundException('Bet not found');
    }

    // Only owner can cancel their bet (unless admin)
    if (bet.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only cancel your own bets');
    }

    // Only PENDING bets can be cancelled
    if (bet.status !== 'PENDING') {
      throw new BadRequestException(`Cannot cancel bet with status: ${bet.status}`);
    }

    // Cancel bet and refund weekly usage in transaction
    const cancelledBet = await this.prisma.$transaction(async (tx) => {
      // Update bet status
      const updated = await tx.bet.update({
        where: { id: betId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              role: true,
            },
          },
          provider: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      // Refund weekly usage (only for AGENT and MODERATOR)
      // CRITICAL: Prevent negative weeklyUsed values
      if (updated.user.role === 'AGENT' || updated.user.role === 'MODERATOR') {
        const currentUser = await tx.user.findUnique({
          where: { id: bet.userId },
          select: { weeklyUsed: true },
        });

        const newWeeklyUsed = Math.max(
          0,
          new Decimal(currentUser.weeklyUsed).sub(bet.totalAmount).toNumber(),
        );

        await tx.user.update({
          where: { id: bet.userId },
          data: {
            weeklyUsed: newWeeklyUsed,
          },
        });
      }

      return updated;
    });

    // Audit log
    await this.auditService.logBetCancelled(
      userId,
      betId,
      {
        betNumber: bet.betNumber,
        totalAmount: bet.totalAmount,
        refunded: true,
      },
      bet.moderatorId,
    );

    this.logger.log(`✅ Bet ${betId} cancelled successfully by user ${userId}`);

    return {
      ...cancelledBet,
      providerIds: JSON.parse(cancelledBet.providerIds),
    };
  }

  /**
   * Query bets with pagination and filters
   * Row-level security is applied via Prisma middleware
   */
  async queryBets(
    userId: number,
    userRole: string,
    dto: QueryBetsDto,
  ): Promise<PaginatedResponse<any>> {
    this.logger.log(`User ${userId} querying bets`);

    const { page = 1, limit = 10, status, betNumber, drawDate, userId: filterUserId, providerId } = dto;

    // Build where clause
    const where: any = {};

    // Role-based filtering
    if (userRole === 'AGENT') {
      // Agents can only see their own bets
      where.userId = userId;
    } else if (userRole === 'MODERATOR') {
      // Moderators can see bets from their downline (handled by RLS middleware)
      if (filterUserId) {
        where.userId = filterUserId;
      }
    } else if (userRole === 'ADMIN') {
      // Admins can see all bets
      if (filterUserId) {
        where.userId = filterUserId;
      }
    }

    // Apply filters
    if (status) {
      where.status = status;
    }

    if (betNumber) {
      where.betNumber = {
        contains: betNumber,
      };
    }

    if (drawDate) {
      where.drawDate = new Date(drawDate);
    }

    if (providerId) {
      where.providerId = providerId;
    }

    // Get total count
    const total = await this.prisma.bet.count({ where });

    // Get paginated bets
    const bets = await this.prisma.bet.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        provider: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Parse providerIds JSON
    const betsWithParsedProviders = bets.map((bet) => ({
      ...bet,
      providerIds: JSON.parse(bet.providerIds),
    }));

    return createPaginatedResponse(betsWithParsedProviders, total, page, limit);
  }

  /**
   * Get bet by ID
   */
  async getBetById(userId: number, userRole: string, betId: number) {
    const bet = await this.prisma.bet.findUnique({
      where: { id: betId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        provider: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!bet) {
      throw new NotFoundException('Bet not found');
    }

    // Check permissions
    if (userRole === 'AGENT' && bet.userId !== userId) {
      throw new ForbiddenException('You can only view your own bets');
    }

    return {
      ...bet,
      providerIds: JSON.parse(bet.providerIds),
    };
  }
}
