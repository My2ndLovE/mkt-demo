import { IsArray, IsString, IsNumber, Min, Max, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Draw Schedule DTO
 *
 * Defines when a provider conducts lottery draws
 * - days: Array of weekday numbers (0=Sunday, 1=Monday, ..., 6=Saturday)
 * - time: Time in HH:mm format (24-hour)
 *
 * @example
 * {
 *   "days": [0, 3, 6],  // Sunday, Wednesday, Saturday
 *   "time": "19:00"     // 7:00 PM
 * }
 */
export class DrawScheduleDto {
  @ApiProperty({
    description: 'Array of weekday numbers when draws occur (0=Sunday, 1=Monday, ..., 6=Saturday)',
    example: [0, 3, 6],
    type: [Number],
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  days: number[];

  @ApiProperty({
    description: 'Draw time in HH:mm format (24-hour, Asia/Kuala_Lumpur timezone)',
    example: '19:00',
  })
  @IsString()
  time: string;
}
