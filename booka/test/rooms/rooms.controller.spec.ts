import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { RoomsController } from '../../src/rooms/rooms.controller';
import { RoomsService } from '../../src/rooms/rooms.service';
import { injectMockService } from '../utils/test-helpers';

describe('RoomsController', () => {
  let controller: RoomsController;
  let roomsService: RoomsService;

  const mockRoom = {
    id: 1,
    name: 'Test Room',
    description: 'A test room',
    location: 'New York, NY',
    capacity: 2,
    pricePerNight: '100.00',
    status: 'available',
  };

  beforeEach(async () => {
    const mockRoomsService = {
      search: vi.fn(),
      findById: vi.fn(),
      checkAvailability: vi.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [RoomsController],
      providers: [
        {
          provide: RoomsService,
          useValue: mockRoomsService,
        },
      ],
    }).compile();

    controller = module.get<RoomsController>(RoomsController);
    roomsService = mockRoomsService as any;
    
    // Manual injection workaround if DI failed
    injectMockService(controller, 'roomsService', mockRoomsService);
  });

  describe('search', () => {
    it('should search rooms', async () => {
      const searchDto = {
        page: 1,
        limit: 20,
      };

      const expectedResult = {
        data: [mockRoom],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      roomsService.search.mockResolvedValue(expectedResult);

      const result = await controller.search(searchDto);

      expect(result).toEqual(expectedResult);
      expect(roomsService.search).toHaveBeenCalledWith(searchDto);
    });
  });

  describe('findById', () => {
    it('should get room by ID', async () => {
      const roomId = 1;

      roomsService.findById.mockResolvedValue(mockRoom as any);

      const result = await controller.findById(roomId);

      expect(result).toEqual(mockRoom);
      expect(roomsService.findById).toHaveBeenCalledWith(roomId);
    });
  });

  describe('checkAvailability', () => {
    it('should check room availability', async () => {
      const roomId = 1;
      const checkDto = {
        dateFrom: '2024-01-15',
        dateTo: '2024-01-20',
      };

      const expectedResult = {
        roomId: 1,
        roomName: 'Test Room',
        dateFrom: checkDto.dateFrom,
        dateTo: checkDto.dateTo,
        available: true,
        conflictingBookings: 0,
        totalPrice: '500.00',
        nights: 5,
      };

      roomsService.checkAvailability.mockResolvedValue(expectedResult);

      const result = await controller.checkAvailability(roomId, checkDto);

      expect(result).toEqual(expectedResult);
      expect(roomsService.checkAvailability).toHaveBeenCalledWith(
        roomId,
        checkDto.dateFrom,
        checkDto.dateTo,
      );
    });
  });
});

