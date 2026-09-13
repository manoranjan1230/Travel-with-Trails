import { useParams } from 'wouter';
import type { Booking } from '@/types/models';
import { BookingDetailsPage } from './BookingDetailsPage';
export function BookingDetailsRoute({ bookings, onCancel }: { bookings: Booking[]; onCancel: (id: string) => void }) { const {id}=useParams<{id:string}>(); const booking=bookings.find(x=>String(x.id)===String(id)); if(!booking) return null; return <BookingDetailsPage booking={booking} onCancel={()=>onCancel(String(id))}/>; }
