import { format, parseISO, differenceInDays, isPast, isFuture } from 'date-fns';

/**
 * Formats a date string for display in a human-readable format.
 * 
 * @param date - ISO date string in YYYY-MM-DD format
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 * 
 * @example
 * formatDate('2024-01-15') // Returns "Jan 15, 2024"
 */
export function formatDate(date: string): string {
  return format(parseISO(date), 'MMM d, yyyy');
}

/**
 * Formats a date range for display with intelligent formatting based on the date span.
 * Automatically adjusts the format to avoid redundancy (e.g., same month/year).
 * 
 * @param from - Start date string in YYYY-MM-DD format
 * @param to - End date string in YYYY-MM-DD format
 * @returns Formatted date range string with appropriate detail level
 * 
 * @example
 * formatDateRange('2024-01-15', '2024-01-20') // Returns "Jan 15 - 20, 2024"
 * formatDateRange('2024-01-15', '2024-02-20') // Returns "Jan 15 - Feb 20, 2024"
 * formatDateRange('2023-12-15', '2024-01-20') // Returns "Dec 15, 2023 - Jan 20, 2024"
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
 * Calculates the number of nights between two dates.
 * The calculation is exclusive of the start date and inclusive of the end date.
 * 
 * @param from - Start date string in YYYY-MM-DD format (check-in date)
 * @param to - End date string in YYYY-MM-DD format (check-out date)
 * @returns Number of nights between the two dates
 * 
 * @example
 * calculateNights('2024-01-15', '2024-01-20') // Returns 5
 */
export function calculateNights(from: string, to: string): number {
  return differenceInDays(parseISO(to), parseISO(from));
}

/**
 * Checks if a date is in the past relative to the current date and time.
 * 
 * @param date - ISO date string in YYYY-MM-DD format
 * @returns True if the date is in the past, false otherwise
 * 
 * @example
 * isDateInPast('2023-01-01') // Returns true (if current date is after 2023-01-01)
 * isDateInPast('2025-01-01') // Returns false (if current date is before 2025-01-01)
 */
export function isDateInPast(date: string): boolean {
  return isPast(parseISO(date));
}

/**
 * Checks if a date is in the future relative to the current date and time.
 * 
 * @param date - ISO date string in YYYY-MM-DD format
 * @returns True if the date is in the future, false otherwise
 * 
 * @example
 * isDateInFuture('2025-01-01') // Returns true (if current date is before 2025-01-01)
 * isDateInFuture('2023-01-01') // Returns false (if current date is after 2023-01-01)
 */
export function isDateInFuture(date: string): boolean {
  return isFuture(parseISO(date));
}

