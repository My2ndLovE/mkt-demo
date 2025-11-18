import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CreateResultDto } from './dto/create-result.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { QueryResultsDto } from './dto/query-results.dto';
import { createPaginatedResponse, PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class ResultsService {
  private readonly logger = new Logger(ResultsService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Create a new draw result (ADMIN only)
   */
  async create(userId: number, dto: CreateResultDto) {
    this.logger.log(`Creating draw result for provider ${dto.providerId}`);

    // Verify provider exists
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: dto.providerId },
    });

    if (!provider) {
      throw new NotFoundException('Service provider not found');
    }

    // Check if result already exists
    const existing = await this.prisma.drawResult.findUnique({
      where: {
        providerId_drawNumber: {
          providerId: dto.providerId,
          drawNumber: dto.drawNumber,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Draw result already exists for provider ${provider.name}, draw ${dto.drawNumber}`,
      );
    }

    // Create draw result
    const result = await this.prisma.drawResult.create({
      data: {
        providerId: dto.providerId,
        drawNumber: dto.drawNumber,
        drawDate: new Date(dto.drawDate),
        winningNumbers: dto.winningNumbers,
        specialNumbers: dto.specialNumbers || null,
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Audit log
    await this.auditService.logDrawResult(userId, result.id, 'CREATED', {
      provider: provider.name,
      drawNumber: dto.drawNumber,
      drawDate: dto.drawDate,
    });

    this.logger.log(`✅ Draw result ${result.id} created successfully`);

    // Process bets for this draw (determine win/loss)
    await this.processBetsForDraw(result.id);

    return result;
  }

  /**
   * Query draw results with pagination and filters
   */
  async findAll(dto: QueryResultsDto): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10, providerId, drawNumber, drawDate, fromDate, toDate } = dto;

    // Build where clause
    const where: any = {};

    if (providerId) {
      where.providerId = providerId;
    }

    if (drawNumber) {
      where.drawNumber = {
        contains: drawNumber,
      };
    }

    if (drawDate) {
      where.drawDate = new Date(drawDate);
    }

    if (fromDate || toDate) {
      where.drawDate = {
        ...(fromDate && { gte: new Date(fromDate) }),
        ...(toDate && { lte: new Date(toDate) }),
      };
    }

    // Get total count
    const total = await this.prisma.drawResult.count({ where });

    // Get paginated results
    const results = await this.prisma.drawResult.findMany({
      where,
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        drawDate: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return createPaginatedResponse(results, total, page, limit);
  }

  /**
   * Get draw result by ID
   */
  async findOne(id: number) {
    const result = await this.prisma.drawResult.findUnique({
      where: { id },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!result) {
      throw new NotFoundException('Draw result not found');
    }

    return result;
  }

  /**
   * Update draw result (ADMIN only)
   */
  async update(userId: number, id: number, dto: UpdateResultDto) {
    this.logger.log(`Updating draw result ${id}`);

    // Check if result exists
    const existing = await this.prisma.drawResult.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Draw result not found');
    }

    // Update draw result
    const result = await this.prisma.drawResult.update({
      where: { id },
      data: {
        ...(dto.drawDate && { drawDate: new Date(dto.drawDate) }),
        ...(dto.winningNumbers && { winningNumbers: dto.winningNumbers }),
        ...(dto.specialNumbers !== undefined && { specialNumbers: dto.specialNumbers }),
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Audit log
    await this.auditService.logDrawResult(userId, result.id, 'UPDATED', {
      changes: dto,
    });

    this.logger.log(`✅ Draw result ${id} updated successfully`);

    // Reprocess bets for this draw
    await this.processBetsForDraw(id);

    return result;
  }

  /**
   * Delete draw result (ADMIN only)
   */
  async remove(userId: number, id: number) {
    this.logger.log(`Deleting draw result ${id}`);

    // Check if result exists
    const existing = await this.prisma.drawResult.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Draw result not found');
    }

    // Delete draw result (will also reset bet statuses)
    await this.prisma.drawResult.delete({
      where: { id },
    });

    this.logger.log(`✅ Draw result ${id} deleted successfully`);

    return {
      message: 'Draw result deleted successfully',
    };
  }

  /**
   * Process all pending bets for a specific draw result
   * Determines win/loss and triggers commission calculation
   */
  private async processBetsForDraw(drawResultId: number) {
    this.logger.log(`Processing bets for draw result ${drawResultId}`);

    // Get draw result
    const drawResult = await this.prisma.drawResult.findUnique({
      where: { id: drawResultId },
    });

    if (!drawResult) {
      return;
    }

    // Parse winning numbers
    const winningNumbers = drawResult.winningNumbers.split(',').map((n) => n.trim());
    const specialNumbers = drawResult.specialNumbers
      ? drawResult.specialNumbers.split(',').map((n) => n.trim())
      : [];

    // Get all PENDING bets for this provider and draw date
    const pendingBets = await this.prisma.bet.findMany({
      where: {
        providerId: drawResult.providerId,
        drawDate: drawResult.drawDate,
        status: 'PENDING',
      },
    });

    this.logger.log(`Found ${pendingBets.length} pending bets to process`);

    // Process each bet
    for (const bet of pendingBets) {
      const isWin = this.checkBetWin(bet.betNumber, bet.betType, winningNumbers, specialNumbers);

      // Update bet status
      await this.prisma.bet.update({
        where: { id: bet.id },
        data: {
          status: isWin ? 'WON' : 'LOST',
          resultId: drawResult.id,
        },
      });

      // If bet won, calculate commissions
      if (isWin) {
        await this.calculateCommissionsForBet(bet.id);
      }
    }

    this.logger.log(`✅ Processed ${pendingBets.length} bets for draw ${drawResult.drawNumber}`);
  }

  /**
   * Check if a bet wins based on bet number, type, and draw results
   */
  private checkBetWin(
    betNumber: string,
    betType: string,
    winningNumbers: string[],
    specialNumbers: string[],
  ): boolean {
    // Simple straight match logic (can be extended for different bet types)
    if (betType === 'STRAIGHT') {
      // Check if bet number matches any winning or special number
      return winningNumbers.includes(betNumber) || specialNumbers.includes(betNumber);
    }

    // Add more bet type logic here (BOX, PERMUTATION, etc.)
    // For now, default to false for unknown types
    return false;
  }

  /**
   * Calculate commissions for a winning bet
   * Creates commission records for entire upline hierarchy
   */
  private async calculateCommissionsForBet(betId: number) {
    this.logger.log(`Calculating commissions for bet ${betId}`);

    // Get bet with user details
    const bet = await this.prisma.bet.findUnique({
      where: { id: betId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            uplineId: true,
            commissionRate: true,
          },
        },
      },
    });

    if (!bet) {
      return;
    }

    // Calculate commission for entire upline hierarchy using recursive CTE
    const uplineWithRates = await this.prisma.$queryRaw<any[]>`
      WITH RECURSIVE UplineTree AS (
        -- Base case: bet owner
        SELECT
          id, username, uplineId, commissionRate, 0 as level
        FROM [User]
        WHERE id = ${bet.userId}

        UNION ALL

        -- Recursive case: get uplines
        SELECT
          u.id, u.username, u.uplineId, u.commissionRate, ut.level + 1
        FROM [User] u
        INNER JOIN UplineTree ut ON u.id = ut.uplineId
        WHERE u.active = 1
      )
      SELECT id, username, commissionRate, level
      FROM UplineTree
      WHERE level > 0
      ORDER BY level
    `;

    // Create commission records for each upline
    const winAmount = bet.totalAmount * 90; // Example: 90x payout for 4D straight win
    const commissionRecords = uplineWithRates.map((upline) => ({
      betId: bet.id,
      userId: upline.id,
      commissionRate: upline.commissionRate,
      commissionAmount: (winAmount * upline.commissionRate) / 100,
      moderatorId: bet.moderatorId,
    }));

    if (commissionRecords.length > 0) {
      await this.prisma.commission.createMany({
        data: commissionRecords,
      });

      this.logger.log(`✅ Created ${commissionRecords.length} commission records for bet ${betId}`);
    }
  }
}
