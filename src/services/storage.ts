import type { Booking, Traveller } from '@/types/models';
export const TRAVELLERS_KEY = 'travel-with-trails-travellers-v1';
export const BOOKINGS_KEY = 'travel-with-trails-bookings-v3';
export const CANCELLED_KEY = 'travel-with-trails-cancelled-v3';
export function readTravellerStorage(): Traveller[] { try { const parsed=JSON.parse(localStorage.getItem(TRAVELLERS_KEY)||'[]'); return Array.isArray(parsed)?parsed.filter((x): x is Traveller=>Boolean(x?.id&&x?.name)):[]; } catch { return []; } }
export function readBookingStorage(key: string): Booking[] { try { const parsed=JSON.parse(localStorage.getItem(key)||'[]'); if(Array.isArray(parsed)) return parsed.filter(x=>x?.trip?.id); if(parsed?.trip?.id) return [parsed]; } catch {} return []; }
export function persistBookings(items: Booking[]) { localStorage.setItem(BOOKINGS_KEY, JSON.stringify(items)); }
export function persistCancelled(items: Booking[]) { localStorage.setItem(CANCELLED_KEY, JSON.stringify(items)); }
export function makeBookingId(tripId: string) { return `${tripId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
export function normalizeBookings(items: Booking[]): Booking[] { return items.filter(Boolean).map((item)=>{ const raw=Number(item.people); const fallback=item.trip?.id==='spiti-valley-expedition'?2:item.trip?.id==='bir-billing-weekend'?2:1; const people=Number.isFinite(raw)&&raw>0?Math.floor(raw):fallback; return {...item, people, trip:{...item.trip}, travellers:Array.isArray(item.travellers)?item.travellers:undefined}; }); }
