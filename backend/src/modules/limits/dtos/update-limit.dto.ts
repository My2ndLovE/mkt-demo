import { IsNumber, Min, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating user betting limits
 *
 * Admin-only operation (T120)
 * Used to adjust weekly limits and reset weekly used amounts
 *
 * Business Rules:
 * - Sub-agents cannot have limit > parent limit
 * - weeklyUsed can be adjusted (e.g., to grant extra credit)
 * - Changes are logged in audit trail
 */
export class UpdateLimitDto {
  @ApiPropertyOptional({
    description: 'New weekly betting limit in currency units',
    example: 15000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'weeklyLimit must be a positive number' })
  weeklyLimit?: number;

  @ApiPropertyOptional({
    description: 'Current weekly used amount (admin can adjust for credit)',
    example: 5000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'weeklyUsed must be a positive number' })
  weeklyUsed?: number;
}
