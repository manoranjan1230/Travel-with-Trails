import { useState } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Clock3, Headphones, Heart, Leaf, Pencil, Search, Send, Share2, ShieldCheck, Star, Users, X, CalendarDays, Sparkles, SlidersHorizontal, Mountain, Ticket } from 'lucide-react';
import { trips, alpineHero, spitiValley, kedarnath, valleyFlowers } from '@/data/trips';
import type { Trip, Traveller, Booking } from '@/types/models';
import { PageShell, SearchBox, SectionTitle, TripCard, TrustRow, Filters, Metric, ItineraryPreview, InfoList, BookingStepper, Field, EmptyState } from '@/components/common';
import { readTravellerStorage, TRAVELLERS_KEY } from '@/services/storage';
import { formatPrice, getBasePrice, ageFromDob } from '@/services/pricing';

export function BookingDetailsPage({ booking, onCancel }: { booking: Booking; onCancel: () => void }) {
  const rawPeople = Number(booking.people);
  const people = Number.isFinite(rawPeople) && rawPeople > 0 ? Math.floor(rawPeople) : (booking.trip.id === 'spiti-valley-expedition' ? 2 : booking.trip.id === 'bir-billing-weekend' ? 2 : 1);
  // Always render the traveller records captured during this booking.
  // Never substitute demo/default people here: Booking Details must reflect
  // exactly what the user entered in the booking flow.
  const travellers = Array.isArray(booking.travellers)
    ? booking.travellers.filter((traveller): traveller is Traveller => Boolean(traveller && traveller.name))
    : [];
  const [, setLocation] = useLocation();
  const [showCancel, setShowCancel] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const trip = booking.trip;
  const basePrice = getBasePrice(trip);
  const total = basePrice * people;
  const cancellationPerPerson = Math.round(basePrice * 0.10);
  const cancellationTotal = cancellationPerPerson * people;
  const refund = total - cancellationTotal;
  const itineraryByTrip: Record<string, { day:number; title:string; items:string[] }[]> = {
    'bir-billing-weekend': [
      {day:1,title:'Arrival & Local Exploration',items:['Delhi to Bir','Check-in and settle in','Visit Chokling Monastery','Evening market & cafes']},
      {day:2,title:'Paragliding & Sightseeing',items:['Paragliding at Billing (optional)','Hidden waterfall','Local villages','Bonfire & group dinner']},
      {day:3,title:'Sunrise • Leisure • Departure',items:['Sunrise viewpoint','Leisure time & shopping','Check-out and departure']},
    ],
    'kedarnath-yatra': [
      {day:1,title:'Arrival & Orientation',items:['Arrival and check-in','Trip briefing','Local orientation']},
      {day:2,title:'Journey Towards Kedarnath',items:['Scenic mountain transfer','Rest and meal breaks','Route briefing']},
      {day:3,title:'Kedarnath Darshan',items:['Temple visit','Time for prayers','Evening at the valley']},
      {day:4,title:'Return Journey',items:['Breakfast','Return transfer','Relaxed evening']},
      {day:5,title:'Departure',items:['Leisure morning','Check-out and departure']},
    ],
    'spiti-valley-expedition': [
      {day:1,title:'Manali to Kaza',items:['Mountain drive','Scenic stops','Check-in and acclimatise']},
      {day:2,title:'Kaza & Key',items:['Key Monastery','Kibber village','Local cafes']},
      {day:3,title:'Langza • Hikkim • Komic',items:['High-altitude villages','Scenic viewpoints','Village experiences']},
      {day:4,title:'Dhankar',items:['Dhankar Monastery','Valley walk','Mountain viewpoints']},
      {day:5,title:'Pin Valley',items:['Pin Valley excursion','Nature and villages','Local exploration']},
      {day:6,title:'Chandratal',items:['Lake viewpoint','Scenic drive','Camp stay']},
      {day:7,title:'Departure',items:['Breakfast','Final mountain views','Return journey']},
    ],
  };
  const itinerary = itineraryByTrip[trip.id] ?? Array.from({length:trip.days},(_,i)=>({day:i+1,title:i===0?'Arrival & check-in':i===trip.days-1?'Leisure & departure':'Explore & experience',items:['Local experiences and scenic stops','Time to relax and explore']}));
  return <PageShell><main className="mx-auto max-w-[1060px] px-5 py-8 lg:px-8 lg:py-10">
    <Link href="/bookings" className="inline-flex items-center gap-2 text-[10px] font-semibold text-muted-foreground hover:text-primary" data-testid="link-back-my-bookings"><ArrowLeft size={13}/> Back to My Bookings</Link>
    <div className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[9px] font-bold uppercase tracking-[.24em] text-primary/70">Booking Details</p><h1 className="mt-2 font-display text-[39px] leading-none tracking-[-.045em] md:text-[47px]">{trip.title}</h1><p className="mt-2 text-[10px] text-muted-foreground">{trip.dates} · {trip.days} days · {trip.nights} nights</p></div><div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-[8px] uppercase tracking-[.18em] text-muted-foreground">Booking ID</p><p className="mt-1 font-mono-ui text-[11px] font-bold">{booking.id}</p></div><span className={`rounded-full px-3 py-1.5 text-[9px] font-bold ${booking.status === 'Pending payment' ? 'bg-[#f6e5ba] text-[#865b19]' : 'bg-[#dcebdc] text-primary'}`}>{booking.status || 'Confirmed'}</span></div></div>
    <div className="mt-6 grid items-start gap-5 lg:grid-cols-[1.45fr_.75fr]">
      <section>
        <div className="overflow-hidden rounded-2xl border border-border bg-card"><div className="h-[280px] md:h-[330px]"><img src={trip.image} alt={trip.title} className="size-full object-cover"/></div></div>
        <div className="mt-4 rounded-2xl border border-border bg-card p-5 md:p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="font-display text-[22px]">Travellers ({travellers.length})</h2><p className="mt-1 text-[10px] text-muted-foreground">Here are the travellers included in this booking.</p></div></div><div className="mt-4 divide-y divide-border">{travellers.map((traveller,index)=><div key={traveller.id} className="flex items-center gap-3 py-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-primary">{index+1}</span><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-bold text-primary">{traveller.name.split(' ').map((x)=>x[0]).slice(0,2).join('').toUpperCase()}</span><div className="min-w-0"><p className="text-[12px] font-bold">{traveller.name} {index===0 && <span className="ml-1 rounded-full bg-[#dcebdc] px-2 py-1 text-[8px] text-primary">Primary Traveller</span>}</p><p className="mt-1 text-[10px] text-muted-foreground">{traveller.dob ? `Age: ${ageFromDob(traveller.dob)} years` : 'Age not provided'}</p></div></div>)}</div></div>
        <div className="mt-4 rounded-2xl border border-border bg-card p-5 md:p-6"><h2 className="font-display text-[22px]">Trip information</h2><div className="mt-4 divide-y divide-border">
          <div className="flex justify-between gap-6 py-3 text-[10px]"><span className="text-muted-foreground">Destination</span><strong>{trip.location}</strong></div>
          <div className="flex justify-between gap-6 py-3 text-[10px]"><span className="text-muted-foreground">Duration</span><strong>{trip.days} days / {trip.nights} nights</strong></div>
          <div className="flex justify-between gap-6 py-3 text-[10px]"><span className="text-muted-foreground">Dates</span><strong>{trip.dates}</strong></div>
          <div className="flex justify-between gap-6 py-3 text-[10px]"><span className="text-muted-foreground">Trip status</span><strong>{booking.status || 'Confirmed'}</strong></div>
        </div></div>
        <div className="mt-4 rounded-2xl border border-border bg-card p-5 md:p-6"><h2 className="font-display text-[22px]">Contact Information</h2><div className="mt-4 grid gap-5 sm:grid-cols-2"><div><p className="text-[9px] font-bold uppercase tracking-[.16em] text-muted-foreground">Primary Contact</p><p className="mt-2 text-[12px] font-bold">{travellers[0]?.name || 'Not provided'}</p><p className="mt-1 text-[10px] text-muted-foreground">{travellers[0]?.mobile || 'Not provided'}</p><p className="mt-1 text-[10px] text-muted-foreground">{travellers[0]?.email || 'Not provided'}</p></div><div><p className="text-[9px] font-bold uppercase tracking-[.16em] text-muted-foreground">Emergency Contact</p><p className="mt-2 text-[12px] font-bold">{travellers[0]?.emergencyName || 'Not provided'} {travellers[0]?.relationship ? <span className="font-normal text-muted-foreground">({travellers[0].relationship})</span> : null}</p><p className="mt-1 text-[10px] text-muted-foreground">{travellers[0]?.emergencyPhone || 'Not provided'}</p></div></div></div>
        <div className="mt-4 rounded-2xl border border-border bg-card p-5 md:p-6"><h2 className="font-display text-[22px]">Quick itinerary</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{itinerary.map(item=><div key={item.day} className="rounded-xl border border-border/80 bg-background p-4"><p className="font-display text-[16px]">Day {item.day}</p><p className="mt-1 text-[10px] font-semibold">{item.title}</p><ul className="mt-2 space-y-1.5 text-[9px] leading-relaxed text-muted-foreground">{item.items.map(line=><li key={line}>• {line}</li>)}</ul></div>)}</div></div>
        <div className="mt-4 rounded-2xl border border-[#e8bdb4] bg-[#fff7f5] p-5 md:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-[8px] font-bold uppercase tracking-[.2em] text-[#9b4f42]">Booking safety</p><h2 className="mt-1 font-display text-[22px]">Need to cancel?</h2></div><span className="rounded-full bg-white px-3 py-1 text-[8px] font-bold text-[#9b4f42]">Cancellation</span></div><p className="mt-3 max-w-2xl text-[9px] leading-relaxed text-muted-foreground">Plans changed? You can cancel this booking from here. For this demo, cancellation charges are <strong>10% per person</strong>, and the refund estimate is calculated from your current traveller count.</p><div className="mt-4 grid gap-2 sm:grid-cols-3"><div className="rounded-xl bg-white/75 p-3.5"><p className="text-[8px] uppercase tracking-[.14em] text-muted-foreground">Booking total</p><p className="mt-1 text-[12px] font-bold">{formatPrice(total)}</p></div><div className="rounded-xl bg-white/75 p-3.5"><p className="text-[8px] uppercase tracking-[.14em] text-muted-foreground">Cancellation charge</p><p className="mt-1 text-[12px] font-bold">{formatPrice(cancellationTotal)}</p></div><div className="rounded-xl bg-white/75 p-3.5"><p className="text-[8px] uppercase tracking-[.14em] text-muted-foreground">Estimated refund</p><p className="mt-1 text-[12px] font-bold">{formatPrice(refund)}</p></div></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="max-w-xl text-[8px] leading-relaxed text-muted-foreground">Demo policy only — this can be replaced with your final cancellation policy later.</p><button type="button" onClick={()=>setShowCancel(true)} className="rounded-full border border-[#d98e82] bg-white px-5 py-2.5 text-[9px] font-bold text-[#9b4f42]" data-testid="button-cancel-booking">Cancel this booking</button></div></div>
      </section>
      <aside className="space-y-3 lg:sticky lg:top-24">
        <div className="rounded-2xl border border-border bg-card p-5"><h2 className="font-display text-[22px]">Your booking</h2><div className="mt-4"><p className="text-[9px] font-bold uppercase tracking-[.18em] text-muted-foreground">Travellers</p><p className="mt-2 font-display text-[23px]">{people} traveller{people===1?'':'s'}</p><p className="mt-1 text-[10px] text-muted-foreground">To add more travellers, book this trip again from the trip page.</p></div><div className="mt-4 rounded-xl bg-secondary/65 p-4"><div className="flex justify-between text-[10px]"><span className="text-muted-foreground">Price per person</span><strong>{formatPrice(basePrice)}</strong></div><div className="mt-2 flex justify-between text-[10px]"><span className="text-muted-foreground">Travellers</span><strong>× {people}</strong></div><div className="mt-3 flex justify-between border-t border-border pt-3 text-[11px] font-bold"><span>Total booking amount</span><strong className="font-mono-ui">{formatPrice(total)}</strong></div></div></div>
        <div className="rounded-2xl bg-primary p-5 text-primary-foreground"><p className="text-[8px] font-bold uppercase tracking-[.18em] opacity-70">Need help?</p><h2 className="mt-1 font-display text-[21px]">We’re here for the journey.</h2><p className="mt-2 text-[9px] leading-relaxed opacity-80">Have a question about your booking, itinerary or payment? Reach out to the Travel with Trails support team.</p><Link href="/support" className="mt-4 inline-flex rounded-full border border-white/30 px-4 py-2 text-[9px] font-bold">Contact support →</Link></div>
      </aside>
    </div>

    {showCancel && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10271f]/45 p-5 backdrop-blur-sm"><div className="w-full max-w-[420px] rounded-2xl border border-border bg-background p-6 shadow-2xl"><p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#9b4f42]">Confirm cancellation</p><h2 className="mt-2 font-display text-[27px]">Cancel {trip.title}?</h2><p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">{people} traveller{people===1?'':'s'} × {formatPrice(cancellationPerPerson)} per-person cancellation charge = <strong>{formatPrice(cancellationTotal)}</strong>. Estimated refund: <strong>{formatPrice(refund)}</strong>.</p><div className="mt-6 flex gap-2"><button type="button" onClick={()=>setShowCancel(false)} className="flex-1 rounded-full border border-border px-4 py-3 text-[10px] font-bold">Keep booking</button><button type="button" onClick={() => {
                // Keep the booking mounted while the success popup is visible.
                // Removing it here causes BookingDetailsRoute to render null before
                // the cancellation-success popup can be displayed.
                setShowCancel(false);
                setShowCancelled(true);
              }} className="flex-1 rounded-full bg-[#9b4f42] px-4 py-3 text-[10px] font-bold text-white" data-testid="button-confirm-cancellation">Confirm cancellation</button></div></div></div>}

    {showCancelled && (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-[#10271f]/55 p-5 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        data-testid="cancellation-success-dialog"
      >
        <div className="w-full max-w-[515px] rounded-[28px] border border-border bg-[#f8f5ee] p-7 text-center shadow-[0_24px_70px_rgba(16,39,31,0.28)] sm:p-8">
          <div className="mx-auto flex size-[74px] items-center justify-center rounded-full bg-[#dcebdc] text-primary">
            <Check size={34} strokeWidth={2.5} />
          </div>
          <p className="mt-6 text-[10px] font-bold uppercase tracking-[.22em] text-primary">
            Cancellation confirmed
          </p>
          <h2 className="mt-2 font-display text-[31px] font-semibold leading-tight tracking-[-.035em] md:text-[34px]">
            We’re sorry to see you go.
          </h2>
          <p className="mx-auto mt-4 max-w-[400px] text-[12px] leading-[1.65] text-muted-foreground">
            Your booking for <strong className="text-foreground">{trip.title}</strong> has been successfully cancelled.
          </p>
          <div className="mt-6 rounded-2xl bg-[#e6ecdf] p-4 text-left">
            <div className="flex items-center gap-3">
              <img src={trip.image} alt="" className="size-[62px] shrink-0 rounded-xl object-cover" />
              <div className="min-w-0">
                <p className="truncate text-[12px] font-bold text-foreground">{trip.title}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{trip.dates}</p>
              </div>
            </div>
          </div>
          <p className="mx-auto mt-5 max-w-[390px] text-[10px] leading-[1.7] text-muted-foreground">
            We’re sorry for the inconvenience. Your cancellation has been recorded successfully.
            We hope to welcome you on another adventure soon.
          </p>
          <button
            type="button"
            onClick={() => {
              // Move the booking to cancellation history only after the
              // success popup has been shown and the user continues.
              onCancel();
              setShowCancelled(false);
              setLocation('/bookings');
            }}
            className="mt-6 h-12 w-full rounded-full bg-primary text-[11px] font-bold text-primary-foreground transition-transform hover:scale-[1.01]"
            data-testid="button-cancellation-success-done"
          >
            Back to My Bookings
          </button>
        </div>
      </div>
    )}

  </main></PageShell>;
}
