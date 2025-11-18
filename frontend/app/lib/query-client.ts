import { QueryClient, type QueryClientConfig } from '@tanstack/react-query';
import { ApiError } from './api-client';

/**
 * Default query client configuration
 */
const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes
      staleTime: 5 * 60 * 1000,

      // Cache time: 10 minutes
      gcTime: 10 * 60 * 1000,

      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof ApiError && error.statusCode) {
          if (error.statusCode >= 400 && error.statusCode < 500) {
            return false;
          }
        }

        // Retry up to 3 times for other errors
        return failureCount < 3;
      },

      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus (disabled for mobile to save data)
      refetchOnWindowFocus: false,

      // Refetch on reconnect
      refetchOnReconnect: true,

      // Refetch on mount (only if stale)
      refetchOnMount: true,
    },
    mutations: {
      // Retry mutations once on network errors
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.statusCode) {
          // Don't retry client errors
          if (error.statusCode >= 400 && error.statusCode < 500) {
            return false;
          }
        }

        // Retry once for network errors
        return failureCount < 1;
      },

      // Retry delay
      retryDelay: 1000,
    },
  },
};

/**
 * Create and configure query client
 */
export function createQueryClient() {
  return new QueryClient(queryClientConfig);
}

/**
 * Singleton query client instance
 */
export const queryClient = createQueryClient();

/**
 * Query keys factory for type-safe query keys
 */
export const queryKeys = {
  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.users.lists(), { filters }] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },

  // Agents
  agents: {
    all: ['agents'] as const,
    lists: () => [...queryKeys.agents.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.agents.lists(), { filters }] as const,
    details: () => [...queryKeys.agents.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.agents.details(), id] as const,
  },

  // Lotteries
  lotteries: {
    all: ['lotteries'] as const,
    lists: () => [...queryKeys.lotteries.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.lotteries.lists(), { filters }] as const,
    details: () => [...queryKeys.lotteries.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.lotteries.details(), id] as const,
  },

  // Transactions
  transactions: {
    all: ['transactions'] as const,
    lists: () => [...queryKeys.transactions.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.transactions.lists(), { filters }] as const,
    details: () => [...queryKeys.transactions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.transactions.details(), id] as const,
  },

  // Reports
  reports: {
    all: ['reports'] as const,
    dashboard: () => [...queryKeys.reports.all, 'dashboard'] as const,
    analytics: (filters: Record<string, unknown>) =>
      [...queryKeys.reports.all, 'analytics', { filters }] as const,
  },
} as const;
