import { Module } from '@nestjs/common';
import { EmailsService } from './emails.service';

/**
 * Emails module
 * Provides email sending functionality
 */
@Module({
  providers: [EmailsService],
  exports: [EmailsService],
})
export class EmailsModule {}

