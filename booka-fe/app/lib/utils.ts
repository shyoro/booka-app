import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names intelligently, merging Tailwind CSS classes
 * and handling conditional classes.
 *
 * @param inputs - Class values (strings, objects, arrays, or undefined)
 * @returns Merged class string with Tailwind conflicts resolved
 *
 * @example
 * cn('px-2 py-1', 'px-4') // Returns 'py-1 px-4' (px-2 is overridden by px-4)
 * cn('bg-red-500', { 'bg-blue-500': isActive }) // Conditionally applies bg-blue-500
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

