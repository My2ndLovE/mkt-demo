import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LimitsService } from '../limits/limits.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/dtos';
import { Prisma } from '@prisma/client';
import {
  PlaceBetDto,
  CreateBetResponseDto,
  QueryBetDto,
  BetListResponseDto,
  BetDetailsDto,
} from './dtos';

/**
 * Bets Service
 *
 * Handles lottery betting operations (T051-T073, T220, T249-T254, T276-T289, T310-T311, T330, T337)
 *
 * Core Features:
 * - Bet placement with multi-provider support (OPTION A)
 * - Receipt number generation
 * - Limit checking and deduction
 * - Bet cancellation and refund
 * - Bet history and filtering
 *
 * Business Rules:
 * 1. All validations must pass before bet placement
 * 2. Providers must exist and be active
 * 3. Game type must be supported by all selected providers
 * 4. Bet amount must be within weekly limits
 * 5. Draw date must be in the future
 * 6. Receipt numbers are unique (format: YYYYMMDD-AGENTID-NNNN)
 * 7. Bets can only be cancelled if PENDING and draw hasn't occurred
 * 8. All operations are atomic (transactions)
 */
@Injectable()
export class BetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly limitsService: LimitsService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Place a bet (T056-T060, OPTION A)
   *
   * Implements the complete bet placement flow:
   * 1. Validate providers (exist, active, support game type)
   * 2. Calculate total amount
   * 3. Check limits
   * 4. Create bet and bet-provider records in transaction
   * 5. Deduct from weekly limit
   * 6. Generate receipt
   * 7. Audit log
   *
   * @param agentId - ID of agent placing the bet
   * @param dto - Bet placement data
   * @returns Bet receipt with details
   * @throws NotFoundException if providers not found
   * @throws BadRequestException if validation fails
   * @throws ForbiddenException if limits exceeded
   */
  async placeBet(agentId: number, dto: PlaceBetDto): Promise<CreateBetResponseDto> {
    // 1. Validate providers (T249-T252)
    await this.validateProviders(dto.providerIds, dto.gameType);

    // 2. Calculate total amount
    const totalAmount = dto.amountPerProvider * dto.providerIds.length;

    // 3. Check limits (T055)
    const limitCheck = await this.limitsService.checkLimit(agentId, totalAmount);
    if (!limitCheck.allowed) {
      throw new ForbiddenException(`Weekly limit exceeded. ${limitCheck.message}`);
    }

    // 4. Start transaction for atomic bet creation
    const bet = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 4a. Generate receipt number
      const receiptNumber = await this.generateReceiptNumber(agentId, tx);

      // 4b. Create Bet record (T056)
      const createdBet = await tx.bet.create({
        data: {
          agentId,
          gameType: dto.gameType,
          betType: dto.betType,
          numbers: dto.numbers,
          amount: totalAmount,
          drawDate: new Date(dto.drawDate),
          receiptNumber,
          status: 'PENDING',
          winAmount: 0,
        },
      });

      // 4c. Create BetProvider records (OPTION A - T057-T058)
      await tx.betProvider.createMany({
        data: dto.providerIds.map((providerId) => ({
          betId: createdBet.id,
          providerId,
          amount: dto.amountPerProvider,
          status: 'PENDING',
          winAmount: 0,
        })),
      });

      // 4d. Deduct from weekly limit (T059)
      const user = await tx.user.findUnique({
        where: { id: agentId },
        select: { weeklyUsed: true, weeklyLimit: true },
      });

      if (!user) {
        throw new NotFoundException(`User with ID '${agentId}' not found`);
      }

      const newWeeklyUsed = Number(user.weeklyUsed) + totalAmount;
      const weeklyLimit = Number(user.weeklyLimit);

      if (newWeeklyUsed > weeklyLimit) {
        throw new BadRequestException(
          `Bet amount exceeds weekly limit. Remaining: ${(weeklyLimit - Number(user.weeklyUsed)).toFixed(2)}`,
        );
      }

      await tx.user.update({
        where: { id: agentId },
        data: { weeklyUsed: newWeeklyUsed },
      });

      // 4e. Audit log (T060)
      await this.auditService.log(AuditAction.BET_PLACED, agentId, {
        betId: createdBet.id,
        receiptNumber: createdBet.receiptNumber,
        gameType: dto.gameType,
        betType: dto.betType,
        numbers: dto.numbers,
        totalAmount,
        providers: dto.providerIds,
      });

      return createdBet;
    });

    // 5. Fetch complete bet details with providers
    const betDetails = await this.findOne(bet.id, agentId);

    // 6. Get updated limits
    const limits = await this.limitsService.getMyLimits(agentId);

    // 7. Return receipt (T061)
    return {
      receiptNumber: bet.receiptNumber,
      bet: betDetails,
      limits: {
        weeklyLimit: limits.weeklyLimit,
        weeklyUsed: limits.weeklyUsed,
        remaining: limits.weeklyRemaining,
      },
    };
  }

  /**
   * Cancel a bet (T062-T064)
   *
   * Cancels a pending bet and refunds the weekly limit.
   *
   * @param betId - Bet ID
   * @param agentId - Agent ID (for authorization)
   * @returns Updated bet details
   * @throws NotFoundException if bet not found
   * @throws ForbiddenException if not authorized
   * @throws BadRequestException if bet cannot be cancelled
   */
  async cancelBet(betId: number, agentId: number): Promise<BetDetailsDto> {
    const bet = await this.prisma.bet.findUnique({
      where: { id: betId },
      include: {
        agent: { select: { id: true, moderatorId: true } },
      },
    });

    // Validation
    if (!bet) {
      throw new NotFoundException(`Bet with ID '${betId}' not found`);
    }

    if (bet.agentId !== agentId) {
      throw new ForbiddenException('You can only cancel your own bets');
    }

    if (bet.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot cancel bet with status '${bet.status}'. Only PENDING bets can be cancelled.`,
      );
    }

    if (new Date(bet.drawDate) < new Date()) {
      throw new BadRequestException('Cannot cancel bet after draw date has passed');
    }

    // Cancel bet and refund limit in transaction
    const cancelledBet = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update bet status
      const updated = await tx.bet.update({
        where: { id: betId },
        data: { status: 'CANCELLED' },
      });

      // Update bet provider statuses
      await tx.betProvider.updateMany({
        where: { betId },
        data: { status: 'CANCELLED' },
      });

      // Refund limit
      const user = await tx.user.findUnique({
        where: { id: agentId },
        select: { weeklyUsed: true },
      });

      if (user) {
        const newWeeklyUsed = Math.max(0, Number(user.weeklyUsed) - Number(bet.amount));

        await tx.user.update({
          where: { id: agentId },
          data: { weeklyUsed: newWeeklyUsed },
        });
      }

      // Audit log
      await this.auditService.log(AuditAction.BET_CANCELLED, agentId, {
        betId,
        receiptNumber: bet.receiptNumber,
        refundAmount: Number(bet.amount),
      });

      return updated;
    });

    return this.findOne(cancelledBet.id, agentId);
  }

  /**
   * Get all bets with filtering and pagination
   *
   * Agents see only their own bets.
   * Moderators see all bets under their organization.
   *
   * @param agentId - Agent ID
   * @param query - Query parameters
   * @param role - User role (for authorization)
   * @returns Paginated bet list
   */
  async findAll(
    agentId: number,
    query: QueryBetDto,
    role: string,
  ): Promise<BetListResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Role-based filtering
    if (role === 'MODERATOR') {
      // Moderators see all bets in their organization
      where.agent = { moderatorId: agentId };
    } else if (role === 'AGENT') {
      // Agents see only their own bets
      where.agentId = agentId;
    } else if (role === 'ADMIN') {
      // Admins see all bets (no filter)
    }

    // Status filter
    if (query.status) {
      where.status = query.status;
    }

    // Game type filter
    if (query.gameType) {
      where.gameType = query.gameType;
    }

    // Date range filter
    if (query.startDate || query.endDate) {
      where.drawDate = {};
      if (query.startDate) {
        where.drawDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const endDate = new Date(query.endDate);
        endDate.setHours(23, 59, 59, 999);
        where.drawDate.lte = endDate;
      }
    }

    // Get total count
    const total = await this.prisma.bet.count({ where });

    // Get bets
    const bets = await this.prisma.bet.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        providers: {
          include: {
            provider: { select: { name: true, code: true } },
          },
        },
      },
    });

    return {
      data: bets.map((bet: any) => ({
        id: bet.id,
        receiptNumber: bet.receiptNumber,
        gameType: bet.gameType,
        betType: bet.betType,
        numbers: bet.numbers,
        amount: Number(bet.amount),
        drawDate: bet.drawDate.toISOString().split('T')[0],
        status: bet.status,
        winAmount: Number(bet.winAmount),
        providerCount: bet.providers.length,
        createdAt: bet.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single bet by ID
   *
   * @param betId - Bet ID
   * @param agentId - Agent ID (for authorization)
   * @returns Bet details
   * @throws NotFoundException if bet not found
   * @throws ForbiddenException if not authorized
   */
  async findOne(betId: number, agentId: number): Promise<BetDetailsDto> {
    const bet = await this.prisma.bet.findUnique({
      where: { id: betId },
      include: {
        providers: {
          include: {
            provider: { select: { id: true, name: true, code: true } },
          },
        },
        agent: { select: { id: true, moderatorId: true } },
      },
    });

    if (!bet) {
      throw new NotFoundException(`Bet with ID '${betId}' not found`);
    }

    // Authorization check
    if (bet.agentId !== agentId) {
      throw new ForbiddenException('You can only view your own bets');
    }

    return {
      id: bet.id,
      gameType: bet.gameType,
      betType: bet.betType,
      numbers: bet.numbers,
      totalAmount: Number(bet.amount),
      drawDate: bet.drawDate.toISOString().split('T')[0],
      status: bet.status,
      winAmount: Number(bet.winAmount),
      providers: bet.providers.map((bp: any) => ({
        providerId: bp.providerId,
        providerName: bp.provider.name,
        amount: Number(bet.amount) / bet.providers.length,
        status: bp.status,
        winAmount: Number(bp.winAmount),
      })),
      createdAt: bet.createdAt,
    };
  }

  /**
   * Get a bet by receipt number
   *
   * @param receiptNumber - Receipt number
   * @param agentId - Agent ID (for authorization)
   * @returns Bet details
   * @throws NotFoundException if bet not found
   * @throws ForbiddenException if not authorized
   */
  async findByReceipt(receiptNumber: string, agentId: number): Promise<BetDetailsDto> {
    const bet = await this.prisma.bet.findUnique({
      where: { receiptNumber },
      include: {
        providers: {
          include: {
            provider: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    if (!bet) {
      throw new NotFoundException(`Bet with receipt number '${receiptNumber}' not found`);
    }

    // Authorization check
    if (bet.agentId !== agentId) {
      throw new ForbiddenException('You can only view your own bets');
    }

    return {
      id: bet.id,
      gameType: bet.gameType,
      betType: bet.betType,
      numbers: bet.numbers,
      totalAmount: Number(bet.amount),
      drawDate: bet.drawDate.toISOString().split('T')[0],
      status: bet.status,
      winAmount: Number(bet.winAmount),
      providers: bet.providers.map((bp: any) => ({
        providerId: bp.providerId,
        providerName: bp.provider.name,
        amount: Number(bet.amount) / bet.providers.length,
        status: bp.status,
        winAmount: Number(bp.winAmount),
      })),
      createdAt: bet.createdAt,
    };
  }

  /**
   * Validate providers (T249-T252)
   *
   * Validates that:
   * 1. All provider IDs exist
   * 2. All providers are active
   * 3. All providers support the specified game type
   *
   * @param providerIds - Array of provider IDs
   * @param gameType - Game type to validate
   * @throws NotFoundException if any provider not found
   * @throws BadRequestException if validation fails
   * @private
   */
  private async validateProviders(providerIds: string[], gameType: string): Promise<void> {
    // Fetch all providers in a single query
    const providers = await this.prisma.serviceProvider.findMany({
      where: { id: { in: providerIds } },
    });

    // Check if all providers were found
    if (providers.length !== providerIds.length) {
      const foundIds = providers.map((p: any) => p.id);
      const missingIds = providerIds.filter((id: string) => !foundIds.includes(id));
      throw new NotFoundException(`Providers not found: ${missingIds.join(', ')}`);
    }

    // Check if all providers are active
    const inactiveProviders = providers.filter((p: any) => !p.active);
    if (inactiveProviders.length > 0) {
      throw new BadRequestException(
        `Inactive providers: ${inactiveProviders.map((p: any) => p.name).join(', ')}`,
      );
    }

    // Check if all providers support the game type
    const unsupportedProviders = providers.filter((p: any) => {
      const availableGames = JSON.parse(p.availableGames);
      return !availableGames.includes(gameType);
    });

    if (unsupportedProviders.length > 0) {
      throw new BadRequestException(
        `Game type '${gameType}' not supported by: ${unsupportedProviders.map((p: any) => p.name).join(', ')}`,
      );
    }
  }

  /**
   * Generate unique receipt number (T056)
   *
   * Format: YYYYMMDD-AGENTID-NNNN
   * Example: 20251118-00001-0001
   *
   * The sequence number is based on the number of bets placed today by this agent.
   * Includes retry logic to handle race conditions when multiple concurrent bets
   * are placed by the same agent.
   *
   * @param agentId - Agent ID
   * @param tx - Prisma transaction client (optional)
   * @returns Receipt number
   * @private
   */
  private async generateReceiptNumber(
    agentId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<string> {
    const prisma = tx || this.prisma;

    // Retry up to 5 times with random offset to handle race conditions
    const maxRetries = 5;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // Get current date in YYYYMMDD format
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const datePart = `${year}${month}${day}`;

      // Get agent ID part (5 digits, padded)
      const agentPart = String(agentId).padStart(5, '0');

      // Get count of bets today for this agent
      const todayStart = new Date(year, now.getMonth(), now.getDate());
      const todayEnd = new Date(year, now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const count = await prisma.bet.count({
        where: {
          agentId,
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      });

      // Generate sequence number (4 digits, padded)
      // Add attempt number to avoid collisions on retry
      const sequence = String(count + 1 + attempt).padStart(4, '0');
      const receiptNumber = `${datePart}-${agentPart}-${sequence}`;

      // Check if this receipt number already exists
      const existing = await prisma.bet.findUnique({
        where: { receiptNumber },
      });

      if (!existing) {
        return receiptNumber;
      }

      // If receipt exists and this is not the last attempt, wait a random time before retry
      if (attempt < maxRetries - 1) {
        // Random delay between 10-50ms to reduce collision probability
        const delay = Math.floor(Math.random() * 40) + 10;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Fallback: Use timestamp-based suffix if all retries failed
    const timestamp = Date.now().toString().slice(-4);
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const agentPart = String(agentId).padStart(5, '0');
    return `${datePart}-${agentPart}-${timestamp}`;
  }
}
