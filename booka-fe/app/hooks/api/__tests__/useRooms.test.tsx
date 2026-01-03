import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSearchRooms, useRoomDetails, useRoomAvailability } from '../useRooms';
import apiClient from '~/lib/api-client';

/**
 * Unit tests for useRooms hooks
 * Tests room search, details fetching, and availability checking
 */
vi.mock('~/lib/api-client', () => ({
  default: {
    GET: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useRooms hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useSearchRooms', () => {
    it('should fetch rooms successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [
            {
              id: 1,
              name: 'Test Room',
              location: 'Test City',
              capacity: 4,
              pricePerNight: '100.00',
              status: 'available',
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

      const { result } = renderHook(() => useSearchRooms(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.rooms).toHaveLength(1);
      expect(result.current.data?.rooms[0].name).toBe('Test Room');
    });

    it('should handle API errors', async () => {
      vi.mocked(apiClient.GET).mockResolvedValue({
        data: undefined,
        error: { status: 500, message: 'Server error' },
        response: {} as Response,
      });

      const { result } = renderHook(() => useSearchRooms(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeInstanceOf(Error);
    });

    it('should pass search parameters correctly', async () => {
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

      const searchParams = {
        location: 'Test City',
        capacity: 4,
        dateFrom: '2024-01-15',
        dateTo: '2024-01-20',
      };

      renderHook(() => useSearchRooms(searchParams), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(apiClient.GET).toHaveBeenCalledWith('/api/v1/rooms', {
          params: { query: searchParams },
        });
      });
    });
  });

  describe('useRoomDetails', () => {
    it('should fetch room details successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 1,
          name: 'Test Room',
          location: 'Test City',
          capacity: 4,
          pricePerNight: '100.00',
          status: 'available',
        },
      };

      vi.mocked(apiClient.GET).mockResolvedValue({
        data: mockResponse,
        error: undefined,
        response: {} as Response,
      });

      const { result } = renderHook(() => useRoomDetails(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.name).toBe('Test Room');
    });

    it('should not fetch when id is not provided', () => {
      const { result } = renderHook(() => useRoomDetails(0), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
    });
  });

  describe('useRoomAvailability', () => {
    it('should check room availability successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          available: true,
        },
      };

      vi.mocked(apiClient.GET).mockResolvedValue({
        data: mockResponse,
        error: undefined,
        response: {} as Response,
      });

      const { result } = renderHook(
        () => useRoomAvailability(1, '2024-01-15', '2024-01-20'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.available).toBe(true);
    });

    it('should not fetch when required parameters are missing', () => {
      const { result } = renderHook(
        () => useRoomAvailability(0, '', ''),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.isFetching).toBe(false);
    });
  });
});

