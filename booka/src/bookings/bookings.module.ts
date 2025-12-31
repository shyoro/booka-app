import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { DrizzleModule } from '../database/drizzle.module';
import { RoomsModule } from '../rooms/rooms.module';
import { EmailsModule } from '../emails/emails.module';
import { UsersModule } from '../users/users.module';

/**
 * Bookings module
 * Provides booking management functionality with concurrency control
 */
@Module({
  imports: [DrizzleModule, RoomsModule, EmailsModule, UsersModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}

