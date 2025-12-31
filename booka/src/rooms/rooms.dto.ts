import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Search rooms DTO schema
 */
export const searchRoomsSchema = z.object({
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  location: z.string().optional(),
  capacity: z.coerce.number().int().positive().optional(),
  amenities: z.string().optional(), // Comma-separated list
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
}).refine((data) => {
  // If dateFrom is provided, dateTo must also be provided
  if (data.dateFrom && !data.dateTo) {
    return false;
  }
  // If dateTo is provided, dateFrom must also be provided
  if (data.dateTo && !data.dateFrom) {
    return false;
  }
  // dateTo must be after dateFrom
  if (data.dateFrom && data.dateTo) {
    return new Date(data.dateTo) > new Date(data.dateFrom);
  }
  return true;
}, {
  message: 'dateTo must be after dateFrom and both must be provided together',
});

/**
 * Search rooms DTO
 */
export class SearchRoomsDto extends createZodDto(searchRoomsSchema) {
  // Store Zod schema for custom validation pipe
  static readonly zodSchema = searchRoomsSchema;
}

/**
 * Create room DTO schema
 */
export const createRoomSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  capacity: z.number().int().positive('Capacity must be positive'),
  pricePerNight: z.number().nonnegative('Price must be non-negative'),
  amenities: z.record(z.unknown()).optional(),
  images: z.array(z.string().url()).optional(),
});

/**
 * Create room DTO
 */
export class CreateRoomDto extends createZodDto(createRoomSchema) {}

/**
 * Update room DTO schema
 */
export const updateRoomSchema = createRoomSchema.partial();

/**
 * Update room DTO
 */
export class UpdateRoomDto extends createZodDto(updateRoomSchema) {}

/**
 * Check availability DTO schema
 */
export const checkAvailabilitySchema = z.object({
  dateFrom: z.string().date('Invalid date format'),
  dateTo: z.string().date('Invalid date format'),
}).refine((data) => {
  return new Date(data.dateTo) > new Date(data.dateFrom);
}, {
  message: 'dateTo must be after dateFrom',
});

/**
 * Check availability DTO
 */
export class CheckAvailabilityDto extends createZodDto(checkAvailabilitySchema) {}

