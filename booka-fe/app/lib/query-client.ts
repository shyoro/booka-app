import { QueryClient } from '@tanstack/react-query';

/**
 * Creates and configures a QueryClient instance for React Query.
 * 
 * Default configuration:
 * - staleTime: 5 minutes (data is considered fresh for 5 minutes)
 * - gcTime: 10 minutes (cached data is kept for 10 minutes after last use)
 * - retry: 3 attempts with exponential backoff
 * - refetchOnWindowFocus: false (prevents refetching when window regains focus)
 * - refetchOnReconnect: true (refetches when network reconnects)
 * 
 * @returns Configured QueryClient instance
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        retry: 3,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: true,
      },
      mutations: {
        retry: 1,
      },
    },
  });
}

