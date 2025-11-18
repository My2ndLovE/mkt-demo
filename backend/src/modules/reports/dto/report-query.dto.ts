import {
  IsOptional,
  IsDateString,
  IsEnum,
  IsNumber,
  Min,
  Max,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { BadRequestException } from '@nestjs/common';

export enum ReportFormat {
  JSON = 'json',
  EXCEL = 'excel',
  CSV = 'csv',
}

// FIX M-2: Custom validator to ensure endDate is after startDate
@ValidatorConstraint({ name: 'IsAfterDate', async: false })
export class IsAfterDate implements ValidatorConstraintInterface {
  validate(endDate: string, args: ValidationArguments) {
    const [startDateField] = args.constraints;
    const startDate = (args.object as Record<string, unknown>)[startDateField];

    if (!startDate || !endDate) return true;

    const start = new Date(startDate as string);
    const end = new Date(endDate);

    // Check for invalid dates
    if (isNaN(start.getTime())) {
      throw new BadRequestException('Invalid startDate format. Use ISO 8601 format.');
    }
    if (isNaN(end.getTime())) {
      throw new BadRequestException('Invalid endDate format. Use ISO 8601 format.');
    }

    return end >= start;
  }

  defaultMessage() {
    return 'endDate must be equal to or after startDate';
  }
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
  @Validate(IsAfterDate, ['startDate'], {
    message: 'endDate must be equal to or after startDate',
  })
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

  @ApiProperty({
    description: 'Page number (1-indexed)',
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of records per page',
    example: 100,
    default: 100,
    minimum: 1,
    maximum: 1000,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  pageSize?: number = 100;
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

export interface PaginationMetadata {
  page: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
