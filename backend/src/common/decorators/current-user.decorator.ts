import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Current user payload interface
 *
 * Represents the authenticated user data extracted from JWT token.
 * This data is attached to the request object by the JWT authentication guard.
 * Matches the user object returned by JwtStrategy.validate()
 */
export interface CurrentUserPayload {
  /** User's unique identifier */
  id: number;

  /** Username */
  username: string;

  /** User's role (ADMIN, MODERATOR, AGENT) */
  role: string;

  /** Full name */
  fullName: string;

  /** Email address (optional) */
  email?: string;

  /** Phone number (optional) */
  phone?: string;

  /** Upline user ID (for hierarchy) */
  uplineId?: number;

  /** Moderator ID (for organization) */
  moderatorId?: number;

  /** Weekly betting limit */
  weeklyLimit: number;

  /** Weekly amount used */
  weeklyUsed: number;

  /** Commission rate */
  commissionRate: number;

  /** Can create sub-agents */
  canCreateSubs: boolean;

  /** Account active status */
  active: boolean;

  /** First login flag */
  firstLogin: boolean;

  /** Last login timestamp */
  lastLoginAt?: Date;

  /** Account creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;

  /** Token issued at timestamp */
  iat?: number;

  /** Token expiration timestamp */
  exp?: number;
}

/**
 * Current User decorator
 *
 * Extracts the authenticated user from the request context.
 * This decorator should be used in conjunction with JWT authentication guard.
 *
 * The user object is populated by the JWT strategy after successful token validation.
 * It contains user identity information from the JWT payload.
 *
 * @example
 * ```typescript
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * async getProfile(@CurrentUser() user: CurrentUserPayload) {
 *   return { user };
 * }
 * ```
 *
 * @example Extract only userId
 * ```typescript
 * @Get('my-bets')
 * @UseGuards(JwtAuthGuard)
 * async getMyBets(@CurrentUser('userId') userId: string) {
 *   return this.betsService.findByUserId(userId);
 * }
 * ```
 *
 * @param {string} [data] - Optional property name to extract from user object
 * @returns {ParameterDecorator} Parameter decorator
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): CurrentUserPayload | unknown => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserPayload;

    // If a specific property is requested, return only that property
    if (data) {
      return user?.[data as keyof CurrentUserPayload];
    }

    // Otherwise, return the entire user object
    return user;
  },
);
