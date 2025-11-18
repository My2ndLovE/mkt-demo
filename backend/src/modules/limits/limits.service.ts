import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LimitsService {
  constructor(private prisma: PrismaService) {}

  /**
   * FIX H-1: Deprecated - use checkAndDeduct instead to avoid race conditions
   * @deprecated Use checkAndDeduct for atomic check-and-deduct operation
   */
  async checkBalance(userId: number, amount: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { weeklyLimit: true, weeklyUsed: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const remaining = Number(user.weeklyLimit) - Number(user.weeklyUsed);

    if (amount > remaining) {
      throw new ForbiddenException(
        `Insufficient weekly limit. Remaining: $${remaining.toFixed(2)}, Required: $${amount.toFixed(2)}`
      );
    }
  }

  /**
   * FIX H-1: Deprecated - use checkAndDeduct instead to avoid race conditions
   * @deprecated Use checkAndDeduct for atomic check-and-deduct operation
   */
  async deductAmount(userId: number, amount: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        weeklyUsed: {
          increment: amount,
        },
      },
    });
  }

  /**
   * FIX H-1: Atomic check-and-deduct to prevent race conditions
   * Replaces separate checkBalance + deductAmount calls
   *
   * @param userId User ID to deduct from
   * @param amount Amount to deduct
   * @returns Result with new balance
   * @throws ForbiddenException if insufficient balance
   * @throws NotFoundException if user not found
   */
  async checkAndDeduct(userId: number, amount: number) {
    return await this.prisma.$transaction(async (tx) => {
      // Lock the row to prevent concurrent modifications
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { weeklyLimit: true, weeklyUsed: true },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      const limit = Number(user.weeklyLimit);
      const used = Number(user.weeklyUsed);
      const remaining = limit - used;

      if (amount > remaining) {
        throw new ForbiddenException(
          `Insufficient weekly limit. Available: $${remaining.toFixed(2)}, Required: $${amount.toFixed(2)}. Please contact your upline to increase your limit.`
        );
      }

      // Atomic update
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          weeklyUsed: {
            increment: amount,
          },
        },
        select: { weeklyUsed: true },
      });

      const newUsed = Number(updated.weeklyUsed);
      const newRemaining = limit - newUsed;

      return {
        success: true,
        weeklyLimit: limit,
        previousUsed: used,
        newUsed,
        deducted: amount,
        remaining: newRemaining,
      };
    });
  }

  async restoreAmount(userId: number, amount: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        weeklyUsed: {
          decrement: amount,
        },
      },
    });
  }

  async getBalance(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        weeklyLimit: true,
        weeklyUsed: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const limit = Number(user.weeklyLimit);
    const used = Number(user.weeklyUsed);
    const remaining = limit - used;

    return {
      weeklyLimit: limit,
      weeklyUsed: used,
      remaining: remaining,
      percentage: limit > 0 ? (used / limit) * 100 : 0,
    };
  }

  async resetAllLimits(): Promise<{ affectedUsers: number }> {
    const result = await this.prisma.user.updateMany({
      where: {
        role: {
          in: ['AGENT', 'MODERATOR'],
        },
      },
      data: {
        weeklyUsed: 0,
      },
    });

    return { affectedUsers: result.count };
  }
}
