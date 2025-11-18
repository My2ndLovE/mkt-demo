import { IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelBetDto {
  @ApiProperty({ example: 1, description: 'Bet ID to cancel' })
  @IsInt()
  @IsNotEmpty()
  betId: number;
}
