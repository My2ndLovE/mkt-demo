import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { createPaginatedResponse, PaginatedResponse } from '../../common/dto/pagination.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Create a new user (sub-agent)
   * Can be done by ADMIN, MODERATOR, or AGENT (creating downline)
   */
  async create(creatorId: number, creatorRole: string, dto: CreateUserDto) {
    this.logger.log(`User ${creatorId} creating new user: ${dto.username}`);

    // Check if username already exists
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existing) {
      throw new BadRequestException(`Username "${dto.username}" already exists`);
    }

    // Permission checks
    if (dto.role === 'ADMIN') {
      throw new BadRequestException('Cannot create ADMIN users via API');
    }

    if (dto.role === 'MODERATOR' && creatorRole !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can create MODERATOR users');
    }

    // Get creator info for moderatorId assignment
    const creator = await this.prisma.user.findUnique({
      where: { id: creatorId },
      select: {
        id: true,
        role: true,
        moderatorId: true,
      },
    });

    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    // Determine moderatorId based on creator role
    let moderatorId: number | null = null;
    if (creatorRole === 'MODERATOR') {
      moderatorId = creatorId; // Moderator creating agent
    } else if (creatorRole === 'AGENT') {
      moderatorId = creator.moderatorId; // Agent creating sub-agent (inherit moderatorId)
    }
    // ADMIN doesn't set moderatorId when creating MODERATOR

    // Validate upline if provided
    if (dto.uplineId) {
      const upline = await this.prisma.user.findUnique({
        where: { id: dto.uplineId },
      });

      if (!upline) {
        throw new BadRequestException('Upline user not found');
      }

      // Prevent circular hierarchy
      if (dto.uplineId === creatorId) {
        throw new BadRequestException('Cannot set yourself as upline');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        passwordHash,
        fullName: dto.fullName,
        role: dto.role,
        uplineId: dto.uplineId || creatorId, // Default upline is creator
        moderatorId: dto.role === 'MODERATOR' ? null : moderatorId,
        weeklyLimit: dto.weeklyLimit || 0,
        commissionRate: dto.commissionRate || 0,
        contactNumber: dto.contactNumber,
        email: dto.email,
        active: true,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        uplineId: true,
        moderatorId: true,
        weeklyLimit: true,
        weeklyUsed: true,
        commissionRate: true,
        contactNumber: true,
        email: true,
        active: true,
        createdAt: true,
      },
    });

    // Audit log
    await this.auditService.logUserCreated(
      creatorId,
      user.id,
      {
        username: user.username,
        role: user.role,
        uplineId: user.uplineId,
      },
      moderatorId,
    );

    this.logger.log(`✅ User ${user.id} created successfully by ${creatorId}`);

    return user;
  }

  /**
   * Query users with pagination and filters
   * Row-level security is applied via Prisma middleware
   */
  async findAll(
    userId: number,
    userRole: string,
    dto: QueryUsersDto,
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10, role, username, fullName, uplineId, active } = dto;

    // Build where clause
    const where: any = {};

    // Role-based filtering
    if (userRole === 'AGENT') {
      // Agents can only see their downline
      where.uplineId = userId;
    } else if (userRole === 'MODERATOR') {
      // Moderators can see users in their tree (handled by RLS middleware)
      if (role) {
        where.role = role;
      }
      if (uplineId) {
        where.uplineId = uplineId;
      }
    } else if (userRole === 'ADMIN') {
      // Admins can see all users
      if (role) {
        where.role = role;
      }
      if (uplineId) {
        where.uplineId = uplineId;
      }
    }

    // Apply search filters
    if (username) {
      where.username = {
        contains: username,
      };
    }

    if (fullName) {
      where.fullName = {
        contains: fullName,
      };
    }

    if (active !== undefined) {
      where.active = active;
    }

    // Get total count
    const total = await this.prisma.user.count({ where });

    // Get paginated users
    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        uplineId: true,
        moderatorId: true,
        weeklyLimit: true,
        weeklyUsed: true,
        commissionRate: true,
        contactNumber: true,
        email: true,
        active: true,
        createdAt: true,
        upline: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return createPaginatedResponse(users, total, page, limit);
  }

  /**
   * Get user by ID
   */
  async findOne(requesterId: number, requesterRole: string, userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        uplineId: true,
        moderatorId: true,
        weeklyLimit: true,
        weeklyUsed: true,
        commissionRate: true,
        contactNumber: true,
        email: true,
        active: true,
        createdAt: true,
        upline: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Permission check (agents can only view their downline)
    if (requesterRole === 'AGENT' && user.uplineId !== requesterId) {
      throw new ForbiddenException('You can only view your downline users');
    }

    return user;
  }

  /**
   * Update user
   */
  async update(
    requesterId: number,
    requesterRole: string,
    userId: number,
    dto: UpdateUserDto,
  ) {
    this.logger.log(`User ${requesterId} updating user ${userId}`);

    // Check if user exists
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    // Permission check
    if (requesterRole === 'AGENT' && existing.uplineId !== requesterId) {
      throw new ForbiddenException('You can only update your downline users');
    }

    if (requesterRole === 'MODERATOR' && existing.role === 'MODERATOR') {
      throw new ForbiddenException('Moderators cannot update other moderators');
    }

    // Update user
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.fullName && { fullName: dto.fullName }),
        ...(dto.role && { role: dto.role }),
        ...(dto.uplineId !== undefined && { uplineId: dto.uplineId }),
        ...(dto.weeklyLimit !== undefined && { weeklyLimit: dto.weeklyLimit }),
        ...(dto.commissionRate !== undefined && { commissionRate: dto.commissionRate }),
        ...(dto.contactNumber !== undefined && { contactNumber: dto.contactNumber }),
        ...(dto.email !== undefined && { email: dto.email }),
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        uplineId: true,
        moderatorId: true,
        weeklyLimit: true,
        weeklyUsed: true,
        commissionRate: true,
        contactNumber: true,
        email: true,
        active: true,
        createdAt: true,
      },
    });

    this.logger.log(`✅ User ${userId} updated successfully`);

    return user;
  }

  /**
   * Deactivate user (soft delete)
   */
  async remove(requesterId: number, requesterRole: string, userId: number) {
    this.logger.log(`User ${requesterId} deactivating user ${userId}`);

    // Check if user exists
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    // Cannot deactivate yourself
    if (userId === requesterId) {
      throw new BadRequestException('Cannot deactivate yourself');
    }

    // Permission check
    if (requesterRole === 'AGENT' && existing.uplineId !== requesterId) {
      throw new ForbiddenException('You can only deactivate your downline users');
    }

    if (requesterRole === 'MODERATOR' && existing.role === 'MODERATOR') {
      throw new ForbiddenException('Moderators cannot deactivate other moderators');
    }

    // Deactivate user
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        active: false,
      },
    });

    this.logger.log(`✅ User ${userId} deactivated successfully`);

    return {
      message: 'User deactivated successfully',
    };
  }

  /**
   * Get user hierarchy tree (recursive)
   * Returns the entire downline tree for a user
   */
  async getHierarchyTree(userId: number, userRole: string) {
    this.logger.log(`Fetching hierarchy tree for user ${userId}`);

    // Recursive CTE to get entire downline tree
    const tree = await this.prisma.$queryRaw<any[]>`
      WITH RECURSIVE UserTree AS (
        -- Base case: start with the given user
        SELECT
          id, username, fullName, role, uplineId, moderatorId,
          weeklyLimit, weeklyUsed, commissionRate, active,
          0 as level
        FROM [User]
        WHERE id = ${userId}

        UNION ALL

        -- Recursive case: get all downlines
        SELECT
          u.id, u.username, u.fullName, u.role, u.uplineId, u.moderatorId,
          u.weeklyLimit, u.weeklyUsed, u.commissionRate, u.active,
          ut.level + 1
        FROM [User] u
        INNER JOIN UserTree ut ON u.uplineId = ut.id
        WHERE u.active = 1
      )
      SELECT * FROM UserTree
      ORDER BY level, username
    `;

    return tree;
  }
}
