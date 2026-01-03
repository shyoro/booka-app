import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import apiClient from '~/lib/api-client';
import type { paths } from '~/types/api-types';

type SearchRoomsResponse = paths['/api/v1/rooms']['get']['responses'][200]['content']['application/json'];
type Room = NonNullable<NonNullable<SearchRoomsResponse['data']>['data']>[0];
type SearchParams = paths['/api/v1/rooms']['get']['parameters']['query'];

export type { Room };

/**
 * Hook to search for rooms with filters
 * @param params - Search parameters (location, dates, capacity, etc.)
 * @returns Query result with rooms data
 */
export function useSearchRooms(params?: SearchParams) {
  return useQuery({
    queryKey: ['rooms', 'search', params],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/rooms', {
        params: { query: params },
      });

      if (error) {
        throw new Error('Failed to fetch rooms');
      }

      if (!data?.success || !data.data) {
        throw new Error('Invalid response format');
      }

      return {
        rooms: data.data.data || [],
        pagination: data.data.pagination,
      };
    },
  });
}

/**
 * Hook to search for rooms with infinite scrolling pagination
 * @param params - Search parameters (location, dates, capacity, etc.)
 * @returns Infinite query result with rooms data
 */
export function useInfiniteSearchRooms(params?: SearchParams) {
  return useInfiniteQuery({
    queryKey: ['rooms', 'search', 'infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const { data, error } = await apiClient.GET('/api/v1/rooms', {
        params: {
          query: {
            ...params,
            page: pageParam,
            limit: 20,
          },
        },
      });

      if (error) {
        throw new Error('Failed to fetch rooms');
      }

      if (!data?.success || !data.data) {
        throw new Error('Invalid response format');
      }

      return {
        rooms: data.data.data || [],
        pagination: data.data.pagination,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage;
      if (!pagination) {
        return undefined;
      }
      const { page, totalPages } = pagination;

      if (!page || !totalPages) {
        return undefined;
      }

      if (page < totalPages) {
        return page + 1;
      }
      return undefined;
    },
  });
}

/**
 * Hook to fetch room details by ID
 * @param id - Room ID
 * @returns Query result with room data
 */
export function useRoomDetails(id: number) {
  return useQuery({
    queryKey: ['rooms', id],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/rooms/{id}', {
        params: { path: { id } },
      });

      if (error) {
        throw new Error('Failed to fetch room details');
      }

      if (!data?.success || !data.data) {
        throw new Error('Invalid response format');
      }

      return data.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook to check room availability for a date range
 * @param id - Room ID
 * @param dateFrom - Check-in date (YYYY-MM-DD)
 * @param dateTo - Check-out date (YYYY-MM-DD)
 * @returns Query result with availability data
 */
export function useRoomAvailability(id: number, dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['rooms', id, 'availability', dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/rooms/{id}/availability', {
        params: {
          path: { id },
          query: { dateFrom, dateTo },
        },
      });

      if (error) {
        throw new Error('Failed to check availability');
      }

      if (!data?.success || !data.data) {
        throw new Error('Invalid response format');
      }

      return data.data;
    },
    enabled: !!id && !!dateFrom && !!dateTo,
  });
}

/**
 * Hook to fetch all unique room locations with memoization and localStorage caching
 * @returns Query result with locations array
 */
export function useLocations() {
  const STORAGE_KEY = 'booka_locations';

  return useQuery({
    queryKey: ['rooms', 'locations'],
    queryFn: async () => {
      // Check localStorage first
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch {
          // Invalid cache, continue to fetch
        }
      }

      // Fetch from API
      const { data, error } = await apiClient.GET('/api/v1/rooms/locations');

      if (error) {
        throw new Error('Failed to fetch locations');
      }

      if (!data?.success || !data.data?.locations) {
        throw new Error('Invalid response format');
      }

      const locations = data.data.locations;

      // Store in localStorage
      if (locations.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
      }

      return locations;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

