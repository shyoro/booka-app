import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { Navbar } from '~/components/layout/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '~/components/ui/alert-dialog';
import { BookingCard } from '~/components/bookings/BookingCard';
import { useAuth } from '~/hooks/useAuth';
import { useBookings, useCancelBooking } from '~/hooks/api/useBookings';
import { isDateInPast } from '~/lib/date-utils';
import { toast } from 'sonner';
import { Calendar } from 'lucide-react';

export function meta() {
  return [
    { title: 'My Bookings - Booka' },
    { name: 'description', content: 'View and manage your bookings' },
  ];
}

/**
 * Profile dashboard with booking history
 */
export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cancelBookingId, setCancelBookingId] = useState<number | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { data, isLoading } = useBookings();
  const cancelBooking = useCancelBooking();

  if (!user) {
    navigate('/', { replace: true });
    return null;
  }

  const bookings = data?.bookings || [];
  const today = new Date().toISOString().split('T')[0];

  const upcomingBookings = bookings.filter(
    (booking) => booking.checkOutDate && !isDateInPast(booking.checkOutDate) && booking.status !== 'cancelled'
  );

  const pastBookings = bookings.filter(
    (booking) => (booking.checkOutDate && isDateInPast(booking.checkOutDate)) || booking.status === 'cancelled'
  );

  const handleCancelClick = (bookingId: number) => {
    setCancelBookingId(bookingId);
    setShowCancelDialog(true);
  };

  const handleCancelConfirm = async () => {
    if (!cancelBookingId) return;

    try {
      await cancelBooking.mutateAsync(cancelBookingId);
      toast.success('Booking cancelled successfully');
      setShowCancelDialog(false);
      setCancelBookingId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel booking');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-2">My Bookings</h1>
          <p className="text-muted-foreground mb-8">Manage your reservations</p>

          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList>
              <TabsTrigger value="upcoming" data-test="bookings-upcoming-tab">
                Upcoming ({upcomingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="past" data-test="bookings-past-tab">
                Past ({pastBookings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading bookings...</p>
                </div>
              ) : upcomingBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No upcoming bookings</h3>
                  <p className="text-muted-foreground">You don't have any upcoming reservations</p>
                </div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {upcomingBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onCancel={handleCancelClick}
                    />
                  ))}
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading bookings...</p>
                </div>
              ) : pastBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No past bookings</h3>
                  <p className="text-muted-foreground">Your past reservations will appear here</p>
                </div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {pastBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will cancel your reservation and you may be subject to cancellation fees.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-test="cancel-dialog-keep-btn">Keep Reservation</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-test="cancel-dialog-confirm-btn"
            >
              {cancelBooking.isPending ? 'Cancelling...' : 'Cancel Reservation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

