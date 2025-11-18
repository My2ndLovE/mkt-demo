import {
  IsString,
  IsEmail,
  IsNumber,
  IsBoolean,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating an existing user
 *
 * All fields are optional. Only provided fields will be updated.
 *
 * Access Control:
 * - Users can update their own profile (fullName, phone, email)
 * - Admins can update all fields including limits, commission rates, and status
 * - Cannot change username (unique identifier)
 * - Cannot change role (security)
 * - Cannot change uplineId directly (use transfer-upline endpoint)
 *
 * Business Rules:
 * - weeklyLimit changes must not violate hierarchy constraints
 * - commissionRate changes must not violate hierarchy constraints
 * - Setting active=false performs soft delete
 */
export class UpdateUserDto {
  @ApiPropertyOptional({
    description: "User's full name",
    example: 'John Doe Jr.',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({
    description: "User's phone number",
    example: '+60123456789',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    description: "User's email address",
    example: 'john.doe.jr@example.com',
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional({
    description: 'Weekly betting limit (admin only)',
    example: 15000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weeklyLimit?: number;

  @ApiPropertyOptional({
    description: 'Commission rate percentage (admin only)',
    example: 6.5,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number;

  @ApiPropertyOptional({
    description: 'Whether user can create sub-agents (admin only)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  canCreateSubs?: boolean;

  @ApiPropertyOptional({
    description: 'User active status - setting to false performs soft delete (admin only)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
