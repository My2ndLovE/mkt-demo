import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Country } from './create-provider.dto';

/**
 * DTO for querying service providers
 *
 * Supports filtering and searching providers
 */
export class QueryProviderDto {
  @ApiPropertyOptional({
    description: 'Filter by country code',
    enum: Country,
    example: Country.MY,
  })
  @IsOptional()
  @IsEnum(Country)
  country?: Country;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({
    description: 'Search by name or code',
    example: 'Magnum',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
