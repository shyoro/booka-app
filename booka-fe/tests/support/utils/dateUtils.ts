/**
 * Date utility functions for tests
 */

/**
 * Get a future date relative to today
 * @param daysFromNow - Number of days from today
 * @returns Date string in format YYYY-MM-DD
 */
export function getFutureDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

/**
 * Get a date range for booking
 * @param checkInDays - Days from today for check-in
 * @param checkOutDays - Days from today for check-out
 * @returns Object with checkIn and checkOut date strings
 */
export function getDateRange(checkInDays: number, checkOutDays: number): { checkIn: string; checkOut: string } {
  return {
    checkIn: getFutureDate(checkInDays),
    checkOut: getFutureDate(checkOutDays),
  };
}

