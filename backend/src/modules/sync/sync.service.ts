import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { ResultsService } from '../results/results.service';
import { ProvidersService } from '../providers/providers.service';
import {
  MagayoResultResponse,
  SyncResult,
  SyncProvider,
} from './dto/sync-result.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000; // 2 seconds

  constructor(
    private http: HttpService,
    private config: ConfigService,
    private prisma: PrismaService,
    private resultsService: ResultsService,
    private providersService: ProvidersService,
  ) {}

  /**
   * Automated sync job - Runs daily at 9 PM SGT
   * Checks for new results from all active providers
   */
  @Cron('0 21 * * *', {
    name: 'daily-result-sync',
    timeZone: 'Asia/Singapore',
  })
  async handleDailySync() {
    this.logger.log('Starting daily result sync job...');

    try {
      // Get all active providers
      const providers = await this.providersService.findAll();
      const activeProviders = providers.filter((p) => p.active);

      this.logger.log(`Found ${activeProviders.length} active providers`);

      const results: SyncResult[] = [];

      for (const provider of activeProviders) {
        try {
          // Sync today's results for each provider
          const today = new Date().toISOString().split('T')[0];
          const result = await this.syncProviderResults(
            provider.code,
            today,
            SyncProvider.MAGAYO,
          );

          results.push(result);

          // Delay between providers to avoid rate limiting
          await this.sleep(1000);
        } catch (error) {
          this.logger.error(
            `Failed to sync ${provider.code}: ${error instanceof Error ? error.message : String(error)}`,
          );
          results.push({
            success: false,
            provider: provider.code,
            drawDate: new Date().toISOString(),
            error:
              error instanceof Error ? error.message : 'Unknown sync error',
          });
        }
      }

      // Log sync summary
      await this.logSyncSummary(results);

      const successCount = results.filter((r) => r.success).length;
      this.logger.log(
        `Daily sync completed: ${successCount}/${results.length} successful`,
      );
    } catch (error) {
      this.logger.error(
        `Daily sync job failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Sync results for a specific provider and date
   */
  async syncProviderResults(
    providerCode: string,
    drawDate: string,
    syncProvider: SyncProvider = SyncProvider.MAGAYO,
  ): Promise<SyncResult> {
    this.logger.log(
      `Syncing ${providerCode} results for ${drawDate} from ${syncProvider}`,
    );

    // Check if result already exists
    const existing = await this.prisma.drawResult.findFirst({
      where: {
        provider: providerCode,
        drawDate: new Date(drawDate),
      },
    });

    if (existing) {
      this.logger.log(
        `Result already exists for ${providerCode} on ${drawDate}`,
      );
      return {
        success: true,
        provider: providerCode,
        drawDate,
        resultId: existing.id,
        betsProcessed: 0,
      };
    }

    // Fetch from external API
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < this.MAX_RETRIES) {
      attempt++;

      try {
        const resultData = await this.fetchFromMagayo(providerCode, drawDate);

        // Create result in database
        const result = await this.resultsService.create(
          {
            provider: providerCode,
            drawDate,
            drawNumber: resultData.drawNumber,
            firstPrize: resultData.prizes.first,
            secondPrize: resultData.prizes.second,
            thirdPrize: resultData.prizes.third,
            starterPrizes: resultData.prizes.starter,
            consolationPrizes: resultData.prizes.consolation,
          },
          1, // System user ID (admin)
        );

        this.logger.log(
          `Successfully synced result ${result.id} for ${providerCode}`,
        );

        // Return success with stats
        return {
          success: true,
          provider: providerCode,
          drawDate,
          resultId: result.id,
          betsProcessed: result.betsProcessed || 0,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.error(
          `Sync attempt ${attempt} failed: ${lastError.message}`,
        );

        if (attempt < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAY * attempt;
          this.logger.log(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    return {
      success: false,
      provider: providerCode,
      drawDate,
      error: lastError?.message || 'Unknown error after all retries',
    };
  }

  /**
   * Fetch results from Magayo API
   * Note: This is a mock implementation - replace with actual API
   */
  private async fetchFromMagayo(
    providerCode: string,
    drawDate: string,
  ): Promise<MagayoResultResponse> {
    const apiUrl = this.config.get<string>('MAGAYO_API_URL');
    const apiKey = this.config.get<string>('MAGAYO_API_KEY');

    if (!apiUrl || !apiKey) {
      throw new Error('Magayo API configuration missing');
    }

    try {
      // Construct API URL
      const url = `${apiUrl}/results/${providerCode}/${drawDate}`;

      const response = await firstValueFrom(
        this.http.get<MagayoResultResponse>(url, {
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json',
          },
        }),
      );

      if (!response.data) {
        throw new Error('Empty response from Magayo API');
      }

      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Magayo API error: ${error.message}`);
      }

      // Fallback to mock data for development/testing
      if (this.config.get<string>('NODE_ENV') === 'development') {
        this.logger.warn(
          'Using mock data for development (Magayo API not available)',
        );
        return this.getMockResult(providerCode, drawDate);
      }

      throw error;
    }
  }

  /**
   * Mock result data for development/testing
   */
  private getMockResult(
    providerCode: string,
    drawDate: string,
  ): MagayoResultResponse {
    const random4D = () =>
      Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');

    return {
      provider: providerCode,
      drawDate,
      drawNumber: `${providerCode}-${drawDate.replace(/-/g, '')}`,
      prizes: {
        first: random4D(),
        second: random4D(),
        third: random4D(),
        starter: Array.from({ length: 10 }, () => random4D()),
        consolation: Array.from({ length: 10 }, () => random4D()),
      },
    };
  }

  /**
   * Manual sync trigger (Admin only)
   */
  async manualSync(
    providerCode: string,
    drawDate: string,
    syncProvider: SyncProvider = SyncProvider.MAGAYO,
  ): Promise<SyncResult> {
    this.logger.log(
      `Manual sync triggered for ${providerCode} on ${drawDate}`,
    );

    const result = await this.syncProviderResults(
      providerCode,
      drawDate,
      syncProvider,
    );

    // Log to audit trail
    await this.prisma.auditLog.create({
      data: {
        userId: 1, // System/Admin user
        action: 'MANUAL_RESULT_SYNC',
        metadata: JSON.stringify({
          provider: providerCode,
          drawDate,
          success: result.success,
          resultId: result.resultId,
          error: result.error,
        }),
      },
    });

    return result;
  }

  /**
   * Get sync history
   */
  async getSyncHistory(limit = 50) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        OR: [
          { action: 'MANUAL_RESULT_SYNC' },
          { action: 'AUTOMATED_RESULT_SYNC' },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      metadata: JSON.parse(log.metadata || '{}'),
      createdAt: log.createdAt,
    }));
  }

  /**
   * Check sync status for a provider/date
   */
  async getSyncStatus(providerCode: string, drawDate: string) {
    const result = await this.prisma.drawResult.findFirst({
      where: {
        provider: providerCode,
        drawDate: new Date(drawDate),
      },
      select: {
        id: true,
        drawNumber: true,
        firstPrize: true,
        secondPrize: true,
        thirdPrize: true,
        createdAt: true,
      },
    });

    if (!result) {
      return {
        synced: false,
        provider: providerCode,
        drawDate,
        message: 'No result found for this date',
      };
    }

    return {
      synced: true,
      provider: providerCode,
      drawDate,
      result,
    };
  }

  /**
   * Bulk sync for date range (Admin only)
   */
  async bulkSync(
    providerCode: string,
    startDate: string,
    endDate: string,
  ): Promise<SyncResult[]> {
    this.logger.log(
      `Bulk sync: ${providerCode} from ${startDate} to ${endDate}`,
    );

    const start = new Date(startDate);
    const end = new Date(endDate);
    const results: SyncResult[] = [];

    // Iterate through date range
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];

      try {
        const result = await this.syncProviderResults(
          providerCode,
          dateStr,
          SyncProvider.MAGAYO,
        );
        results.push(result);

        // Delay to avoid rate limiting
        await this.sleep(1500);
      } catch (error) {
        this.logger.error(
          `Bulk sync failed for ${dateStr}: ${error instanceof Error ? error.message : String(error)}`,
        );
        results.push({
          success: false,
          provider: providerCode,
          drawDate: dateStr,
          error:
            error instanceof Error ? error.message : 'Unknown bulk sync error',
        });
      }

      // Move to next day
      current.setDate(current.getDate() + 1);
    }

    // Log bulk sync summary
    await this.prisma.auditLog.create({
      data: {
        userId: 1,
        action: 'BULK_RESULT_SYNC',
        metadata: JSON.stringify({
          provider: providerCode,
          startDate,
          endDate,
          total: results.length,
          successful: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
        }),
      },
    });

    return results;
  }

  /**
   * Log sync summary to database
   */
  private async logSyncSummary(results: SyncResult[]) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: 1, // System user
          action: 'AUTOMATED_RESULT_SYNC',
          metadata: JSON.stringify({
            timestamp: new Date().toISOString(),
            total: results.length,
            successful: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
            results: results.map((r) => ({
              provider: r.provider,
              success: r.success,
              resultId: r.resultId,
              betsProcessed: r.betsProcessed,
              error: r.error,
            })),
          }),
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to log sync summary: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Utility: Async sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
