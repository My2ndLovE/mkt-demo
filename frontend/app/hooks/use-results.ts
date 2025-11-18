import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type {
  DrawResult,
  DrawResultsListParams,
  DrawResultsListResponse,
} from '../types';

/**
 * Get draw results list query
 */
export function useResults(params?: DrawResultsListParams) {
  return useQuery({
    queryKey: ['results', params],
    queryFn: async () => {
      const response = await apiClient.get<DrawResultsListResponse>('/results', {
        params,
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get result by ID query
 */
export function useResult(id: number | string) {
  return useQuery({
    queryKey: ['results', id],
    queryFn: async () => {
      const response = await apiClient.get<DrawResult>(`/results/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Get latest results (for dashboard)
 */
export function useLatestResults(limit = 5) {
  return useQuery({
    queryKey: ['results', 'latest', limit],
    queryFn: async () => {
      const response = await apiClient.get<DrawResultsListResponse>('/results', {
        params: { page: 1, pageSize: limit },
      });
      return response.data.results;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get results by date
 */
export function useResultsByDate(date: string) {
  return useQuery({
    queryKey: ['results', 'date', date],
    queryFn: async () => {
      const response = await apiClient.get<DrawResult[]>(`/results/date/${date}`);
      return response.data;
    },
    enabled: !!date,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
