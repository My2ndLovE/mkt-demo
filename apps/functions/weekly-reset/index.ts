import { app, InvocationContext, Timer } from '@azure/functions';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Weekly limit reset function
 * Runs every Monday at 00:00 MYT (Asia/Kuala_Lumpur)
 * Resets weeklyUsed to 0 for all users
 */
export async function weeklyReset(myTimer: Timer, context: InvocationContext): Promise<void> {
  context.log('⏰ Weekly limit reset function triggered');
  context.log('Timer schedule:', myTimer.schedule);
  context.log('Current time (MYT):', new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' }));

  try {
    // Reset weeklyUsed to 0 for all users
    const result = await prisma.user.updateMany({
      where: {
        active: true,
        role: {
          in: ['MODERATOR', 'AGENT'],
        },
      },
      data: {
        weeklyUsed: 0,
      },
    });

    context.log(`✅ Successfully reset weekly limits for ${result.count} users`);

    // Create audit log entries
    const usersReset = await prisma.user.findMany({
      where: {
        active: true,
        role: {
          in: ['MODERATOR', 'AGENT'],
        },
      },
      select: {
        id: true,
      },
    });

    // Log the reset in limitResetLog table
    await prisma.limitResetLog.createMany({
      data: usersReset.map((user) => ({
        userId: user.id,
        resetDate: new Date(),
        previousUsed: 0, // We don't track previous value in this simple implementation
        newUsed: 0,
      })),
    });

    context.log(`📝 Created ${usersReset.length} limit reset log entries`);
  } catch (error) {
    context.error('❌ Error during weekly reset:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Register the function
app.timer('weekly-reset', {
  schedule: '0 0 0 * * MON', // Every Monday at 00:00
  handler: weeklyReset,
});
