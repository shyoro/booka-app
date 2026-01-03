import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { MapPin, Users } from 'lucide-react';
import { cn } from '~/lib/utils';
import type { Room } from '~/hooks/api/useRooms';
import type { SearchParams } from '~/components/search/HeroSearch';

interface RoomCardProps {
  room: Room;
  onBook?: (roomId: number) => void;
  searchParams?: SearchParams;
}

/**
 * Room card component with glassmorphism styling and animations
 */
export function RoomCard({ room, onBook, searchParams }: RoomCardProps) {
  const imageUrl = room.images && room.images.length > 0 ? room.images[0] : '/placeholder-room.jpg';
  const price = parseFloat(room.pricePerNight || '0');

  /**
   * Build URL with all search params to preserve search context
   */
  const buildRoomUrl = () => {
    const baseUrl = `/rooms/${room.id}`;
    const params = new URLSearchParams();

    if (searchParams?.location) {
      params.set('location', searchParams.location);
    }
    if (searchParams?.dateFrom) {
      params.set('dateFrom', searchParams.dateFrom);
    }
    if (searchParams?.dateTo) {
      params.set('dateTo', searchParams.dateTo);
    }
    if (searchParams?.capacity) {
      params.set('capacity', searchParams.capacity.toString());
    }
    if (searchParams?.minPrice) {
      params.set('minPrice', searchParams.minPrice.toString());
    }
    if (searchParams?.maxPrice) {
      params.set('maxPrice', searchParams.maxPrice.toString());
    }

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Link to={buildRoomUrl()} className="block h-full">
        <Card
          className={cn(
            // Layout
            'flex flex-col h-full',
            // Box model
            'p-0 overflow-hidden',
            // Visuals
            'bg-white/10 dark:bg-gray-900/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl',
            // Interactive states
            'cursor-pointer group hover:shadow-2xl transition-all duration-300'
          )}
        >
          <div className="relative h-48 w-full overflow-hidden rounded-t-2xl shrink-0">
            <img
              src={imageUrl}
              alt={room.name || 'Room'}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Room';
              }}
            />
          </div>
          <CardHeader className="shrink-0">
            <h3 className="text-xl font-bold truncate group-hover:text-primary transition-colors">{room.name}</h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="truncate">{room.location}</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            {room.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{room.description}</p>
            )}
            <div className="flex items-center gap-2 flex-wrap mt-auto">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {room.capacity} guests
              </Badge>
              {room.amenities && typeof room.amenities === 'object' && Object.keys(room.amenities).slice(0, 3).map((amenity) => (
                <Badge key={amenity} variant="outline" className="text-xs">
                  {amenity}
                </Badge>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center items-center pt-4 shrink-0">
            <div className="text-center">
              <span className="text-2xl font-bold text-primary">${Math.round(price)}</span>
              <span className="text-sm text-muted-foreground"> /night</span>
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}

