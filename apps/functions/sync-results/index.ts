import { app, InvocationContext, Timer } from '@azure/functions';
import { PrismaClient } from '@prisma/client';
import axios, { AxiosError } from 'axios';

const prisma = new PrismaClient();

interface LotteryResult {
  provider: string;
  drawNumber: string;
  drawDate: string;
  winningNumbers: string;
  specialNumbers?: string;
}

/**
 * Lottery results synchronization function
 * Runs on Wed/Sat/Sun at 19:30 MYT (Asia/Kuala_Lumpur)
 * Fetches results from Magayo API with retry mechanism
 */
export async function syncResults(myTimer: Timer, context: InvocationContext): Promise<void> {
  context.log('⏰ Results synchronization function triggered');
  context.log('Timer schedule:', myTimer.schedule);
  context.log('Current time (MYT):', new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' }));

  const apiKey = process.env.MAGAYO_API_KEY;
  const apiEndpoint = process.env.MAGAYO_API_ENDPOINT;

  if (!apiKey || !apiEndpoint) {
    context.error('❌ MAGAYO_API_KEY or MAGAYO_API_ENDPOINT not configured');
    return;
  }

  try {
    // Get all active service providers
    const providers = await prisma.serviceProvider.findMany({
      where: {
        active: true,
      },
    });

    context.log(`📋 Found ${providers.length} active providers to sync`);

    for (const provider of providers) {
      context.log(`🔄 Syncing results for ${provider.name}...`);

      try {
        // Fetch results from API with retry
        const results = await fetchResultsWithRetry(
          apiEndpoint,
          apiKey,
          provider.code,
          context,
        );

        // Process each result
        for (const result of results) {
          await upsertDrawResult(provider.id, result, context);
        }

        context.log(`✅ Successfully synced ${results.length} results for ${provider.name}`);
      } catch (error) {
        context.error(`❌ Failed to sync results for ${provider.name}:`, error);
        // Continue with next provider even if one fails
      }
    }

    context.log('🎉 Results synchronization completed');
  } catch (error) {
    context.error('❌ Error during results synchronization:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Fetch lottery results from API with exponential backoff retry
 */
async function fetchResultsWithRetry(
  endpoint: string,
  apiKey: string,
  providerCode: string,
  context: InvocationContext,
  maxRetries: number = 3,
): Promise<LotteryResult[]> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      context.log(`📡 API request attempt ${attempt}/${maxRetries} for ${providerCode}`);

      const response = await axios.get<LotteryResult[]>(endpoint, {
        params: {
          apiKey,
          provider: providerCode,
          limit: 10, // Get last 10 draws
        },
        timeout: 10000, // 10 second timeout
      });

      context.log(`✅ API request successful for ${providerCode}`);
      return response.data;
    } catch (error) {
      lastError = error as Error;
      const axiosError = error as AxiosError;

      context.warn(
        `⚠️ API request attempt ${attempt} failed for ${providerCode}:`,
        axiosError.message,
      );

      // Don't retry on 4xx errors (client errors)
      if (axiosError.response && axiosError.response.status >= 400 && axiosError.response.status < 500) {
        context.error(`🛑 Client error (${axiosError.response.status}), skipping retry`);
        throw error;
      }

      // Wait before retry with exponential backoff
      if (attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        context.log(`⏳ Waiting ${delayMs}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw new Error(
    `Failed to fetch results after ${maxRetries} attempts: ${lastError?.message}`,
  );
}

/**
 * Upsert draw result into database
 */
async function upsertDrawResult(
  providerId: number,
  result: LotteryResult,
  context: InvocationContext,
): Promise<void> {
  try {
    await prisma.drawResult.upsert({
      where: {
        providerId_drawNumber: {
          providerId,
          drawNumber: result.drawNumber,
        },
      },
      update: {
        drawDate: new Date(result.drawDate),
        winningNumbers: result.winningNumbers,
        specialNumbers: result.specialNumbers || null,
      },
      create: {
        providerId,
        drawNumber: result.drawNumber,
        drawDate: new Date(result.drawDate),
        winningNumbers: result.winningNumbers,
        specialNumbers: result.specialNumbers || null,
      },
    });

    context.log(`✅ Upserted draw result ${result.drawNumber}`);
  } catch (error) {
    context.error(`❌ Failed to upsert draw result ${result.drawNumber}:`, error);
    throw error;
  }
}

// Register the function
app.timer('sync-results', {
  schedule: '0 30 19 * * 0,3,6', // Sun/Wed/Sat at 19:30
  handler: syncResults,
});
