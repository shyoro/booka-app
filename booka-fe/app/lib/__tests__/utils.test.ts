import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

/**
 * Unit tests for the cn utility function
 * Tests class name merging and conditional class application
 */
describe('cn utility', () => {
  it('should merge class names', () => {
    const result = cn('px-2', 'py-1');
    expect(result).toBe('px-2 py-1');
  });

  it('should handle Tailwind class conflicts correctly', () => {
    const result = cn('px-2 py-1', 'px-4');
    expect(result).toBe('py-1 px-4');
  });

  it('should apply conditional classes', () => {
    const isActive = true;
    const result = cn('bg-red-500', { 'bg-blue-500': isActive });
    expect(result).toBe('bg-blue-500');
  });

  it('should not apply conditional classes when condition is false', () => {
    const isActive = false;
    const result = cn('bg-red-500', { 'bg-blue-500': isActive });
    expect(result).toBe('bg-red-500');
  });

  it('should handle undefined and null values', () => {
    const result = cn('px-2', undefined, null, 'py-1');
    expect(result).toBe('px-2 py-1');
  });

  it('should handle empty strings', () => {
    const result = cn('px-2', '', 'py-1');
    expect(result).toBe('px-2 py-1');
  });

  it('should handle arrays of class names', () => {
    const result = cn(['px-2', 'py-1'], 'px-4');
    expect(result).toBe('py-1 px-4');
  });

  it('should merge multiple conflicting classes correctly', () => {
    const result = cn('px-2 py-1', 'px-4 py-2', 'px-6');
    expect(result).toBe('py-2 px-6');
  });
});

