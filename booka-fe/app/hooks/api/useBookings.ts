import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '~/lib/api-client';
import type { paths } from '~/types/api-types';

type GetBookingsResponse = paths['/api/v1/bookings']['get']['responses'][200]['content']['application/json'];
type Booking = NonNullable<NonNullable<GetBookingsResponse['data']>['data']>[0];
type GetBookingsParams = paths['/api/v1/bookings']['get']['parameters']['query'];
type CreateBookingBody = paths['/api/v1/bookings']['post']['requestBody']['content']['application/json'];

export type { Booking };

/**
 * Hook to fetch user's bookings
 * @param filters - Optional filters (status, dateFrom, dateTo, page, limit)
 * @returns Query result with bookings data
 */
export function useBookings(filters?: GetBookingsParams) {
  return useQuery({
    queryKey: ['bookings', filters],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/bookings', {
        params: { query: filters },
      });

      if (error) {
        throw new Error('Failed to fetch bookings');
      }

      if (!data?.success || !data.data) {
        throw new Error('Invalid response format');
      }

      return {
        bookings: data.data.data || [],
        pagination: data.data.pagination,
      };
    },
  });
}

/**
 * Hook to create a new booking
 * @returns Mutation function to create booking
 */
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingData: CreateBookingBody) => {
      const { data, error } = await apiClient.POST('/api/v1/bookings', {
        body: bookingData,
      });

      if (error) {
        throw new Error('Failed to create booking');
      }

      if (!data?.success || !data.data) {
        throw new Error('Invalid response format');
      }

      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

/**
 * Hook to cancel a booking
 * @returns Mutation function to cancel booking
 */
export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: number) => {
      const { data, error } = await apiClient.PATCH('/api/v1/bookings/{id}/cancel', {
        params: { path: { id: bookingId } },
      });

      if (error) {
        throw new Error('Failed to cancel booking');
      }

      if (!data) {
        throw new Error('Invalid response format');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

