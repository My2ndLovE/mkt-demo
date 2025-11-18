import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * JWT Payload Interface
 *
 * Structure of the JWT token payload.
 *
 * @interface JwtPayload
 */
export interface JwtPayload {
  sub: number; // User ID
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT Strategy
 *
 * Passport strategy for validating JWT access tokens.
 * Extracts JWT from Authorization header (Bearer token).
 * Validates token signature using JWT secret.
 * Loads user from database and attaches to request.
 *
 * @class JwtStrategy
 * @extends {PassportStrategy(Strategy)}
 *
 * @example Usage in controller
 * ```typescript
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@Request() req) {
 *   return req.user; // User loaded by JwtStrategy
 * }
 * ```
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'your-secret-key',
    });
  }

  /**
   * Validate JWT Payload
   *
   * Called by Passport after successfully verifying the JWT signature.
   * Loads the full user object from database and validates:
   * - User exists
   * - User is active
   *
   * The returned user object is attached to the request as req.user.
   *
   * @param {JwtPayload} payload - Decoded JWT payload
   * @returns {Promise<any>} User object (without password hash)
   * @throws {UnauthorizedException} If user not found or inactive
   */
  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        role: true,
        fullName: true,
        email: true,
        phone: true,
        uplineId: true,
        moderatorId: true,
        weeklyLimit: true,
        weeklyUsed: true,
        commissionRate: true,
        canCreateSubs: true,
        active: true,
        firstLogin: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.active) {
      throw new UnauthorizedException('User account is inactive');
    }

    return user;
  }
}
