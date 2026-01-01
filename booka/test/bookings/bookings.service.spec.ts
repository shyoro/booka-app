import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { BookingsService } from '../../src/bookings/bookings.service';
import { RoomsService } from '../../src/rooms/rooms.service';
import { EmailsService } from '../../src/emails/emails.service';
import { UsersService } from '../../src/users/users.service';
import { sql } from 'drizzle-orm';

describe('BookingsService', () => {
  let service: BookingsService;
  let mockDb: any;
  let roomsService: RoomsService;
  let emailsService: EmailsService;

  const mockRoom = {
    id: 1,
    name: 'Test Room',
    status: 'available',
    pricePerNight: '100.00',
  };

  const mockBooking = {
    id: 1,
    userId: 1,
    roomId: 1,
    checkInDate: '2024-01-15',
    checkOutDate: '2024-01-20',
    totalPrice: '500.00',
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(() => {
    mockDb = {
      transaction: vi.fn(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      returning: vi.fn(),
      execute: vi.fn(),
    };

    const mockRoomsService = {
      findById: vi.fn(),
    };

    const mockEmailsService = {
      sendConfirmationEmail: vi.fn(),
      sendCancellationEmail: vi.fn(),
    };

    const mockUsersService = {
      findById: vi.fn(),
    };

    service = new BookingsService(
      mockDb,
      mockRoomsService as any,
      mockEmailsService as any,
      mockUsersService as any,
    );

    roomsService = mockRoomsService as any;
    emailsService = mockEmailsService as any;
  });

  describe('create', () => {
    it('should create a booking successfully', async () => {
      const createBookingDto = {
        roomId: 1,
        checkInDate: '2024-01-15',
        checkOutDate: '2024-01-20',
      };

      const mockTx = {
        execute: vi.fn().mockResolvedValue([{
          id: 1,
          name: 'Test Room',
          status: 'available',
          price_per_night: '100.00',
        }]),
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockBooking]),
      };

      mockDb.transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      vi.spyOn(service['usersService'], 'findById').mockResolvedValue(mockUser);
      vi.spyOn(service['emailsService'], 'sendConfirmationEmail').mockResolvedValue();

      const result = await service.create(1, createBookingDto);

      expect(result).toBeDefined();
      expect(mockDb.transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if room not found', async () => {
      const createBookingDto = {
        roomId: 999,
        checkInDate: '2024-01-15',
        checkOutDate: '2024-01-20',
      };

      const mockTx = {
        execute: vi.fn().mockResolvedValue([]),
      };

      mockDb.transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await expect(service.create(1, createBookingDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if room is unavailable', async () => {
      const createBookingDto = {
        roomId: 1,
        checkInDate: '2024-01-15',
        checkOutDate: '2024-01-20',
      };

      const mockTx = {
        execute: vi.fn().mockResolvedValue([{
          id: 1,
          name: 'Test Room',
          status: 'unavailable',
          price_per_night: '100.00',
        }]),
      };

      mockDb.transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await expect(service.create(1, createBookingDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if dates conflict with existing booking', async () => {
      const createBookingDto = {
        roomId: 1,
        checkInDate: '2024-01-15',
        checkOutDate: '2024-01-20',
      };

      const mockTx = {
        execute: vi.fn().mockResolvedValue([{
          id: 1,
          name: 'Test Room',
          status: 'available',
          price_per_night: '100.00',
        }]),
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: 1 }]),
      };

      mockDb.transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await expect(service.create(1, createBookingDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findByUser', () => {
    it('should find bookings for user', async () => {
      const getBookingsDto = {
        page: 1,
        limit: 20,
      };

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
      });

      const countResult = [{ count: 2 }];
      const bookingsResult = [{
        booking: mockBooking,
        room: mockRoom,
      }];

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(countResult),
      }).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(bookingsResult),
      });

      const result = await service.findByUser(1, getBookingsDto);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result.pagination.page).toBe(1);
    });
  });

  describe('findById', () => {
    it('should find booking by ID', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{
          booking: mockBooking,
          room: mockRoom,
        }]),
      });

      const result = await service.findById(1, 1);

      expect(result).toHaveProperty('room');
    });

    it('should throw NotFoundException if booking not found', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      });

      await expect(service.findById(999, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own booking', async () => {
      const otherUserBooking = { ...mockBooking, userId: 2 };

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{
          booking: otherUserBooking,
          room: mockRoom,
        }]),
      });

      await expect(service.findById(1, 1)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('cancel', () => {
    it('should cancel a booking successfully', async () => {
      const bookingWithRoom = {
        ...mockBooking,
        room: mockRoom,
      };

      vi.spyOn(service, 'findById').mockResolvedValue(bookingWithRoom as any);
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ ...mockBooking, status: 'cancelled' }]),
      });

      vi.spyOn(service['usersService'], 'findById').mockResolvedValue(mockUser);
      vi.spyOn(service['emailsService'], 'sendCancellationEmail').mockResolvedValue();

      const result = await service.cancel(1, 1);

      expect(result.status).toBe('cancelled');
    });

    it('should throw ConflictException if booking already cancelled', async () => {
      const cancelledBooking = {
        ...mockBooking,
        status: 'cancelled',
        room: mockRoom,
      };

      vi.spyOn(service, 'findById').mockResolvedValue(cancelledBooking as any);

      await expect(service.cancel(1, 1)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if booking is completed', async () => {
      const completedBooking = {
        ...mockBooking,
        status: 'completed',
        room: mockRoom,
      };

      vi.spyOn(service, 'findById').mockResolvedValue(completedBooking as any);

      await expect(service.cancel(1, 1)).rejects.toThrow(ConflictException);
    });
  });

  describe('checkDateOverlap', () => {
    it('should detect overlapping dates', () => {
      const start1 = new Date('2024-01-15');
      const end1 = new Date('2024-01-20');
      const start2 = new Date('2024-01-18');
      const end2 = new Date('2024-01-25');

      const result = service.checkDateOverlap(start1, end1, start2, end2);

      expect(result).toBe(true);
    });

    it('should detect non-overlapping dates', () => {
      const start1 = new Date('2024-01-15');
      const end1 = new Date('2024-01-20');
      const start2 = new Date('2024-01-21');
      const end2 = new Date('2024-01-25');

      const result = service.checkDateOverlap(start1, end1, start2, end2);

      expect(result).toBe(false);
    });
  });
});

