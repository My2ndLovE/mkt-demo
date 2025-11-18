import { IsNotEmpty, IsArray, IsString, IsNumber, Min, ArrayMinSize, IsInt, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateBetDto {
  @ApiProperty({ example: 1, description: 'Service provider ID' })
  @IsInt()
  @IsNotEmpty()
  providerId: number;

  @ApiProperty({
    example: ['M', 'P', 'T'],
    description: 'Array of provider codes to bet on (e.g., ["M", "P", "T"] for Magnum, Sports Toto, DaMaCai)',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one provider must be selected' })
  @IsString({ each: true })
  providerIds: string[];

  @ApiProperty({ example: '1234', description: 'Bet number (4 digits)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}$/, { message: 'Bet number must be exactly 4 digits' })
  betNumber: string;

  @ApiProperty({ example: 'STRAIGHT', description: 'Bet type (STRAIGHT, BOX, etc.)' })
  @IsString()
  @IsNotEmpty()
  betType: string;

  @ApiProperty({ example: 10.0, description: 'Amount per provider (in MYR)' })
  @IsNumber()
  @Type(() => Number)
  @Min(1, { message: 'Minimum bet amount is RM 1.00' })
  amountPerProvider: number;

  @ApiProperty({ example: '2025-01-20', description: 'Draw date (YYYY-MM-DD)', required: false })
  @IsString()
  drawDate?: string;
}
