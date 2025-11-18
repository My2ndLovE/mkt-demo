import { AzureFunction, Context } from '@azure/functions';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import { SchedulerService } from '../../src/modules/scheduler/scheduler.service';

/**
 * Azure Function for Weekly Limit Reset
 * Triggered every Monday at 00:00 SGT (GMT+8)
 * Schedule: 0 0 0 * * 1 (second minute hour day month dayOfWeek)
 */
const timerTrigger: AzureFunction = async function (
  context: Context,
  myTimer: unknown,
): Promise<void> {
  const timeStamp = new Date().toISOString();

  context.log('Weekly limit reset triggered at:', timeStamp);

  try {
    // Bootstrap NestJS application
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    // Get scheduler service
    const schedulerService = app.get(SchedulerService);

    // Trigger the weekly reset
    await schedulerService.handleWeeklyLimitReset();

    context.log('Weekly limit reset completed successfully');

    // Close application context
    await app.close();
  } catch (error) {
    context.log.error('Weekly limit reset failed:', error);
    throw error; // Rethrow to mark function execution as failed
  }
};

export default timerTrigger;
