import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsArray,
  IsDateString,
  IsEnum,
  Min,
  ArrayMinSize,
} from 'class-validator';

export enum GameType {
  THREE_D = '3D',
  FOUR_D = '4D',
  FIVE_D = '5D',
  SIX_D = '6D',
}

export enum BetType {
  BIG = 'BIG',
  SMALL = 'SMALL',
  IBOX = 'IBOX',
}

export class CreateBetDto {
  @ApiProperty({
    example: ['M', 'P', 'T'],
    description: 'Array of provider codes',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  providers: string[];

  @ApiProperty({ example: '4D', enum: GameType })
  @IsEnum(GameType)
  gameType: string;

  @ApiProperty({ example: 'BIG', enum: BetType })
  @IsEnum(BetType)
  betType: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  numbers: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: '2025-11-20T19:00:00Z' })
  @IsDateString()
  drawDate: string;
}

export class CancelBetDto {
  @ApiProperty({ example: 'BET-20251118193045-123-a4f3c2' })
  @IsString()
  receiptNumber: string;
}

export class BetResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  providers: string[];

  @ApiProperty()
  gameType: string;

  @ApiProperty()
  betType: string;

  @ApiProperty()
  numbers: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  drawDate: Date;

  @ApiProperty()
  status: string;

  @ApiProperty()
  receiptNumber: string;

  @ApiProperty({ required: false })
  results?: Array<{
    provider: string;
    status: string;
    winAmount: number;
    prizeCategory?: string;
  }>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
