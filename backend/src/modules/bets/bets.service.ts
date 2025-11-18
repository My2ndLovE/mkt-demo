import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LimitsService } from '../limits/limits.service';
import { ProvidersService } from '../providers/providers.service';
import { BetNumberValidator } from './validators/bet-number.validator';
import { DrawCutoffValidator } from './validators/draw-cutoff.validator';
import { IBoxValidator } from './validators/ibox.validator';
import { CreateBetDto } from './dto/bet.dto';
import { nanoid } from 'nanoid';

@Injectable()
export class BetsService {
  constructor(
    private prisma: PrismaService,
    private limitsService: LimitsService,
    private providersService: ProvidersService,
    private betNumberValidator: BetNumberValidator,
    private drawCutoffValidator: DrawCutoffValidator,
    private iboxValidator: IBoxValidator
  ) {}

  async create(dto: CreateBetDto, userId: number) {
    // Validate bet number
    this.betNumberValidator.validate(dto.gameType, dto.numbers);

    // Validate iBox if applicable
    if (dto.betType === 'IBOX') {
      this.iboxValidator.validate(dto.numbers);
    }

    // FIX C-1: Batch load all providers to avoid N+1 query problem
    const providers = await this.prisma.serviceProvider.findMany({
      where: { code: { in: dto.providers } },
    });

    // Create lookup map for O(1) access
    const providerMap = new Map(providers.map((p) => [p.code, p]));

    // Validate all providers
    for (const providerCode of dto.providers) {
      const provider = providerMap.get(providerCode);

      if (!provider) {
        throw new BadRequestException(
          `Provider ${providerCode} not found. Available providers: ${providers.map((p) => p.code).join(', ')}`,
        );
      }

      if (!provider.active) {
        throw new BadRequestException(
          `Provider ${providerCode} is currently inactive. Please select an active provider.`,
        );
      }

      // Validate game type is supported by provider
      if (!provider.availableGames.includes(dto.gameType)) {
        throw new BadRequestException(
          `Provider ${providerCode} does not support ${dto.gameType}. Supported games: ${provider.availableGames.join(', ')}`,
        );
      }

      // Validate bet type is supported
      if (!provider.betTypes.includes(dto.betType)) {
        throw new BadRequestException(
          `Provider ${providerCode} does not support ${dto.betType}. Supported types: ${provider.betTypes.join(', ')}`,
        );
      }

      // Validate draw cutoff
      const drawDate = new Date(dto.drawDate);
      this.drawCutoffValidator.validate(drawDate, provider.drawSchedule);
    }

    // Calculate total amount (amount per provider × number of providers)
    const totalAmount = dto.amount * dto.providers.length;

    // Use transaction for atomic operations
    return await this.prisma.$transaction(async (tx) => {
      // 1. FIX H-1: Atomic check and deduct weekly limit to prevent race conditions
      await this.limitsService.checkAndDeduct(userId, totalAmount);

      // 2. Generate receipt number
      const receiptNumber = this.generateReceiptNumber(userId);

      // 3. Create bet
      const bet = await tx.bet.create({
        data: {
          agentId: userId,
          providers: JSON.stringify(dto.providers),
          gameType: dto.gameType,
          betType: dto.betType,
          numbers: dto.numbers,
          amount: totalAmount,
          drawDate: new Date(dto.drawDate),
          status: 'PENDING',
          receiptNumber,
        },
      });

      // 4. Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'BET_PLACED',
          metadata: JSON.stringify({
            betId: bet.id,
            providers: dto.providers,
            gameType: dto.gameType,
            betType: dto.betType,
            numbers: dto.numbers,
            amount: totalAmount,
            receiptNumber,
          }),
        },
      });

      return this.formatBet(bet);
    });
  }

  async findAll(userId: number, filters?: {
    status?: string;
    gameType?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: Record<string, unknown> = { agentId: userId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.gameType) {
      where.gameType = filters.gameType;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        (where.createdAt as Record<string, unknown>).lte = new Date(filters.endDate);
      }
    }

    const bets = await this.prisma.bet.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to recent 100 bets
    });

    return bets.map((bet) => this.formatBet(bet));
  }

  async findByReceipt(receiptNumber: string, userId: number) {
    const bet = await this.prisma.bet.findUnique({
      where: { receiptNumber },
    });

    if (!bet || bet.agentId !== userId) {
      throw new NotFoundException('Bet not found');
    }

    return this.formatBet(bet);
  }

  async cancel(receiptNumber: string, userId: number) {
    const bet = await this.prisma.bet.findUnique({
      where: { receiptNumber },
    });

    if (!bet || bet.agentId !== userId) {
      throw new NotFoundException('Bet not found');
    }

    if (bet.status !== 'PENDING') {
      throw new BadRequestException(`Cannot cancel bet with status: ${bet.status}`);
    }

    // Check if draw cutoff has passed
    const now = new Date();
    if (now >= bet.drawDate) {
      throw new BadRequestException('Cannot cancel bet after draw cutoff time');
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Update bet status
      const updatedBet = await tx.bet.update({
        where: { receiptNumber },
        data: { status: 'CANCELLED' },
      });

      // 2. Restore weekly limit
      await this.limitsService.restoreAmount(userId, Number(bet.amount));

      // 3. Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'BET_CANCELLED',
          metadata: JSON.stringify({
            betId: bet.id,
            receiptNumber,
            amount: Number(bet.amount),
          }),
        },
      });

      return this.formatBet(updatedBet);
    });
  }

  private generateReceiptNumber(userId: number): string {
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const random = nanoid(6);
    return `BET-${timestamp}-${userId}-${random}`;
  }

  private formatBet(bet: {
    id: number;
    providers: string;
    gameType: string;
    betType: string;
    numbers: string;
    amount: { toNumber: () => number } | number;
    drawDate: Date;
    status: string;
    results: string | null;
    receiptNumber: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: bet.id,
      providers: JSON.parse(bet.providers),
      gameType: bet.gameType,
      betType: bet.betType,
      numbers: bet.numbers,
      amount: typeof bet.amount === 'number' ? bet.amount : bet.amount.toNumber(),
      drawDate: bet.drawDate,
      status: bet.status,
      results: bet.results ? JSON.parse(bet.results) : null,
      receiptNumber: bet.receiptNumber,
      createdAt: bet.createdAt,
      updatedAt: bet.updatedAt,
    };
  }
}
