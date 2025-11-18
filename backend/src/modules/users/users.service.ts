import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService
  ) {}

  async create(dto: CreateUserDto, creatorId: number) {
    const creator = await this.prisma.user.findUnique({
      where: { id: creatorId },
    });

    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    // Check if username already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existingUser) {
      throw new BadRequestException('Username already exists');
    }

    // Determine moderatorId based on creator role
    let moderatorId: number;
    if (creator.role === 'MODERATOR') {
      moderatorId = creator.id;
    } else if (creator.role === 'AGENT') {
      if (!creator.canCreateSubs) {
        throw new ForbiddenException('You do not have permission to create sub-agents');
      }
      moderatorId = creator.moderatorId!;
    } else {
      throw new ForbiddenException('Only moderators and agents can create users');
    }

    // Validate upline if provided
    if (dto.uplineId) {
      const upline = await this.prisma.user.findUnique({
        where: { id: dto.uplineId },
      });

      // FIX H-4: Improved error message with specific context
      if (!upline) {
        throw new BadRequestException(
          `Upline user with ID ${dto.uplineId} not found. Please verify the upline exists.`,
        );
      }

      if (upline.moderatorId !== moderatorId) {
        throw new BadRequestException(
          `Upline user ${dto.uplineId} does not belong to your organization. You can only assign uplines within your own hierarchy.`,
        );
      }
    }

    // Hash password
    const passwordHash = await this.authService.hashPassword(dto.password);

    // Create user
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username: dto.username,
          passwordHash,
          role: dto.role,
          fullName: dto.fullName,
          phone: dto.phone,
          email: dto.email,
          weeklyLimit: dto.weeklyLimit,
          weeklyUsed: 0,
          commissionRate: dto.commissionRate,
          canCreateSubs: dto.canCreateSubs ?? true,
          uplineId: dto.uplineId || (creator.role === 'AGENT' ? creator.id : undefined),
          moderatorId,
          active: true,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: creatorId,
          action: 'USER_CREATED',
          metadata: JSON.stringify({
            newUserId: newUser.id,
            username: newUser.username,
            role: newUser.role,
            weeklyLimit: dto.weeklyLimit,
            commissionRate: dto.commissionRate,
          }),
        },
      });

      return newUser;
    });

    return this.formatUser(user);
  }

  async findAll(userId: number) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    let users;
    if (currentUser.role === 'ADMIN') {
      users = await this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } else if (currentUser.role === 'MODERATOR') {
      users = await this.prisma.user.findMany({
        where: {
          OR: [{ id: currentUser.id }, { moderatorId: currentUser.id }],
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Agent can see self and downlines
      users = await this.prisma.user.findMany({
        where: {
          OR: [
            { id: currentUser.id },
            { uplineId: currentUser.id }, // Direct downlines
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return users.map((u) => this.formatUser(u));
  }

  async findOne(id: number, userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        upline: {
          select: { id: true, username: true, fullName: true },
        },
        downlines: {
          select: { id: true, username: true, fullName: true, weeklyLimit: true, active: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify access
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (currentUser?.role === 'ADMIN') {
      // Admin can see all
    } else if (currentUser?.role === 'MODERATOR') {
      if (user.moderatorId !== currentUser.id && user.id !== currentUser.id) {
        throw new ForbiddenException('Access denied');
      }
    } else {
      // Agents can only see themselves and their downlines
      if (user.id !== currentUser?.id && user.uplineId !== currentUser?.id) {
        throw new ForbiddenException('Access denied');
      }
    }

    return {
      ...this.formatUser(user),
      upline: user.upline,
      downlines: user.downlines,
    };
  }

  async update(id: number, dto: UpdateUserDto, updaterId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updater = await this.prisma.user.findUnique({
      where: { id: updaterId },
    });

    // Verify permission
    if (updater?.role === 'ADMIN') {
      // Admin can update all
    } else if (updater?.role === 'MODERATOR') {
      if (user.moderatorId !== updater.id && user.id !== updater.id) {
        throw new ForbiddenException('Cannot update users from other moderators');
      }
    } else {
      // Agents can only update their downlines
      if (user.uplineId !== updater?.id && user.id !== updater?.id) {
        throw new ForbiddenException('Cannot update this user');
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data: dto,
      });

      await tx.auditLog.create({
        data: {
          userId: updaterId,
          action: 'USER_UPDATED',
          metadata: JSON.stringify({
            targetUserId: id,
            changes: dto,
          }),
        },
      });

      return updatedUser;
    });

    return this.formatUser(updated);
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const newPasswordHash = await this.authService.hashPassword(dto.newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'PASSWORD_CHANGED',
        metadata: JSON.stringify({ userId }),
      },
    });

    return { message: 'Password changed successfully' };
  }

  async getHierarchy(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get all downlines recursively
    const hierarchy = await this.getDownlineTree(userId);

    return hierarchy;
  }

  private async getDownlineTree(userId: number): Promise<unknown> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        downlines: {
          select: {
            id: true,
            username: true,
            fullName: true,
            role: true,
            weeklyLimit: true,
            weeklyUsed: true,
            commissionRate: true,
            active: true,
          },
        },
      },
    });

    if (!user) return null;

    const downlines = await Promise.all(
      user.downlines.map(async (downline) => ({
        ...downline,
        downlines: await this.getDownlineTree(downline.id),
      }))
    );

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      weeklyLimit: Number(user.weeklyLimit),
      weeklyUsed: Number(user.weeklyUsed),
      commissionRate: Number(user.commissionRate),
      active: user.active,
      downlines,
    };
  }

  private formatUser(user: {
    id: number;
    username: string;
    role: string;
    fullName: string;
    phone: string | null;
    email: string | null;
    weeklyLimit: { toNumber: () => number } | number;
    weeklyUsed: { toNumber: () => number } | number;
    commissionRate: { toNumber: () => number } | number;
    canCreateSubs: boolean;
    uplineId: number | null;
    moderatorId: number | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      weeklyLimit:
        typeof user.weeklyLimit === 'number' ? user.weeklyLimit : user.weeklyLimit.toNumber(),
      weeklyUsed:
        typeof user.weeklyUsed === 'number' ? user.weeklyUsed : user.weeklyUsed.toNumber(),
      commissionRate:
        typeof user.commissionRate === 'number'
          ? user.commissionRate
          : user.commissionRate.toNumber(),
      canCreateSubs: user.canCreateSubs,
      uplineId: user.uplineId,
      moderatorId: user.moderatorId,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
