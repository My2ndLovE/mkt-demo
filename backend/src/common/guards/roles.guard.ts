import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, UserRole } from '../decorators/roles.decorator';
import { CurrentUserPayload } from '../decorators/current-user.decorator';

/**
 * Roles Guard
 *
 * Enforces role-based access control (RBAC) for routes and controllers.
 * Works in conjunction with the @Roles() decorator and JWT authentication.
 *
 * Features:
 * - Validates user roles against required roles
 * - Supports multiple roles (user needs at least one)
 * - Allows access if no roles are specified (backward compatibility)
 * - Logs authorization failures for security auditing
 *
 * This guard should be applied after JwtAuthGuard to ensure user is authenticated.
 *
 * @class RolesGuard
 * @implements {CanActivate}
 *
 * @example Global application in app.module.ts
 * ```typescript
 * providers: [
 *   {
 *     provide: APP_GUARD,
 *     useClass: JwtAuthGuard,
 *   },
 *   {
 *     provide: APP_GUARD,
 *     useClass: RolesGuard,
 *   },
 * ]
 * ```
 *
 * @example Controller-level application
 * ```typescript
 * @Controller('admin')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(UserRole.SUPER_ADMIN)
 * export class AdminController {
 *   // All routes require SUPER_ADMIN role
 * }
 * ```
 *
 * @example Route-level application
 * ```typescript
 * @Get('reports')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(UserRole.SUPER_ADMIN, UserRole.SENIOR_AGENT)
 * async getReports() {
 *   // Requires SUPER_ADMIN or SENIOR_AGENT role
 * }
 * ```
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  /**
   * Determines if the current user has the required role(s)
   *
   * Checks if the authenticated user has at least one of the roles
   * specified in the @Roles() decorator. If no roles are specified,
   * access is granted (route is protected only by authentication).
   *
   * @param {ExecutionContext} context - Execution context
   * @returns {boolean} True if user has required role, false otherwise
   * @throws {ForbiddenException} If user doesn't have required role
   */
  canActivate(context: ExecutionContext): boolean {
    // Get required roles from metadata (set by @Roles() decorator)
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are specified, allow access (route is only auth-protected)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get user from request (populated by JWT guard)
    const request = context.switchToHttp().getRequest();
    const user = request.user as CurrentUserPayload;

    // Validate user exists (should be guaranteed by JWT guard)
    if (!user || !user.role) {
      this.logger.warn('No user found in request context. JWT guard may not be applied.');
      throw new ForbiddenException('User authentication required');
    }

    // Check if user has at least one of the required roles
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      this.logger.warn(
        `Access denied for user ${user.userId} (${user.email}). ` +
          `Required roles: [${requiredRoles.join(', ')}], User role: ${user.role}`,
      );

      throw new ForbiddenException(
        `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    // Log successful authorization for audit trail
    this.logger.debug(
      `Access granted for user ${user.userId} (${user.role}) to ${request.method} ${request.url}`,
    );

    return true;
  }
}
