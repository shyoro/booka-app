import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, and, sql, gte, lte, or, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { bookings, rooms } from '../database/schema';
import { CreateBookingDto, GetBookingsDto } from './bookings.dto';
import { RoomsService } from '../rooms/rooms.service';
import { EmailsService } from '../emails/emails.service';
import { UsersService } from '../users/users.service';

/**
 * Bookings service
 * Handles booking operations with concurrency control using FOR UPDATE
 */
@Injectable()
export class BookingsService {
  /**
   * Create bookings service
   * @param db - Database instance
   * @param roomsService - Rooms service
   * @param emailsService - Emails service
   * @param usersService - Users service
   */
  constructor(
    @Inject('DRIZZLE_DB')
    private readonly db: NodePgDatabase<typeof import('../database/schema')>,
    private roomsService: RoomsService,
    private emailsService: EmailsService,
    private usersService: UsersService,
  ) {}

  /**
   * Create a new booking with FOR UPDATE lock for concurrency control
   * @param userId - User ID
   * @param createBookingDto - Booking data
   * @returns Created booking
   */
  async create(userId: number, createBookingDto: CreateBookingDto) {
    const { roomId, checkInDate, checkOutDate } = createBookingDto;

    // Use transaction with FOR UPDATE lock
    const result = await this.db.transaction(async (tx) => {
      // Lock the room row with FOR UPDATE to prevent concurrent bookings
      // Using raw SQL for FOR UPDATE as Drizzle query builder doesn't support it directly
      const roomResult = await tx.execute(
        sql`SELECT id, name, status, price_per_night FROM ${rooms} WHERE id = ${roomId} FOR UPDATE LIMIT 1`,
      );
      
      if (!roomResult || roomResult.length === 0) {
        throw new NotFoundException(`Room with ID ${roomId} not found`);
      }
      
      const roomData = roomResult[0] as { id: number; name: string; status: string; price_per_night: string };
      const room = {
        id: roomData.id,
        name: roomData.name,
        status: roomData.status as 'available' | 'unavailable',
        pricePerNight: roomData.price_per_night,
      };

      if (room.status !== 'available') {
        throw new ConflictException('Room is not available');
      }

      // Check for conflicting bookings
      const conflictingBookings = await tx
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.roomId, roomId),
            sql`${bookings.status} != 'cancelled'`,
            sql`${bookings.checkInDate} < ${checkOutDate}`,
            sql`${bookings.checkOutDate} > ${checkInDate}`,
          ),
        )
        .limit(1);

      if (conflictingBookings.length > 0) {
        throw new ConflictException('Room is not available for the selected dates');
      }

      // Calculate total price
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      const pricePerNight = parseFloat(room.pricePerNight);
      const totalPrice = (nights * pricePerNight).toFixed(2);

      // Create booking
      const [booking] = await tx
        .insert(bookings)
        .values({
          userId,
          roomId,
          checkInDate,
          checkOutDate,
          totalPrice,
          status: 'pending',
        })
        .returning();

      return { booking, room, totalPrice };
    });

    // Send confirmation email (outside transaction)
    const user = await this.usersService.findById(userId);
    if (user && 'email' in user) {
      try {
        await this.emailsService.sendConfirmationEmail(user.email as string, {
          bookingId: result.booking.id,
          roomName: result.room.name,
          checkInDate,
          checkOutDate,
          totalPrice: result.totalPrice,
        });
      } catch (error) {
        // Log error but don't fail the booking
        console.error('Failed to send confirmation email:', error);
      }
    }

    return result.booking;
  }

  /**
   * Get user's booking history with filters
   * @param userId - User ID
   * @param getBookingsDto - Filter parameters
   * @returns Paginated booking list
   */
  async findByUser(userId: number, getBookingsDto: GetBookingsDto) {
    const { status, dateFrom, dateTo, page, limit } = getBookingsDto;
    const offset = (page - 1) * limit;

    const conditions = [eq(bookings.userId, userId)];

    if (status) {
      conditions.push(eq(bookings.status, status));
    }

    if (dateFrom && dateTo) {
      const dateCondition = or(
        and(
          gte(bookings.checkInDate, dateFrom),
          lte(bookings.checkInDate, dateTo),
        ),
        and(
          gte(bookings.checkOutDate, dateFrom),
          lte(bookings.checkOutDate, dateTo),
        ),
        and(
          lte(bookings.checkInDate, dateFrom),
          gte(bookings.checkOutDate, dateTo),
        ),
      );
      if (dateCondition) {
        conditions.push(dateCondition);
      }
    }

    // Get total count
    const totalQuery = this.db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(and(...conditions));

    const [{ count: total }] = await totalQuery;
    const totalPages = Math.ceil(Number(total) / limit);

    // Get bookings with room details
    const results = await this.db
      .select({
        booking: bookings,
        room: rooms,
      })
      .from(bookings)
      .innerJoin(rooms, eq(bookings.roomId, rooms.id))
      .where(and(...conditions))
      .orderBy(bookings.createdAt)
      .limit(limit)
      .offset(offset);

    const data = results.map((r) => ({
      ...r.booking,
      room: r.room,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total: Number(total),
        totalPages,
      },
    };
  }

  /**
   * Find booking by ID with ownership check
   * @param bookingId - Booking ID
   * @param userId - User ID (for ownership check)
   * @returns Booking details
   */
  async findById(bookingId: number, userId: number) {
    const [result] = await this.db
      .select({
        booking: bookings,
        room: rooms,
      })
      .from(bookings)
      .innerJoin(rooms, eq(bookings.roomId, rooms.id))
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!result) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    // Check ownership
    if (result.booking.userId !== userId) {
      throw new ForbiddenException('You do not have access to this booking');
    }

    return {
      ...result.booking,
      room: result.room,
    };
  }

  /**
   * Cancel a booking
   * @param bookingId - Booking ID
   * @param userId - User ID (for ownership check)
   * @param cancellationReason - Optional cancellation reason
   * @returns Cancelled booking
   */
  async cancel(bookingId: number, userId: number, cancellationReason?: string) {
    // Get booking with ownership check
    const booking = await this.findById(bookingId, userId);

    if (booking.status === 'cancelled') {
      throw new ConflictException('Booking is already cancelled');
    }

    if (booking.status === 'completed') {
      throw new ConflictException('Cannot cancel a completed booking');
    }

    // Update booking status
    const [updatedBooking] = await this.db
      .update(bookings)
      .set({
        status: 'cancelled',
        cancellationReason: cancellationReason || null,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    // Send cancellation email
    const user = await this.usersService.findById(userId);
    if (user && 'email' in user) {
      try {
        await this.emailsService.sendCancellationEmail(user.email as string, {
          bookingId: booking.id,
          roomName: booking.room.name,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          cancellationReason,
        });
      } catch (error) {
        console.error('Failed to send cancellation email:', error);
      }
    }

    return updatedBooking;
  }

  /**
   * Check if two date ranges overlap
   * @param start1 - Start date of first range
   * @param end1 - End date of first range
   * @param start2 - Start date of second range
   * @param end2 - End date of second range
   * @returns True if dates overlap
   */
  checkDateOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return start1 < end2 && end1 > start2;
  }
}

