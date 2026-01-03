import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingCard } from '../BookingCard';
import type { Booking } from '~/hooks/api/useBookings';

/**
 * Unit tests for BookingCard component
 * Tests component rendering, status handling, and cancellation functionality
 */
describe('BookingCard', () => {
  const mockBooking: Booking = {
    id: 1,
    userId: 1,
    roomId: 1,
    checkInDate: '2024-02-15',
    checkOutDate: '2024-02-20',
    totalPrice: '500.00',
    status: 'confirmed',
    cancellationReason: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    room: {
      id: 1,
      name: 'Test Room',
      description: 'A beautiful test room',
      location: 'Test City',
      capacity: 4,
      pricePerNight: '100.00',
      amenities: {},
      images: ['https://example.com/room.jpg'],
      status: 'available',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should render booking information correctly', () => {
    render(<BookingCard booking={mockBooking} />);
    
    expect(screen.getByText('Test Room')).toBeInTheDocument();
    expect(screen.getByText('Test City')).toBeInTheDocument();
    expect(screen.getByText('$500')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
  });

  it('should render room image with correct alt text', () => {
    render(<BookingCard booking={mockBooking} />);
    
    const image = screen.getByAltText('Test Room');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/room.jpg');
  });

  it('should show cancel button for upcoming bookings', () => {
    const onCancel = vi.fn();
    render(<BookingCard booking={mockBooking} onCancel={onCancel} />);
    
    const cancelButton = screen.getByTestId(`cancel-booking-btn-${mockBooking.id}`);
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).toHaveTextContent('Cancel Reservation');
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn();
    render(<BookingCard booking={mockBooking} onCancel={onCancel} />);
    
    const cancelButton = screen.getByTestId(`cancel-booking-btn-${mockBooking.id}`);
    cancelButton.click();
    
    expect(onCancel).toHaveBeenCalledWith(mockBooking.id);
  });

  it('should not show cancel button for cancelled bookings', () => {
    const cancelledBooking = { ...mockBooking, status: 'cancelled' as const };
    const onCancel = vi.fn();
    render(<BookingCard booking={cancelledBooking} onCancel={onCancel} />);
    
    expect(screen.queryByTestId(`cancel-booking-btn-${cancelledBooking.id}`)).not.toBeInTheDocument();
    expect(screen.getByText('CANCELLED')).toBeInTheDocument();
  });

  it('should not show cancel button for past bookings', () => {
    const pastBooking = {
      ...mockBooking,
      checkInDate: '2023-01-15',
      checkOutDate: '2023-01-20',
    };
    const onCancel = vi.fn();
    render(<BookingCard booking={pastBooking} onCancel={onCancel} />);
    
    expect(screen.queryByTestId(`cancel-booking-btn-${pastBooking.id}`)).not.toBeInTheDocument();
  });

  it('should display cancelled badge for cancelled bookings', () => {
    const cancelledBooking = { ...mockBooking, status: 'cancelled' as const };
    render(<BookingCard booking={cancelledBooking} />);
    
    expect(screen.getByText('CANCELLED')).toBeInTheDocument();
  });

  it('should handle booking without room data gracefully', () => {
    const bookingWithoutRoom = { ...mockBooking, room: undefined };
    render(<BookingCard booking={bookingWithoutRoom} />);
    
    expect(screen.getByText('Room')).toBeInTheDocument();
  });

  it('should format date range correctly', () => {
    render(<BookingCard booking={mockBooking} />);
    
    // The date range should be formatted by formatDateRange utility
    // Since we're mocking dates, we check that the date range is displayed
    const dateElements = screen.getAllByText(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('should display correct status badge', () => {
    const pendingBooking = { ...mockBooking, status: 'pending' as const };
    render(<BookingCard booking={pendingBooking} />);
    
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});

