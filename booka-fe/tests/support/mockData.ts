/**
 * Mock data for API responses
 * Used to isolate tests from the real database
 */

export const mockRoomsResponse = {
  success: true,
  data: {
    data: [
      {
        id: 1,
        name: 'Cozy Downtown Apartment',
        location: 'New York',
        description: 'A beautiful apartment in the heart of downtown',
        pricePerNight: '150.00',
        capacity: 2,
        images: ['https://via.placeholder.com/400x300?text=Room+1'],
        amenities: {
          wifi: true,
          parking: false,
          pool: false,
        },
      },
      {
        id: 2,
        name: 'Luxury Beach Villa',
        location: 'Miami',
        description: 'Stunning beachfront property with ocean views',
        pricePerNight: '350.00',
        capacity: 4,
        images: ['https://via.placeholder.com/400x300?text=Room+2'],
        amenities: {
          wifi: true,
          parking: true,
          pool: true,
        },
      },
      {
        id: 3,
        name: 'Mountain Cabin Retreat',
        location: 'Aspen',
        description: 'Peaceful cabin surrounded by nature',
        pricePerNight: '200.00',
        capacity: 3,
        images: ['https://via.placeholder.com/400x300?text=Room+3'],
        amenities: {
          wifi: true,
          parking: true,
          pool: false,
        },
      },
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 3,
      totalPages: 1,
    },
  },
};

export const mockRoomDetailsResponse = {
  success: true,
  data: {
    id: 1,
    name: 'Cozy Downtown Apartment',
    location: 'New York',
    description: 'A beautiful apartment in the heart of downtown with modern amenities and stunning city views.',
    pricePerNight: '150.00',
    capacity: 2,
    images: [
      'https://via.placeholder.com/800x600?text=Room+1+Main',
      'https://via.placeholder.com/400x300?text=Room+1+Bedroom',
      'https://via.placeholder.com/400x300?text=Room+1+Kitchen',
    ],
    amenities: {
      wifi: true,
      parking: false,
      pool: false,
      airConditioning: true,
      heating: true,
      kitchen: true,
    },
  },
};

export const mockRoomAvailabilityResponse = {
  success: true,
  data: {
    available: true,
    message: 'Room is available for the selected dates',
  },
};

export const mockLocationsResponse = {
  success: true,
  data: {
    locations: ['New York', 'Miami', 'Aspen', 'Los Angeles', 'Chicago'],
  },
};

export const mockBookingsResponse = {
  success: true,
  data: {
    data: [
      {
        id: 1,
        userId: 1,
        roomId: 1,
        checkInDate: '2026-01-08',
        checkOutDate: '2026-01-10',
        totalPrice: '300.00',
        status: 'confirmed',
        cancellationReason: null,
        createdAt: '2026-01-02T14:34:25.793Z',
        updatedAt: '2026-01-02T14:34:25.793Z',
        room: {
          id: 1,
          name: 'Cozy Downtown Apartment',
          description: 'A beautiful apartment in the heart of downtown',
          location: 'New York',
          capacity: 2,
          pricePerNight: '150.00',
          amenities: {
            wifi: true,
            parking: false,
            pool: false,
          },
          images: ['https://via.placeholder.com/400x300?text=Room+1'],
          status: 'available',
          createdAt: '2025-12-30T20:13:55.405Z',
          updatedAt: '2025-12-30T20:13:55.405Z',
        },
      },
      {
        id: 2,
        userId: 1,
        roomId: 2,
        checkInDate: '2026-01-04',
        checkOutDate: '2026-01-16',
        totalPrice: '4200.00',
        status: 'pending',
        cancellationReason: null,
        createdAt: '2026-01-03T14:50:27.266Z',
        updatedAt: '2026-01-03T14:50:27.266Z',
        room: {
          id: 2,
          name: 'Luxury Beach Villa',
          description: 'Stunning beachfront property with ocean views',
          location: 'Miami',
          capacity: 4,
          pricePerNight: '350.00',
          amenities: {
            wifi: true,
            parking: true,
            pool: true,
          },
          images: ['https://via.placeholder.com/400x300?text=Room+2'],
          status: 'available',
          createdAt: '2025-12-30T20:13:55.405Z',
          updatedAt: '2025-12-30T20:13:55.405Z',
        },
      },
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
    },
  },
};

export const mockCreateBookingResponse = {
  success: true,
  data: {
    id: 3,
    roomId: 1,
    checkInDate: '2024-12-20',
    checkOutDate: '2024-12-25',
    status: 'confirmed',
    totalPrice: '750.00',
  },
};

export const mockCancelBookingResponse = {
  success: true,
  data: {
    id: 1,
    status: 'cancelled',
  },
};

