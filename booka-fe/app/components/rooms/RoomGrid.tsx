import { motion } from 'framer-motion';
import { RoomCard } from './RoomCard';
import { RoomSkeleton } from './RoomSkeleton';
import type { Room } from '~/hooks/api/useRooms';
import { Search } from 'lucide-react';

interface RoomGridProps {
  rooms: Room[];
  isLoading?: boolean;
  emptyMessage?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

/**
 * Room grid component with responsive layout and animations
 */
export function RoomGrid({ rooms, isLoading, emptyMessage = 'No rooms found' }: RoomGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <RoomSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Search className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No rooms found</h3>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} />
      ))}
    </motion.div>
  );
}

