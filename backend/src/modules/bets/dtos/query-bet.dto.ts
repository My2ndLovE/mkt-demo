import { IsOptional, IsEnum, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Query Bet DTO
 *
 * Query parameters for filtering and paginating bets
 */
export class QueryBetDto {
  @ApiPropertyOptional({
    description: 'Filter by bet status',
    enum: ['PENDING', 'WON', 'LOST', 'CANCELLED'],
    example: 'PENDING',
  })
  @IsOptional()
  @IsEnum(['PENDING', 'WON', 'LOST', 'CANCELLED'])
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by game type',
    enum: ['3D', '4D', '5D', '6D'],
    example: '4D',
  })
  @IsOptional()
  @IsEnum(['3D', '4D', '5D', '6D'])
  gameType?: string;

  @ApiPropertyOptional({
    description: 'Filter by start date (inclusive)',
    example: '2025-11-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date (inclusive)',
    example: '2025-11-30',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
