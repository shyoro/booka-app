import { describe, it, expect } from 'vitest';
import { calculateNights, calculateTotalPrice } from '../../src/common/utils/price.utils';

describe('Price Utils', () => {
  describe('calculateNights', () => {
    it('should calculate nights correctly for valid date range', () => {
      const checkIn = '2024-01-15';
      const checkOut = '2024-01-20';
      const nights = calculateNights(checkIn, checkOut);
      expect(nights).toBe(5);
    });

    it('should handle Date objects', () => {
      const checkIn = new Date('2024-01-15');
      const checkOut = new Date('2024-01-20');
      const nights = calculateNights(checkIn, checkOut);
      expect(nights).toBe(5);
    });

    it('should return 0 for same day', () => {
      const date = '2024-01-15';
      const nights = calculateNights(date, date);
      expect(nights).toBe(0);
    });

    it('should return 0 for invalid date range (checkOut before checkIn)', () => {
      const checkIn = '2024-01-20';
      const checkOut = '2024-01-15';
      const nights = calculateNights(checkIn, checkOut);
      expect(nights).toBe(0);
    });

    it('should handle single night stay', () => {
      const checkIn = '2024-01-15';
      const checkOut = '2024-01-16';
      const nights = calculateNights(checkIn, checkOut);
      expect(nights).toBe(1);
    });
  });

  describe('calculateTotalPrice', () => {
    it('should calculate total price correctly', () => {
      const checkIn = '2024-01-15';
      const checkOut = '2024-01-20';
      const pricePerNight = 100;
      const total = calculateTotalPrice(checkIn, checkOut, pricePerNight);
      expect(total).toBe('500.00');
    });

    it('should handle string price per night', () => {
      const checkIn = '2024-01-15';
      const checkOut = '2024-01-20';
      const pricePerNight = '99.99';
      const total = calculateTotalPrice(checkIn, checkOut, pricePerNight);
      expect(total).toBe('499.95');
    });

    it('should format result to 2 decimal places', () => {
      const checkIn = '2024-01-15';
      const checkOut = '2024-01-17';
      const pricePerNight = 33.33;
      const total = calculateTotalPrice(checkIn, checkOut, pricePerNight);
      expect(total).toBe('66.66');
    });

    it('should throw error for invalid price (NaN)', () => {
      const checkIn = '2024-01-15';
      const checkOut = '2024-01-20';
      const pricePerNight = 'invalid';
      
      expect(() => {
        calculateTotalPrice(checkIn, checkOut, pricePerNight);
      }).toThrow('Invalid price per night');
    });

    it('should throw error for negative price', () => {
      const checkIn = '2024-01-15';
      const checkOut = '2024-01-20';
      const pricePerNight = -100;
      
      expect(() => {
        calculateTotalPrice(checkIn, checkOut, pricePerNight);
      }).toThrow('Invalid price per night');
    });

    it('should handle single night booking', () => {
      const checkIn = '2024-01-15';
      const checkOut = '2024-01-16';
      const pricePerNight = 100;
      const total = calculateTotalPrice(checkIn, checkOut, pricePerNight);
      expect(total).toBe('100.00');
    });

    it('should handle Date objects', () => {
      const checkIn = new Date('2024-01-15');
      const checkOut = new Date('2024-01-20');
      const pricePerNight = 100;
      const total = calculateTotalPrice(checkIn, checkOut, pricePerNight);
      expect(total).toBe('500.00');
    });
  });
});

