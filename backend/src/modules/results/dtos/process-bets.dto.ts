import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for bet processing
 */
export interface ProcessBetsResponseDto {
  resultId: number;
  processedBets: number;
  wonBets: number;
  lostBets: number;
  totalWinAmount: number;
  commissionsCreated: number;
  processingTime: number; // milliseconds
}
