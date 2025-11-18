import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/**
 * Users Module
 *
 * Manages user accounts and agent hierarchy:
 * - User CRUD operations (T074-T081)
 * - User profile management
 * - Role and permission management
 * - Agent hierarchy management (T082-T089)
 * - First login flow (T290-T296)
 * - Sub-agent creation (T300-T309)
 *
 * Features:
 * - Create users with role-based validation (ADMIN, MODERATOR, AGENT)
 * - Default password generation for first login
 * - Hierarchy queries: upline chain, downlines, descendants
 * - Transfer agent to new upline (admin only)
 * - Soft delete (active=false)
 * - Pagination, filtering, and sorting
 *
 * Business Rules:
 * - ADMIN/MODERATOR cannot have uplineId
 * - AGENT must have uplineId
 * - Sub-agent limits must be <= parent limits
 * - Prevent circular hierarchy
 * - Cannot delete user with active downlines
 *
 * @module UsersModule
 */
@Module({
  imports: [],
  controllers: [UsersController],
  providers: [PrismaService, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
