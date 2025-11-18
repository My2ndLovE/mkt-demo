/**
 * Core type definitions for the Lottery Sandbox application
 */

// ============================================================================
// User & Authentication Types
// ============================================================================

export type UserRole = 'PLAYER' | 'AGENT' | 'MODERATOR';

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  email?: string | null;
  phoneNumber?: string | null;
  parentAgentId?: number | null;
  canCreateSubs: boolean;
  firstLogin: boolean;
  weeklyLimit: number;
  weeklyUsed: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  user: User;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ============================================================================
// Provider Types
// ============================================================================

export type ProviderCode = 'M' | 'P' | 'T' | 'S';

export interface Provider {
  id: number;
  code: ProviderCode;
  name: string;
  isActive: boolean;
  drawDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Bet Types
// ============================================================================

export type GameType = '3D' | '4D' | '5D' | '6D';
export type BetType = 'BIG' | 'SMALL' | 'IBOX';
export type BetStatus = 'PENDING' | 'WON' | 'LOST' | 'CANCELLED';

export interface Bet {
  id: number;
  userId: number;
  receiptNumber: string;
  providers: ProviderCode[];
  gameType: GameType;
  betType: BetType;
  numbers: string[];
  amountPerProvider: number;
  totalAmount: number;
  drawDate: string;
  status: BetStatus;
  winAmount?: number | null;
  placedAt: string;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlaceBetRequest {
  providers: ProviderCode[];
  gameType: GameType;
  betType: BetType;
  numbers: string[];
  amountPerProvider: number;
  drawDate: string; // ISO date string
}

export interface PlaceBetResponse {
  bet: Bet;
  receipt: BetReceipt;
}

export interface BetReceipt {
  receiptNumber: string;
  bet: Bet;
  providers: Provider[];
  user: {
    username: string;
    fullName: string;
  };
}

export interface BetsListParams {
  page?: number;
  pageSize?: number;
  status?: BetStatus;
  startDate?: string;
  endDate?: string;
}

export interface BetsListResponse {
  bets: Bet[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// Draw Result Types
// ============================================================================

export interface DrawResult {
  id: number;
  providerId: number;
  provider: Provider;
  drawDate: string;
  firstPrize: string;
  secondPrize: string;
  thirdPrize: string;
  starters: string[];
  consolations: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DrawResultsListParams {
  page?: number;
  pageSize?: number;
  providerId?: number;
  startDate?: string;
  endDate?: string;
}

export interface DrawResultsListResponse {
  results: DrawResult[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// Commission Types
// ============================================================================

export interface Commission {
  id: number;
  agentId: number;
  sourceAgentId: number;
  sourceAgent: {
    id: number;
    username: string;
    fullName: string;
    role: UserRole;
  };
  betId: number;
  bet: Bet;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionsListParams {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  sourceAgentId?: number;
}

export interface CommissionsListResponse {
  commissions: Commission[];
  total: number;
  totalAmount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// Report Types
// ============================================================================

export interface SalesReport {
  totalBets: number;
  totalAmount: number;
  totalWinAmount: number;
  netProfit: number;
  betsByStatus: {
    status: BetStatus;
    count: number;
    amount: number;
  }[];
  betsByProvider: {
    provider: ProviderCode;
    count: number;
    amount: number;
  }[];
  betsByGameType: {
    gameType: GameType;
    count: number;
    amount: number;
  }[];
  dailySales: {
    date: string;
    count: number;
    amount: number;
  }[];
}

export interface WinLossReport {
  totalBets: number;
  totalWagered: number;
  totalWon: number;
  totalLost: number;
  netWinLoss: number;
  winRate: number;
  biggestWin?: Bet | null;
  byGameType: {
    gameType: GameType;
    totalBets: number;
    totalWagered: number;
    totalWon: number;
    netWinLoss: number;
  }[];
}

export interface DownlinePerformance {
  agent: User;
  totalBets: number;
  totalAmount: number;
  commissionsEarned: number;
  downlineCount: number;
  recentBets: Bet[];
}

export interface DownlinesReport {
  downlines: DownlinePerformance[];
  totalCommissions: number;
  totalDownlines: number;
}

// ============================================================================
// Agent Management Types
// ============================================================================

export interface CreateAgentRequest {
  username: string;
  password: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  role: 'PLAYER' | 'AGENT';
  canCreateSubs: boolean;
  weeklyLimit: number;
}

export interface AgentHierarchy {
  agent: User;
  children: AgentHierarchy[];
  stats: {
    totalBets: number;
    totalAmount: number;
    commissions: number;
  };
}

// ============================================================================
// Limit Types
// ============================================================================

export interface LimitInfo {
  weeklyLimit: number;
  weeklyUsed: number;
  weeklyRemaining: number;
  weeklyPercentUsed: number;
  currentWeekStart: string;
  currentWeekEnd: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiError {
  message: string;
  statusCode?: number;
  details?: unknown;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// UI State Types
// ============================================================================

export interface BetFormState {
  providers: ProviderCode[];
  gameType: GameType;
  betType: BetType;
  numbers: string[];
  amountPerProvider: number;
  drawDate: string;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}
