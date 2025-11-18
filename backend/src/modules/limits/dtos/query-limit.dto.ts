import { IsOptional, IsBoolean, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO for querying user limits
 *
 * Supports filtering by limit status
 */
export class QueryLimitDto {
  @ApiPropertyOptional({
    description: 'Filter users who have exceeded their limits',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  exceeded?: boolean;

  @ApiPropertyOptional({
    description: 'Search by username or full name',
    example: 'agent_john',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
