import { IsOptional, IsDateString, IsInt, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportType {
  BETS = 'bets',
  WIN_LOSS = 'win_loss',
  COMMISSIONS = 'commissions',
  AGENT_PERFORMANCE = 'agent_performance',
  WEEKLY_SUMMARY = 'weekly_summary',
  DRAW_RESULTS = 'draw_results',
}

export enum ExportFormat {
  JSON = 'json',
  EXCEL = 'excel',
}

export class ReportFiltersDto {
  @ApiPropertyOptional({ enum: ReportType, description: 'Report type' })
  @IsOptional()
  @IsEnum(ReportType)
  reportType?: ReportType;

  @ApiPropertyOptional({ enum: ExportFormat, default: 'json', description: 'Export format' })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat = ExportFormat.JSON;

  @ApiPropertyOptional({ description: 'Filter from date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Filter to date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @ApiPropertyOptional({ description: 'Filter by provider ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  providerId?: number;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;
}
