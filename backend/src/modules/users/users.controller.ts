import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, QueryUserDto, TransferUplineDto, UserRole } from './dtos';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

/**
 * Users Controller
 *
 * Handles all user management endpoints:
 * - CRUD operations (T074-T081)
 * - Hierarchy queries (T082-T089)
 * - Sub-agent creation (T300-T309)
 *
 * Authentication: All routes require JWT authentication
 * Authorization: Role-based access control via @Roles() decorator
 */
@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  /**
   * Create new user (T074, T290-T296, T300-T309)
   *
   * Access:
   * - ADMIN/MODERATOR: Can create any user type
   * - AGENT: Can create sub-agents if canCreateSubs=true
   *
   * POST /users
   */
  @Post()
  @ApiOperation({
    summary: 'Create new user',
    description: `
      Create a new user account. Access control:
      - ADMIN: Can create ADMIN, MODERATOR, or AGENT
      - MODERATOR: Can create AGENT under their management
      - AGENT: Can create sub-agents if canCreateSubs=true

      First Login Flow:
      - Default password generated as: username + "_" + 4-digit random
      - Email/SMS notification sent with credentials (if contact provided)
      - User must change password on first login

      Sub-Agent Rules:
      - weeklyLimit must be <= parent's weeklyLimit
      - commissionRate must be <= parent's commissionRate
      - Inherits moderatorId from parent
      - Cannot create if parent.active=false
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or business rule violation',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  @ApiResponse({
    status: 409,
    description: 'Username already exists',
  })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    this.logger.log(
      `User creation requested: ${createUserDto.username} (${createUserDto.role}) by ${currentUser.id}`,
    );

    const createdUser = await this.usersService.create(createUserDto, currentUser.id);

    return {
      message: 'User created successfully',
      data: createdUser,
    };
  }

  /**
   * List users with pagination, filtering, sorting (T075)
   *
   * Access: ADMIN, MODERATOR (filtered by moderatorId)
   *
   * GET /users
   */
  @Get()
  @ApiOperation({
    summary: 'List users with pagination and filtering',
    description: `
      Get paginated list of users with filtering and sorting options.

      Filters:
      - role: Filter by user role (ADMIN, MODERATOR, AGENT)
      - moderatorId: Filter agents by moderator
      - uplineId: Filter by direct upline
      - active: Filter by active status (default: true)
      - search: Search by username or full name

      Sorting:
      - sortBy: Field to sort by (createdAt, username, fullName, weeklyLimit, commissionRate)
      - sortOrder: Sort direction (asc, desc)
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
  })
  async findAll(@Query() query: QueryUserDto) {
    return await this.usersService.findAll(query);
  }

  /**
   * Get current user profile (T077)
   *
   * Access: Any authenticated user
   *
   * GET /users/me
   */
  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
    description: "Retrieve the authenticated user's own profile information",
  })
  @ApiResponse({
    status: 200,
    description: 'Current user profile',
  })
  async getMe(@CurrentUser() currentUser: CurrentUserPayload) {
    const user = await this.usersService.findOne(currentUser.id);

    return {
      data: user,
    };
  }

  /**
   * Get user by ID (T076)
   *
   * Access: ADMIN (any user), Others (self or downlines)
   *
   * GET /users/:id
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve detailed information about a specific user',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'User details retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findOne(id);

    return {
      data: user,
    };
  }

  /**
   * Update user (T078)
   *
   * Access:
   * - ADMIN: Can update all fields
   * - Self: Can update profile fields only (fullName, phone, email)
   *
   * PATCH /users/:id
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update user',
    description: `
      Update user information. Access control:
      - ADMIN: Can update all fields including limits, commission, active status
      - Self: Can only update profile fields (fullName, phone, email)

      Admin-only fields:
      - weeklyLimit, commissionRate, canCreateSubs, active

      Hierarchy constraints:
      - weeklyLimit cannot exceed upline's limit
      - commissionRate cannot exceed upline's rate
      - Cannot reduce below any downline's values
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    const isAdmin = currentUser.role === 'ADMIN';
    const updatedUser = await this.usersService.update(
      id,
      updateUserDto,
      currentUser.id,
      isAdmin,
    );

    return {
      message: 'User updated successfully',
      data: updatedUser,
    };
  }

  /**
   * Soft delete user (T079)
   *
   * Access: ADMIN only
   * Sets active=false instead of deleting record
   *
   * DELETE /users/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft delete user (admin only)',
    description: `
      Soft delete a user by setting active=false.

      Restrictions:
      - Cannot delete user with active downlines
      - Deactivate or transfer downlines first
      - User data is retained for audit purposes
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete user with active downlines',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const deletedUser = await this.usersService.remove(id);

    return {
      message: 'User deleted successfully',
      data: deletedUser,
    };
  }

  /**
   * Get user's upline chain (T085-T087)
   *
   * Access: ADMIN, or self/downlines
   *
   * GET /users/:id/upline-chain
   */
  @Get(':id/upline-chain')
  @ApiOperation({
    summary: "Get user's upline chain",
    description: `
      Retrieve all ancestors (upline hierarchy) for a user.
      Returns users from immediate upline to top-level, ordered by distance.

      Uses recursive CTE for efficient query across unlimited hierarchy depth.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Upline chain retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUplineChain(@Param('id', ParseIntPipe) id: number) {
    const uplineChain = await this.usersService.getUplineChain(id);

    return {
      data: uplineChain,
      meta: {
        count: uplineChain.length,
      },
    };
  }

  /**
   * Get user's direct downlines (T088)
   *
   * Access: ADMIN, or self
   *
   * GET /users/:id/downlines
   */
  @Get(':id/downlines')
  @ApiOperation({
    summary: "Get user's direct downlines",
    description: `
      Retrieve direct children (immediate downlines) for a user.
      Only returns first-level descendants, not entire subtree.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Downlines retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getDownlines(@Param('id', ParseIntPipe) id: number) {
    const downlines = await this.usersService.getDownlines(id);

    return {
      data: downlines,
      meta: {
        count: downlines.length,
      },
    };
  }

  /**
   * Get user's entire subtree (T089)
   *
   * Access: ADMIN, or self
   *
   * GET /users/:id/descendants
   */
  @Get(':id/descendants')
  @ApiOperation({
    summary: "Get user's entire subtree (all descendants)",
    description: `
      Retrieve all descendants recursively for a user.
      Returns entire subtree with level indicators.

      Uses recursive CTE for efficient query across unlimited depth.
      Each descendant includes their hierarchy level (1 = direct child, 2 = grandchild, etc.)
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Descendants retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getDescendants(@Param('id', ParseIntPipe) id: number) {
    const descendants = await this.usersService.getDescendants(id);

    return {
      data: descendants,
      meta: {
        count: descendants.length,
        maxLevel: descendants.length > 0 ? Math.max(...descendants.map((d) => d.level)) : 0,
      },
    };
  }

  /**
   * Transfer agent to new upline (T086)
   *
   * Access: ADMIN only
   *
   * POST /users/:id/transfer-upline
   */
  @Post(':id/transfer-upline')
  @ApiOperation({
    summary: 'Transfer agent to new upline (admin only)',
    description: `
      Move an agent and their entire subtree to a new upline.

      Validations:
      - Target must be AGENT role
      - New upline must be AGENT role
      - Prevents circular hierarchy (agent cannot be moved under their own descendant)
      - ModeratorId inherited from new upline

      Use case: Reorganizing agent hierarchy, replacing upline agents
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Agent ID to transfer',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Agent transferred successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid transfer (circular hierarchy, wrong role, etc.)',
  })
  @ApiResponse({
    status: 404,
    description: 'Agent or new upline not found',
  })
  async transferUpline(
    @Param('id', ParseIntPipe) id: number,
    @Body() transferUplineDto: TransferUplineDto,
  ) {
    const updatedAgent = await this.usersService.transferUpline(id, transferUplineDto);

    return {
      message: 'Agent transferred successfully',
      data: updatedAgent,
    };
  }
}
