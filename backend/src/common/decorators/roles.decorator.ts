import { SetMetadata } from '@nestjs/common';

/**
 * User roles enumeration
 *
 * Defines all possible user roles in the Multi-Level Agent Lottery System.
 * Roles are hierarchical, with each role having specific permissions and access levels.
 */
export enum UserRole {
  /** Super administrator - full system access */
  SUPER_ADMIN = 'SUPER_ADMIN',

  /** Operator - manages games and results */
  OPERATOR = 'OPERATOR',

  /** Senior agent - Level 1 in hierarchy */
  SENIOR_AGENT = 'SENIOR_AGENT',

  /** Master agent - Level 2 in hierarchy */
  MASTER_AGENT = 'MASTER_AGENT',

  /** Gold agent - Level 3 in hierarchy */
  GOLD_AGENT = 'GOLD_AGENT',

  /** Agent - Level 4 in hierarchy */
  AGENT = 'AGENT',

  /** Player - End user who places bets */
  PLAYER = 'PLAYER',
}

/**
 * Metadata key for roles
 */
export const ROLES_KEY = 'roles';

/**
 * Roles decorator
 *
 * Marks a route handler or controller with required roles for access.
 * Must be used in conjunction with RolesGuard to enforce role-based access control.
 *
 * The RolesGuard will check if the authenticated user has at least one of the
 * specified roles before allowing access to the route.
 *
 * @example Single role
 * ```typescript
 * @Get('admin/users')
 * @Roles(UserRole.SUPER_ADMIN)
 * async getAllUsers() {
 *   return this.usersService.findAll();
 * }
 * ```
 *
 * @example Multiple roles
 * ```typescript
 * @Get('reports/commissions')
 * @Roles(UserRole.SUPER_ADMIN, UserRole.SENIOR_AGENT, UserRole.MASTER_AGENT)
 * async getCommissionReports() {
 *   return this.reportsService.getCommissions();
 * }
 * ```
 *
 * @example Controller-level roles (applies to all routes)
 * ```typescript
 * @Controller('admin')
 * @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
 * export class AdminController {
 *   // All routes in this controller require SUPER_ADMIN or OPERATOR role
 * }
 * ```
 *
 * @param {...UserRole[]} roles - One or more roles required to access the route
 * @returns {CustomDecorator} Class or method decorator
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
