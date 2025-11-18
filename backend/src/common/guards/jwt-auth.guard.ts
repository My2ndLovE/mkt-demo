import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Observable } from 'rxjs';

/**
 * JWT Authentication Guard
 *
 * Protects routes by validating JWT tokens in the Authorization header.
 * Extends Passport's AuthGuard with custom logic for public routes.
 *
 * Features:
 * - Validates JWT tokens using Passport JWT strategy
 * - Skips authentication for routes marked with @Public() decorator
 * - Extracts user payload and attaches it to request.user
 * - Throws UnauthorizedException for invalid or missing tokens
 *
 * Token format: Authorization: Bearer <token>
 *
 * This guard should be applied globally in main.ts or selectively on controllers/routes.
 *
 * @class JwtAuthGuard
 * @extends {AuthGuard('jwt')}
 *
 * @example Global application in main.ts
 * ```typescript
 * app.useGlobalGuards(new JwtAuthGuard(reflector));
 * ```
 *
 * @example Controller-level application
 * ```typescript
 * @Controller('users')
 * @UseGuards(JwtAuthGuard)
 * export class UsersController {
 *   // All routes in this controller are protected
 * }
 * ```
 *
 * @example Route-level application
 * ```typescript
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * async getProfile(@CurrentUser() user: CurrentUserPayload) {
 *   return user;
 * }
 * ```
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Determines if the route can be activated
   *
   * Checks if the route is marked as public using @Public() decorator.
   * If public, authentication is skipped. Otherwise, validates JWT token.
   *
   * @param {ExecutionContext} context - Execution context
   * @returns {boolean | Promise<boolean> | Observable<boolean>} Whether route can be activated
   * @throws {UnauthorizedException} If token is invalid or missing (handled by parent class)
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Skip authentication for public routes
    if (isPublic) {
      return true;
    }

    // Delegate to Passport JWT strategy for authentication
    return super.canActivate(context);
  }

  /**
   * Handles authentication errors
   *
   * Transforms Passport authentication errors into proper NestJS exceptions.
   *
   * @param {Error} err - Authentication error
   * @throws {UnauthorizedException} With appropriate error message
   */
  handleRequest<TUser = any>(err: Error | null, user: TUser, info: Error | string): TUser {
    // Handle authentication errors
    if (err || !user) {
      const message = info instanceof Error ? info.message : info || 'Unauthorized access';
      throw err || new UnauthorizedException(message);
    }

    return user;
  }
}
