import { IsNotEmpty, IsString, IsInt, IsDateString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateResultDto {
  @ApiProperty({ example: 1, description: 'Service provider ID' })
  @IsInt()
  @IsNotEmpty()
  providerId: number;

  @ApiProperty({ example: '6789/25', description: 'Draw number (unique per provider)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  drawNumber: string;

  @ApiProperty({ example: '2025-01-20', description: 'Draw date (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  drawDate: string;

  @ApiProperty({ example: '1234,5678,9012,3456,7890', description: 'Winning numbers (comma-separated)' })
  @IsString()
  @IsNotEmpty()
  winningNumbers: string;

  @ApiPropertyOptional({ example: '4321,8765', description: 'Special numbers (comma-separated)' })
  @IsString()
  @IsOptional()
  specialNumbers?: string;
}
