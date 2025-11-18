import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LimitsService } from '../limits/limits.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY = 1000; // 1 second

  constructor(
    private limitsService: LimitsService,
    private prisma: PrismaService,
  ) {}

  /**
   * Weekly limit reset - Runs every Monday at 00:00 SGT (GMT+8)
   * Cron: 0 0 * * 1 (minute hour day-of-month month day-of-week)
   */
  @Cron('0 0 * * 1', {
    name: 'weekly-limit-reset',
    timeZone: 'Asia/Singapore',
  })
  async handleWeeklyLimitReset() {
    this.logger.log('Starting weekly limit reset job...');

    const startTime = new Date();
    let attempt = 0;
    let success = false;
    let lastError: Error | null = null;

    while (attempt < this.MAX_RETRIES && !success) {
      attempt++;

      try {
        this.logger.log(`Reset attempt ${attempt} of ${this.MAX_RETRIES}`);

        // Call the limits service to reset all limits
        const result = await this.limitsService.resetAllLimits();

        // Log successful reset
        await this.logResetEvent({
          success: true,
          attemptCount: attempt,
          usersAffected: result.count,
          startTime,
          endTime: new Date(),
          errorMessage: null,
        });

        this.logger.log(
          `Weekly limit reset completed successfully. ${result.count} users affected.`,
        );

        success = true;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.error(
          `Reset attempt ${attempt} failed: ${lastError.message}`,
          lastError.stack,
        );

        // If not the last attempt, wait with exponential backoff
        if (attempt < this.MAX_RETRIES) {
          const delayMs = this.INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
          this.logger.log(`Retrying in ${delayMs}ms...`);
          await this.sleep(delayMs);
        }
      }
    }

    // If all retries failed, log the failure
    if (!success && lastError) {
      await this.logResetEvent({
        success: false,
        attemptCount: attempt,
        usersAffected: 0,
        startTime,
        endTime: new Date(),
        errorMessage: lastError.message,
      });

      this.logger.error(
        `Weekly limit reset FAILED after ${attempt} attempts. Manual intervention required.`,
      );

      // In production, trigger alert/notification here
      // Example: this.alertingService.sendCriticalAlert(...)
    }
  }

  /**
   * Log reset event to database for audit trail
   */
  private async logResetEvent(params: {
    success: boolean;
    attemptCount: number;
    usersAffected: number;
    startTime: Date;
    endTime: Date;
    errorMessage: string | null;
  }) {
    try {
      await this.prisma.limitResetLog.create({
        data: {
          resetDate: params.startTime,
          success: params.success,
          usersAffected: params.usersAffected,
          errorMessage: params.errorMessage,
          metadata: JSON.stringify({
            attemptCount: params.attemptCount,
            durationMs: params.endTime.getTime() - params.startTime.getTime(),
            startTime: params.startTime.toISOString(),
            endTime: params.endTime.toISOString(),
          }),
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to log reset event: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Manual trigger for testing or emergency resets
   */
  async triggerManualReset(userId: number): Promise<{
    success: boolean;
    count: number;
    error?: string;
  }> {
    this.logger.log(`Manual reset triggered by user ${userId}`);

    try {
      const result = await this.limitsService.resetAllLimits();

      await this.logResetEvent({
        success: true,
        attemptCount: 1,
        usersAffected: result.count,
        startTime: new Date(),
        endTime: new Date(),
        errorMessage: null,
      });

      // Audit log
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'MANUAL_LIMIT_RESET',
          metadata: JSON.stringify({
            usersAffected: result.count,
            timestamp: new Date().toISOString(),
          }),
        },
      });

      return { success: true, count: result.count };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      await this.logResetEvent({
        success: false,
        attemptCount: 1,
        usersAffected: 0,
        startTime: new Date(),
        endTime: new Date(),
        errorMessage,
      });

      this.logger.error(`Manual reset failed: ${errorMessage}`);

      return { success: false, count: 0, error: errorMessage };
    }
  }

  /**
   * Get reset history for monitoring
   */
  async getResetHistory(limit = 50) {
    return this.prisma.limitResetLog.findMany({
      orderBy: { resetDate: 'desc' },
      take: limit,
    });
  }

  /**
   * Utility function for async sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
