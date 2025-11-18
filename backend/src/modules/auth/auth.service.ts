import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import {
  LoginResponseDto,
  RefreshTokenResponseDto,
  ChangePasswordResponseDto,
} from './dtos/auth.dto';

/**
 * Authentication Service
 *
 * Handles all authentication business logic:
 * - User credential validation (T024-T036)
 * - Login with JWT token generation
 * - Refresh token rotation
 * - Logout (token revocation)
 * - Password hashing with bcrypt (10 rounds minimum)
 * - First login detection and forced password change (T297-T299)
 * - Password change with complexity validation
 *
 * @class AuthService
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly bcryptRounds = 10; // Minimum 10 rounds for security
  private readonly accessTokenExpiry = '15m'; // 15 minutes
  private readonly refreshTokenExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Validate User Credentials
   *
   * Validates username and password using bcrypt comparison.
   * Called by LocalStrategy during login.
   *
   * @param {string} username - Username
   * @param {string} password - Plain text password
   * @returns {Promise<any | null>} User object without password hash, or null if invalid
   */
  async validateUser(username: string, password: string): Promise<any | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { username },
      });

      if (!user) {
        this.logger.warn(`Login attempt with non-existent username: ${username}`);
        return null;
      }

      if (!user.active) {
        this.logger.warn(`Login attempt for inactive user: ${username}`);
        return null;
      }

      // Compare password with bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        this.logger.warn(`Invalid password for user: ${username}`);
        return null;
      }

      // Remove password hash from returned user object
      const { passwordHash, ...result } = user;
      return result;
    } catch (error) {
      this.logger.error(`Error validating user ${username}:`, error);
      return null;
    }
  }

  /**
   * Login
   *
   * Generates access and refresh tokens for authenticated user.
   * Updates lastLoginAt timestamp.
   * Handles first login detection (T297).
   *
   * Flow:
   * 1. Generate JWT access token (15 min expiry)
   * 2. Generate refresh token (7 day expiry)
   * 3. Store refresh token in database
   * 4. Update lastLoginAt
   * 5. Return tokens + user info + requirePasswordChange flag
   *
   * @param {any} user - Validated user object (from LocalStrategy)
   * @returns {Promise<LoginResponseDto>} Access token, refresh token, and user info
   */
  async login(user: any): Promise<LoginResponseDto> {
    try {
      const payload = { username: user.username, sub: user.id, role: user.role };

      // Generate access token
      const accessToken = this.jwtService.sign(payload, {
        expiresIn: this.accessTokenExpiry,
      });

      // Generate refresh token
      const refreshToken = this.generateRefreshToken();
      const refreshTokenExpiry = new Date(Date.now() + this.refreshTokenExpiry);

      // Store refresh token in database
      await this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: refreshTokenExpiry,
        },
      });

      // Update lastLoginAt
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      this.logger.log(`User ${user.username} logged in successfully`);

      return {
        accessToken,
        refreshToken,
        requirePasswordChange: user.firstLogin === true, // T297: Force password change on first login
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          fullName: user.fullName,
        },
      };
    } catch (error) {
      this.logger.error(`Error during login for user ${user.username}:`, error);
      throw new BadRequestException('Login failed');
    }
  }

  /**
   * Refresh Tokens
   *
   * Validates refresh token and generates new access + refresh token pair.
   * Implements refresh token rotation for security (T024-T036).
   *
   * Flow:
   * 1. Validate refresh token exists and not expired
   * 2. Check not revoked
   * 3. Generate new access + refresh token pair
   * 4. Revoke old refresh token (set revokedAt, store replacedBy)
   * 5. Return new tokens
   *
   * @param {string} refreshToken - Current refresh token
   * @returns {Promise<RefreshTokenResponseDto>} New access and refresh tokens
   * @throws {UnauthorizedException} If token is invalid, expired, or revoked
   */
  async refreshTokens(refreshToken: string): Promise<RefreshTokenResponseDto> {
    try {
      // Find refresh token in database
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if token is expired
      if (new Date() > storedToken.expiresAt) {
        throw new UnauthorizedException('Refresh token expired');
      }

      // Check if token is revoked
      if (storedToken.revokedAt) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      // Check if user is still active
      if (!storedToken.user.active) {
        throw new UnauthorizedException('User account is inactive');
      }

      // Generate new tokens
      const payload = {
        username: storedToken.user.username,
        sub: storedToken.user.id,
        role: storedToken.user.role,
      };

      const newAccessToken = this.jwtService.sign(payload, {
        expiresIn: this.accessTokenExpiry,
      });

      const newRefreshToken = this.generateRefreshToken();
      const newRefreshTokenExpiry = new Date(Date.now() + this.refreshTokenExpiry);

      // Store new refresh token
      await this.prisma.refreshToken.create({
        data: {
          userId: storedToken.user.id,
          token: newRefreshToken,
          expiresAt: newRefreshTokenExpiry,
        },
      });

      // Revoke old refresh token (rotation)
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: {
          revokedAt: new Date(),
          replacedBy: newRefreshToken,
        },
      });

      this.logger.log(`Refresh tokens rotated for user ${storedToken.user.username}`);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Error refreshing tokens:', error);
      throw new UnauthorizedException('Failed to refresh tokens');
    }
  }

  /**
   * Logout
   *
   * Revokes the refresh token to invalidate the session.
   *
   * @param {string} refreshToken - Refresh token to revoke
   * @returns {Promise<{ message: string }>} Success message
   * @throws {UnauthorizedException} If token not found
   */
  async logout(refreshToken: string): Promise<{ message: string }> {
    try {
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!storedToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Revoke the token
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });

      this.logger.log(`User ${storedToken.userId} logged out successfully`);

      return { message: 'Logged out successfully' };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Error during logout:', error);
      throw new BadRequestException('Logout failed');
    }
  }

  /**
   * Change Password (T297-T299)
   *
   * Changes user password with old password verification.
   * Sets firstLogin flag to false after successful change.
   * Revokes all existing refresh tokens (force re-login on all devices).
   *
   * Flow:
   * 1. Require access token authentication
   * 2. Validate old password
   * 3. Hash new password (bcrypt, 10 rounds)
   * 4. Update User.passwordHash
   * 5. Set User.firstLogin = false
   * 6. Revoke all existing refresh tokens (force re-login on all devices)
   * 7. Return success
   *
   * @param {number} userId - User ID (from JWT)
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password (must meet complexity requirements)
   * @returns {Promise<ChangePasswordResponseDto>} Success message
   * @throws {UnauthorizedException} If old password is incorrect
   * @throws {BadRequestException} If new password doesn't meet requirements
   */
  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<ChangePasswordResponseDto> {
    try {
      // Get user with password hash
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Verify old password
      const isOldPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);

      if (!isOldPasswordValid) {
        this.logger.warn(
          `Failed password change attempt for user ${user.username}: incorrect old password`,
        );
        throw new UnauthorizedException('Old password is incorrect');
      }

      // Check if new password is same as old password
      if (oldPassword === newPassword) {
        throw new BadRequestException('New password must be different from old password');
      }

      // Hash new password (10 rounds minimum)
      const newPasswordHash = await bcrypt.hash(newPassword, this.bcryptRounds);

      // Update password and set firstLogin to false
      const wasFirstLogin = user.firstLogin;
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: newPasswordHash,
          firstLogin: false, // T298: Clear first login flag
        },
      });

      // Revoke all existing refresh tokens (force re-login on all devices)
      await this.prisma.refreshToken.updateMany({
        where: {
          userId: userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      this.logger.log(`Password changed successfully for user ${user.username}`);

      return {
        message: 'Password changed successfully',
        firstLoginUpdated: wasFirstLogin,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error changing password for user ${userId}:`, error);
      throw new BadRequestException('Failed to change password');
    }
  }

  /**
   * Hash Password
   *
   * Utility method to hash passwords with bcrypt (10 rounds minimum).
   * Used when creating new users or resetting passwords.
   *
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.bcryptRounds);
  }

  /**
   * Generate Refresh Token
   *
   * Generates a cryptographically secure random refresh token.
   *
   * @returns {string} Refresh token (64 character hex string)
   * @private
   */
  private generateRefreshToken(): string {
    return randomBytes(32).toString('hex');
  }
}
