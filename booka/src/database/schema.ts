import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  decimal,
  jsonb,
  date,
  pgEnum,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Room status enum
 */
export const roomStatusEnum = pgEnum('room_status', ['available', 'unavailable']);

/**
 * Booking status enum
 */
export const bookingStatusEnum = pgEnum('booking_status', [
  'pending',
  'confirmed',
  'cancelled',
  'completed',
]);

/**
 * Users table
 * Stores user account information
 */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Rooms table
 * Stores room information including location, capacity, pricing, and amenities
 */
export const rooms = pgTable('rooms', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  location: text('location').notNull(),
  capacity: integer('capacity').notNull(),
  pricePerNight: decimal('price_per_night', { precision: 10, scale: 2 }).notNull(),
  amenities: jsonb('amenities'),
  images: text('images').array(),
  status: roomStatusEnum('status').notNull().default('available'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Bookings table
 * Stores booking information with relationships to users and rooms
 */
export const bookings = pgTable(
  'bookings',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roomId: integer('room_id')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    checkInDate: date('check_in_date').notNull(),
    checkOutDate: date('check_out_date').notNull(),
    totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
    status: bookingStatusEnum('status').notNull().default('pending'),
    cancellationReason: text('cancellation_reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Partial unique constraint on (roomId, checkInDate, checkOutDate) where status != 'cancelled'
    // Note: Drizzle doesn't support partial unique constraints directly,
    // so this is handled via a partial unique index in the migration file (0000_wealthy_venom.sql)
    // The constraint prevents overlapping bookings only for non-cancelled bookings
  }),
);

/**
 * Database relations
 * Defines relationships between tables for type-safe queries
 */
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
}));

export const roomsRelations = relations(rooms, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  room: one(rooms, {
    fields: [bookings.roomId],
    references: [rooms.id],
  }),
}));

