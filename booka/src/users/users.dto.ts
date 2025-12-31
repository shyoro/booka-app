import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Create user DTO schema
 */
export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
});

/**
 * Create user DTO
 */
export class CreateUserDto extends createZodDto(createUserSchema) {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'User password (minimum 8 characters)',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  password!: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  name!: string;
}

/**
 * Update user DTO schema
 */
export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').max(255, 'Name is too long').optional(),
  email: z.string().email('Invalid email format').optional(),
}).refine((data) => {
  return Object.keys(data).length > 0;
}, {
  message: 'At least one field must be provided',
});

/**
 * Update user DTO
 */
export class UpdateUserDto extends createZodDto(updateUserSchema) {
  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
    required: false,
  })
  email?: string;
}

