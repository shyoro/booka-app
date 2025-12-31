import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, gte, lte, sql, or, ilike } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { rooms, bookings } from '../database/schema';
import { SearchRoomsDto } from './rooms.dto';

/**
 * Rooms service
 * Handles room-related operations including search and availability checking
 */
@Injectable()
export class RoomsService {
  /**
   * Create rooms service
   * @param db - Database instance
   */
  constructor(
    @Inject('DRIZZLE_DB')
    private readonly db: NodePgDatabase<typeof import('../database/schema')>,
  ) {}

  /**
   * Search rooms with filters
   * @param searchDto - Search parameters
   * @returns Paginated list of available rooms
   */
  async search(searchDto: SearchRoomsDto) {
    if (!this.db) {
      throw new Error('Database connection is not available. Please check DATABASE_URL configuration.');
    }

    const { dateFrom, dateTo, location, capacity, amenities, minPrice, maxPrice, page, limit } = searchDto;

    if (dateFrom) {
      const today = (new Date()).setHours(0, 0, 0, 0);
      const checkInDate = (new Date(dateFrom)).setHours(0, 0, 0, 0);
      if (checkInDate < today) {
        return {
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        };
      }
    }

    const offset = (page - 1) * limit;

    // Build base query conditions
    const conditions = [];

    // Status filter - only available rooms
    conditions.push(eq(rooms.status, 'available'));

    // Location filter
    if (location) {
      conditions.push(ilike(rooms.location, `%${location}%`));
    }

    // Capacity filter
    if (capacity) {
      conditions.push(gte(rooms.capacity, capacity));
    }

    // Price range filters
    if (minPrice !== undefined) {
      conditions.push(gte(sql`CAST(${rooms.pricePerNight} AS DECIMAL)`, minPrice));
    }

    if (maxPrice !== undefined) {
      conditions.push(lte(sql`CAST(${rooms.pricePerNight} AS DECIMAL)`, maxPrice));
    }

    // Amenities filter (if provided)
    if (amenities) {
      const amenityList = amenities.split(',').map((a) => a.trim());
      const amenityConditions = amenityList.map((amenity) =>
        sql`${rooms.amenities}::text ILIKE ${`%${amenity}%`}`,
      );
      conditions.push(or(...amenityConditions));
    }

    // Build query
    let query = this.db.select().from(rooms).where(and(...conditions));

    // Get total count for pagination
    const totalQuery = this.db
      .select({ count: sql<number>`count(*)` })
      .from(rooms)
      .where(and(...conditions));

    const [{ count: total }] = await totalQuery;
    const totalPages = Math.ceil(Number(total) / limit);

    // Apply pagination
    const results = await query.limit(limit).offset(offset);

    // If date range is provided, filter out rooms with conflicting bookings
    let availableRooms = results;

    if (dateFrom && dateTo) {
      const conflictingBookings = await this.db
        .select({ roomId: bookings.roomId })
        .from(bookings)
        .where(
          and(
            sql`${bookings.status} != 'cancelled'`,
            sql`${bookings.checkInDate} < ${dateTo}`,
            sql`${bookings.checkOutDate} > ${dateFrom}`,
          ),
        );

      const conflictingRoomIds = new Set(conflictingBookings.map((b) => b.roomId));
      availableRooms = results.filter((room) => !conflictingRoomIds.has(room.id));
    }

    return {
      data: availableRooms,
      pagination: {
        page,
        limit,
        total: Number(total),
        totalPages,
      },
    };
  }

  /**
   * Find room by ID
   * @param id - Room ID
   * @returns Room details
   * @throws NotFoundException if room not found
   */
  async findById(id: number) {
    const [room] = await this.db.select().from(rooms).where(eq(rooms.id, id)).limit(1);

    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    return room;
  }

  /**
   * Check room availability for a date range
   * @param roomId - Room ID
   * @param dateFrom - Check-in date
   * @param dateTo - Check-out date
   * @returns Availability status
   */
  async checkAvailability(roomId: number, dateFrom: string, dateTo: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDate = new Date(dateFrom);
    checkInDate.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      const room = await this.findById(roomId);
      return {
        roomId,
        roomName: room.name,
        dateFrom,
        dateTo,
        available: false,
        conflictingBookings: 0,
      };
    }

    // Verify room exists
    const room = await this.findById(roomId);

    // Check for conflicting bookings
    const conflictingBookings = await this.db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.roomId, roomId),
          sql`${bookings.status} != 'cancelled'`,
          sql`${bookings.checkInDate} < ${dateTo}`,
          sql`${bookings.checkOutDate} > ${dateFrom}`,
        ),
      )
      .limit(1);

    const isAvailable = conflictingBookings.length === 0;

    return {
      roomId,
      roomName: room.name,
      dateFrom,
      dateTo,
      available: isAvailable,
      conflictingBookings: conflictingBookings.length,
    };
  }

  /**
   * Create a new room (for future admin use)
   * @param roomData - Room data
   * @returns Created room
   */
  async create(roomData: {
    name: string;
    description?: string;
    location: string;
    capacity: number;
    pricePerNight: string;
    amenities?: unknown;
    images?: string[];
  }) {
    const [room] = await this.db
      .insert(rooms)
      .values({
        name: roomData.name,
        description: roomData.description || null,
        location: roomData.location,
        capacity: roomData.capacity,
        pricePerNight: roomData.pricePerNight,
        amenities: roomData.amenities || null,
        images: roomData.images || [],
      })
      .returning();

    return room;
  }

  /**
   * Update a room (for future admin use)
   * @param id - Room ID
   * @param roomData - Updated room data
   * @returns Updated room
   */
  async update(id: number, roomData: Partial<{
    name: string;
    description: string;
    location: string;
    capacity: number;
    pricePerNight: string;
    amenities: unknown;
    images: string[];
    status: 'available' | 'unavailable';
  }>) {
    const [room] = await this.db
      .update(rooms)
      .set({
        ...roomData,
        updatedAt: new Date(),
      })
      .where(eq(rooms.id, id))
      .returning();

    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    return room;
  }
}

