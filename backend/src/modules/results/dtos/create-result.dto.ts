import {
  IsString,
  IsEnum,
  IsDateString,
  IsArray,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Game type enumeration
 */
export enum GameType {
  THREE_D = '3D',
  FOUR_D = '4D',
  FIVE_D = '5D',
  SIX_D = '6D',
}

/**
 * Sync method enumeration
 */
export enum SyncMethod {
  AUTO = 'AUTO', // Synced from API
  MANUAL = 'MANUAL', // Manually entered by admin/moderator
}

/**
 * Result status enumeration
 */
export enum ResultStatus {
  PENDING = 'PENDING', // Entered but not verified
  VERIFIED = 'VERIFIED', // Verified by admin
  FINAL = 'FINAL', // Final and processed
}

/**
 * DTO for creating a new draw result
 *
 * Used for manual result entry (T142-T150)
 * Also used by auto-sync process (T215-T224)
 *
 * Business Rules:
 * - Draw number must be unique per provider/game/date
 * - First, second, third prize must match game type digit count
 * - Starters and consolations are arrays of 10 numbers each
 * - All numbers must match the game type digit count
 */
export class CreateResultDto {
  @ApiProperty({
    description: 'Service provider ID',
    example: 'provider-123',
  })
  @IsString()
  providerId: string;

  @ApiProperty({
    description: 'Game type (3D, 4D, 5D, 6D)',
    enum: GameType,
    example: GameType.FOUR_D,
  })
  @IsEnum(GameType)
  gameType: GameType;

  @ApiProperty({
    description: 'Draw date and time (ISO 8601)',
    example: '2025-11-20T19:00:00Z',
  })
  @IsDateString()
  drawDate: string;

  @ApiProperty({
    description: 'Unique draw number/identifier',
    example: 'M-4D-20251120',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  drawNumber: string;

  @ApiProperty({
    description: 'First prize winning number',
    example: '1234',
  })
  @IsString()
  firstPrize: string;

  @ApiProperty({
    description: 'Second prize winning number',
    example: '5678',
  })
  @IsString()
  secondPrize: string;

  @ApiProperty({
    description: 'Third prize winning number',
    example: '9012',
  })
  @IsString()
  thirdPrize: string;

  @ApiProperty({
    description: 'Starter prizes (array of 10 numbers)',
    example: ['1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '0000'],
    type: [String],
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(10)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  starters: string[];

  @ApiProperty({
    description: 'Consolation prizes (array of 10 numbers)',
    example: ['1357', '2468', '1122', '3344', '5566', '7788', '9900', '1234', '5678', '9012'],
    type: [String],
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(10)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  consolations: string[];
}
