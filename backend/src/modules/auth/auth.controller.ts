import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  LoginResponseDto,
  RefreshTokenDto,
  RefreshTokenResponseDto,
  ChangePasswordDto,
  ChangePasswordResponseDto,
} from './dtos/auth.dto';

/**
 * Authentication Controller
 *
 * Handles all authentication endpoints:
 * - POST /auth/login - User login with username/password (T024-T036)
 * - POST /auth/refresh - Refresh access token using refresh token
 * - POST /auth/logout - Logout and revoke refresh token
 * - POST /auth/change-password - Change password with old password verification (T297-T299)
 *
 * Security features:
 * - Rate limiting on login endpoint (5 attempts/minute)
 * - JWT authentication for protected routes
 * - Password complexity validation
 * - Refresh token rotation
 *
 * @class AuthController
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Login
   *
   * Authenticates user with username and password.
   * Returns JWT access token and refresh token.
   * Detects first login and sets requirePasswordChange flag (T297).
   *
   * Rate limited to 5 attempts per minute for security.
   *
   * @param {LoginDto} loginDto - Username and password
   * @param {Request} req - Request object (user attached by LocalAuthGuard)
   * @returns {Promise<LoginResponseDto>} Access token, refresh token, and user info
   *
   * @example Request
   * ```json
   * {
   *   "username": "agent001",
   *   "password": "SecurePass123!"
   * }
   * ```
   *
   * @example Response
   * ```json
   * {
   *   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "refreshToken": "a1b2c3d4e5f6...",
   *   "requirePasswordChange": false,
   *   "user": {
   *     "id": 1,
   *     "username": "agent001",
   *     "role": "AGENT",
   *     "fullName": "John Doe"
   *   }
   * }
   * ```
   */
  @ApiOperation({ summary: 'Login with username and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  @UseGuards(AuthGuard('local'))
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Request() req): Promise<LoginResponseDto> {
    return this.authService.login(req.user);
  }

  /**
   * Refresh Tokens
   *
   * Refreshes access token using valid refresh token.
   * Implements token rotation - old refresh token is revoked.
   *
   * @param {RefreshTokenDto} refreshTokenDto - Refresh token
   * @returns {Promise<RefreshTokenResponseDto>} New access and refresh tokens
   *
   * @example Request
   * ```json
   * {
   *   "refreshToken": "a1b2c3d4e5f6..."
   * }
   * ```
   *
   * @example Response
   * ```json
   * {
   *   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "refreshToken": "x7y8z9a0b1c2..."
   * }
   * ```
   */
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
    type: RefreshTokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  /**
   * Logout
   *
   * Logs out user by revoking the refresh token.
   * Access token will expire naturally (15 minutes).
   *
   * @param {RefreshTokenDto} refreshTokenDto - Refresh token to revoke
   * @returns {Promise<{ message: string }>} Success message
   *
   * @example Request
   * ```json
   * {
   *   "refreshToken": "a1b2c3d4e5f6..."
   * }
   * ```
   *
   * @example Response
   * ```json
   * {
   *   "message": "Logged out successfully"
   * }
   * ```
   */
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Body() refreshTokenDto: RefreshTokenDto): Promise<{ message: string }> {
    return this.authService.logout(refreshTokenDto.refreshToken);
  }

  /**
   * Change Password (T297-T299)
   *
   * Changes user password with old password verification.
   * Sets firstLogin flag to false after successful change.
   * Revokes all existing refresh tokens (forces re-login on all devices).
   *
   * Requires valid JWT access token (user must be authenticated).
   *
   * Password complexity requirements:
   * - Minimum 8 characters
   * - At least 1 uppercase letter
   * - At least 1 lowercase letter
   * - At least 1 number
   * - At least 1 special character (!@#$%^&*)
   *
   * @param {ChangePasswordDto} changePasswordDto - Old and new passwords
   * @param {Request} req - Request object (user attached by JwtAuthGuard)
   * @returns {Promise<ChangePasswordResponseDto>} Success message
   *
   * @example Request
   * ```json
   * {
   *   "oldPassword": "OldPassword123!",
   *   "newPassword": "NewSecurePass456!"
   * }
   * ```
   *
   * @example Response
   * ```json
   * {
   *   "message": "Password changed successfully",
   *   "firstLoginUpdated": true
   * }
   * ```
   */
  @ApiOperation({ summary: 'Change password with old password verification' })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    type: ChangePasswordResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized or incorrect old password' })
  @ApiResponse({ status: 400, description: 'Invalid password format' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @Post('change-password')
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() req,
  ): Promise<ChangePasswordResponseDto> {
    return this.authService.changePassword(
      req.user.id,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
  }
}
