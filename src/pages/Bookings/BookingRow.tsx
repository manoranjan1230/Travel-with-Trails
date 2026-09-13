import { useState } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Clock3, Headphones, Heart, Leaf, Pencil, Search, Send, Share2, ShieldCheck, Star, Users, X, CalendarDays, Sparkles, SlidersHorizontal, Mountain, Ticket } from 'lucide-react';
import { trips, alpineHero, spitiValley, kedarnath, valleyFlowers } from '@/data/trips';
import type { Trip, Traveller, Booking } from '@/types/models';
import { PageShell, SearchBox, SectionTitle, TripCard, TrustRow, Filters, Metric, ItineraryPreview, InfoList, BookingStepper, Field, EmptyState } from '@/components/common';
import { readTravellerStorage, TRAVELLERS_KEY } from '@/services/storage';

export function BookingRow({ booking, status }: { booking: Booking; status: string }) {
  const { trip, people } = booking;
  return <Link href={`/bookings/${booking.id}`} className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card p-3 shadow-sm transition-shadow hover:shadow-md" data-testid={`row-booking-${booking.id}`}><img src={trip.image} alt="" className="size-[68px] rounded-xl object-cover sm:size-[82px]" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-display text-[17px] font-semibold">{trip.title}</h3><span className={`rounded-full px-2 py-1 text-[9px] font-bold capitalize ${status === 'Pending payment' ? 'bg-[#f6e5ba] text-[#865b19]' : status === 'Cancelled' ? 'bg-[#f4ddd8] text-[#9b4f42]' : 'bg-[#dcebdc] text-primary'}`}>{status}</span></div><p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground"><CalendarDays size={12} />{trip.dates}</p><p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground"><Users size={12} />{people} travellers · {trip.days} days</p></div><span className="text-[10px] font-bold text-primary">View details <ChevronRight size={14} className="inline" /></span></Link>;
}
