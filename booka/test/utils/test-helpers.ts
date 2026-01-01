import { vi } from 'vitest';

/**
 * Create a mock query builder for Drizzle ORM
 * @param result - The result array to return when limit() or returning() is called
 * @returns Mock query builder with chaining methods
 */
export function createMockQueryBuilder(result: any[] = []) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
    offset: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(result),
  };
}

/**
 * Create a mock count query builder for Drizzle ORM
 * @param countResult - The count result array to return
 * @returns Mock count query builder
 */
export function createMockCountQueryBuilder(countResult: any[] = [{ count: 0 }]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(countResult),
  };
}

/**
 * Inject a mock service into an instance if DI failed
 * @param instance - The instance to inject into
 * @param property - The property name to inject
 * @param mock - The mock service to inject
 */
export function injectMockService(instance: any, property: string, mock: any): void {
  if (!instance[property]) {
    instance[property] = mock;
  }
}

