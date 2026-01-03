import { z } from 'zod';

/**
 * Environment variables schema
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url().optional(),
  // JWT Configuration
  JWT_SECRET: z.string().min(32).optional(),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32).optional(),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  // Email Configuration
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_FROM_NAME: z.string().default('Booka'),
  // Rate Limiting Configuration
  THROTTLE_TTL: z.coerce.number().default(60), // Time window in seconds (1 minute)
  THROTTLE_LIMIT_PUBLIC: z.coerce.number().default(100), // Requests per window for public endpoints
  THROTTLE_LIMIT_AUTHENTICATED: z.coerce.number().default(500), // Requests per window for authenticated endpoints
  THROTTLE_LIMIT_SEARCH: z.coerce.number().default(50), // Requests per window for search endpoints
});

export type Environment = z.infer<typeof envSchema>;

/**
 * Validates and returns environment variables
 * @throws Error if environment variables are invalid
 */
export function validateEnvironment(): Environment {
  const env: Record<string, unknown> = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
    EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
    THROTTLE_TTL: process.env.THROTTLE_TTL,
    THROTTLE_LIMIT_PUBLIC: process.env.THROTTLE_LIMIT_PUBLIC,
    THROTTLE_LIMIT_AUTHENTICATED: process.env.THROTTLE_LIMIT_AUTHENTICATED,
    THROTTLE_LIMIT_SEARCH: process.env.THROTTLE_LIMIT_SEARCH,
  };

  // Only include optional fields if they exist (Zod .optional() expects key to be omitted, not undefined)
  if (process.env.DATABASE_URL) {
    env.DATABASE_URL = process.env.DATABASE_URL;
  }

  if (process.env.JWT_SECRET) {
    env.JWT_SECRET = process.env.JWT_SECRET;
  }

  if (process.env.JWT_REFRESH_SECRET) {
    env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
  }

  if (process.env.RESEND_API_KEY) {
    env.RESEND_API_KEY = process.env.RESEND_API_KEY;
  }

  if (process.env.EMAIL_FROM) {
    env.EMAIL_FROM = process.env.EMAIL_FROM;
  }

  const validatedEnv = envSchema.parse(env);

  // Require JWT secrets in production
  if (validatedEnv.NODE_ENV === 'production') {
    if (!validatedEnv.JWT_SECRET || validatedEnv.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET is required in production and must be at least 32 characters long');
    }
    if (!validatedEnv.JWT_REFRESH_SECRET || validatedEnv.JWT_REFRESH_SECRET.length < 32) {
      throw new Error('JWT_REFRESH_SECRET is required in production and must be at least 32 characters long');
    }
  }

  return validatedEnv;
}
