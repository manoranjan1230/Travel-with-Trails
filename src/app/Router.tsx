import { useEffect, useState, type ReactNode } from 'react';
import { Route, Switch, Redirect } from 'wouter';
import { onAuthStateChanged } from 'firebase/auth';
import type { Booking, Traveller } from '@/types/models';
import { trips } from '@/data/trips';
import { AuthPage } from '@/pages/Auth/Auth';
import { Home } from '@/pages/Home/Home';
import { TripsPage } from '@/pages/Trips/TripsPage';
import { TripDetailRoute } from '@/pages/TripDetails/TripDetailRoute';
import { BookingsPage } from '@/pages/Bookings/BookingsPage';
import { BookingDetailsRoute } from '@/pages/BookingDetails/BookingDetailsRoute';
import { BookingRoute } from '@/pages/BookingFlow/BookingRoute';
import { ItineraryPage } from '@/pages/Itinerary/ItineraryPage';
import { SupportPage } from '@/pages/Support/SupportPage';
import { ProfilePage } from '@/pages/Profile/ProfilePage';
import { AdminPage } from '@/admin/AdminPage';
import { readCurrentUser } from '@/services/auth';
import { auth } from '@/services/firebase';
import {
  cancelBookingDocument,
  createBookingDocument,
  loadUserBookings,
  makeBookingId,
  migrateLegacyBookingsToFirestore,
} from '@/services/storage';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const current = readCurrentUser();

  return current ? <>{children}</> : <Redirect to="/login" />;
}

function AuthRoute({ mode }: { mode: 'login' | 'signup' }) {
  const current = readCurrentUser();

  return current ? <Redirect to="/" /> : <AuthPage mode={mode} />;
}

export function Router() {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cancelledBookings, setCancelledBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!auth) {
      setBookings([]);
      setCancelledBookings([]);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setBookings([]);
        setCancelledBookings([]);
        return;
      }

      try {
        await migrateLegacyBookingsToFirestore(user.uid);

        const allBookings = await loadUserBookings(user.uid);

        const upcoming = allBookings.filter(
          (booking) =>
            (booking.bookingStatus ?? booking.status ?? 'confirmed') !==
              'cancelled' &&
            (booking.status ?? '').toLowerCase() !== 'cancelled'
        );

        const cancelled = allBookings.filter(
          (booking) =>
            (booking.bookingStatus ?? booking.status ?? 'confirmed') ===
              'cancelled' ||
            (booking.status ?? '').toLowerCase() === 'cancelled'
        );

        setBookings(upcoming);
        setCancelledBookings(cancelled);
      } catch (error) {
        console.error('Failed to load bookings from Firestore.', error);
        setBookings([]);
        setCancelledBookings([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const onWishlist = (id: string) => {
    setWishlist((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const addBooking = async (
    trip: (typeof trips)[number],
    travellers: Traveller[]
  ): Promise<void> => {
    const user = auth?.currentUser;

    if (!user) {
      throw new Error(
        'Authentication required before creating a booking. Please log in again.'
      );
    }

    const tripPrice =
      typeof trip.price === 'number'
        ? trip.price
        : Number(
            String(trip.price ?? 0).replace(/[^\d.-]/g, '')
          ) || 0;

    const tripStartDate = new Date().toISOString();
    const tripEndDate = new Date(
      Date.now() + ((Number(trip.days ?? 3) || 3) * 24 * 60 * 60 * 1000)
    ).toISOString();

    const booking: Booking = {
      id: makeBookingId(trip.id),
      trip: { ...trip },
      people: travellers.length,
      numberOfPersons: travellers.length,
      travellers: travellers.map((traveller) => ({ ...traveller })),
      userId: user.uid,
      tripId: trip.id,
      bookingStatus: 'confirmed',
      status: 'Confirmed',
      tripStartDate,
      tripEndDate,
      payment: {
        paymentPersonName: user.displayName || 'Traveller',
        upiIdOrBankAccountNumber: '',
        contactNumber: travellers[0]?.mobile || user.phoneNumber || '',
        timestamp: new Date().toISOString(),
      },
      totalAmount: tripPrice * travellers.length,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const createdBooking = await createBookingDocument(
        booking,
        user.uid
      );

      setBookings((current) => [
        createdBooking,
        ...current.filter((item) => item.id !== createdBooking.id),
      ]);
    } catch (error) {
      console.error('Could not create booking in Firestore.', error);
      throw error;
    }
  };

  const cancelBooking = async (id: string) => {
    const bookingToCancel = [...bookings, ...cancelledBookings].find(
      (booking) => booking.id === id
    );

    if (!bookingToCancel) {
      return;
    }

    try {
      const updatedBooking = await cancelBookingDocument(id);

      setBookings((current) =>
        current.filter((booking) => booking.id !== id)
      );

      setCancelledBookings((current) => [
        {
          ...bookingToCancel,
          ...updatedBooking,
          bookingStatus: 'cancelled',
          status: 'Cancelled',
        } as Booking,
        ...current.filter((booking) => booking.id !== id),
      ]);
    } catch (error) {
      console.error('Could not cancel booking in Firestore.', error);
      throw error;
    }
  };

  return (
    <Switch>
      <Route path="/login">
        <AuthRoute mode="login" />
      </Route>

      <Route path="/signup">
        <AuthRoute mode="signup" />
      </Route>

      <Route path="/profile">
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      </Route>

      <Route path="/bookings/:id">
        <ProtectedRoute>
          <BookingDetailsRoute
            bookings={[...bookings, ...cancelledBookings]}
            onCancel={cancelBooking}
          />
        </ProtectedRoute>
      </Route>

      <Route path="/book/:id">
        <ProtectedRoute>
          <BookingRoute onComplete={addBooking} />
        </ProtectedRoute>
      </Route>

      <Route path="/trips/:id">
        <TripDetailRoute
          wishlist={wishlist}
          onWishlist={onWishlist}
        />
      </Route>

      <Route path="/trips">
        <TripsPage
          wishlist={wishlist}
          onWishlist={onWishlist}
        />
      </Route>

      <Route path="/bookings">
        <ProtectedRoute>
          <BookingsPage
            bookings={bookings}
            cancelledBookings={cancelledBookings}
          />
        </ProtectedRoute>
      </Route>

      <Route path="/itinerary">
        <ItineraryPage />
      </Route>

      <Route path="/support">
        <SupportPage />
      </Route>

      <Route path="/admin">
        <ProtectedRoute>
          <AdminPage />
        </ProtectedRoute>
      </Route>

      <Route path="/">
        <Home
          wishlist={wishlist}
          onWishlist={onWishlist}
        />
      </Route>
    </Switch>
  );
}