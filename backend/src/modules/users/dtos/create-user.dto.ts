import {
  IsString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * User roles enumeration
 * Aligned with Prisma schema User.role field
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  AGENT = 'AGENT',
}

/**
 * DTO for creating a new user
 *
 * Supports three types of user creation:
 * 1. ADMIN - Created by system, no upline
 * 2. MODERATOR - Created by admin, no upline, manages agents
 * 3. AGENT - Created by admin/moderator or parent agent, requires uplineId
 *
 * Business Rules:
 * - Username must be unique (3-50 chars)
 * - ADMIN/MODERATOR cannot have uplineId
 * - AGENT must have uplineId
 * - Default password generated as: username + 4-digit random (e.g., "agent123_9472")
 * - firstLogin flag set to true on creation
 * - Sub-agent creation validates parent's canCreateSubs, weeklyLimit, commissionRate
 */
export class CreateUserDto {
  @ApiProperty({
    description: 'Unique username for the user (3-50 characters)',
    example: 'agent_john_001',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty({
    description: 'User role: ADMIN, MODERATOR, or AGENT',
    enum: UserRole,
    example: UserRole.AGENT,
  })
  @IsEnum(UserRole, { message: 'role must be one of: ADMIN, MODERATOR, AGENT' })
  role: UserRole;

  @ApiProperty({
    description: "User's full name",
    example: 'John Doe',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  fullName: string;

  @ApiPropertyOptional({
    description: "User's phone number (optional, E.164 format recommended)",
    example: '+60123456789',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    description: "User's email address (optional)",
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional({
    description:
      'ID of the upline/parent agent (required for AGENT role, must be null for ADMIN/MODERATOR)',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  @ValidateIf((o) => o.role === UserRole.AGENT)
  uplineId?: number;

  @ApiPropertyOptional({
    description:
      'ID of the moderator managing this agent (required for AGENT, inherited from upline if not specified)',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  moderatorId?: number;

  @ApiProperty({
    description:
      'Weekly betting limit in currency units (must be <= parent weeklyLimit for sub-agents)',
    example: 10000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0, { message: 'weeklyLimit must be a positive number' })
  weeklyLimit: number;

  @ApiProperty({
    description:
      'Commission rate percentage (0-100, must be <= parent commissionRate for sub-agents)',
    example: 5.5,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0, { message: 'commissionRate must be between 0 and 100' })
  @Max(100, { message: 'commissionRate must be between 0 and 100' })
  commissionRate: number;

  @ApiProperty({
    description: 'Whether this user can create sub-agents (AGENT role only)',
    example: true,
  })
  @IsBoolean()
  canCreateSubs: boolean;
}
