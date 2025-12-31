import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/**
 * Example DTO with Zod schema
 * This demonstrates how to create DTOs with Zod validation
 */
export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
});

/**
 * Create user DTO
 * Automatically infers TypeScript type from Zod schema
 */
export class CreateUserDto extends createZodDto(CreateUserSchema) {}

