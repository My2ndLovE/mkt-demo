import { PartialType } from '@nestjs/swagger';
import { CreateProviderDto } from './create-provider.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating an existing service provider
 *
 * All fields are optional (partial update)
 * Admin-only operation (T093)
 *
 * CRITICAL: If apiKey is provided, it will be encrypted before storage
 */
export class UpdateProviderDto extends PartialType(CreateProviderDto) {
  @ApiPropertyOptional({
    description: 'Whether the provider is active (soft delete)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
