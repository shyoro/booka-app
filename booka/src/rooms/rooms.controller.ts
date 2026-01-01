import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { SearchRoomsDto, CheckAvailabilityDto } from './rooms.dto';
import { Public } from '../common/decorators/public.decorator';

/**
 * Rooms controller
 * Handles room search and management endpoints
 */
@ApiTags('rooms')
@Controller('rooms')
export class RoomsController {
  /**
   * Create rooms controller
   * @param roomsService - Rooms service
   */
  constructor(private readonly roomsService: RoomsService) {}

  /**
   * Search rooms with filters
   */
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search available rooms' })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'Check-in date (ISO format)' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, description: 'Check-out date (ISO format)' })
  @ApiQuery({ name: 'location', required: false, type: String, description: 'Location search term' })
  @ApiQuery({ name: 'capacity', required: false, type: Number, description: 'Minimum capacity' })
  @ApiQuery({ name: 'amenities', required: false, type: String, description: 'Comma-separated amenities' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum price per night' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price per night' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiResponse({
    status: 200,
    description: 'Rooms retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  name: { type: 'string', example: 'Cozy Studio' },
                  description: { type: 'string', example: 'A beautiful studio apartment' },
                  location: { type: 'string', example: 'New York, NY' },
                  capacity: { type: 'number', example: 2 },
                  pricePerNight: { type: 'string', example: '99.99' },
                  amenities: { type: 'object', example: { wifi: true, parking: true } },
                  images: { type: 'array', items: { type: 'string' } },
                  status: { type: 'string', example: 'available' },
                  estimatedTotalPrice: { type: 'string', example: '499.95', description: 'Estimated total price for the date range (only included when dateFrom and dateTo are provided)' },
                  nights: { type: 'number', example: 5, description: 'Number of nights (only included when dateFrom and dateTo are provided)' },
                },
              },
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 20 },
                total: { type: 'number', example: 100 },
                totalPages: { type: 'number', example: 5 },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async search(@Query() searchDto: SearchRoomsDto) {
    return this.roomsService.search(searchDto);
  }

  /**
   * Get room details by ID
   */
  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get room details' })
  @ApiParam({ name: 'id', type: Number, description: 'Room ID' })
  @ApiResponse({
    status: 200,
    description: 'Room details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Cozy Studio' },
            description: { type: 'string' },
            location: { type: 'string' },
            capacity: { type: 'number' },
            pricePerNight: { type: 'string' },
            amenities: { type: 'object' },
            images: { type: 'array', items: { type: 'string' } },
            status: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Room not found' })
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.roomsService.findById(id);
  }

  /**
   * Check room availability for date range
   */
  @Public()
  @Get(':id/availability')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check room availability for date range' })
  @ApiParam({ name: 'id', type: Number, description: 'Room ID' })
  @ApiQuery({ name: 'dateFrom', required: true, type: String, description: 'Check-in date (ISO format)' })
  @ApiQuery({ name: 'dateTo', required: true, type: String, description: 'Check-out date (ISO format)' })
  @ApiResponse({
    status: 200,
    description: 'Availability checked successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            roomId: { type: 'number', example: 1 },
            roomName: { type: 'string', example: 'Cozy Studio' },
            dateFrom: { type: 'string', example: '2024-01-15' },
            dateTo: { type: 'string', example: '2024-01-20' },
            available: { type: 'boolean', example: true },
            conflictingBookings: { type: 'number', example: 0 },
            totalPrice: { type: 'string', example: '499.95', nullable: true, description: 'Total price for the date range (only included when room is available)' },
            nights: { type: 'number', example: 5, description: 'Number of nights (only included when room is available)' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  async checkAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Query() checkDto: CheckAvailabilityDto,
  ) {
    return this.roomsService.checkAvailability(id, checkDto.dateFrom, checkDto.dateTo);
  }
}

