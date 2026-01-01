/**
 * Price calculation utilities
 * Provides reusable functions for calculating booking prices
 */

/**
 * Calculate number of nights between two dates
 * @param checkInDate - Check-in date (string or Date)
 * @param checkOutDate - Check-out date (string or Date)
 * @returns Number of nights
 */
export function calculateNights(checkInDate: string | Date, checkOutDate: string | Date): number {
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const timeDiff = checkOut.getTime() - checkIn.getTime();
  const nights = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  return nights > 0 ? nights : 0;
}

/**
 * Calculate total price for a booking based on date range and price per night
 * @param checkInDate - Check-in date (string or Date)
 * @param checkOutDate - Check-out date (string or Date)
 * @param pricePerNight - Price per night (string or number)
 * @returns Total price as a formatted string with 2 decimal places
 */
export function calculateTotalPrice(
  checkInDate: string | Date,
  checkOutDate: string | Date,
  pricePerNight: string | number,
): string {
  const nights = calculateNights(checkInDate, checkOutDate);
  const price = typeof pricePerNight === 'string' ? parseFloat(pricePerNight) : pricePerNight;
  
  if (isNaN(price) || price < 0) {
    throw new Error('Invalid price per night');
  }
  
  const totalPrice = nights * price;
  return totalPrice.toFixed(2);
}

