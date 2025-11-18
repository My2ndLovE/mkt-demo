import { IsOptional, IsString, IsEnum, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export enum BetStatus {
  PENDING = 'PENDING',
  WON = 'WON',
  LOST = 'LOST',
  CANCELLED = 'CANCELLED',
}

export class QueryBetsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: BetStatus, description: 'Filter by bet status' })
  @IsOptional()
  @IsEnum(BetStatus)
  status?: BetStatus;

  @ApiPropertyOptional({ description: 'Filter by bet number' })
  @IsOptional()
  @IsString()
  betNumber?: string;

  @ApiPropertyOptional({ description: 'Filter by draw date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  drawDate?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID (admin/moderator only)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @ApiPropertyOptional({ description: 'Filter by provider ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  providerId?: number;
}
