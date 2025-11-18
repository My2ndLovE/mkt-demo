import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsDateString,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsEnum,
  IsOptional,
  IsNumber,
} from 'class-validator';

export enum SyncMethod {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
}

export class CreateDrawResultDto {
  @ApiProperty({ example: 'M' })
  @IsString()
  providerId: string;

  @ApiProperty({ example: '4D' })
  @IsEnum(['3D', '4D', '5D', '6D'])
  gameType: string;

  @ApiProperty({ example: '2025-11-20T19:00:00Z' })
  @IsDateString()
  drawDate: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  firstPrize: string;

  @ApiProperty({ example: '5678' })
  @IsString()
  secondPrize: string;

  @ApiProperty({ example: '9012' })
  @IsString()
  thirdPrize: string;

  @ApiProperty({
    example: ['1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '0000'],
    description: 'Array of 10 starter prizes',
  })
  @IsArray()
  @ArrayMinSize(10)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  starters: string[];

  @ApiProperty({
    example: ['1234', '2345', '3456', '4567', '5678', '6789', '7890', '8901', '9012', '0123'],
    description: 'Array of 10 consolation prizes',
  })
  @IsArray()
  @ArrayMinSize(10)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  consolations: string[];
}

export class DrawResultResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  providerId: string;

  @ApiProperty()
  providerName: string;

  @ApiProperty()
  gameType: string;

  @ApiProperty()
  drawDate: Date;

  @ApiProperty()
  drawNumber: string;

  @ApiProperty()
  firstPrize: string;

  @ApiProperty()
  secondPrize: string;

  @ApiProperty()
  thirdPrize: string;

  @ApiProperty()
  starters: string[];

  @ApiProperty()
  consolations: string[];

  @ApiProperty()
  syncMethod: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  syncedAt: Date;

  @ApiProperty()
  processedBets?: number;
}
