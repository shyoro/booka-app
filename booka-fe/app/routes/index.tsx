import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import { Navbar } from '~/components/layout/Navbar';
import { HeroSearch, type SearchParams } from '~/components/search/HeroSearch';
import { RoomGrid } from '~/components/rooms/RoomGrid';
import { useInfiniteSearchRooms } from '~/hooks/api/useRooms';

export function meta() {
  return [
    { title: 'Booka - Find Your Perfect Room' },
    { name: 'description', content: 'Discover and book the perfect room for your stay' },
  ];
}

/**
 * Parse search params from URL
 */
function parseSearchParams(searchParams: URLSearchParams): SearchParams {
  const location = searchParams.get('location') || undefined;
  const dateFrom = searchParams.get('dateFrom') || undefined;
  const dateTo = searchParams.get('dateTo') || undefined;
  const capacity = searchParams.get('capacity') ? parseInt(searchParams.get('capacity')!) : undefined;
  const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined;

  return { location, dateFrom, dateTo, capacity, minPrice, maxPrice };
}

/**
 * Home page with hero search and featured rooms
 */
export default function Index() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const searchFilters = parseSearchParams(searchParams);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteSearchRooms({
    location: searchFilters.location,
    dateFrom: searchFilters.dateFrom,
    dateTo: searchFilters.dateTo,
    capacity: searchFilters.capacity,
    minPrice: searchFilters.minPrice,
    maxPrice: searchFilters.maxPrice,
  });

  /**
   * Memoized search handler to prevent unnecessary re-renders of HeroSearch
   */
  const handleSearch = useCallback((params: SearchParams) => {
    const newParams = new URLSearchParams();
    
    if (params.location) newParams.set('location', params.location);
    if (params.dateFrom) newParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) newParams.set('dateTo', params.dateTo);
    if (params.capacity) newParams.set('capacity', params.capacity.toString());
    if (params.minPrice) newParams.set('minPrice', params.minPrice.toString());
    if (params.maxPrice) newParams.set('maxPrice', params.maxPrice.toString());
    
    setSearchParams(newParams, { replace: true });
  }, [setSearchParams]);

  const rooms = data?.pages.flatMap((page) => page.rooms) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Navbar />
      <main>
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20"
        >
          <div className="max-w-4xl mx-auto mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Find Your Perfect Stay
            </h1>
            <p className="text-center text-muted-foreground text-lg">
              Discover amazing rooms and book your next adventure
            </p>
          </div>
          <HeroSearch onSearch={handleSearch} initialParams={searchFilters} />
        </motion.section>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <h2 className="text-3xl font-bold mb-8">
            {searchFilters.location || searchFilters.dateFrom ? 'Search Results' : 'Featured Rooms'}
          </h2>
          <RoomGrid
            rooms={rooms}
            isLoading={isLoading}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            searchParams={searchFilters}
          />
        </section>
      </main>
    </div>
  );
}
