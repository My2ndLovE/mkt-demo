import {
  IsEnum,
  IsString,
  IsArray,
  IsNumber,
  IsDateString,
  IsNotEmpty,
  ArrayMinSize,
  ArrayMaxSize,
  Min,
  Validate,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsValidBetNumber, IsFutureDrawDate } from '../validators';

/**
 * Place Bet DTO (T051-T054)
 *
 * Data Transfer Object for bet placement.
 * Implements OPTION A: Multi-provider support (providerIds array)
 *
 * Validation Rules:
 * - gameType: 3D, 4D, 5D, or 6D
 * - betType: BIG, SMALL, or IBOX
 * - numbers: Must match game type length (3-6 digits)
 * - providerIds: 1-4 provider IDs (M, P, T, S)
 * - amountPerProvider: Minimum RM 1.00
 * - drawDate: Must be future date
 */
export class PlaceBetDto {
  @ApiProperty({
    description: 'Game type (3D, 4D, 5D, 6D)',
    enum: ['3D', '4D', '5D', '6D'],
    example: '4D',
  })
  @IsEnum(['3D', '4D', '5D', '6D'], {
    message: 'Game type must be one of: 3D, 4D, 5D, 6D',
  })
  gameType!: string;

  @ApiProperty({
    description: 'Bet type (BIG, SMALL, IBOX)',
    enum: ['BIG', 'SMALL', 'IBOX'],
    example: 'BIG',
  })
  @IsEnum(['BIG', 'SMALL', 'IBOX'], {
    message: 'Bet type must be one of: BIG, SMALL, IBOX',
  })
  betType!: string;

  @ApiProperty({
    description: 'Bet numbers (3-6 digits depending on game type)',
    example: '1234',
    pattern: '^\\d{3,6}$',
  })
  @IsString()
  @IsNotEmpty({ message: 'Numbers cannot be empty' })
  @Validate(IsValidBetNumber, {
    message: 'Numbers must match game type format (3D: 3 digits, 4D: 4 digits, etc.)',
  })
  numbers!: string;

  @ApiProperty({
    description: 'Array of provider IDs to place bet with (OPTION A)',
    example: ['M', 'P', 'T'],
    type: [String],
    minItems: 1,
    maxItems: 4,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one provider must be selected' })
  @ArrayMaxSize(4, { message: 'Maximum 4 providers allowed' })
  @IsString({ each: true })
  providerIds!: string[];

  @ApiProperty({
    description: 'Bet amount for EACH provider (minimum RM 1.00)',
    example: 10.0,
    minimum: 1,
  })
  @IsNumber({}, { message: 'Amount per provider must be a number' })
  @Min(1, { message: 'Minimum bet amount is RM 1.00 per provider' })
  amountPerProvider!: number;

  @ApiProperty({
    description: 'Draw date (must be future date)',
    example: '2025-11-20',
    format: 'date',
  })
  @IsDateString({}, { message: 'Draw date must be a valid date string (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'Draw date cannot be empty' })
  @Validate(IsFutureDrawDate, {
    message: 'Draw date must be in the future',
  })
  drawDate!: string;
}
