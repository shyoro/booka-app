import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Calendar } from '~/components/ui/calendar';
import { Label } from '~/components/ui/label';
import { Skeleton } from '~/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '~/components/ui/carousel';
import { useAuth } from '~/hooks/useAuth';
import { useCreateBooking } from '~/hooks/api/useBookings';
import { useRoomAvailability } from '~/hooks/api/useRooms';
import { AuthDialog } from '~/components/auth/AuthDialog';
import { calculateNights } from '~/lib/date-utils';
import { cn } from '~/lib/utils';
import { toast } from 'sonner';
import { MapPin, Users, Calendar as CalendarIcon, DollarSign } from 'lucide-react';
import type { Room } from '~/hooks/api/useRooms';

interface RoomDetailsProps {
  room: Room | undefined;
  isLoading: boolean;
  error: unknown;
  initialCheckIn?: Date;
  initialCheckOut?: Date;
  backUrl: string;
}

/**
 * Room details component with booking functionality
 */
export function RoomDetails({
  room,
  isLoading,
  error,
  initialCheckIn,
  initialCheckOut,
  backUrl,
}: RoomDetailsProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState<Date | undefined>(initialCheckIn);
  const [checkOut, setCheckOut] = useState<Date | undefined>(initialCheckOut);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const createBooking = useCreateBooking();

  /**
   * Update dates when initial dates change
   */
  useEffect(() => {
    if (initialCheckIn) {
      setCheckIn(initialCheckIn);
    }
    if (initialCheckOut) {
      setCheckOut(initialCheckOut);
    }
  }, [initialCheckIn, initialCheckOut]);

  const dateFrom = checkIn ? format(checkIn, 'yyyy-MM-dd') : undefined;
  const dateTo = checkOut ? format(checkOut, 'yyyy-MM-dd') : undefined;

  const { data: availability } = useRoomAvailability(
    room?.id || 0,
    dateFrom || '',
    dateTo || ''
  );

  if (isLoading) {
    return (
      <>
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div>
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        </div>
      </>
    );
  }

  if (error || !room) {
    return (
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-muted-foreground mb-4">Room not found</p>
        <Link to="/">
          <Button data-test="room-404-back-btn">Back to Home</Button>
        </Link>
      </div>
    );
  }

  const nights = checkIn && checkOut ? calculateNights(format(checkIn, 'yyyy-MM-dd'), format(checkOut, 'yyyy-MM-dd')) : 0;
  const pricePerNight = parseFloat(room?.pricePerNight || '0');
  const totalPrice = nights * pricePerNight;
  const isAvailable = availability?.available !== false;

  /**
   * Handle booking creation
   */
  const handleBookNow = async () => {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }

    if (!checkIn || !checkOut) {
      toast.error('Please select check-in and check-out dates');
      return;
    }

    if (!isAvailable) {
      toast.error('Room is not available for selected dates');
      return;
    }

    try {
      if (!room?.id) {
        toast.error('Room information is missing');
        return;
      }

      await createBooking.mutateAsync({
        roomId: room.id,
        checkInDate: format(checkIn, 'yyyy-MM-dd'),
        checkOutDate: format(checkOut, 'yyyy-MM-dd'),
      });
      toast.success('Booking created successfully!');
      navigate('/profile');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create booking');
    }
  };

  const images = room?.images && Array.isArray(room.images) ? room.images : [];
  const amenities = room?.amenities && typeof room.amenities === 'object' ? room.amenities : {};

  return (
    <>
      <Link
        to={backUrl}
        className="text-muted-foreground hover:text-foreground mb-6 inline-block"
        data-test="room-details-back-link"
      >
        ← Back to search
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        <div className="lg:col-span-2 space-y-6">
          {images.length > 0 ? (
            <Carousel
              opts={{
                align: 'start',
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-0">
                {images.map((img, index) => (
                  <CarouselItem key={index} className="pl-0">
                    <div className="relative w-full aspect-[4/3] md:aspect-[16/10] rounded-2xl overflow-hidden bg-muted">
                      <img
                        src={img}
                        alt={`${room?.name} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1200x900?text=Room';
                        }}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {images.length > 1 && (
                <>
                  <CarouselPrevious />
                  <CarouselNext />
                </>
              )}
            </Carousel>
          ) : (
            <div className="relative w-full aspect-[4/3] md:aspect-[16/10] rounded-2xl overflow-hidden bg-muted flex items-center justify-center">
              <span className="text-muted-foreground">No images available</span>
            </div>
          )}

          <Card className="bg-white/10 dark:bg-gray-900/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl mb-2">{room?.name}</CardTitle>
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{room?.location}</span>
                  </div>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {room?.capacity} guests
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {room?.description && <p className="text-lg">{room.description}</p>}
              <div>
                <h3 className="font-semibold mb-2">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(amenities).map(([key, value]) => (
                    value && (
                      <Badge key={key} variant="outline">
                        {key.replace('_', ' ')}
                      </Badge>
                    )
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-24 h-fit">
          <Card className="bg-white/10 dark:bg-gray-900/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl">
            <CardHeader>
              <CardTitle>Reserve this room</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Check-in</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn('w-full justify-start text-left font-normal', !checkIn && 'text-muted-foreground')}
                      data-test="room-checkin-btn"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {checkIn ? format(checkIn, 'MMM dd, yyyy') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" data-test="room-checkin-calendar">
                    <Calendar
                      mode="single"
                      selected={checkIn}
                      onSelect={setCheckIn}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Check-out</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn('w-full justify-start text-left font-normal', !checkOut && 'text-muted-foreground')}
                      data-test="room-checkout-btn"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {checkOut ? format(checkOut, 'MMM dd, yyyy') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" data-test="room-checkout-calendar">
                    <Calendar
                      mode="single"
                      selected={checkOut}
                      onSelect={setCheckOut}
                      disabled={(date) => (checkIn ? date <= checkIn : date < new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {checkIn && checkOut && (
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      ${pricePerNight.toFixed(2)} × {nights} {nights === 1 ? 'night' : 'nights'}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {totalPrice.toFixed(2)}
                    </span>
                  </div>
                  {!isAvailable && (
                    <p className="text-sm text-destructive">Room not available for these dates</p>
                  )}
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handleBookNow}
                disabled={!checkIn || !checkOut || !isAvailable || createBooking.isPending}
                data-test="room-book-now-btn"
              >
                {createBooking.isPending ? 'Booking...' : 'Book Now'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </>
  );
}

