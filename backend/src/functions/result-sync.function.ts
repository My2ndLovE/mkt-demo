import { AzureFunction, Context } from '@azure/functions';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ResultsService } from '../modules/results/results.service';

/**
 * Azure Timer Trigger Function: Draw Result Synchronization
 *
 * Schedule: Wednesday, Saturday, Sunday at 19:30 Asia/Kuala_Lumpur
 * CRON: "0 30 19 * * 0,3,6" (sec min hour day month dayOfWeek)
 *
 * Purpose: Automatically sync lottery results from Magayo API
 * Critical for T215-T224: Automated result synchronization
 */
const timerTrigger: AzureFunction = async function (
  context: Context,
  myTimer: any
): Promise<void> {
  const startTime = Date.now();

  context.log('📥 Result Sync triggered at:', new Date().toISOString());
  context.log('Timer info:', myTimer);

  try {
    // Bootstrap NestJS application
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    // Get ResultsService
    const resultsService = app.get(ResultsService);

    // Get today's date for draw sync
    const today = new Date();
    const providers = ['M', 'P', 'T']; // Malaysia providers (Magnum, Sports Toto, Da Ma Cai)
    const gameTypes = ['4D']; // MVP: 4D only

    const results = [];

    // Sync each provider
    for (const providerId of providers) {
      for (const gameType of gameTypes) {
        try {
          context.log(`🔄 Syncing ${providerId} ${gameType}...`);

          // Call sync method (this should fetch from Magayo API)
          // For now, this is a placeholder - actual API integration needed
          const result = await resultsService.syncFromAPI(providerId, gameType, today);

          results.push({
            provider: providerId,
            gameType,
            status: 'success',
            resultId: result?.id
          });

          context.log(`✅ ${providerId} ${gameType} synced successfully`);

        } catch (error) {
          context.log.error(`❌ Failed to sync ${providerId} ${gameType}:`, error.message);

          results.push({
            provider: providerId,
            gameType,
            status: 'failed',
            error: error.message
          });

          // Continue with other providers even if one fails
          continue;
        }
      }
    }

    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.status === 'success').length;
    const failCount = results.filter(r => r.status === 'failed').length;

    // Log summary
    context.log('📊 Result Sync Summary:');
    context.log(`  - Total providers: ${providers.length * gameTypes.length}`);
    context.log(`  - Successful: ${successCount}`);
    context.log(`  - Failed: ${failCount}`);
    context.log(`  - Duration: ${duration}ms`);

    if (failCount > 0) {
      context.log.warn('⚠️ Some providers failed to sync. Manual entry may be required.');
      // TODO: Send notification to admin (email/SMS/webhook)
    }

    // Close NestJS app
    await app.close();

  } catch (error) {
    const duration = Date.now() - startTime;

    context.log.error('❌ Result Sync failed catastrophically:', error);
    context.log.error('Error details:', {
      message: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });

    // TODO: Alert admin - critical failure

    // Re-throw to mark function execution as failed
    throw error;
  }
};

export default timerTrigger;
