import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { Navbar } from '~/components/layout/Navbar';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Calendar } from '~/components/ui/calendar';
import { Label } from '~/components/ui/label';
import { Skeleton } from '~/components/ui/skeleton';
import { useAuth } from '~/hooks/useAuth';
import { useCreateBooking } from '~/hooks/api/useBookings';
import { useRoomDetails, useRoomAvailability } from '~/hooks/api/useRooms';
import { AuthDialog } from '~/components/auth/AuthDialog';
import { calculateNights } from '~/lib/date-utils';
import { cn } from '~/lib/utils';
import { toast } from 'sonner';
import { MapPin, Users, Calendar as CalendarIcon, DollarSign } from 'lucide-react';

/**
 * Room details page with booking functionality
 */
export default function RoomDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const roomId = id ? Number(id) : 0;
  const { data: roomData, isLoading, error } = useRoomDetails(roomId);
  const room = roomData;
  const { user } = useAuth();
  const navigate = useNavigate();

  /**
   * Parse date from search params
   */
  const parseDateFromParams = (dateStr: string | null): Date | undefined => {
    if (!dateStr) return undefined;
    const parsed = parseISO(dateStr);
    return !isNaN(parsed.getTime()) ? parsed : undefined;
  };

  /**
   * Build back URL with all preserved search params
   */
  const buildBackUrl = (): string => {
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
  };

  const [checkIn, setCheckIn] = useState<Date | undefined>(() =>
    parseDateFromParams(searchParams.get('dateFrom'))
  );
  const [checkOut, setCheckOut] = useState<Date | undefined>(() =>
    parseDateFromParams(searchParams.get('dateTo'))
  );
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const createBooking = useCreateBooking();

  /**
   * Scroll to top on mount
   */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [roomId]);

  /**
   * Update dates when search params change
   */
  useEffect(() => {
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const newCheckIn = parseDateFromParams(dateFrom);
    const newCheckOut = parseDateFromParams(dateTo);

    if (newCheckIn) {
      setCheckIn(newCheckIn);
    }
    if (newCheckOut) {
      setCheckOut(newCheckOut);
    }
  }, [searchParams]);

  const dateFrom = checkIn ? format(checkIn, 'yyyy-MM-dd') : undefined;
  const dateTo = checkOut ? format(checkOut, 'yyyy-MM-dd') : undefined;

  const { data: availability } = useRoomAvailability(
    room?.id || 0,
    dateFrom || '',
    dateTo || ''
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <Navbar />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        </main>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <Navbar />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-4xl font-bold mb-4">404</h1>
            <p className="text-muted-foreground mb-4">Room not found</p>
            <Link to="/">
              <Button data-test="room-404-back-btn">Back to Home</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const nights = checkIn && checkOut ? calculateNights(format(checkIn, 'yyyy-MM-dd'), format(checkOut, 'yyyy-MM-dd')) : 0;
  const pricePerNight = parseFloat(room?.pricePerNight || '0');
  const totalPrice = nights * pricePerNight;
  const isAvailable = availability?.available !== false;

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
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to={buildBackUrl()}
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
            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden">
                <img
                  src={images[0]}
                  alt={room?.name}
                  className="w-full h-96 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Room';
                  }}
                />
                {images.length > 1 && (
                  <div className="grid grid-cols-1 gap-2">
                    {images.slice(1, 3).map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`${room?.name} ${i + 2}`}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Room';
                        }}
                      />
                    ))}
                  </div>
                )}
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
                          {key}
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
                    <PopoverContent className="w-auto p-0" align="start">
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
                    <PopoverContent className="w-auto p-0" align="start">
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
      </main>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </div>
  );
}

