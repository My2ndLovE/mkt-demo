import { IsString, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum SyncProvider {
  MAGAYO = 'magayo',
  // Future: Add more providers
}

export class ManualSyncDto {
  @ApiProperty({
    description: 'Provider code to sync (e.g., SG, MY)',
    example: 'SG',
  })
  @IsString()
  providerCode: string;

  @ApiProperty({
    description: 'Draw date to sync (ISO 8601)',
    example: '2025-01-18',
  })
  @IsDateString()
  drawDate: string;

  @ApiProperty({
    description: 'Sync provider API',
    enum: SyncProvider,
    default: SyncProvider.MAGAYO,
  })
  @IsEnum(SyncProvider)
  syncProvider?: SyncProvider = SyncProvider.MAGAYO;
}

export interface MagayoResultResponse {
  provider: string;
  drawDate: string;
  drawNumber: string;
  prizes: {
    first: string;
    second: string;
    third: string;
    starter: string[];
    consolation: string[];
  };
}

export interface SyncResult {
  success: boolean;
  provider: string;
  drawDate: string;
  resultId?: number;
  error?: string;
  betsProcessed?: number;
}
