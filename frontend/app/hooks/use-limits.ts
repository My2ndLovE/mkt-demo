import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';
import type { WeeklyLimit } from '../types/limit';

export function useWeeklyLimit() {
  return useQuery({
    queryKey: ['weeklyLimit'],
    queryFn: async (): Promise<WeeklyLimit> => {
      const response = await apiClient.get('/limits/balance');
      return response.data;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}
