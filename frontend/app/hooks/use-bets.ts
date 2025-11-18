import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import type { Bet, CreateBetRequest, BetFilters } from '../types/bet';

export function useBets(filters?: BetFilters) {
  return useQuery({
    queryKey: ['bets', filters],
    queryFn: async (): Promise<Bet[]> => {
      const response = await apiClient.get('/bets', { params: filters });
      return response.data;
    },
  });
}

export function useBetByReceipt(receiptNumber: string) {
  return useQuery({
    queryKey: ['bet', receiptNumber],
    queryFn: async (): Promise<Bet> => {
      const response = await apiClient.get(`/bets/receipt/${receiptNumber}`);
      return response.data;
    },
    enabled: !!receiptNumber,
  });
}

export function usePlaceBet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bet: CreateBetRequest): Promise<Bet> => {
      const response = await apiClient.post('/bets', bet);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate bets and limits to refresh data
      queryClient.invalidateQueries({ queryKey: ['bets'] });
      queryClient.invalidateQueries({ queryKey: ['weeklyLimit'] });
    },
  });
}

export function useCancelBet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (receiptNumber: string): Promise<Bet> => {
      const response = await apiClient.post('/bets/cancel', { receiptNumber });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bets'] });
      queryClient.invalidateQueries({ queryKey: ['weeklyLimit'] });
    },
  });
}
