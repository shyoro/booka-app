import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Drizzle ORM module for database connection
 * Provides a global database connection instance
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'DRIZZLE_DB',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // Try multiple ways to get DATABASE_URL
        const connectionString = 
          configService.get<string>('DATABASE_URL') || 
          process.env.DATABASE_URL;
        
        if (!connectionString) {
          throw new Error('DATABASE_URL is required but not found in environment variables. Please check your .env file.');
        }

        const queryClient = postgres(connectionString, {
          max: 10,
        });

        return drizzle(queryClient, { schema });
      },
    },
  ],
  exports: ['DRIZZLE_DB'],
})
export class DrizzleModule {}

