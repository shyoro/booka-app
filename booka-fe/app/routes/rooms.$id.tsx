import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { parseISO } from 'date-fns';
import { Navbar } from '~/components/layout/Navbar';
import { RoomDetails } from '~/components/rooms/RoomDetails';
import { useRoomDetails } from '~/hooks/api/useRooms';

/**
 * Parse date from search params
 */
function parseDateFromParams(dateStr: string | null): Date | undefined {
  if (!dateStr) return undefined;
  const parsed = parseISO(dateStr);
  return !isNaN(parsed.getTime()) ? parsed : undefined;
}

/**
 * Build back URL with all preserved search params
 */
function buildBackUrl(searchParams: URLSearchParams): string {
  const params = new URLSearchParams();
  const location = searchParams.get('location');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const capacity = searchParams.get('capacity');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');

  if (location) params.set('location', location);
  if (dateFrom) params.set('dateFrom', dateFrom);
  if (dateTo) params.set('dateTo', dateTo);
  if (capacity) params.set('capacity', capacity);
  if (minPrice) params.set('minPrice', minPrice);
  if (maxPrice) params.set('maxPrice', maxPrice);

  const queryString = params.toString();
  return queryString ? `/?${queryString}` : '/';
}

/**
 * Room details route page
 */
export default function RoomDetailsPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const roomId = id ? Number(id) : 0;
  const { data: roomData, isLoading, error } = useRoomDetails(roomId);
  const room = roomData;

  const initialCheckIn = parseDateFromParams(searchParams.get('dateFrom'));
  const initialCheckOut = parseDateFromParams(searchParams.get('dateTo'));
  const backUrl = buildBackUrl(searchParams);

  /**
   * Scroll to top on mount
   */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [roomId]);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RoomDetails
          room={room}
          isLoading={isLoading}
          error={error}
          initialCheckIn={initialCheckIn}
          initialCheckOut={initialCheckOut}
          backUrl={backUrl}
        />
      </main>
    </div>
  );
}

