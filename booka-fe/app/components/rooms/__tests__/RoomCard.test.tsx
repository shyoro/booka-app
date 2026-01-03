import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoomCard } from '../RoomCard';
import type { Room } from '~/hooks/api/useRooms';

// Mock React Router
vi.mock('react-router', () => ({
  Link: ({ to, children, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

/**
 * Unit tests for RoomCard component
 * Tests component rendering, props handling, and user interactions
 */
describe('RoomCard', () => {
  const mockRoom: Room = {
    id: 1,
    name: 'Test Room',
    description: 'A beautiful test room',
    location: 'Test City',
    capacity: 4,
    pricePerNight: '100.50',
    amenities: {
      wifi: true,
      parking: true,
      airConditioning: true,
    },
    images: ['https://example.com/room.jpg'],
    status: 'available',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  it('should render room information correctly', () => {
    render(<RoomCard room={mockRoom} />);
    
    expect(screen.getByText('Test Room')).toBeInTheDocument();
    expect(screen.getByText('Test City')).toBeInTheDocument();
    expect(screen.getByText('A beautiful test room')).toBeInTheDocument();
    expect(screen.getByText('4 guests')).toBeInTheDocument();
    expect(screen.getByText('$101')).toBeInTheDocument();
    expect(screen.getByText('/night')).toBeInTheDocument();
  });

  it('should render room image with correct alt text', () => {
    render(<RoomCard room={mockRoom} />);
    
    const image = screen.getByAltText('Test Room');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/room.jpg');
  });

  it('should use placeholder image when no images provided', () => {
    const roomWithoutImages = { ...mockRoom, images: [] };
    render(<RoomCard room={roomWithoutImages} />);
    
    const image = screen.getByAltText('Test Room');
    expect(image).toHaveAttribute('src', '/placeholder-room.jpg');
  });

  it('should render amenities badges', () => {
    render(<RoomCard room={mockRoom} />);
    
    expect(screen.getByText('wifi')).toBeInTheDocument();
    expect(screen.getByText('parking')).toBeInTheDocument();
    expect(screen.getByText('airConditioning')).toBeInTheDocument();
  });

  it('should build correct URL with search params', () => {
    const searchParams = {
      location: 'Test City',
      dateFrom: '2024-01-15',
      dateTo: '2024-01-20',
      capacity: 4,
      minPrice: 50,
      maxPrice: 200,
    };
    
    render(<RoomCard room={mockRoom} searchParams={searchParams} />);
    
    const link = screen.getByTestId(`room-card-${mockRoom.id}`);
    expect(link).toHaveAttribute('href', expect.stringContaining('/rooms/1'));
    expect(link).toHaveAttribute('href', expect.stringContaining('location=Test+City'));
    expect(link).toHaveAttribute('href', expect.stringContaining('dateFrom=2024-01-15'));
    expect(link).toHaveAttribute('href', expect.stringContaining('dateTo=2024-01-20'));
    expect(link).toHaveAttribute('href', expect.stringContaining('capacity=4'));
  });

  it('should build URL without query params when searchParams not provided', () => {
    render(<RoomCard room={mockRoom} />);
    
    const link = screen.getByTestId(`room-card-${mockRoom.id}`);
    expect(link).toHaveAttribute('href', '/rooms/1');
  });

  it('should handle room without description', () => {
    const roomWithoutDescription = { ...mockRoom, description: null };
    render(<RoomCard room={roomWithoutDescription} />);
    
    expect(screen.getByText('Test Room')).toBeInTheDocument();
    expect(screen.queryByText('A beautiful test room')).not.toBeInTheDocument();
  });

  it('should handle room with empty amenities', () => {
    const roomWithoutAmenities = { ...mockRoom, amenities: {} };
    render(<RoomCard room={roomWithoutAmenities} />);
    
    expect(screen.getByText('4 guests')).toBeInTheDocument();
    expect(screen.queryByText('wifi')).not.toBeInTheDocument();
  });

  it('should round price correctly', () => {
    const roomWithDecimalPrice = { ...mockRoom, pricePerNight: '99.99' };
    render(<RoomCard room={roomWithDecimalPrice} />);
    
    expect(screen.getByText('$100')).toBeInTheDocument();
  });
});

