import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

/**
 * Authentication Module (T024-T036, T297-T299)
 *
 * Handles user authentication and authorization:
 * - User login with username/password (LocalStrategy)
 * - JWT token generation and validation (JwtStrategy)
 * - Password hashing and verification (bcrypt, 10 rounds)
 * - Refresh token management with rotation
 * - Session management
 * - First login detection and forced password change (T297-T299)
 * - Password change with complexity validation (T298)
 *
 * Endpoints:
 * - POST /auth/login - Login with username/password
 * - POST /auth/refresh - Refresh access token
 * - POST /auth/logout - Logout and revoke refresh token
 * - POST /auth/change-password - Change password (T297-T299)
 *
 * Security features:
 * - JWT access tokens (15 minute expiry)
 * - Refresh tokens (7 day expiry)
 * - Refresh token rotation on use
 * - Token revocation on logout
 * - All tokens revoked on password change
 * - Rate limiting on login (5 attempts/minute)
 * - Password complexity enforcement
 *
 * @module AuthModule
 */
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.accessTokenExpiration'),
          issuer: configService.get<string>('jwt.issuer'),
          audience: configService.get<string>('jwt.audience'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy, PrismaService],
  exports: [AuthService, JwtStrategy],
})
export class AuthModule {}
