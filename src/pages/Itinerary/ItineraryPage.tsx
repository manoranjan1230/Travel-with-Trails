import { useState } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Clock3, Headphones, Heart, Leaf, Pencil, Search, Send, Share2, ShieldCheck, Star, Users, X, CalendarDays, Sparkles, SlidersHorizontal, Mountain, Ticket } from 'lucide-react';
import { trips, alpineHero, spitiValley, kedarnath, valleyFlowers } from '@/data/trips';
import type { Trip, Traveller, Booking } from '@/types/models';
import { PageShell, SearchBox, SectionTitle, TripCard, TrustRow, Filters, Metric, ItineraryPreview, InfoList, BookingStepper, Field, EmptyState } from '@/components/common';
import { readTravellerStorage, TRAVELLERS_KEY } from '@/services/storage';

export function ItineraryPage() {
  const [day, setDay] = useState(1);
  const days = [{ title: 'Arrival & local exploration', date: 'Saturday, 20 September', items: ['Arrive at Bir and check in to your stay', 'Visit Chokling Monastery at golden hour', 'Easy walk through the market and cafes'] }, { title: 'Adventure & nature', date: 'Sunday, 21 September', items: ['Optional paragliding from Billing', 'Picnic by the hidden waterfall', 'Bonfire and group dinner with local stories'] }, { title: 'Sunrise & departure', date: 'Monday, 22 September', items: ['Sunrise viewpoint walk', 'Leisure time and last-minute shopping', 'Check out and depart with memories'] }];
  const active = days[day - 1];
  return <PageShell><main className="mx-auto max-w-[1000px] px-5 py-8 lg:px-8 lg:py-12">
    <Link href="/bookings" className="inline-flex items-center gap-2 text-[11px] font-semibold text-muted-foreground hover:text-primary" data-testid="link-back-bookings"><ArrowLeft size={14} /> My bookings</Link>
    <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-primary/70">Your route, unrushed</p><h1 className="mt-2 font-display text-[42px] tracking-[-.04em] md:text-[56px]">Bir Billing Weekend</h1><p className="mt-2 text-[12px] text-muted-foreground">20 Sep – 22 Sep 2026 · 3 days · 2 travellers</p></div><button type="button" className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-[11px] font-semibold hover:bg-secondary" data-testid="button-share-itinerary"><Share2 size={14} /> Share itinerary</button></div>
    <div className="mt-9 grid gap-8 md:grid-cols-[190px_1fr]">
      <div className="flex gap-2 overflow-x-auto md:block md:space-y-2">{days.map((item, index) => <button key={item.title} onClick={() => setDay(index + 1)} type="button" className={`min-w-[148px] rounded-2xl border p-4 text-left transition-colors md:w-full ${day === index + 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary/40'}`} data-testid={`button-itinerary-day-${index + 1}`}><span className="text-[10px] font-bold uppercase tracking-[.15em] opacity-70">Day {index + 1}</span><p className="mt-2 font-display text-[18px] leading-tight">{item.title}</p></button>)}</div>
      <div className="relative rounded-2xl border border-border bg-card p-6 md:p-8"><div className="absolute bottom-0 left-10 top-24 w-px bg-border" /><div className="relative"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Day {day} · {active.date}</p><h2 className="mt-2 font-display text-[29px]">{active.title}</h2><div className="mt-8 space-y-5">{active.items.map((item, index) => <div className="relative flex gap-4" key={item}><span className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-4 border-card bg-secondary text-primary"><Check size={12} strokeWidth={3} /></span><div><p className="text-[12px] font-semibold">{item}</p><p className="mt-1 text-[10px] text-muted-foreground">{index === 0 ? 'Your trip captain will be there to make the start easy.' : index === 1 ? 'A little space to wander, notice, and breathe.' : 'The good kind of tired, with stories to tell.'}</p></div></div>)}</div></div></div>
    </div>
  </main></PageShell>;
}

const faqs = ['How do I book a trip?', 'What is included in the trip?', 'What is the cancellation policy?', 'Do you provide local transport?', 'Is the trip suitable for solo travellers?', 'How will I get trip updates?'];
