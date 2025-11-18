import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for checking if a bet amount is within limits
 *
 * Used before placing a bet to validate limits
 */
export class CheckLimitDto {
  @ApiProperty({
    description: 'Bet amount to check against limits',
    example: 500,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01, { message: 'amount must be greater than 0' })
  amount: number;
}

/**
 * Response DTO for limit check
 */
export interface CheckLimitResponseDto {
  allowed: boolean;
  weeklyLimit: number;
  weeklyUsed: number;
  weeklyRemaining: number;
  message?: string;
}
