import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { DrizzleModule } from '../database/drizzle.module';
import { FixQueryMiddleware } from '../common/middleware/fix-query.middleware';

/**
 * Rooms module
 * Provides room search and management functionality
 */
@Module({
  imports: [DrizzleModule],
  controllers: [RoomsController],
  providers: [RoomsService, FixQueryMiddleware],
  exports: [RoomsService],
})
export class RoomsModule implements NestModule {
  /**
   * Configure middleware
   * @param consumer - Middleware consumer
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(FixQueryMiddleware).forRoutes('rooms');
  }
}

