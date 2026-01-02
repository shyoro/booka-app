import { format, parseISO, differenceInDays, isPast, isFuture } from 'date-fns';

/**
 * Formats a date string for display
 * @param date - ISO date string (YYYY-MM-DD)
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
export function formatDate(date: string): string {
  return format(parseISO(date), 'MMM d, yyyy');
}

/**
 * Formats a date range for display
 * @param from - Start date string (YYYY-MM-DD)
 * @param to - End date string (YYYY-MM-DD)
 * @returns Formatted date range string (e.g., "Jan 15 - Jan 20, 2024")
 */
export function formatDateRange(from: string, to: string): string {
  const fromDate = parseISO(from);
  const toDate = parseISO(to);
  
  if (fromDate.getFullYear() === toDate.getFullYear()) {
    if (fromDate.getMonth() === toDate.getMonth()) {
      return `${format(fromDate, 'MMM d')} - ${format(toDate, 'd, yyyy')}`;
    }
    return `${format(fromDate, 'MMM d')} - ${format(toDate, 'MMM d, yyyy')}`;
  }
  
  return `${format(fromDate, 'MMM d, yyyy')} - ${format(toDate, 'MMM d, yyyy')}`;
}

/**
 * Calculates the number of nights between two dates
 * @param from - Start date string (YYYY-MM-DD)
 * @param to - End date string (YYYY-MM-DD)
 * @returns Number of nights
 */
export function calculateNights(from: string, to: string): number {
  return differenceInDays(parseISO(to), parseISO(from));
}

/**
 * Checks if a date is in the past
 * @param date - ISO date string (YYYY-MM-DD)
 * @returns True if the date is in the past
 */
export function isDateInPast(date: string): boolean {
  return isPast(parseISO(date));
}

/**
 * Checks if a date is in the future
 * @param date - ISO date string (YYYY-MM-DD)
 * @returns True if the date is in the future
 */
export function isDateInFuture(date: string): boolean {
  return isFuture(parseISO(date));
}

