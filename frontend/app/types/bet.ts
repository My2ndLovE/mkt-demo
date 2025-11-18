export type GameType = '3D' | '4D' | '5D' | '6D';
export type BetType = 'BIG' | 'SMALL' | 'IBOX';
export type BetStatus = 'PENDING' | 'WON' | 'LOST' | 'CANCELLED' | 'PARTIAL';

export interface CreateBetRequest {
  providers: string[];
  gameType: GameType;
  betType: BetType;
  numbers: string;
  amount: number;
  drawDate: string;
}

export interface BetResult {
  provider: string;
  status: string;
  winAmount: number;
  prizeCategory?: string;
}

export interface Bet {
  id: number;
  providers: string[];
  gameType: GameType;
  betType: BetType;
  numbers: string;
  amount: number;
  drawDate: string;
  status: BetStatus;
  receiptNumber: string;
  results?: BetResult[];
  createdAt: string;
  updatedAt: string;
}

export interface BetFilters {
  status?: BetStatus;
  gameType?: GameType;
  startDate?: string;
  endDate?: string;
}
