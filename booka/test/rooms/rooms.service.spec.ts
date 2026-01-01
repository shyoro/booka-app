import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RoomsService } from '../../src/rooms/rooms.service';
import { sql } from 'drizzle-orm';

describe('RoomsService', () => {
  let service: RoomsService;
  let mockDb: any;

  const mockRoom = {
    id: 1,
    name: 'Test Room',
    description: 'A test room',
    location: 'New York, NY',
    capacity: 2,
    pricePerNight: '100.00',
    amenities: { wifi: true, parking: true },
    images: ['image1.jpg'],
    status: 'available',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockDb = {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
    };

    service = new RoomsService(mockDb);
    
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('findById', () => {
    it('should find room by ID', async () => {
      const queryBuilder = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockRoom]),
      };
      mockDb.select.mockReturnValue(queryBuilder);

      const result = await service.findById(1);

      expect(result).toEqual(mockRoom);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should throw NotFoundException if room not found', async () => {
      const queryBuilder = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      mockDb.select.mockReturnValue(queryBuilder);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('search', () => {
    it('should search rooms with filters', async () => {
      const searchDto = {
        page: 1,
        limit: 20,
      };

      const countResult = [{ count: 1 }];
      const roomsResult = [mockRoom];

      // main query: this.db.select().from(rooms).where(...) - created first
      const mainQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(roomsResult),
      };

      // totalQuery: this.db.select({ count: ... }).from(rooms).where(...) - created second
      const countBuilder = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(countResult),
      };

      // First call: select() for main query
      // Second call: select({ count: ... }) for totalQuery
      mockDb.select
        .mockReturnValueOnce(mainQueryBuilder)
        .mockReturnValueOnce(countBuilder);

      const result = await service.search(searchDto);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result.data.length).toBe(1);
    });

    it('should filter by location', async () => {
      const searchDto = {
        location: 'New York',
        page: 1,
        limit: 20,
      };

      const countResult = [{ count: 1 }];
      const roomsResult = [mockRoom];

      const mainQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(roomsResult),
      };

      const countBuilder = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(countResult),
      };

      mockDb.select
        .mockReturnValueOnce(mainQueryBuilder)
        .mockReturnValueOnce(countBuilder);

      const result = await service.search(searchDto);

      expect(result.data.length).toBe(1);
    });

    it('should return empty results for past dates', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const searchDto = {
        dateFrom: yesterday.toISOString().split('T')[0],
        dateTo: new Date().toISOString().split('T')[0],
        page: 1,
        limit: 20,
      };

      const result = await service.search(searchDto);

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('checkAvailability', () => {
    it('should check room availability', async () => {
      const dateFrom = '2024-01-15';
      const dateTo = '2024-01-20';

      // Mock findById to bypass database call
      vi.spyOn(service, 'findById').mockResolvedValue(mockRoom as any);

      // Mock the conflicting bookings query - no conflicts
      const bookingsQueryBuilder: any = {
        from: vi.fn(function() { return this; }),
        where: vi.fn(function() { return this; }),
        limit: vi.fn().mockResolvedValue([]), // Empty array = no conflicts
      };
      // Clear any previous mocks and set up fresh
      mockDb.select.mockClear();
      mockDb.select.mockReturnValue(bookingsQueryBuilder);

      const result = await service.checkAvailability(1, dateFrom, dateTo);

      expect(result).toHaveProperty('available');
      expect(result).toHaveProperty('roomId');
    });

    it('should return false for past dates', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateFrom = yesterday.toISOString().split('T')[0];
      const dateTo = new Date().toISOString().split('T')[0];

      vi.spyOn(service, 'findById').mockResolvedValue(mockRoom as any);

      const result = await service.checkAvailability(1, dateFrom, dateTo);

      expect(result.available).toBe(false);
    });
  });

  describe('create', () => {
    it('should create a new room', async () => {
      const roomData = {
        name: 'New Room',
        description: 'A new room',
        location: 'Los Angeles, CA',
        capacity: 4,
        pricePerNight: '150.00',
        amenities: { wifi: true },
        images: ['image.jpg'],
      };

      const newRoom = { ...mockRoom, ...roomData };
      const queryBuilder = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([newRoom]),
      };
      mockDb.insert.mockReturnValue(queryBuilder);

      const result = await service.create(roomData);

      expect(result).toEqual(newRoom);
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a room', async () => {
      const updateData = {
        name: 'Updated Room',
        pricePerNight: '120.00',
      };

      const updatedRoom = { ...mockRoom, ...updateData };
      const queryBuilder = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([updatedRoom]),
      };
      mockDb.update.mockReturnValue(queryBuilder);

      const result = await service.update(1, updateData);

      expect(result).toEqual(updatedRoom);
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if room not found', async () => {
      const updateData = { name: 'Updated Room' };

      const queryBuilder = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      };
      mockDb.update.mockReturnValue(queryBuilder);

      await expect(service.update(999, updateData)).rejects.toThrow(NotFoundException);
    });
  });
});

