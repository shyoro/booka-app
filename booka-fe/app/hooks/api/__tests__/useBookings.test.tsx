import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBookings, useCreateBooking, useCancelBooking } from '../useBookings';
import apiClient from '~/lib/api-client';

/**
 * Unit tests for useBookings hooks
 * Tests booking fetching, creation, and cancellation
 */
vi.mock('~/lib/api-client', () => ({
  default: {
    GET: vi.fn(),
    POST: vi.fn(),
    PATCH: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useBookings hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useBookings', () => {
    it('should fetch bookings successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [
            {
              id: 1,
              userId: 1,
              roomId: 1,
              checkInDate: '2024-01-15',
              checkOutDate: '2024-01-20',
              totalPrice: '500.00',
              status: 'confirmed',
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        },
      };

      vi.mocked(apiClient.GET).mockResolvedValue({
        data: mockResponse,
        error: undefined,
        response: {} as Response,
      });

      const { result } = renderHook(() => useBookings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.bookings).toHaveLength(1);
      expect(result.current.data?.bookings[0].status).toBe('confirmed');
    });

    it('should pass filters correctly', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        },
      };

      vi.mocked(apiClient.GET).mockResolvedValue({
        data: mockResponse,
        error: undefined,
        response: {} as Response,
      });

      const filters = {
        status: 'confirmed',
        dateFrom: '2024-01-15',
        dateTo: '2024-01-20',
      };

      renderHook(() => useBookings(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(apiClient.GET).toHaveBeenCalledWith('/api/v1/bookings', {
          params: { query: filters },
        });
      });
    });

    it('should handle API errors', async () => {
      vi.mocked(apiClient.GET).mockResolvedValue({
        data: undefined,
        error: { status: 500, message: 'Server error' },
        response: {} as Response,
      });

      const { result } = renderHook(() => useBookings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('useCreateBooking', () => {
    it('should create booking successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 1,
          userId: 1,
          roomId: 1,
          checkInDate: '2024-01-15',
          checkOutDate: '2024-01-20',
          totalPrice: '500.00',
          status: 'pending',
        },
      };

      vi.mocked(apiClient.POST).mockResolvedValue({
        data: mockResponse,
        error: undefined,
        response: {} as Response,
      });

      const { result } = renderHook(() => useCreateBooking(), {
        wrapper: createWrapper(),
      });

      const bookingData = {
        roomId: 1,
        checkInDate: '2024-01-15',
        checkOutDate: '2024-01-20',
      };

      result.current.mutate(bookingData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.status).toBe('pending');
    });

    it('should handle creation errors', async () => {
      vi.mocked(apiClient.POST).mockResolvedValue({
        data: undefined,
        error: { status: 400, message: 'Validation error' },
        response: {} as Response,
      });

      const { result } = renderHook(() => useCreateBooking(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        roomId: 1,
        checkInDate: '2024-01-15',
        checkOutDate: '2024-01-20',
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('useCancelBooking', () => {
    it('should cancel booking successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 1,
          status: 'cancelled',
        },
      };

      vi.mocked(apiClient.PATCH).mockResolvedValue({
        data: mockResponse,
        error: undefined,
        response: {} as Response,
      });

      const { result } = renderHook(() => useCancelBooking(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(1);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.PATCH).toHaveBeenCalledWith('/api/v1/bookings/{id}/cancel', {
        params: { path: { id: 1 } },
      });
    });

    it('should handle cancellation errors', async () => {
      vi.mocked(apiClient.PATCH).mockResolvedValue({
        data: undefined,
        error: { status: 404, message: 'Booking not found' },
        response: {} as Response,
      });

      const { result } = renderHook(() => useCancelBooking(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(999);

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });
});

