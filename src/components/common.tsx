import { type ReactNode, useEffect, useState } from 'react';
import { ArrowRight, Check, ChevronDown, ChevronRight, Compass, Headphones, Heart, Home as HomeIcon, Leaf, Mountain, Search, ShieldCheck, SlidersHorizontal, Ticket, Users, Clock3, Star } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { navItems } from '@/data/navigation';
import { trips } from '@/data/trips';
import type { Trip } from '@/types/models';
import { readCurrentUser, signOut } from '@/services/auth';

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5" data-testid="link-brand">
      <span className="flex size-9 items-center justify-center rounded-[12px] bg-primary text-primary-foreground shadow-sm">
        <Mountain size={21} strokeWidth={1.8} />
      </span>
      <span className="leading-none">
        <span className="block font-display text-[18px] font-semibold tracking-[-.02em]">Travel with Trails</span>
        <span className="mt-1 block text-[9px] uppercase tracking-[.2em] text-muted-foreground">Explore · Travel · Belong</span>
      </span>
    </Link>
  );
}

export function Header() {
  const [location, setLocation] = useLocation();
  const isHome = location === '/';
  const [user, setUser] = useState<{ name: string; email: string } | null>(() => {
    try { return JSON.parse(localStorage.getItem('travel-with-trails-current-user') || 'null'); } catch { return null; }
  });
  const [profileOpen, setProfileOpen] = useState(false);
  useEffect(() => {
    const sync = () => {
      try { setUser(JSON.parse(localStorage.getItem('travel-with-trails-current-user') || 'null')); } catch { setUser(null); }
    };
    window.addEventListener('travel-with-trails-auth-changed', sync);
    return () => window.removeEventListener('travel-with-trails-auth-changed', sync);
  }, []);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest('[data-profile-menu]')) setProfileOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);
  const initials = user?.name?.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || '';
  const active = (href: string) => location === href || (href === '/trips' && location.startsWith('/trips')) || (href === '/bookings' && location.startsWith('/bookings'));
  return (
    <>
  <header className={`relative w-full z-40 px-4 pt-4 sm:px-6 lg:px-8 lg:pt-6 ${ isHome ? 'text-white' : 'text-foreground' }`}>
    

        <div className={`mx-auto flex h-[64px] max-w-[1240px] items-center justify-between gap-4 rounded-[22px] border px-3 shadow-lg backdrop-blur-xl sm:h-[70px] sm:px-4 ${isHome ? 'border-white/20 bg-black/15 shadow-black/20' : 'border-border/70 bg-card/90 shadow-black/5'}`}>
          <Link href="/" className="group flex min-w-0 items-center gap-2.5" data-testid="link-brand">
            <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl border shadow-sm transition-transform group-hover:scale-105 sm:size-10 ${isHome ? 'border-white/25 bg-white/10 text-white' : 'border-primary/10 bg-primary text-primary-foreground'}`}>
              <Mountain size={20} strokeWidth={1.8} />
            </span>
            <span className="min-w-0 leading-none">
              <span className={`block truncate font-display text-[16px] font-semibold tracking-[-.02em] sm:text-[18px] ${isHome ? 'text-white' : 'text-foreground'}`}>Travel with Trails</span>
              <span className={`mt-1 block text-[7px] uppercase tracking-[.2em] sm:text-[8px] ${isHome ? 'text-white/70' : 'text-muted-foreground'}`}>Explore · Travel · Belong</span>
            </span>
          </Link>

          <nav className={`hidden items-center gap-1 rounded-full border p-1 md:flex ${isHome ? 'border-white/15 bg-white/5' : 'border-border/70 bg-background/60'}`} aria-label="Primary navigation">
            {navItems.map(({ href, label }) => <Link key={href} href={href} data-testid={`link-nav-${label.toLowerCase()}`} className={`rounded-full px-4 py-2.5 text-[11px] font-semibold transition-all ${active(href) ? (isHome ? 'bg-white/20 text-white shadow-sm' : 'bg-primary text-primary-foreground shadow-sm') : (isHome ? 'text-white/80 hover:bg-white/10 hover:text-white' : 'text-muted-foreground hover:bg-secondary hover:text-foreground')}`}>{label}</Link>)}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {user ? (
              <div className="relative" data-profile-menu>
                <button type="button" onClick={() => setProfileOpen((open) => !open)} className={`flex items-center gap-2 rounded-full border px-2 py-1.5 text-left shadow-md backdrop-blur-md transition-all hover:scale-[1.01] ${isHome ? 'border-white/25 bg-white/10 text-white hover:bg-white/15' : 'border-border bg-card text-foreground hover:border-primary/30'}`} data-testid="button-profile-menu" aria-expanded={profileOpen}>
                  <span className={`flex size-7 items-center justify-center rounded-full text-[10px] font-bold ${isHome ? 'bg-white text-[#17352a]' : 'bg-[#c9d9c6] text-primary'}`}>{initials || 'U'}</span>
                  <span className="hidden max-w-[125px] truncate text-[10px] font-semibold sm:block">Hi, {user.name}</span>
                  <ChevronDown size={13} className={`transition-transform ${profileOpen ? 'rotate-180' : ''} ${isHome ? 'text-white/80' : 'text-muted-foreground'}`} />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[200px] overflow-hidden rounded-2xl border border-border bg-card p-1.5 text-foreground shadow-2xl">
                    <div className="border-b border-border px-3 py-2.5">
                      <p className="text-[11px] font-bold">{user.name}</p>
                      <p className="mt-0.5 truncate text-[9px] text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="mt-1">
                      <Link href="/profile" onClick={() => { setProfileOpen(false); }} className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-[10px] font-bold text-foreground transition-colors hover:bg-secondary" data-testid="button-profile-page">Profile</Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className={`rounded-full border px-3.5 py-2 text-[10px] font-bold shadow-md backdrop-blur-md transition-all hover:scale-[1.02] sm:px-4 sm:text-[11px] ${isHome ? 'border-white/30 bg-white/10 text-white hover:bg-white/18' : 'border-border bg-card text-foreground hover:border-primary/30'}`} data-testid="link-login-header">Log in</Link>
                <Link href="/signup" className={`hidden rounded-full px-4 py-2 text-[10px] font-bold shadow-md transition-transform hover:scale-[1.03] sm:inline-flex sm:text-[11px] ${isHome ? 'bg-white text-[#17352a]' : 'bg-primary text-primary-foreground'}`} data-testid="link-signup-header">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex h-[72px] items-center justify-around border-t border-border/80 bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
        {navItems.map(({ href, label, icon: Icon }) => { const isActive = active(href); return <Link key={href} href={href} className={`flex min-w-[62px] flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} data-testid={`link-mobile-${label.toLowerCase()}`}><Icon size={19} strokeWidth={isActive ? 2.4 : 1.8} /><span>{label}</span></Link>; })}
      </nav>
    </>
  );
}

export function PageShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`min-h-[100dvh] bg-background mobile-safe ${className}`}><Header />{children}</div>;
}

export function SearchBox({ value, onChange, placeholder = 'Search destinations, trips or experiences...' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="flex h-12 w-full items-center gap-3 rounded-full border border-border/80 bg-card px-4 shadow-[0_5px_18px_hsl(154_30%_20%/.09)] transition-colors focus-within:border-primary/50" data-testid="searchbox-trips">
    <Search size={17} className="shrink-0 text-[#355449]" />
    <input value={value} onChange={(event) => onChange(event.target.value)} type="search" placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-[12px] font-medium text-[#17352a] caret-[#17352a] outline-none placeholder:text-[#52675d]" data-testid="input-search-trips" />
    <button type="button" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105" aria-label="Search" data-testid="button-search-submit"><ArrowRight size={15} /></button>
  </label>;
}

export function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return <div className="mb-5 flex items-end justify-between gap-3">
    <div><p className="mb-1 text-[10px] font-bold uppercase tracking-[.22em] text-primary/70">{eyebrow}</p><h2 className="font-display text-[26px] font-semibold leading-tight tracking-[-.035em] md:text-[30px]">{title}</h2></div>
    {action}
  </div>;
}

export function TripCard({ trip, wishlist, onWishlist, compact = false }: { trip: Trip; wishlist: string[]; onWishlist: (id: string) => void; compact?: boolean }) {
  const saved = wishlist.includes(trip.id);
  return <article className={`group relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_3px_14px_hsl(154_30%_20%/.05)] ${compact ? '' : 'lift'}`} data-testid={`card-trip-${trip.id}`}>
    <Link href={`/trips/${trip.id}`} className="block" data-testid={`link-trip-${trip.id}`}>
      <div className={`${compact ? 'h-32' : 'h-44'} relative overflow-hidden`}>
        <img src={trip.image} alt={trip.title} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#12271e]/65 via-transparent to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-[#f6f0df]/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-primary">{trip.location.split(' ')[0]}</span>
        <button type="button" onClick={(event) => { event.preventDefault(); onWishlist(trip.id); }} className={`absolute right-3 top-3 flex size-8 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${saved ? 'bg-accent text-primary' : 'bg-[#fbf7e9]/85 text-primary hover:bg-accent'}`} aria-label={`${saved ? 'Remove' : 'Save'} ${trip.title}`} data-testid={`button-wishlist-${trip.id}`}><Heart size={15} fill={saved ? 'currentColor' : 'none'} /></button>
        {!compact && <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-primary-foreground"><span className="text-[11px] font-medium">{trip.days} Days · {trip.difficulty}</span><span className="flex items-center gap-1 text-[11px]"><Star size={12} fill="currentColor" /> {trip.rating}</span></div>}
      </div>
      <div className="p-4">
        <h3 className="font-display text-[18px] font-semibold leading-tight">{trip.title}</h3>
        <p className="mt-1 text-[11px] text-muted-foreground">{trip.blurb}</p>
        <div className="mt-4 flex items-end justify-between"><div><p className="text-[9px] uppercase tracking-[.14em] text-muted-foreground">from</p><p className="font-mono-ui text-[15px] font-bold text-primary">{trip.price}</p></div><span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold text-primary">View trip <ChevronRight size={13} /></span></div>
      </div>
    </Link>
  </article>;
}

export function TrustRow() {
  const items = [{ icon: Compass, title: 'Handpicked trips', text: 'Small, thoughtful groups' }, { icon: Leaf, title: 'Stays & food arranged', text: 'Local hosts we trust' }, { icon: ShieldCheck, title: 'Trusted local guides', text: 'Real mountain knowledge' }, { icon: Headphones, title: '24/7 support', text: 'Before and during your trip' }];
  return <div className="grid grid-cols-2 gap-3 py-5 md:grid-cols-4">{items.map(({ icon: Icon, title, text }) => <div className="flex items-center gap-3" key={title}><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary"><Icon size={18} /></span><div><p className="text-[11px] font-bold">{title}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{text}</p></div></div>)}</div>;
}

export function Filters({ category, setCategory, difficulty, setDifficulty, onClear }: { category: string; setCategory: (v: string) => void; difficulty: string; setDifficulty: (v: string) => void; onClear: () => void }) {
  return <aside className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
    <div className="flex items-center justify-between"><p className="flex items-center gap-2 text-[12px] font-bold"><SlidersHorizontal size={15} /> Filter trips</p><button onClick={onClear} type="button" className="text-[10px] font-semibold text-primary hover:underline" data-testid="button-clear-filters">Clear all</button></div>
    <div className="mt-6 space-y-6">
      <fieldset><legend className="mb-3 text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">Trip type</legend><div className="space-y-2.5">{['Himalayas', 'Devotional', 'Weekend getaway', 'International'].map((option) => <label key={option} className="flex items-center gap-2.5 text-[12px]"><input type="radio" name="category" checked={category === option} onChange={() => setCategory(option)} className="size-3.5 accent-[hsl(var(--primary))]" data-testid={`input-category-${option.toLowerCase().replaceAll(' ', '-')}`} />{option}{option === 'International' && <span className="text-[9px] text-muted-foreground">(soon)</span>}</label>)}</div></fieldset>
      <fieldset><legend className="mb-3 text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">Difficulty</legend><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[12px] outline-none focus:border-primary" data-testid="select-difficulty"><option>Any difficulty</option><option>Easy</option><option>Moderate</option><option>Challenging</option></select></fieldset>
      <fieldset><legend className="mb-3 text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">Duration</legend><div className="flex flex-wrap gap-2">{['1–3 days', '4–6 days', '7+ days'].map((duration) => <button type="button" key={duration} className="rounded-full border border-border px-3 py-1.5 text-[10px] hover:border-primary hover:text-primary" data-testid={`button-duration-${duration}`}>{duration}</button>)}</div></fieldset>
    </div>
  </aside>;
}

export function Metric({ icon: Icon, label, sub }: { icon: typeof Clock3; label: string; sub: string }) {
  return <div className="flex flex-col items-center gap-1 px-2 text-center"><Icon size={16} className="text-primary" /><p className="text-[11px] font-bold">{label}</p><p className="text-[9px] text-muted-foreground">{sub}</p></div>;
}

export function ItineraryPreview() {
  return <div className="space-y-3">{[['Day 1', 'Delhi to Bir', 'Arrival & local exploration'], ['Day 2', 'Adventure & sightseeing', 'Paragliding · Waterfall · Cafes'], ['Day 3', 'Sunrise & departure', 'Head back with memories']].map(([day, title, text]) => <div className="flex gap-4 rounded-2xl border border-border bg-card p-4" key={day}><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-primary">{day.replace('Day ', '')}</span><div><p className="text-[12px] font-bold">{title}</p><p className="mt-1 text-[11px] text-muted-foreground">{text}</p></div></div>)}</div>;
}

export function InfoList({ title, items }: { title: string; items: string[] }) {
  return <div><h2 className="font-display text-[26px]">{title}</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{items.map((item) => <div className="flex gap-3 rounded-xl bg-secondary/60 p-4 text-[12px]" key={item}><Check size={16} className="shrink-0 text-primary" />{item}</div>)}</div></div>;
}

export function BookingStepper({ step }: { step: number }) {
  return <div className="mx-auto flex max-w-[720px] items-center justify-center gap-2 rounded-2xl border border-border/70 bg-card px-4 py-3 text-[10px] font-semibold shadow-sm">
    {[['Travellers', 1], ['Review', 2], ['Payment', 3]].map(([label, value], index) => <div key={label} className="flex items-center gap-2">
      <span className={`flex size-6 items-center justify-center rounded-full text-[9px] ${step >= Number(value) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>{value}</span>
      <span className={step >= Number(value) ? 'text-primary' : 'text-muted-foreground'}>{label}</span>
      {index < 2 && <span className="mx-1 h-px w-8 bg-border sm:w-14" />}
    </div>)}
  </div>;
}

export function Field({ label, required: isRequired, value, onChange, placeholder, type='text', className='', inputMode }: { label: string; required?: boolean; value: string; onChange: (value: string)=>void; placeholder?: string; type?: string; className?: string; inputMode?: 'text'|'tel'|'email' }) {
  return <label className={className + ' block'}><span className="text-[10px] font-bold">{label} {isRequired && <span className="text-[#c35b4e]">*</span>}</span><input type={type} value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} inputMode={inputMode} className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 text-[11px] outline-none focus:border-primary"/></label>;
}

export function EmptyState({ title, text, action }: { title: string; text: string; action: ReactNode }) {
  return <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center"><span className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary"><Mountain size={21} /></span><h3 className="mt-4 font-display text-[24px]">{title}</h3><p className="mt-2 max-w-[280px] text-[12px] leading-relaxed text-muted-foreground">{text}</p><div className="mt-5">{action}</div></div>;
}
