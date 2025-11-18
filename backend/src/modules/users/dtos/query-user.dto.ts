import { IsOptional, IsEnum, IsNumber, IsBoolean, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from './create-user.dto';

/**
 * Sort field options for user queries
 */
export enum UserSortField {
  CREATED_AT = 'createdAt',
  USERNAME = 'username',
  FULL_NAME = 'fullName',
  WEEKLY_LIMIT = 'weeklyLimit',
  COMMISSION_RATE = 'commissionRate',
}

/**
 * Sort order options
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * DTO for querying/listing users with pagination, filtering, and sorting
 *
 * Features:
 * - Pagination: page and limit parameters
 * - Filtering: by role, moderatorId, uplineId, active status, search term
 * - Sorting: by multiple fields in ascending/descending order
 *
 * Examples:
 * - GET /users?role=AGENT&active=true&page=1&limit=20
 * - GET /users?moderatorId=5&sortBy=weeklyLimit&sortOrder=desc
 * - GET /users?uplineId=10&search=john
 * - GET /users?active=false (soft-deleted users)
 */
export class QueryUserDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by user role',
    enum: UserRole,
    example: UserRole.AGENT,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Filter by moderator ID (agents managed by this moderator)',
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  moderatorId?: number;

  @ApiPropertyOptional({
    description: 'Filter by upline ID (direct children of this agent)',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  uplineId?: number;

  @ApiPropertyOptional({
    description: 'Filter by active status (false = soft-deleted users)',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  active?: boolean = true;

  @ApiPropertyOptional({
    description: 'Search by username or full name (case-insensitive partial match)',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: UserSortField,
    example: UserSortField.CREATED_AT,
    default: UserSortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(UserSortField)
  sortBy?: UserSortField = UserSortField.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    example: SortOrder.DESC,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}
