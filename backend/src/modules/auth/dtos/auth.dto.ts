import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

/**
 * Login DTO
 *
 * Data Transfer Object for user login requests.
 * Validates username and password format.
 *
 * @class LoginDto
 */
export class LoginDto {
  @ApiProperty({
    description: 'Username',
    example: 'agent001',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'Password (minimum 8 characters)',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;
}

/**
 * Login Response DTO
 *
 * Response data for successful login.
 * Includes access token, refresh token, and user information.
 *
 * @class LoginResponseDto
 */
export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token (15 minutes expiry)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token (7 days expiry)',
    example: 'refresh_token_abc123...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Whether password change is required (true if first login)',
    example: false,
  })
  requirePasswordChange: boolean;

  @ApiProperty({
    description: 'User information',
    example: {
      id: 1,
      username: 'agent001',
      role: 'AGENT',
      fullName: 'John Doe',
    },
  })
  user: {
    id: number;
    username: string;
    role: string;
    fullName: string;
  };
}

/**
 * Refresh Token DTO
 *
 * Data Transfer Object for token refresh requests.
 *
 * @class RefreshTokenDto
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
    example: 'refresh_token_abc123...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

/**
 * Refresh Token Response DTO
 *
 * Response data for successful token refresh.
 *
 * @class RefreshTokenResponseDto
 */
export class RefreshTokenResponseDto {
  @ApiProperty({
    description: 'New JWT access token (15 minutes expiry)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'New refresh token (7 days expiry)',
    example: 'refresh_token_xyz789...',
  })
  refreshToken: string;
}

/**
 * Change Password DTO
 *
 * Data Transfer Object for password change requests.
 * Enforces password complexity requirements (T298):
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character (!@#$%^&*)
 *
 * @class ChangePasswordDto
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'OldPassword123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({
    description: 'New password (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)',
    example: 'NewSecurePass456!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/, {
    message:
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (!@#$%^&*)',
  })
  newPassword: string;
}

/**
 * Change Password Response DTO
 *
 * Response data for successful password change.
 *
 * @class ChangePasswordResponseDto
 */
export class ChangePasswordResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Password changed successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Whether first login flag was updated',
    example: true,
  })
  firstLoginUpdated: boolean;
}
