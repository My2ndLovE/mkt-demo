import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type {
  Commission,
  CommissionsListParams,
  CommissionsListResponse,
} from '../types';

/**
 * Get commissions list query
 */
export function useCommissions(params?: CommissionsListParams) {
  return useQuery({
    queryKey: ['commissions', params],
    queryFn: async () => {
      const response = await apiClient.get<CommissionsListResponse>(
        '/commissions',
        { params }
      );
      return response.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Get commission by ID query
 */
export function useCommission(id: number) {
  return useQuery({
    queryKey: ['commissions', id],
    queryFn: async () => {
      const response = await apiClient.get<Commission>(`/commissions/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Get total commissions earned
 */
export function useTotalCommissions(params?: CommissionsListParams) {
  return useQuery({
    queryKey: ['commissions', 'total', params],
    queryFn: async () => {
      const response = await apiClient.get<CommissionsListResponse>(
        '/commissions',
        { params }
      );
      return response.data.totalAmount;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Get recent commissions (for dashboard)
 */
export function useRecentCommissions(limit = 5) {
  return useQuery({
    queryKey: ['commissions', 'recent', limit],
    queryFn: async () => {
      const response = await apiClient.get<CommissionsListResponse>(
        '/commissions',
        { params: { page: 1, pageSize: limit } }
      );
      return response.data.commissions;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
