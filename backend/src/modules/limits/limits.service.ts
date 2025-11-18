import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UpdateLimitDto, QueryLimitDto, CheckLimitResponseDto } from './dtos';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Limits Service
 *
 * Manages betting limits and weekly resets (T114-T125, T227)
 *
 * Business Rules:
 * 1. weeklyUsed cannot exceed weeklyLimit
 * 2. Sub-agents cannot have limit > parent limit
 * 3. Admin can adjust limits anytime
 * 4. Limits reset every Monday 00:00 Asia/Kuala_Lumpur (T227)
 * 5. Reset is logged in LimitResetLog for auditing
 *
 * Core Methods:
 * - checkLimit(userId, amount): Check if bet within limits
 * - deductLimit(userId, amount): Deduct from weeklyUsed
 * - resetWeeklyLimits(): Reset all users' weeklyUsed to 0 (scheduled)
 */
@Injectable()
export class LimitsService {
  private readonly logger = new Logger(LimitsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if a bet amount is within user's limits (T114)
   *
   * @param userId - User ID
   * @param amount - Bet amount to check
   * @returns Limit check result
   * @throws NotFoundException if user not found
   */
  async checkLimit(userId: number, amount: number): Promise<CheckLimitResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        weeklyLimit: true,
        weeklyUsed: true,
        active: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }

    if (!user.active) {
      return {
        allowed: false,
        weeklyLimit: Number(user.weeklyLimit),
        weeklyUsed: Number(user.weeklyUsed),
        weeklyRemaining: 0,
        message: 'User account is inactive',
      };
    }

    const weeklyLimit = Number(user.weeklyLimit);
    const weeklyUsed = Number(user.weeklyUsed);
    const weeklyRemaining = weeklyLimit - weeklyUsed;
    const allowed = weeklyUsed + amount <= weeklyLimit;

    return {
      allowed,
      weeklyLimit,
      weeklyUsed,
      weeklyRemaining,
      message: allowed
        ? 'Bet is within limits'
        : `Insufficient weekly limit. Remaining: ${weeklyRemaining.toFixed(2)}`,
    };
  }

  /**
   * Deduct amount from user's weekly used limit (T115)
   *
   * Called when a bet is placed
   *
   * @param userId - User ID
   * @param amount - Amount to deduct
   * @throws NotFoundException if user not found
   * @throws BadRequestException if amount exceeds remaining limit
   */
  async deductLimit(userId: number, amount: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { weeklyLimit: true, weeklyUsed: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }

    const weeklyLimit = Number(user.weeklyLimit);
    const weeklyUsed = Number(user.weeklyUsed);
    const newWeeklyUsed = weeklyUsed + amount;

    if (newWeeklyUsed > weeklyLimit) {
      throw new BadRequestException(
        `Bet amount exceeds weekly limit. Remaining: ${(weeklyLimit - weeklyUsed).toFixed(2)}`,
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { weeklyUsed: newWeeklyUsed },
    });

    this.logger.log(`Deducted ${amount} from user ${userId}. New weeklyUsed: ${newWeeklyUsed}`);
  }

  /**
   * Refund amount to user's weekly used limit (T116)
   *
   * Called when a bet is cancelled
   *
   * @param userId - User ID
   * @param amount - Amount to refund
   * @throws NotFoundException if user not found
   */
  async refundLimit(userId: number, amount: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { weeklyUsed: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }

    const weeklyUsed = Number(user.weeklyUsed);
    const newWeeklyUsed = Math.max(0, weeklyUsed - amount);

    await this.prisma.user.update({
      where: { id: userId },
      data: { weeklyUsed: newWeeklyUsed },
    });

    this.logger.log(`Refunded ${amount} to user ${userId}. New weeklyUsed: ${newWeeklyUsed}`);
  }

  /**
   * Reset all users' weekly used limits to 0 (T117, T227)
   *
   * Scheduled to run every Monday at 00:00 Asia/Kuala_Lumpur time
   * Logs the reset operation for auditing
   *
   * @cron Every Monday at 00:00 Asia/Kuala_Lumpur (TZ offset: UTC+8)
   */
  @Cron('0 0 * * 1', {
    name: 'reset-weekly-limits',
    timeZone: 'Asia/Kuala_Lumpur',
  })
  async resetWeeklyLimits(): Promise<{ affectedUsers: number; totalLimit: number }> {
    this.logger.log('Starting weekly limit reset...');

    const startTime = Date.now();

    try {
      // Get count of affected users before reset
      const usersToReset = await this.prisma.user.count({
        where: { weeklyUsed: { gt: 0 } },
      });

      // Get total limit sum for logging
      const aggregateResult = await this.prisma.user.aggregate({
        _sum: { weeklyLimit: true },
        where: { active: true },
      });

      const totalLimit = Number(aggregateResult._sum.weeklyLimit || 0);

      // Reset all users' weeklyUsed to 0
      await this.prisma.user.updateMany({
        where: { weeklyUsed: { gt: 0 } },
        data: { weeklyUsed: 0 },
      });

      // Log the reset operation
      await this.prisma.limitResetLog.create({
        data: {
          resetDate: new Date(),
          affectedUsers: usersToReset,
          totalLimit,
          status: 'SUCCESS',
        },
      });

      const duration = Date.now() - startTime;
      this.logger.log(
        `Weekly limit reset completed successfully. ` +
          `Affected users: ${usersToReset}, Total limit: ${totalLimit}, Duration: ${duration}ms`,
      );

      return { affectedUsers: usersToReset, totalLimit };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        'Weekly limit reset failed',
        error instanceof Error ? error.stack : String(error),
      );

      // Log the failed reset
      await this.prisma.limitResetLog.create({
        data: {
          resetDate: new Date(),
          affectedUsers: 0,
          totalLimit: 0,
          status: 'FAILED',
          errorMessage,
        },
      });

      throw error;
    }
  }

  /**
   * Get current user's limits (T118)
   *
   * @param userId - User ID
   * @returns User's limit information
   * @throws NotFoundException if user not found
   */
  async getMyLimits(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        fullName: true,
        weeklyLimit: true,
        weeklyUsed: true,
        active: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }

    const weeklyLimit = Number(user.weeklyLimit);
    const weeklyUsed = Number(user.weeklyUsed);
    const weeklyRemaining = weeklyLimit - weeklyUsed;
    const usagePercentage = weeklyLimit > 0 ? (weeklyUsed / weeklyLimit) * 100 : 0;

    return {
      userId: user.id,
      username: user.username,
      fullName: user.fullName,
      weeklyLimit,
      weeklyUsed,
      weeklyRemaining,
      usagePercentage: usagePercentage.toFixed(2),
      active: user.active,
    };
  }

  /**
   * Update user's limits (T119-T120)
   *
   * Admin-only operation
   * Validates that sub-agents cannot have limit > parent limit
   *
   * @param userId - User ID
   * @param updateLimitDto - New limit values
   * @param adminId - ID of admin performing the update
   * @returns Updated user limits
   * @throws NotFoundException if user not found
   * @throws BadRequestException if validation fails
   */
  async updateLimits(userId: number, updateLimitDto: UpdateLimitDto, adminId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { upline: { select: { weeklyLimit: true } } },
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }

    // Validate sub-agent limit does not exceed parent limit
    if (updateLimitDto.weeklyLimit !== undefined && user.upline) {
      const parentLimit = Number(user.upline.weeklyLimit);
      if (updateLimitDto.weeklyLimit > parentLimit) {
        throw new BadRequestException(
          `Sub-agent's weekly limit (${updateLimitDto.weeklyLimit}) cannot exceed parent's limit (${parentLimit})`,
        );
      }
    }

    // Validate weeklyUsed does not exceed weeklyLimit
    if (updateLimitDto.weeklyUsed !== undefined && updateLimitDto.weeklyLimit !== undefined) {
      if (updateLimitDto.weeklyUsed > updateLimitDto.weeklyLimit) {
        throw new BadRequestException(
          `weeklyUsed (${updateLimitDto.weeklyUsed}) cannot exceed weeklyLimit (${updateLimitDto.weeklyLimit})`,
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (updateLimitDto.weeklyLimit !== undefined) {
      updateData.weeklyLimit = updateLimitDto.weeklyLimit;
    }
    if (updateLimitDto.weeklyUsed !== undefined) {
      updateData.weeklyUsed = updateLimitDto.weeklyUsed;
    }

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    this.logger.log(
      `Limits updated for user ${userId} by admin ${adminId}. ` +
        `New weeklyLimit: ${updatedUser.weeklyLimit}, weeklyUsed: ${updatedUser.weeklyUsed}`,
    );

    return this.getMyLimits(userId);
  }

  /**
   * Get all users' limits with filtering (T121)
   *
   * Admin-only operation for monitoring
   *
   * @param query - Query parameters for filtering
   * @returns List of users with their limits
   */
  async getAllLimits(query: QueryLimitDto) {
    const where: any = {};

    // Filter by exceeded limits
    if (query.exceeded !== undefined) {
      if (query.exceeded) {
        // Users who have exceeded or are at limit
        where.weeklyUsed = { gte: this.prisma.user.fields.weeklyLimit };
      }
    }

    // Search by username or full name
    if (query.search) {
      where.OR = [
        { username: { contains: query.search, mode: 'insensitive' } },
        { fullName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        weeklyLimit: true,
        weeklyUsed: true,
        active: true,
        upline: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: [{ weeklyUsed: 'desc' }, { username: 'asc' }],
    });

    return users.map((user) => {
      const weeklyLimit = Number(user.weeklyLimit);
      const weeklyUsed = Number(user.weeklyUsed);
      const weeklyRemaining = weeklyLimit - weeklyUsed;
      const usagePercentage = weeklyLimit > 0 ? (weeklyUsed / weeklyLimit) * 100 : 0;

      return {
        userId: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        weeklyLimit,
        weeklyUsed,
        weeklyRemaining,
        usagePercentage: usagePercentage.toFixed(2),
        active: user.active,
        upline: user.upline
          ? {
              id: user.upline.id,
              username: user.upline.username,
            }
          : null,
      };
    });
  }

  /**
   * Get recent limit reset logs (T122)
   *
   * Admin-only operation for monitoring scheduled jobs
   *
   * @param limit - Number of logs to retrieve (default: 10)
   * @returns Recent limit reset logs
   */
  async getResetLogs(limit = 10) {
    return this.prisma.limitResetLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
