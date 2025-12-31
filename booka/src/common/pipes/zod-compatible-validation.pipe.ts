import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ValidationPipe, ValidationPipeOptions } from '@nestjs/common';
import { ZodSchema } from 'zod';

/**
 * Zod-compatible validation pipe
 * Works with both class-validator DTOs and nestjs-zod DTOs
 */
@Injectable()
export class ZodCompatibleValidationPipe extends ValidationPipe {
  /**
   * Create Zod-compatible validation pipe
   * @param options - Validation pipe options
   */
  constructor(options?: ValidationPipeOptions) {
    const finalOptions = {
      whitelist: true,
      forbidNonWhitelisted: false, // Disable for Zod DTOs
      transform: true,
      ...options,
    };
    super(finalOptions);
  }

  /**
   * Transform and validate the value
   * @param value - The value to validate
   * @param metadata - Argument metadata
   * @returns Validated value
   */
  async transform(value: unknown, metadata: ArgumentMetadata): Promise<unknown> {
    // Check if we have a metatype (DTO class) - handle both query and body parameters
    if (!metadata.metatype) {
      return super.transform(value, metadata);
    }

    // Try to get Zod schema for both query and body parameters
    const zodSchema = this.getZodSchema(metadata.metatype);
    
    if (zodSchema) {
      // Use Zod validation instead of class-validator
      // Skip super.transform() entirely to avoid class-validator interference
      try {
        return zodSchema.parse(value);
      } catch (error) {
        this.handleZodError(error);
      }
    }

    // Fall back to class-validator if no Zod schema found
    return super.transform(value, metadata);
  }

  /**
   * Handle Zod validation errors
   * @param error - The error caught from Zod parsing
   * @throws BadRequestException with formatted error messages
   */
  private handleZodError(error: unknown): never {
    if (error && typeof error === 'object' && 'errors' in error) {
      const zodError = error as { errors: Array<{ message: string; path: (string | number)[] }> };
      const errorMessages = zodError.errors.map((e) => {
        const path = e.path.join('.');
        return path ? `${path}: ${e.message}` : e.message;
      });
      
      throw new BadRequestException({
        message: errorMessages,
        error: 'Bad Request',
        statusCode: 400,
      });
    }
    
    throw new BadRequestException('Validation failed');
  }

  /**
   * Get Zod schema from DTO class
   * @param metatype - The DTO class
   * @returns Zod schema if found, null otherwise
   */
  private getZodSchema(metatype: unknown): ZodSchema | null {
    // Check if the class has a static property with the schema
    if (metatype && typeof metatype === 'function') {
      // Look for common Zod schema property names
      const schemaPropertyNames = ['zodSchema', 'schema', '_schema'];
      
      for (const propName of schemaPropertyNames) {
        if (propName in metatype) {
          const schema = (metatype as unknown as Record<string, unknown>)[propName];
          if (schema && typeof schema === 'object' && 'parse' in schema) {
            return schema as ZodSchema;
          }
        }
      }
    }
    
    return null;
  }
}

