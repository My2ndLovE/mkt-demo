import { AzureFunction, Context } from '@azure/functions';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { LimitsService } from '../modules/limits/limits.service';

/**
 * Azure Timer Trigger Function: Weekly Limit Reset
 *
 * Schedule: Every Monday at 00:00 Asia/Kuala_Lumpur
 * CRON: "0 0 0 * * 1" (sec min hour day month dayOfWeek)
 *
 * Purpose: Reset all users' weeklyUsed to 0 for the new week
 * Critical for T227: Weekly limit reset functionality
 */
const timerTrigger: AzureFunction = async function (
  context: Context,
  myTimer: any
): Promise<void> {
  const startTime = Date.now();

  context.log('🔄 Weekly Limit Reset triggered at:', new Date().toISOString());
  context.log('Timer info:', myTimer);

  try {
    // Bootstrap NestJS application
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    // Get LimitsService
    const limitsService = app.get(LimitsService);

    // Execute weekly reset
    const result = await limitsService.resetWeeklyLimits();

    const duration = Date.now() - startTime;

    // Log success
    context.log('✅ Weekly Limit Reset completed successfully');
    context.log(`📊 Stats:
      - Users affected: ${result.affectedUsers}
      - Total limit reset: RM ${result.totalLimit.toFixed(2)}
      - Duration: ${duration}ms
    `);

    // Close NestJS app
    await app.close();

  } catch (error) {
    const duration = Date.now() - startTime;

    context.log.error('❌ Weekly Limit Reset failed:', error);
    context.log.error('Error details:', {
      message: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });

    // Re-throw to mark function execution as failed
    throw error;
  }
};

export default timerTrigger;
