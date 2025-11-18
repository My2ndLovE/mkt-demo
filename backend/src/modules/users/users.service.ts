import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, QueryUserDto, TransferUplineDto, UserRole } from './dtos';
import * as bcrypt from 'bcrypt';

// User type interface based on Prisma schema
interface User {
  id: number;
  username: string;
  passwordHash: string;
  role: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  uplineId: number | null;
  moderatorId: number | null;
  weeklyLimit: any; // Decimal
  weeklyUsed: any; // Decimal
  commissionRate: any; // Decimal
  canCreateSubs: boolean;
  active: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  upline?: any;
  moderator?: any;
  downlines?: any[];
}

/**
 * Users Service
 *
 * Handles all user-related business logic:
 * - CRUD operations (T074-T081)
 * - Hierarchy management (T082-T089)
 * - First login flow (T290-T296)
 * - Sub-agent creation (T300-T309)
 *
 * Business Rules:
 * 1. Username must be unique (global)
 * 2. ADMIN/MODERATOR cannot have uplineId
 * 3. AGENT must have uplineId
 * 4. Default password = username + 4-digit random (e.g., "agent123_9472")
 * 5. Sub-agent validation: parent.canCreateSubs, limits, commission rates
 * 6. Prevent circular hierarchy
 * 7. Soft delete (active=false)
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly SALT_ROUNDS = 10;
  private readonly MAX_HIERARCHY_DEPTH = 100;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new user (T074, T290-T296, T300-T309)
   *
   * Supports three creation flows:
   * 1. Admin creating ADMIN/MODERATOR/AGENT
   * 2. Moderator creating AGENT
   * 3. Agent creating sub-agent (if canCreateSubs=true)
   *
   * @param createUserDto - User creation data
   * @param creatorId - ID of user creating this account (optional for system)
   * @returns Created user (without password hash)
   */
  async create(createUserDto: CreateUserDto, creatorId?: number): Promise<User> {
    // Validate username uniqueness
    await this.validateUsernameUnique(createUserDto.username);

    // Validate role-specific rules
    await this.validateRoleRules(createUserDto, creatorId);

    // Generate default password
    const defaultPassword = this.generateDefaultPassword(createUserDto.username);
    const passwordHash = await bcrypt.hash(defaultPassword, this.SALT_ROUNDS);

    // Inherit moderatorId from upline if not specified
    let moderatorId = createUserDto.moderatorId;
    if (createUserDto.role === UserRole.AGENT && createUserDto.uplineId && !moderatorId) {
      const upline = await this.findOne(createUserDto.uplineId);
      moderatorId = upline.moderatorId || upline.id;
    }

    // Create user
    const user = await this.prisma.user.create({
      data: {
        username: createUserDto.username,
        passwordHash,
        role: createUserDto.role,
        fullName: createUserDto.fullName,
        phone: createUserDto.phone,
        email: createUserDto.email,
        uplineId: createUserDto.uplineId,
        moderatorId,
        weeklyLimit: createUserDto.weeklyLimit,
        commissionRate: createUserDto.commissionRate,
        canCreateSubs: createUserDto.canCreateSubs,
        active: true,
      },
    });

    this.logger.log(
      `User created: ${user.username} (ID: ${user.id}, Role: ${user.role}) by creator ${creatorId || 'SYSTEM'}`,
    );

    // TODO: Send email/SMS notification with credentials (T292-T293)
    // this.notificationService.sendCredentials(user, defaultPassword);

    return this.sanitizeUser(user);
  }

  /**
   * Get paginated list of users with filtering and sorting (T075)
   *
   * @param query - Query parameters for filtering, sorting, pagination
   * @returns Paginated user list with metadata
   */
  async findAll(query: QueryUserDto) {
    const {
      page = 1,
      limit = 20,
      role,
      moderatorId,
      uplineId,
      active,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Build where clause
    const where: any = {
      ...(role && { role }),
      ...(moderatorId !== undefined && { moderatorId }),
      ...(uplineId !== undefined && { uplineId }),
      ...(active !== undefined && { active }),
      ...(search && {
        OR: [
          { username: { contains: search, mode: 'insensitive' } },
          { fullName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Calculate pagination
    const skip = (page - 1) * limit;
    const take = limit;

    // Execute query with count
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          upline: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
          moderator: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const sanitizedUsers = users.map((user: any) => this.sanitizeUser(user));

    return {
      data: sanitizedUsers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID (T076)
   *
   * @param id - User ID
   * @returns User details
   * @throws NotFoundException if user not found
   */
  async findOne(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        upline: {
          select: {
            id: true,
            username: true,
            fullName: true,
            commissionRate: true,
          },
        },
        moderator: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.sanitizeUser(user);
  }

  /**
   * Update user (T078)
   *
   * Access control:
   * - Users can update own profile (fullName, phone, email)
   * - Admins can update all fields
   *
   * @param id - User ID to update
   * @param updateUserDto - Update data
   * @param requesterId - ID of user making the request
   * @param isAdmin - Whether requester is admin
   * @returns Updated user
   */
  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    requesterId: number,
    isAdmin: boolean,
  ): Promise<User> {
    const user = await this.findOne(id);

    // Check permissions
    const isSelf = id === requesterId;
    if (!isSelf && !isAdmin) {
      throw new ForbiddenException('You can only update your own profile');
    }

    // Non-admins can only update profile fields
    if (!isAdmin) {
      const allowedFields = ['fullName', 'phone', 'email'];
      const attemptedFields = Object.keys(updateUserDto);
      const invalidFields = attemptedFields.filter((f) => !allowedFields.includes(f));

      if (invalidFields.length > 0) {
        throw new ForbiddenException(`Only admins can update: ${invalidFields.join(', ')}`);
      }
    }

    // Validate hierarchy constraints for limit/commission updates
    if (
      isAdmin &&
      (updateUserDto.weeklyLimit !== undefined || updateUserDto.commissionRate !== undefined)
    ) {
      await this.validateHierarchyConstraints(user, updateUserDto);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    this.logger.log(`User updated: ${updatedUser.username} (ID: ${id}) by ${requesterId}`);

    return this.sanitizeUser(updatedUser);
  }

  /**
   * Soft delete user (T079)
   *
   * Sets active=false instead of deleting the record.
   * Admin-only operation.
   *
   * @param id - User ID to delete
   * @returns Deleted user
   */
  async remove(id: number): Promise<User> {
    await this.findOne(id); // Validate user exists

    // Prevent deleting user with active downlines
    const activeDownlines = await this.prisma.user.count({
      where: { uplineId: id, active: true },
    });

    if (activeDownlines > 0) {
      throw new BadRequestException(
        `Cannot delete user with ${activeDownlines} active downlines. Deactivate or transfer them first.`,
      );
    }

    const deletedUser = await this.prisma.user.update({
      where: { id },
      data: { active: false },
    });

    this.logger.log(`User soft deleted: ${deletedUser.username} (ID: ${id})`);

    return this.sanitizeUser(deletedUser);
  }

  /**
   * Get user's upline chain (T085-T087)
   *
   * Returns all ancestors from immediate upline to top-level agent.
   * Uses recursive CTE for efficient query.
   *
   * @param userId - User ID
   * @returns Array of upline users ordered from closest to furthest
   */
  async getUplineChain(userId: number): Promise<User[]> {
    await this.findOne(userId); // Validate user exists

    // SQL Server recursive CTE for upline chain
    const uplineChain = await this.prisma.$queryRaw<User[]>`
      WITH RECURSIVE UserHierarchy AS (
        SELECT id, uplineId, username, fullName, role, commissionRate, weeklyLimit, 0 AS level
        FROM users
        WHERE id = ${userId}

        UNION ALL

        SELECT u.id, u.uplineId, u.username, u.fullName, u.role, u.commissionRate, u.weeklyLimit, uh.level + 1
        FROM users u
        INNER JOIN UserHierarchy uh ON u.id = uh.uplineId
        WHERE uh.level < ${this.MAX_HIERARCHY_DEPTH}
      )
      SELECT * FROM UserHierarchy
      WHERE level > 0
      ORDER BY level ASC
    `;

    return uplineChain.map((user: any) => this.sanitizeUser(user));
  }

  /**
   * Get user's direct downlines (T088)
   *
   * @param userId - User ID
   * @returns Array of direct children
   */
  async getDownlines(userId: number): Promise<User[]> {
    await this.findOne(userId); // Validate user exists

    const downlines = await this.prisma.user.findMany({
      where: { uplineId: userId, active: true },
      orderBy: { createdAt: 'desc' },
    });

    return downlines.map((user: any) => this.sanitizeUser(user));
  }

  /**
   * Get user's entire subtree (T089)
   *
   * Returns all descendants recursively.
   * Uses recursive CTE for efficient query.
   *
   * @param userId - User ID
   * @returns Array of all descendants with level indicator
   */
  async getDescendants(userId: number): Promise<any[]> {
    await this.findOne(userId); // Validate user exists

    // SQL Server recursive CTE for descendants
    const descendants = await this.prisma.$queryRaw<any[]>`
      WITH RECURSIVE UserHierarchy AS (
        SELECT id, uplineId, username, fullName, role, commissionRate, weeklyLimit, active, 0 AS level
        FROM users
        WHERE id = ${userId}

        UNION ALL

        SELECT u.id, u.uplineId, u.username, u.fullName, u.role, u.commissionRate, u.weeklyLimit, u.active, uh.level + 1
        FROM users u
        INNER JOIN UserHierarchy uh ON u.uplineId = uh.id
        WHERE uh.level < ${this.MAX_HIERARCHY_DEPTH}
      )
      SELECT * FROM UserHierarchy
      WHERE level > 0
      ORDER BY level ASC, username ASC
    `;

    return descendants.map((user: any) => ({
      ...this.sanitizeUser(user),
      level: user.level,
    }));
  }

  /**
   * Transfer agent to new upline (T086)
   *
   * Admin-only operation to reorganize hierarchy.
   * Validates against circular references.
   *
   * @param agentId - Agent to transfer
   * @param dto - Transfer data (newUplineId)
   * @returns Updated agent
   */
  async transferUpline(agentId: number, dto: TransferUplineDto): Promise<User> {
    const agent = await this.findOne(agentId);
    const newUpline = await this.findOne(dto.newUplineId);

    // Validate agent is AGENT role
    if (agent.role !== UserRole.AGENT) {
      throw new BadRequestException('Can only transfer AGENT users');
    }

    // Validate new upline is AGENT role
    if (newUpline.role !== UserRole.AGENT) {
      throw new BadRequestException('New upline must be an AGENT');
    }

    // Prevent circular hierarchy
    await this.validateNoCircularHierarchy(agentId, dto.newUplineId);

    // Inherit moderatorId from new upline
    const newModeratorId = newUpline.moderatorId || newUpline.id;

    const updatedAgent = await this.prisma.user.update({
      where: { id: agentId },
      data: {
        uplineId: dto.newUplineId,
        moderatorId: newModeratorId,
      },
    });

    this.logger.log(
      `Agent transferred: ${agent.username} (ID: ${agentId}) from upline ${agent.uplineId} to ${dto.newUplineId}`,
    );

    return this.sanitizeUser(updatedAgent);
  }

  // ==================== Private Helper Methods ====================

  /**
   * Generate default password for first login
   * Format: username + "_" + 4-digit random number
   *
   * @param username - Username
   * @returns Generated password
   */
  private generateDefaultPassword(username: string): string {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 1000-9999
    return `${username}_${randomSuffix}`;
  }

  /**
   * Remove sensitive fields from user object
   *
   * @param user - User object
   * @returns Sanitized user (without passwordHash)
   */
  private sanitizeUser(user: any): any {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Validate username uniqueness
   *
   * @param username - Username to check
   * @throws ConflictException if username exists
   */
  private async validateUsernameUnique(username: string): Promise<void> {
    const existing = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existing) {
      throw new ConflictException(`Username '${username}' already exists`);
    }
  }

  /**
   * Validate role-specific business rules (T074, T300-T309)
   *
   * @param dto - Create user DTO
   * @param creatorId - Creator user ID
   */
  private async validateRoleRules(dto: CreateUserDto, creatorId?: number): Promise<void> {
    // Rule: ADMIN/MODERATOR cannot have uplineId
    if ((dto.role === UserRole.ADMIN || dto.role === UserRole.MODERATOR) && dto.uplineId) {
      throw new BadRequestException(`${dto.role} users cannot have an upline`);
    }

    // Rule: AGENT must have uplineId
    if (dto.role === UserRole.AGENT && !dto.uplineId) {
      throw new BadRequestException('AGENT users must have an uplineId');
    }

    // Validate sub-agent creation rules (T300-T309)
    if (dto.role === UserRole.AGENT && dto.uplineId && creatorId) {
      await this.validateSubAgentCreation(dto, creatorId);
    }
  }

  /**
   * Validate sub-agent creation by parent agent (T300-T309)
   *
   * Business Rules:
   * - Creator must have canCreateSubs=true
   * - Creator must be active
   * - Creator must be the upline
   * - Sub-agent weeklyLimit <= creator weeklyLimit
   * - Sub-agent commissionRate <= creator commissionRate
   *
   * @param dto - Create user DTO
   * @param creatorId - Creator user ID
   */
  private async validateSubAgentCreation(dto: CreateUserDto, creatorId: number): Promise<void> {
    const creator = await this.findOne(creatorId);

    // Validate creator is the upline
    if (dto.uplineId !== creatorId) {
      // If creator is not the upline, they must be admin
      if (creator.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Agents can only create their own sub-agents');
      }
      // Admin creating agent under another upline - skip remaining validations
      return;
    }

    // Validate creator can create subs
    if (!creator.canCreateSubs) {
      throw new ForbiddenException('You do not have permission to create sub-agents');
    }

    // Validate creator is active
    if (!creator.active) {
      throw new BadRequestException('Cannot create sub-agents when your account is inactive');
    }

    // Validate weeklyLimit
    if (dto.weeklyLimit > Number(creator.weeklyLimit)) {
      throw new BadRequestException(
        `Sub-agent weeklyLimit (${dto.weeklyLimit}) cannot exceed your limit (${creator.weeklyLimit})`,
      );
    }

    // Validate commissionRate
    if (dto.commissionRate > Number(creator.commissionRate)) {
      throw new BadRequestException(
        `Sub-agent commissionRate (${dto.commissionRate}%) cannot exceed your rate (${creator.commissionRate}%)`,
      );
    }
  }

  /**
   * Validate no circular hierarchy when transferring upline
   *
   * Ensures agent is not transferred under one of their own descendants.
   *
   * @param agentId - Agent being transferred
   * @param newUplineId - Proposed new upline
   */
  private async validateNoCircularHierarchy(agentId: number, newUplineId: number): Promise<void> {
    // Cannot be own upline
    if (agentId === newUplineId) {
      throw new BadRequestException('Agent cannot be their own upline');
    }

    // Check if newUpline is a descendant of agent
    const descendants = await this.getDescendants(agentId);
    const descendantIds = descendants.map((d) => d.id);

    if (descendantIds.includes(newUplineId)) {
      throw new BadRequestException(
        'Cannot create circular hierarchy: new upline is a descendant of this agent',
      );
    }
  }

  /**
   * Validate hierarchy constraints when updating limits/commission
   *
   * Ensures updates don't violate parent/child constraints.
   *
   * @param user - User being updated
   * @param updateDto - Update data
   */
  private async validateHierarchyConstraints(user: User, updateDto: UpdateUserDto): Promise<void> {
    // If user has upline, validate against upline limits
    if (user.uplineId) {
      const upline = await this.findOne(user.uplineId);

      if (
        updateDto.weeklyLimit !== undefined &&
        updateDto.weeklyLimit > Number(upline.weeklyLimit)
      ) {
        throw new BadRequestException(
          `weeklyLimit (${updateDto.weeklyLimit}) cannot exceed upline's limit (${upline.weeklyLimit})`,
        );
      }

      if (
        updateDto.commissionRate !== undefined &&
        updateDto.commissionRate > Number(upline.commissionRate)
      ) {
        throw new BadRequestException(
          `commissionRate (${updateDto.commissionRate}%) cannot exceed upline's rate (${upline.commissionRate}%)`,
        );
      }
    }

    // If user has downlines, validate against downline limits
    const downlines = await this.getDownlines(user.id);

    for (const downline of downlines) {
      if (
        updateDto.weeklyLimit !== undefined &&
        Number(downline.weeklyLimit) > updateDto.weeklyLimit
      ) {
        throw new BadRequestException(
          `Cannot reduce weeklyLimit below downline ${downline.username}'s limit (${downline.weeklyLimit})`,
        );
      }

      if (
        updateDto.commissionRate !== undefined &&
        Number(downline.commissionRate) > updateDto.commissionRate
      ) {
        throw new BadRequestException(
          `Cannot reduce commissionRate below downline ${downline.username}'s rate (${downline.commissionRate}%)`,
        );
      }
    }
  }
}
