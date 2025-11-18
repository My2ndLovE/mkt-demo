import { IsOptional, IsDateString, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ReportFormat {
  JSON = 'json',
  EXCEL = 'excel',
  CSV = 'csv',
}

export class ReportQueryDto {
  @ApiProperty({
    description: 'Start date for report (ISO 8601 format)',
    example: '2025-01-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'End date for report (ISO 8601 format)',
    example: '2025-01-31T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Report format',
    enum: ReportFormat,
    default: ReportFormat.JSON,
    required: false,
  })
  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat = ReportFormat.JSON;
}

export class HierarchyReportQueryDto extends ReportQueryDto {
  @ApiProperty({
    description: 'User ID for hierarchy root (defaults to current user)',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  userId?: number;
}
