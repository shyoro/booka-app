import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Create booking DTO schema
 */
export const createBookingSchema = z.object({
  roomId: z.number().int().positive('Room ID must be positive'),
  checkInDate: z.string().date('Invalid check-in date format'),
  checkOutDate: z.string().date('Invalid check-out date format'),
}).refine((data) => {
  return new Date(data.checkOutDate) > new Date(data.checkInDate);
}, {
  message: 'Check-out date must be after check-in date',
});

/**
 * Create booking DTO
 */
export class CreateBookingDto extends createZodDto(createBookingSchema) {
  static readonly zodSchema = createBookingSchema;

  @ApiProperty({
    description: 'Room ID to book',
    example: 1,
    type: Number,
  })
  roomId!: number;

  @ApiProperty({
    description: 'Check-in date (ISO date format: YYYY-MM-DD)',
    example: '2024-01-15',
    type: String,
  })
  checkInDate!: string;

  @ApiProperty({
    description: 'Check-out date (ISO date format: YYYY-MM-DD). Must be after check-in date.',
    example: '2024-01-20',
    type: String,
  })
  checkOutDate!: string;
}

/**
 * Get bookings DTO schema
 */
export const getBookingsSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
}).refine((data) => {
  if (data.dateFrom && !data.dateTo) {
    return false;
  }
  if (data.dateTo && !data.dateFrom) {
    return false;
  }
  if (data.dateFrom && data.dateTo) {
    return new Date(data.dateTo) >= new Date(data.dateFrom);
  }
  return true;
}, {
  message: 'dateTo must be after or equal to dateFrom and both must be provided together',
});

/**
 * Get bookings DTO
 */
export class GetBookingsDto extends createZodDto(getBookingsSchema) {}

