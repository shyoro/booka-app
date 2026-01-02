import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import { Navbar } from '~/components/layout/Navbar';
import { HeroSearch, type SearchParams } from '~/components/search/HeroSearch';
import { RoomGrid } from '~/components/rooms/RoomGrid';
import { useSearchRooms } from '~/hooks/api/useRooms';

export function meta() {
  return [
    { title: 'Booka - Find Your Perfect Room' },
    { name: 'description', content: 'Discover and book the perfect room for your stay' },
  ];
}

/**
 * Home page with hero search and featured rooms
 */
export default function Index() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchFilters, setSearchFilters] = useState<SearchParams>(() => {
    const location = searchParams.get('location') || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    const capacity = searchParams.get('capacity') ? parseInt(searchParams.get('capacity')!) : undefined;

    return { location, dateFrom, dateTo, capacity };
  });

  const { data, isLoading } = useSearchRooms({
    location: searchFilters.location,
    dateFrom: searchFilters.dateFrom,
    dateTo: searchFilters.dateTo,
    capacity: searchFilters.capacity,
    limit: searchFilters.location || searchFilters.dateFrom ? undefined : 5,
    page: 1,
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchFilters.location) params.set('location', searchFilters.location);
    if (searchFilters.dateFrom) params.set('dateFrom', searchFilters.dateFrom);
    if (searchFilters.dateTo) params.set('dateTo', searchFilters.dateTo);
    if (searchFilters.capacity) params.set('capacity', searchFilters.capacity.toString());
    setSearchParams(params, { replace: true });
  }, [searchFilters, setSearchParams]);

  const handleSearch = (params: SearchParams) => {
    setSearchFilters(params);
  };

  const rooms = data?.rooms || [];

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
          <RoomGrid rooms={rooms} isLoading={isLoading} />
        </section>
      </main>
    </div>
  );
}
