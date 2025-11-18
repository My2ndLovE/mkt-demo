import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LimitsService {
  constructor(private prisma: PrismaService) {}

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
