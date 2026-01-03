import { useQuery } from '@tanstack/react-query';
import apiClient from '~/lib/api-client';
import type { paths } from '~/types/api-types';

type UserResponse = paths['/api/v1/users/me']['get']['responses'][200]['content']['application/json'];
type User = NonNullable<UserResponse['data']>;

/**
 * Hook to fetch current user profile
 * Automatically handles token refresh on 401 errors via api-client interceptor
 * @param options - Query options
 * @returns User data, loading state, and error
 */
export function useCurrentUser(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async (): Promise<User> => {
      const { data, error } = await apiClient.GET('/api/v1/users/me');

      if (error) {
        throw new Error('Failed to fetch user profile');
      }

      if (!data?.success || !data.data) {
        throw new Error('Invalid response format');
      }

      return data.data;
    },
    retry: (failureCount, error) => {
      // Don't retry on 401 errors (handled by interceptor)
      if (error instanceof Error && error.message.includes('401')) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    enabled: options?.enabled !== false, // Default to enabled unless explicitly disabled
  });
}

