import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  Min,
  Max,
  MinLength,
} from 'class-validator';

export enum UserRole {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  AGENT = 'AGENT',
}

export class CreateUserDto {
  @ApiProperty({ example: 'agent123' })
  @IsString()
  @MinLength(4)
  username: string;

  @ApiProperty({ example: 'Agent123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'AGENT', enum: UserRole })
  @IsEnum(UserRole)
  role: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 1000, description: 'Weekly betting limit' })
  @IsNumber()
  @Min(0)
  weeklyLimit: number;

  @ApiProperty({
    example: 30,
    description: 'Commission rate (0-100)',
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate: number;

  @ApiProperty({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  canCreateSubs?: boolean;

  @ApiProperty({ required: false, description: 'Upline agent ID (for sub-agents)' })
  @IsOptional()
  @IsNumber()
  uplineId?: number;
}

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weeklyLimit?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  canCreateSubs?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class UserResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  username: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty()
  weeklyLimit: number;

  @ApiProperty()
  weeklyUsed: number;

  @ApiProperty()
  commissionRate: number;

  @ApiProperty()
  canCreateSubs: boolean;

  @ApiProperty({ required: false })
  uplineId?: number;

  @ApiProperty({ required: false })
  moderatorId?: number;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
