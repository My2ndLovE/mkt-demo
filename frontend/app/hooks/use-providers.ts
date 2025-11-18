import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';
import type { ServiceProvider } from '../types/provider';

export function useProviders(activeOnly = true) {
  return useQuery({
    queryKey: ['providers', activeOnly],
    queryFn: async (): Promise<ServiceProvider[]> => {
      const response = await apiClient.get('/providers', {
        params: { active: activeOnly },
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useProvider(id: string) {
  return useQuery({
    queryKey: ['provider', id],
    queryFn: async (): Promise<ServiceProvider> => {
      const response = await apiClient.get(`/providers/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}
