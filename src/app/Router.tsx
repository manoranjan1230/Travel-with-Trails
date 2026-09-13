import { useState } from 'react';
import { Route, Switch } from 'wouter';
import type { Booking, Traveller } from '@/types/models';
import { trips } from '@/data/trips';
import { BOOKINGS_KEY, CANCELLED_KEY, makeBookingId, normalizeBookings, persistBookings, persistCancelled, readBookingStorage } from '@/services/storage';
import { AuthPage } from '@/pages/Auth/Auth';
import { Home } from '@/pages/Home/Home';
import { TripsPage } from '@/pages/Trips/TripsPage';
import { DetailPage } from '@/pages/TripDetails/DetailPage';
import { TripDetailRoute } from '@/pages/TripDetails/TripDetailRoute';
import { BookingsPage } from '@/pages/Bookings/BookingsPage';
import { BookingDetailsRoute } from '@/pages/BookingDetails/BookingDetailsRoute';
import { BookingRoute } from '@/pages/BookingFlow/BookingRoute';
import { ItineraryPage } from '@/pages/Itinerary/ItineraryPage';
import { SupportPage } from '@/pages/Support/SupportPage';
import { ProfilePage } from '@/pages/Profile/ProfilePage';

export function Router() {
 const [wishlist,setWishlist]=useState<string[]>([]);
 const [bookings,setBookings]=useState<Booking[]>(()=>normalizeBookings(readBookingStorage(BOOKINGS_KEY).filter(x=>!String(x.id).startsWith('seed-'))));
 const [cancelledBookings,setCancelledBookings]=useState<Booking[]>(()=>normalizeBookings(readBookingStorage(CANCELLED_KEY)));
 const onWishlist=(id:string)=>setWishlist(c=>c.includes(id)?c.filter(x=>x!==id):[...c,id]);
 const addBooking=(trip: typeof trips[number], travellers: Traveller[])=>setBookings(current=>{ const booking:Booking={id:makeBookingId(trip.id),trip:{...trip},people:travellers.length,travellers:travellers.map(x=>({...x})),status:'Confirmed'}; const next=[booking,...current];persistBookings(next);return next; });
 const cancelBooking=(id:string)=>setBookings(current=>{ const found=current.find(x=>x.id===id); if(!found)return current; const next=current.filter(x=>x.id!==id);persistBookings(next);setCancelledBookings(existing=>{if(existing.some(x=>x.id===found.id))return existing;const nc=[{...found,status:'Cancelled'},...existing];persistCancelled(nc);return nc;});return next;});
 return <Switch>
  <Route path="/login"><AuthPage mode="login"/></Route><Route path="/signup"><AuthPage mode="signup"/></Route>
  <Route path="/profile"><ProfilePage /></Route>
  <Route path="/bookings/:id"><BookingDetailsRoute bookings={bookings} onCancel={cancelBooking}/></Route><Route path="/book/:id"><BookingRoute onComplete={addBooking}/></Route>
  <Route path="/trips/:id"><TripDetailRoute wishlist={wishlist} onWishlist={onWishlist}/></Route><Route path="/trips"><TripsPage wishlist={wishlist} onWishlist={onWishlist}/></Route>
  <Route path="/bookings"><BookingsPage bookings={bookings} cancelledBookings={cancelledBookings}/></Route><Route path="/itinerary"><ItineraryPage/></Route><Route path="/support"><SupportPage/></Route><Route path="/"><Home wishlist={wishlist} onWishlist={onWishlist}/></Route>
 </Switch>;
}
