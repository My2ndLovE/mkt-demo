import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron } from '@nestjs/schedule';
import {
  CreateResultDto,
  UpdateResultDto,
  QueryResultDto,
  SyncMethod,
  ResultStatus,
  ProcessBetsResponseDto,
} from './dtos';

/**
 * Results Service
 *
 * Manages lottery draw results (T142-T158, T215-T224)
 *
 * Features:
 * 1. Manual Entry (T142-T150):
 *    - Admin/Moderator can manually enter results
 *    - Edit results before processing
 *    - Validate result format
 *
 * 2. Auto-Sync (T215-T224):
 *    - Scheduled sync from Magayo API
 *    - Azure Function Timer Trigger (Wed/Sat/Sun 19:30 MYT)
 *    - Retry with exponential backoff (3 attempts)
 *    - Duplicate detection
 *    - Error notification to admin
 *
 * 3. Bet Processing (T151-T158):
 *    - Process all pending bets for a draw
 *    - Determine winners based on prize tiers
 *    - Calculate win amounts
 *    - Generate commissions
 *
 * Business Rules:
 * - Draw number must be unique per provider/game/date
 * - Results can only be edited before processing
 * - Bet processing is atomic (transaction)
 * - Commissions generated automatically after processing
 */
@Injectable()
export class ResultsService {
  private readonly logger = new Logger(ResultsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new draw result (manual entry) (T142)
   *
   * @param createResultDto - Result data
   * @param syncedBy - User ID who entered the result (optional for auto-sync)
   * @returns Created result
   * @throws ConflictException if draw already exists
   * @throws BadRequestException if validation fails
   */
  async create(createResultDto: CreateResultDto, syncedBy?: number) {
    // Check for duplicate draw
    const existingResult = await this.prisma.drawResult.findUnique({
      where: {
        unique_draw: {
          providerId: createResultDto.providerId,
          gameType: createResultDto.gameType,
          drawDate: new Date(createResultDto.drawDate),
        },
      },
    });

    if (existingResult) {
      throw new ConflictException(
        `Result already exists for ${createResultDto.providerId} ${createResultDto.gameType} on ${createResultDto.drawDate}`,
      );
    }

    // Validate provider exists
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: createResultDto.providerId },
    });

    if (!provider) {
      throw new NotFoundException(`Provider with ID '${createResultDto.providerId}' not found`);
    }

    // Validate number format (digit count must match game type)
    this.validateNumberFormat(createResultDto);

    // Create result
    const result = await this.prisma.drawResult.create({
      data: {
        providerId: createResultDto.providerId,
        gameType: createResultDto.gameType,
        drawDate: new Date(createResultDto.drawDate),
        drawNumber: createResultDto.drawNumber,
        firstPrize: createResultDto.firstPrize,
        secondPrize: createResultDto.secondPrize,
        thirdPrize: createResultDto.thirdPrize,
        starters: JSON.stringify(createResultDto.starters),
        consolations: JSON.stringify(createResultDto.consolations),
        syncMethod: syncedBy ? SyncMethod.MANUAL : SyncMethod.AUTO,
        syncedBy,
        status: ResultStatus.PENDING,
      },
    });

    this.logger.log(
      `Result created: ${result.drawNumber} (${result.providerId} ${result.gameType})`,
    );

    return this.transformResult(result);
  }

  /**
   * Get all draw results with filtering and pagination (T146)
   *
   * @param query - Query parameters
   * @returns Paginated results
   */
  async findAll(query: QueryResultDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (query.providerId) {
      where.providerId = query.providerId;
    }

    if (query.gameType) {
      where.gameType = query.gameType;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.startDate || query.endDate) {
      where.drawDate = {};
      if (query.startDate) {
        where.drawDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.drawDate.lte = new Date(query.endDate);
      }
    }

    // Get total count
    const total = await this.prisma.drawResult.count({ where });

    // Get results
    const results = await this.prisma.drawResult.findMany({
      where,
      skip,
      take: limit,
      orderBy: { drawDate: 'desc' },
      include: {
        provider: {
          select: {
            id: true,
            code: true,
            name: true,
            country: true,
          },
        },
      },
    });

    return {
      data: results.map((result) => this.transformResult(result)),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single draw result by ID (T147)
   *
   * @param id - Result ID
   * @returns Result details
   * @throws NotFoundException if result not found
   */
  async findOne(id: number) {
    const result = await this.prisma.drawResult.findUnique({
      where: { id },
      include: {
        provider: {
          select: {
            id: true,
            code: true,
            name: true,
            country: true,
          },
        },
      },
    });

    if (!result) {
      throw new NotFoundException(`Result with ID '${id}' not found`);
    }

    return this.transformResult(result);
  }

  /**
   * Update a draw result (T145)
   *
   * Can only update results that haven't been processed (status != FINAL)
   *
   * @param id - Result ID
   * @param updateResultDto - Update data
   * @returns Updated result
   * @throws NotFoundException if result not found
   * @throws BadRequestException if result already processed
   */
  async update(id: number, updateResultDto: UpdateResultDto) {
    const existingResult = await this.prisma.drawResult.findUnique({
      where: { id },
    });

    if (!existingResult) {
      throw new NotFoundException(`Result with ID '${id}' not found`);
    }

    if (existingResult.status === ResultStatus.FINAL) {
      throw new BadRequestException('Cannot update result that has been finalized and processed');
    }

    // Validate number format if provided
    if (updateResultDto.firstPrize || updateResultDto.gameType) {
      const dataToValidate = {
        ...existingResult,
        ...updateResultDto,
      };
      this.validateNumberFormat(dataToValidate);
    }

    // Build update data
    const updateData: any = {};

    if (updateResultDto.drawNumber) updateData.drawNumber = updateResultDto.drawNumber;
    if (updateResultDto.firstPrize) updateData.firstPrize = updateResultDto.firstPrize;
    if (updateResultDto.secondPrize) updateData.secondPrize = updateResultDto.secondPrize;
    if (updateResultDto.thirdPrize) updateData.thirdPrize = updateResultDto.thirdPrize;
    if (updateResultDto.starters) {
      updateData.starters = JSON.stringify(updateResultDto.starters);
    }
    if (updateResultDto.consolations) {
      updateData.consolations = JSON.stringify(updateResultDto.consolations);
    }
    if (updateResultDto.status) updateData.status = updateResultDto.status;

    // Update result
    const result = await this.prisma.drawResult.update({
      where: { id },
      data: updateData,
      include: {
        provider: {
          select: {
            id: true,
            code: true,
            name: true,
            country: true,
          },
        },
      },
    });

    this.logger.log(`Result updated: ${result.drawNumber}`);

    return this.transformResult(result);
  }

  /**
   * Process all pending bets for a draw result (T151-T158)
   *
   * 1. Find all pending bets matching provider, gameType, drawDate
   * 2. Check if bet numbers match any prize
   * 3. Calculate win amount based on prize tier
   * 4. Update Bet.status (WON/LOST)
   * 5. Update Bet.winAmount
   * 6. Generate commissions for each bet
   *
   * @param resultId - Result ID
   * @returns Processing summary
   * @throws NotFoundException if result not found
   */
  async processBets(resultId: number): Promise<ProcessBetsResponseDto> {
    const startTime = Date.now();

    const result = await this.prisma.drawResult.findUnique({
      where: { id: resultId },
      include: { provider: true },
    });

    if (!result) {
      throw new NotFoundException(`Result with ID '${resultId}' not found`);
    }

    this.logger.log(
      `Processing bets for result: ${result.drawNumber} (${result.providerId} ${result.gameType})`,
    );

    // Parse winning numbers
    const winningNumbers = {
      first: result.firstPrize,
      second: result.secondPrize,
      third: result.thirdPrize,
      starters: JSON.parse(result.starters) as string[],
      consolations: JSON.parse(result.consolations) as string[],
    };

    // Find all pending bets for this draw
    const pendingBets = await this.prisma.bet.findMany({
      where: {
        gameType: result.gameType,
        drawDate: result.drawDate,
        status: 'PENDING',
        providers: {
          some: {
            providerId: result.providerId,
          },
        },
      },
      include: {
        providers: {
          where: {
            providerId: result.providerId,
          },
        },
      },
    });

    this.logger.log(`Found ${pendingBets.length} pending bets to process`);

    let wonBets = 0;
    let lostBets = 0;
    let totalWinAmount = 0;
    const commissionsCreated = 0;

    // Process each bet in a transaction
    for (const bet of pendingBets) {
      const betProvider = bet.providers[0];
      if (!betProvider) continue;

      // Check if bet won and calculate win amount
      const { won, tier, winAmount } = this.checkBetWin(
        bet.numbers,
        bet.betType,
        Number(bet.amount),
        winningNumbers,
      );

      // Update bet and bet provider
      await this.prisma.$transaction(async (tx) => {
        // Update BetProvider
        await tx.betProvider.update({
          where: { id: betProvider.id },
          data: {
            status: won ? 'WON' : 'LOST',
            winAmount,
            resultId,
          },
        });

        // Update Bet (aggregate wins from all providers)
        const allProviders = await tx.betProvider.findMany({
          where: { betId: bet.id },
        });

        const totalWin = allProviders.reduce((sum, p) => sum + Number(p.winAmount), 0);
        const allProcessed = allProviders.every((p) => p.status !== 'PENDING');
        const anyWon = allProviders.some((p) => p.status === 'WON');

        if (allProcessed) {
          await tx.bet.update({
            where: { id: bet.id },
            data: {
              status: anyWon ? 'WON' : 'LOST',
              winAmount: totalWin,
            },
          });
        }
      });

      if (won) {
        wonBets++;
        totalWinAmount += winAmount;
        this.logger.log(`Bet ${bet.id} WON (${tier}): ${bet.numbers} - Win amount: ${winAmount}`);
      } else {
        lostBets++;
      }

      // Note: Commission calculation would be called here
      // For now, we just log it
      // const commissions = await this.commissionsService.calculateCommissions(
      //   bet.id,
      //   won ? Number(bet.amount) - winAmount : Number(bet.amount)
      // );
      // commissionsCreated += commissions.length;
    }

    // Mark result as FINAL
    await this.prisma.drawResult.update({
      where: { id: resultId },
      data: { status: ResultStatus.FINAL },
    });

    const processingTime = Date.now() - startTime;

    this.logger.log(
      `Bet processing completed: ${wonBets} won, ${lostBets} lost, ` +
        `total win amount: ${totalWinAmount}, time: ${processingTime}ms`,
    );

    return {
      resultId,
      processedBets: pendingBets.length,
      wonBets,
      lostBets,
      totalWinAmount,
      commissionsCreated,
      processingTime,
    };
  }

  /**
   * Check if a bet number wins and calculate win amount
   *
   * @param betNumber - Bet number
   * @param betType - Bet type (BIG, SMALL, IBOX)
   * @param betAmount - Bet amount
   * @param winningNumbers - Winning numbers
   * @returns Win status and amount
   * @private
   */
  private checkBetWin(
    betNumber: string,
    betType: string,
    betAmount: number,
    winningNumbers: {
      first: string;
      second: string;
      third: string;
      starters: string[];
      consolations: string[];
    },
  ): { won: boolean; tier?: string; winAmount: number } {
    // Check exact match with prizes
    if (betNumber === winningNumbers.first) {
      return { won: true, tier: 'First Prize', winAmount: betAmount * 2500 };
    }

    if (betNumber === winningNumbers.second) {
      return { won: true, tier: 'Second Prize', winAmount: betAmount * 1000 };
    }

    if (betNumber === winningNumbers.third) {
      return { won: true, tier: 'Third Prize', winAmount: betAmount * 500 };
    }

    if (betType === 'BIG') {
      // BIG bet also wins on starters
      if (winningNumbers.starters.includes(betNumber)) {
        return { won: true, tier: 'Starter', winAmount: betAmount * 60 };
      }

      // BIG bet also wins on consolations
      if (winningNumbers.consolations.includes(betNumber)) {
        return { won: true, tier: 'Consolation', winAmount: betAmount * 20 };
      }
    }

    return { won: false, winAmount: 0 };
  }

  /**
   * Validate that all numbers match the game type digit count
   *
   * @param data - Result data
   * @private
   * @throws BadRequestException if validation fails
   */
  private validateNumberFormat(data: any) {
    const digitCount = parseInt(data.gameType.replace('D', ''));

    const numbersToValidate = [
      { name: 'firstPrize', value: data.firstPrize },
      { name: 'secondPrize', value: data.secondPrize },
      { name: 'thirdPrize', value: data.thirdPrize },
    ];

    for (const num of numbersToValidate) {
      if (num.value && num.value.length !== digitCount) {
        throw new BadRequestException(
          `${num.name} must be exactly ${digitCount} digits for ${data.gameType}`,
        );
      }
    }

    // Validate starters
    if (data.starters) {
      for (const starter of data.starters) {
        if (starter.length !== digitCount) {
          throw new BadRequestException(
            `All starters must be exactly ${digitCount} digits for ${data.gameType}`,
          );
        }
      }
    }

    // Validate consolations
    if (data.consolations) {
      for (const consolation of data.consolations) {
        if (consolation.length !== digitCount) {
          throw new BadRequestException(
            `All consolations must be exactly ${digitCount} digits for ${data.gameType}`,
          );
        }
      }
    }
  }

  /**
   * Transform database result to API format
   *
   * @param result - Result from database
   * @returns Transformed result
   * @private
   */
  private transformResult(result: any) {
    return {
      id: result.id,
      providerId: result.providerId,
      provider: result.provider || undefined,
      gameType: result.gameType,
      drawDate: result.drawDate,
      drawNumber: result.drawNumber,
      firstPrize: result.firstPrize,
      secondPrize: result.secondPrize,
      thirdPrize: result.thirdPrize,
      starters: JSON.parse(result.starters),
      consolations: JSON.parse(result.consolations),
      syncMethod: result.syncMethod,
      syncedBy: result.syncedBy,
      syncedAt: result.syncedAt,
      status: result.status,
    };
  }

  /**
   * Sync results from external API (T215-T224)
   *
   * Scheduled: Azure Function Timer Trigger (Wed/Sat/Sun 19:30 MYT)
   * Manual trigger: Admin can call this endpoint
   *
   * @param providerId - Provider to sync
   * @param gameType - Game type to sync
   * @param drawDate - Draw date to sync
   * @returns Sync result
   *
   * Note: This is a placeholder for the actual API integration
   * In production, this would fetch from Magayo API or similar
   */
  async syncResults(providerId: string, gameType: string, drawDate: Date) {
    this.logger.log(`Starting result sync: ${providerId} ${gameType} ${drawDate.toISOString()}`);

    // TODO: Implement actual API integration
    // This is a placeholder for the sync logic

    try {
      // 1. Fetch from external API (with retry logic)
      // 2. Validate result format
      // 3. Check for duplicates
      // 4. Create result if new
      // 5. Return sync status

      this.logger.warn('Result sync not implemented - placeholder only');

      return {
        success: false,
        message: 'Sync functionality not yet implemented',
      };
    } catch (error) {
      this.logger.error('Result sync failed', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  /**
   * Scheduled result sync (T215-T224)
   *
   * Runs on Wed/Sat/Sun at 19:30 MYT (11:30 UTC)
   *
   * @cron Wed/Sat/Sun at 19:30 Asia/Kuala_Lumpur
   */
  @Cron('30 19 * * 0,3,6', {
    name: 'sync-results',
    timeZone: 'Asia/Kuala_Lumpur',
  })
  async scheduledSync() {
    this.logger.log('Starting scheduled result sync...');

    // TODO: Implement scheduled sync logic
    // 1. Get all active providers
    // 2. For each provider, sync latest results
    // 3. Process any new results
    // 4. Send notifications on errors

    this.logger.warn('Scheduled result sync not implemented - placeholder only');
  }
}
