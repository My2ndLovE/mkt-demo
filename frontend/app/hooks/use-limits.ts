import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { LimitInfo } from '../types';

/**
 * Get current user's limits
 */
export function useLimits() {
  return useQuery({
    queryKey: ['user', 'limits'],
    queryFn: async () => {
      const response = await apiClient.get<LimitInfo>('/users/me/limits');
      return response.data;
    },
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });
}

/**
 * Get limit status color based on percentage used
 */
export function getLimitColor(percentUsed: number): string {
  if (percentUsed >= 90) return 'text-red-600';
  if (percentUsed >= 70) return 'text-orange-600';
  if (percentUsed >= 50) return 'text-yellow-600';
  return 'text-green-600';
}

/**
 * Get limit progress bar color
 */
export function getLimitProgressColor(percentUsed: number): string {
  if (percentUsed >= 90) return 'bg-red-600';
  if (percentUsed >= 70) return 'bg-orange-600';
  if (percentUsed >= 50) return 'bg-yellow-600';
  return 'bg-green-600';
}

/**
 * Check if user can place bet of specified amount
 */
export function useCanPlaceBet(amount: number) {
  const { data: limits } = useLimits();

  if (!limits) return false;

  return limits.weeklyRemaining >= amount;
}
