import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { Provider } from '../types';

/**
 * Get all providers query
 */
export function useProviders() {
  return useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const response = await apiClient.get<Provider[]>('/providers');
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (providers don't change often)
  });
}

/**
 * Get active providers only
 */
export function useActiveProviders() {
  return useQuery({
    queryKey: ['providers', 'active'],
    queryFn: async () => {
      const response = await apiClient.get<Provider[]>('/providers');
      return response.data.filter((p) => p.isActive);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Get provider by ID query
 */
export function useProvider(id: number) {
  return useQuery({
    queryKey: ['providers', id],
    queryFn: async () => {
      const response = await apiClient.get<Provider>(`/providers/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Check if a provider has a draw on a specific date
 */
export function isDrawDay(provider: Provider, date: Date): boolean {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  return provider.drawDays.includes(dayOfWeek);
}

/**
 * Get next draw date for a provider
 */
export function getNextDrawDate(provider: Provider): Date {
  const today = new Date();
  const currentDay = today.getDay();

  // Find next draw day
  const sortedDrawDays = [...provider.drawDays].sort((a, b) => a - b);

  for (const drawDay of sortedDrawDays) {
    if (drawDay > currentDay) {
      const daysUntilDraw = drawDay - currentDay;
      const nextDraw = new Date(today);
      nextDraw.setDate(today.getDate() + daysUntilDraw);
      return nextDraw;
    }
  }

  // If no draw day is after today, get the first draw day of next week
  const firstDrawDay = sortedDrawDays[0];
  const daysUntilDraw = 7 - currentDay + firstDrawDay;
  const nextDraw = new Date(today);
  nextDraw.setDate(today.getDate() + daysUntilDraw);
  return nextDraw;
}
