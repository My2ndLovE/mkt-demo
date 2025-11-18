import {
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  MaxLength,
  MinLength,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DrawScheduleDto } from './draw-schedule.dto';

/**
 * Supported game types
 */
export enum GameType {
  THREE_D = '3D',
  FOUR_D = '4D',
  FIVE_D = '5D',
  SIX_D = '6D',
}

/**
 * Supported bet types
 */
export enum BetType {
  BIG = 'BIG',
  SMALL = 'SMALL',
  IBOX = 'IBOX',
}

/**
 * Country codes
 */
export enum Country {
  MY = 'MY', // Malaysia
  SG = 'SG', // Singapore
}

/**
 * DTO for creating a new service provider
 *
 * Service providers are lottery operators (e.g., Magnum, Sports Toto, Damacai, Singapore Pools)
 * Admin-only operation (T090-T096)
 *
 * CRITICAL: apiKey must be encrypted using EncryptionService before storing (T237)
 *
 * Business Rules:
 * - code must be unique (e.g., M, P, T, S)
 * - availableGames must be non-empty
 * - betTypes must be non-empty
 * - drawSchedule must be valid
 * - apiKey is encrypted at rest
 */
export class CreateProviderDto {
  @ApiProperty({
    description: 'Unique provider code (1-10 characters)',
    example: 'M',
    minLength: 1,
    maxLength: 10,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  code: string;

  @ApiProperty({
    description: 'Provider display name',
    example: 'Magnum 4D',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Country code (ISO 3166-1 alpha-2)',
    enum: Country,
    example: Country.MY,
  })
  @IsEnum(Country)
  country: Country;

  @ApiProperty({
    description: 'Available game types for this provider',
    example: ['3D', '4D', '5D', '6D'],
    type: [String],
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(GameType, { each: true })
  availableGames: GameType[];

  @ApiProperty({
    description: 'Available bet types for this provider',
    example: ['BIG', 'SMALL', 'IBOX'],
    type: [String],
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(BetType, { each: true })
  betTypes: BetType[];

  @ApiProperty({
    description: 'Draw schedule configuration',
    type: DrawScheduleDto,
  })
  @ValidateNested()
  @Type(() => DrawScheduleDto)
  drawSchedule: DrawScheduleDto;

  @ApiPropertyOptional({
    description: 'API endpoint for result synchronization (optional)',
    example: 'https://api.magayo.com/lottery/results',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  apiEndpoint?: string;

  @ApiPropertyOptional({
    description: 'API key for authentication (will be encrypted before storage)',
    example: 'sk_live_1234567890abcdef',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  apiKey?: string;
}
