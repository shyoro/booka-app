import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { BookingsController } from '../../src/bookings/bookings.controller';
import { BookingsService } from '../../src/bookings/bookings.service';
import { injectMockService } from '../utils/test-helpers';

describe('BookingsController', () => {
  let controller: BookingsController;
  let bookingsService: BookingsService;

  const mockBooking = {
    id: 1,
    userId: 1,
    roomId: 1,
    checkInDate: '2024-01-15',
    checkOutDate: '2024-01-20',
    totalPrice: '500.00',
    status: 'pending',
  };

  beforeEach(async () => {
    const mockBookingsService = {
      create: vi.fn(),
      findByUser: vi.fn(),
      findById: vi.fn(),
      cancel: vi.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        {
          provide: BookingsService,
          useValue: mockBookingsService,
        },
      ],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
    bookingsService = mockBookingsService as any;
    
    // Manual injection workaround if DI failed
    injectMockService(controller, 'bookingsService', mockBookingsService);
  });

  describe('create', () => {
    it('should create a booking', async () => {
      const user = { id: 1 };
      const createBookingDto = {
        roomId: 1,
        checkInDate: '2024-01-15',
        checkOutDate: '2024-01-20',
      };

      bookingsService.create.mockResolvedValue(mockBooking as any);

      const result = await controller.create(user, createBookingDto);

      expect(result).toEqual(mockBooking);
      expect(bookingsService.create).toHaveBeenCalledWith(user.id, createBookingDto);
    });
  });

  describe('findByUser', () => {
    it('should get user bookings', async () => {
      const user = { id: 1 };
      const getBookingsDto = {
        page: 1,
        limit: 20,
      };

      const expectedResult = {
        data: [mockBooking],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      bookingsService.findByUser.mockResolvedValue(expectedResult);

      const result = await controller.findByUser(user, getBookingsDto);

      expect(result).toEqual(expectedResult);
      expect(bookingsService.findByUser).toHaveBeenCalledWith(user.id, getBookingsDto);
    });
  });

  describe('findById', () => {
    it('should get booking by ID', async () => {
      const user = { id: 1 };
      const bookingId = 1;

      bookingsService.findById.mockResolvedValue(mockBooking as any);

      const result = await controller.findById(user, bookingId);

      expect(result).toEqual(mockBooking);
      expect(bookingsService.findById).toHaveBeenCalledWith(bookingId, user.id);
    });
  });

  describe('cancel', () => {
    it('should cancel a booking', async () => {
      const user = { id: 1 };
      const bookingId = 1;
      const cancelledBooking = { ...mockBooking, status: 'cancelled' };

      bookingsService.cancel.mockResolvedValue(cancelledBooking as any);

      const result = await controller.cancel(user, bookingId);

      expect(result).toEqual(cancelledBooking);
      expect(bookingsService.cancel).toHaveBeenCalledWith(bookingId, user.id);
    });
  });
});

