import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type {
  SalesReport,
  WinLossReport,
  DownlinesReport,
} from '../types';

interface ReportParams {
  startDate?: string;
  endDate?: string;
}

/**
 * Get sales report query
 */
export function useSalesReport(params?: ReportParams) {
  return useQuery({
    queryKey: ['reports', 'sales', params],
    queryFn: async () => {
      const response = await apiClient.get<SalesReport>('/reports/sales', {
        params,
      });
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get win/loss report query
 */
export function useWinLossReport(params?: ReportParams) {
  return useQuery({
    queryKey: ['reports', 'win-loss', params],
    queryFn: async () => {
      const response = await apiClient.get<WinLossReport>('/reports/win-loss', {
        params,
      });
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get downlines report query
 */
export function useDownlinesReport(params?: ReportParams) {
  return useQuery({
    queryKey: ['reports', 'downlines', params],
    queryFn: async () => {
      const response = await apiClient.get<DownlinesReport>(
        '/reports/downlines',
        { params }
      );
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
