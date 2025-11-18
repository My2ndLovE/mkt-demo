import { IsOptional, IsString, IsInt, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryResultsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by provider ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  providerId?: number;

  @ApiPropertyOptional({ description: 'Filter by draw number' })
  @IsOptional()
  @IsString()
  drawNumber?: string;

  @ApiPropertyOptional({ description: 'Filter by draw date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  drawDate?: string;

  @ApiPropertyOptional({ description: 'Filter from date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Filter to date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
