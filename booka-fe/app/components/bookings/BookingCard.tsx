import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { MapPin, Calendar } from 'lucide-react';
import type { Booking } from '~/hooks/api/useBookings';
import { formatDateRange, isDateInPast, isDateInFuture } from '~/lib/date-utils';
import { cn } from '~/lib/utils';

interface BookingCardProps {
  booking: Booking;
  onCancel?: (bookingId: number) => void;
}

/**
 * Booking card component with state-driven styling
 */
export function BookingCard({ booking, onCancel }: BookingCardProps) {
  const checkInDate = booking.checkInDate || '';
  const checkOutDate = booking.checkOutDate || '';
  const status = booking.status || 'pending';
  const totalPrice = parseFloat(booking.totalPrice || '0');

  const isUpcoming = isDateInFuture(checkInDate) && status !== 'cancelled';
  const isPast = isDateInPast(checkOutDate);
  const isCancelled = status === 'cancelled';

  const room = booking.room && typeof booking.room === 'object' ? booking.room : null;
  const roomName = room && 'name' in room ? (room.name as string) : 'Room';
  const roomLocation = room && 'location' in room ? (room.location as string) : '';
  const roomImages = room && 'images' in room && Array.isArray(room.images) ? room.images : [];
  const imageUrl = roomImages.length > 0 ? roomImages[0] : '/placeholder-room.jpg';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={isUpcoming ? { scale: 1.01 } : {}}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'rounded-2xl shadow-xl overflow-hidden transition-all duration-300 pt-0',
          isUpcoming && 'bg-white dark:bg-gray-800 border-2 border-primary',
          isPast && 'bg-gray-100 dark:bg-gray-900 opacity-60',
          isCancelled && 'border-2 border-destructive opacity-75'
        )}
      >
        <div className="relative h-48 w-full overflow-hidden rounded-t-2xl">
          <img
            src={imageUrl}
            alt={roomName}
            className="object-cover w-full h-full"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Room';
            }}
          />
          {isCancelled && (
            <div className="absolute top-4 right-4">
              <Badge variant="destructive" className="text-xs font-bold">
                CANCELLED
              </Badge>
            </div>
          )}
        </div>

        <CardHeader>
          <h3 className="text-xl font-bold">{roomName}</h3>
          {roomLocation && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{roomLocation}</span>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-2">
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{formatDateRange(checkInDate, checkOutDate)}</span>
          </div>
          <div className="flex items-center justify-between">
            <Badge variant={status === 'confirmed' ? 'default' : 'secondary'}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
            <div className="flex items-center">
              <span
                className={cn(
                  'text-2xl font-bold',
                  isCancelled && 'line-through text-muted-foreground'
                )}
              >
                ${Math.round(totalPrice)}
              </span>
            </div>
          </div>
        </CardContent>

        {isUpcoming && onCancel && (
          <CardFooter>
            <Button
              variant="destructive"
              className="w-full border border-destructive/20"
              onClick={() => onCancel(booking.id!)}
              data-test={`cancel-booking-btn-${booking.id}`}
            >
              Cancel Reservation
            </Button>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
}

