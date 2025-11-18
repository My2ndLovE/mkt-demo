import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { PrizeCalculator } from './prize-calculator.service';
import { IBoxValidator } from '../bets/validators/ibox.validator';
import { CreateDrawResultDto } from './dto/result.dto';

@Injectable()
export class ResultsService {
  constructor(
    private prisma: PrismaService,
    private providersService: ProvidersService,
    private prizeCalculator: PrizeCalculator,
    private iboxValidator: IBoxValidator
  ) {}

  async create(dto: CreateDrawResultDto, userId: number) {
    // Validate provider exists
    const provider = await this.providersService.findOne(dto.providerId);

    if (!provider.availableGames.includes(dto.gameType)) {
      throw new BadRequestException(
        `Provider ${provider.code} does not support ${dto.gameType}`
      );
    }

    // Generate unique draw number
    const drawDate = new Date(dto.drawDate);
    const drawNumber = `${provider.code}-${dto.gameType}-${drawDate.toISOString().split('T')[0].replace(/-/g, '')}`;

    // Check for duplicate
    const existing = await this.prisma.drawResult.findUnique({
      where: { drawNumber },
    });

    if (existing) {
      throw new BadRequestException(
        `Result already exists for ${provider.code} ${dto.gameType} on ${drawDate.toLocaleDateString()}`
      );
    }

    // Validate number uniqueness
    const allNumbers = [
      dto.firstPrize,
      dto.secondPrize,
      dto.thirdPrize,
      ...dto.starters,
      ...dto.consolations,
    ];
    const uniqueNumbers = new Set(allNumbers);
    if (allNumbers.length !== uniqueNumbers.size) {
      throw new BadRequestException('Duplicate numbers detected in results');
    }

    // Create result and process bets in transaction
    return await this.prisma.$transaction(async (tx) => {
      // 1. Create result
      const result = await tx.drawResult.create({
        data: {
          providerId: dto.providerId,
          gameType: dto.gameType,
          drawDate,
          drawNumber,
          firstPrize: dto.firstPrize,
          secondPrize: dto.secondPrize,
          thirdPrize: dto.thirdPrize,
          starters: JSON.stringify(dto.starters),
          consolations: JSON.stringify(dto.consolations),
          syncMethod: 'MANUAL',
          syncedBy: userId,
          status: 'FINAL',
        },
      });

      // 2. Find all pending bets for this draw
      const pendingBets = await tx.bet.findMany({
        where: {
          drawDate: {
            gte: new Date(drawDate.setHours(0, 0, 0, 0)),
            lte: new Date(drawDate.setHours(23, 59, 59, 999)),
          },
          status: 'PENDING',
          gameType: dto.gameType,
        },
      });

      // 3. Process each bet
      let processedCount = 0;
      for (const bet of pendingBets) {
        const providers = JSON.parse(bet.providers) as string[];

        // Only process if this provider is in the bet
        if (!providers.includes(provider.code)) {
          continue;
        }

        // Calculate win amount
        const betAmountPerProvider = Number(bet.amount) / providers.length;
        let win: { prizeCategory: string; winAmount: number } | null = null;

        if (bet.betType === 'IBOX') {
          const permutations = this.iboxValidator.generatePermutations(bet.numbers);
          win = this.prizeCalculator.calculateIBoxWin(
            bet.numbers,
            {
              firstPrize: result.firstPrize,
              secondPrize: result.secondPrize,
              thirdPrize: result.thirdPrize,
              starters: dto.starters,
              consolations: dto.consolations,
            },
            permutations,
            betAmountPerProvider
          );
        } else {
          win = this.prizeCalculator.calculateWinAmount(
            bet.numbers,
            bet.betType,
            {
              firstPrize: result.firstPrize,
              secondPrize: result.secondPrize,
              thirdPrize: result.thirdPrize,
              starters: dto.starters,
              consolations: dto.consolations,
            },
            betAmountPerProvider
          );
        }

        // Update bet results
        let existingResults = bet.results ? JSON.parse(bet.results) : [];
        existingResults = existingResults.filter(
          (r: { provider: string }) => r.provider !== provider.code
        );

        if (win) {
          existingResults.push({
            provider: provider.code,
            status: 'WON',
            winAmount: win.winAmount,
            prizeCategory: win.prizeCategory,
          });
        } else {
          existingResults.push({
            provider: provider.code,
            status: 'LOST',
            winAmount: 0,
          });
        }

        // Determine overall bet status
        const allProviderResults = providers.map((p) => {
          const providerResult = existingResults.find((r: { provider: string }) => r.provider === p);
          return providerResult ? providerResult.status : 'PENDING';
        });

        let betStatus = 'PENDING';
        if (allProviderResults.every((s) => s === 'WON' || s === 'LOST')) {
          betStatus = allProviderResults.some((s) => s === 'WON') ? 'WON' : 'LOST';
        } else if (allProviderResults.some((s) => s === 'WON' || s === 'LOST')) {
          betStatus = 'PARTIAL';
        }

        await tx.bet.update({
          where: { id: bet.id },
          data: {
            results: JSON.stringify(existingResults),
            status: betStatus,
          },
        });

        processedCount++;
      }

      // 4. Audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'RESULT_SYNCED',
          metadata: JSON.stringify({
            resultId: result.id,
            provider: provider.code,
            gameType: dto.gameType,
            drawDate: drawDate.toISOString(),
            processedBets: processedCount,
          }),
        },
      });

      return {
        ...this.formatResult(result, provider.name),
        processedBets: processedCount,
      };
    });
  }

  async findAll(filters?: { providerId?: string; gameType?: string; startDate?: string; endDate?: string }) {
    const where: Record<string, unknown> = {};

    if (filters?.providerId) {
      where.providerId = filters.providerId;
    }

    if (filters?.gameType) {
      where.gameType = filters.gameType;
    }

    if (filters?.startDate || filters?.endDate) {
      where.drawDate = {};
      if (filters.startDate) {
        (where.drawDate as Record<string, unknown>).gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        (where.drawDate as Record<string, unknown>).lte = new Date(filters.endDate);
      }
    }

    const results = await this.prisma.drawResult.findMany({
      where,
      include: {
        provider: {
          select: { name: true },
        },
      },
      orderBy: { drawDate: 'desc' },
      take: 50,
    });

    return results.map((r) => this.formatResult(r, r.provider.name));
  }

  async findOne(id: number) {
    const result = await this.prisma.drawResult.findUnique({
      where: { id },
      include: {
        provider: {
          select: { name: true },
        },
      },
    });

    if (!result) {
      throw new NotFoundException('Result not found');
    }

    return this.formatResult(result, result.provider.name);
  }

  private formatResult(
    result: {
      id: number;
      providerId: string;
      gameType: string;
      drawDate: Date;
      drawNumber: string;
      firstPrize: string;
      secondPrize: string;
      thirdPrize: string;
      starters: string;
      consolations: string;
      syncMethod: string;
      status: string;
      syncedAt: Date;
    },
    providerName: string
  ) {
    return {
      id: result.id,
      providerId: result.providerId,
      providerName,
      gameType: result.gameType,
      drawDate: result.drawDate,
      drawNumber: result.drawNumber,
      firstPrize: result.firstPrize,
      secondPrize: result.secondPrize,
      thirdPrize: result.thirdPrize,
      starters: JSON.parse(result.starters),
      consolations: JSON.parse(result.consolations),
      syncMethod: result.syncMethod,
      status: result.status,
      syncedAt: result.syncedAt,
    };
  }
}
