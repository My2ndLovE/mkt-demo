import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { toast } from '../stores/ui-store';
import type {
  PlaceBetRequest,
  PlaceBetResponse,
  Bet,
  BetReceipt,
  BetsListParams,
  BetsListResponse,
} from '../types';

/**
 * Place bet mutation
 */
export function usePlaceBet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PlaceBetRequest) => {
      const response = await apiClient.post<PlaceBetResponse>('/bets', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bets'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'limits'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      toast.success(`Bet placed successfully! Receipt: ${data.receipt.receiptNumber}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to place bet');
    },
  });
}

/**
 * Get bets list query
 */
export function useBets(params?: BetsListParams) {
  return useQuery({
    queryKey: ['bets', params],
    queryFn: async () => {
      const response = await apiClient.get<BetsListResponse>('/bets', {
        params,
      });
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Get bet by ID query
 */
export function useBet(id: number | string) {
  return useQuery({
    queryKey: ['bets', id],
    queryFn: async () => {
      const response = await apiClient.get<Bet>(`/bets/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Get bet receipt query
 */
export function useBetReceipt(receiptNumber: string) {
  return useQuery({
    queryKey: ['bets', 'receipt', receiptNumber],
    queryFn: async () => {
      const response = await apiClient.get<BetReceipt>(
        `/bets/receipt/${receiptNumber}`
      );
      return response.data;
    },
    enabled: !!receiptNumber,
  });
}

/**
 * Cancel bet mutation
 */
export function useCancelBet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (betId: number) => {
      const response = await apiClient.post<Bet>(`/bets/${betId}/cancel`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bets'] });
      queryClient.invalidateQueries({ queryKey: ['bets', data.id] });
      queryClient.invalidateQueries({ queryKey: ['user', 'limits'] });
      toast.success('Bet cancelled successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel bet');
    },
  });
}

/**
 * Get recent bets (for dashboard)
 */
export function useRecentBets(limit = 5) {
  return useQuery({
    queryKey: ['bets', 'recent', limit],
    queryFn: async () => {
      const response = await apiClient.get<BetsListResponse>('/bets', {
        params: { page: 1, pageSize: limit },
      });
      return response.data.bets;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}
