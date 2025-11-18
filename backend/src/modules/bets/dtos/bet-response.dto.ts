import { ApiProperty } from '@nestjs/swagger';

/**
 * Provider in bet response
 */
export class BetProviderResponseDto {
  @ApiProperty({ description: 'Provider ID', example: 'M' })
  providerId!: string;

  @ApiProperty({ description: 'Provider name', example: 'Magnum' })
  providerName!: string;

  @ApiProperty({ description: 'Amount for this provider', example: 10.0 })
  amount!: number;

  @ApiProperty({ description: 'Status for this provider', example: 'PENDING' })
  status!: string;

  @ApiProperty({ description: 'Win amount for this provider', example: 0 })
  winAmount!: number;
}

/**
 * Limits information in response
 */
export class LimitsInfoDto {
  @ApiProperty({ description: 'Weekly limit', example: 1000.0 })
  weeklyLimit!: number;

  @ApiProperty({ description: 'Weekly used (after this bet)', example: 30.0 })
  weeklyUsed!: number;

  @ApiProperty({ description: 'Remaining limit', example: 970.0 })
  remaining!: number;
}

/**
 * Bet details in response
 */
export class BetDetailsDto {
  @ApiProperty({ description: 'Bet ID', example: 1 })
  id!: number;

  @ApiProperty({ description: 'Game type', example: '4D' })
  gameType!: string;

  @ApiProperty({ description: 'Bet type', example: 'BIG' })
  betType!: string;

  @ApiProperty({ description: 'Bet numbers', example: '1234' })
  numbers!: string;

  @ApiProperty({ description: 'Total amount (sum across all providers)', example: 30.0 })
  totalAmount!: number;

  @ApiProperty({ description: 'Draw date', example: '2025-11-20' })
  drawDate!: string;

  @ApiProperty({ description: 'Bet status', example: 'PENDING' })
  status!: string;

  @ApiProperty({ description: 'Win amount', example: 0 })
  winAmount!: number;

  @ApiProperty({ description: 'Providers for this bet', type: [BetProviderResponseDto] })
  providers!: BetProviderResponseDto[];

  @ApiProperty({ description: 'Created at', example: '2025-11-18T10:30:00Z' })
  createdAt!: Date;
}

/**
 * Create Bet Response DTO
 *
 * Response after successful bet placement (T061)
 */
export class CreateBetResponseDto {
  @ApiProperty({ description: 'Receipt number', example: '20251118-00001-0001' })
  receiptNumber!: string;

  @ApiProperty({ description: 'Bet details', type: BetDetailsDto })
  bet!: BetDetailsDto;

  @ApiProperty({ description: 'Limits information', type: LimitsInfoDto })
  limits!: LimitsInfoDto;
}

/**
 * Bet list item (simplified for listing)
 */
export class BetListItemDto {
  @ApiProperty({ description: 'Bet ID', example: 1 })
  id!: number;

  @ApiProperty({ description: 'Receipt number', example: '20251118-00001-0001' })
  receiptNumber!: string;

  @ApiProperty({ description: 'Game type', example: '4D' })
  gameType!: string;

  @ApiProperty({ description: 'Bet type', example: 'BIG' })
  betType!: string;

  @ApiProperty({ description: 'Bet numbers', example: '1234' })
  numbers!: string;

  @ApiProperty({ description: 'Total amount', example: 30.0 })
  amount!: number;

  @ApiProperty({ description: 'Draw date', example: '2025-11-20' })
  drawDate!: string;

  @ApiProperty({ description: 'Bet status', example: 'PENDING' })
  status!: string;

  @ApiProperty({ description: 'Win amount', example: 0 })
  winAmount!: number;

  @ApiProperty({ description: 'Number of providers', example: 3 })
  providerCount!: number;

  @ApiProperty({ description: 'Created at', example: '2025-11-18T10:30:00Z' })
  createdAt!: Date;
}

/**
 * Paginated bet list response
 */
export class BetListResponseDto {
  @ApiProperty({ description: 'Bet items', type: [BetListItemDto] })
  data!: BetListItemDto[];

  @ApiProperty({ description: 'Pagination info' })
  pagination!: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
