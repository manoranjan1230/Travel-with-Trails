import { useState } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Clock3, Headphones, Heart, Leaf, Pencil, Search, Send, Share2, ShieldCheck, Star, Users, X, CalendarDays, Sparkles, SlidersHorizontal, Mountain, Ticket } from 'lucide-react';
import { trips, alpineHero, spitiValley, kedarnath, valleyFlowers } from '@/data/trips';
import type { Trip, Traveller, Booking } from '@/types/models';
import { Header, SectionTitle, TripCard, TrustRow, Filters, Metric, ItineraryPreview, InfoList, BookingStepper, Field, EmptyState } from '@/components/common';
import { readTravellerStorage, TRAVELLERS_KEY } from '@/services/storage';

export function Home({ wishlist, onWishlist }: { wishlist: string[]; onWishlist: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const visibleTrips = trips.filter((trip) => !search || `${trip.title} ${trip.location}`.toLowerCase().includes(search.toLowerCase()));
  return <main>
      <section className="relative isolate min-h-[100svh] overflow-hidden bg-[#081a1d] text-[#f7f1df]">
        <style>{`
          @keyframes heroBirdOne {
            0% { transform: translate3d(-14vw, 8vh, 0) rotate(-4deg) scale(.72); opacity: 0; }
            8% { opacity: .92; }
            42% { transform: translate3d(38vw, -2vh, 0) rotate(2deg) scale(.86); }
            72% { transform: translate3d(76vw, 8vh, 0) rotate(-2deg) scale(.95); }
            92% { opacity: .9; }
            100% { transform: translate3d(116vw, -5vh, 0) rotate(4deg) scale(1.05); opacity: 0; }
          }
          @keyframes heroBirdTwo {
            0% { transform: translate3d(112vw, 20vh, 0) rotate(3deg) scale(.8) scaleX(-1); opacity: 0; }
            10% { opacity: .82; }
            45% { transform: translate3d(70vw, 8vh, 0) rotate(-2deg) scale(.9) scaleX(-1); }
            76% { transform: translate3d(28vw, 16vh, 0) rotate(2deg) scale(.98) scaleX(-1); }
            100% { transform: translate3d(-18vw, 3vh, 0) rotate(-3deg) scale(1.06) scaleX(-1); opacity: 0; }
          }
          @keyframes heroBirdThree {
            0% { transform: translate3d(-12vw, 42vh, 0) rotate(2deg) scale(.68); opacity: 0; }
            9% { opacity: .75; }
            50% { transform: translate3d(46vw, 28vh, 0) rotate(-3deg) scale(.82); }
            100% { transform: translate3d(112vw, 38vh, 0) rotate(3deg) scale(.94); opacity: 0; }
          }
          @keyframes heroBirdFour {
            0% { transform: translate3d(110vw, 48vh, 0) rotate(-2deg) scale(.7) scaleX(-1); opacity: 0; }
            12% { opacity: .7; }
            55% { transform: translate3d(55vw, 35vh, 0) rotate(2deg) scale(.84) scaleX(-1); }
            100% { transform: translate3d(-16vw, 46vh, 0) rotate(-2deg) scale(.98) scaleX(-1); opacity: 0; }
          }
          @keyframes heroParagliderLeftToRight {
            0% { transform: translate3d(-22vw, 8vh, 0) scaleX(-1); opacity: 0; }
            7% { opacity: 1; }
            50% { transform: translate3d(50vw, 16vh, 0) scaleX(-1); opacity: 1; }
            93% { opacity: 1; }
            100% { transform: translate3d(122vw, 30vh, 0) scaleX(-1); opacity: 0; }
          }
          @keyframes heroDuskSweep {
            0%, 25% { opacity: 0; transform: translateX(110%); }
            58% { opacity: .12; transform: translateX(30%); }
            78%, 100% { opacity: .34; transform: translateX(-12%); }
          }
          @keyframes heroStarsGlow {
            0%, 42% { opacity: 0; }
            65% { opacity: .25; }
            100% { opacity: .75; }
          }
          @keyframes heroStarTwinkle {
            0%, 100% { opacity: .28; transform: scale(.75); }
            50% { opacity: 1; transform: scale(1.3); }
          }
          @keyframes heroShootingStar {
            0% { transform: translate3d(0, 0, 0) rotate(-28deg) scaleX(.15); opacity: 0; }
            8% { opacity: 0; }
            12% { opacity: .95; }
            32% { transform: translate3d(-160px, 120px, 0) rotate(-28deg) scaleX(1); opacity: .9; }
            38%, 100% { transform: translate3d(-230px, 170px, 0) rotate(-28deg) scaleX(1.05); opacity: 0; }
          }
          @keyframes heroWind {
            0% { transform: translateX(-18%); opacity: 0; }
            20% { opacity: .36; }
            55% { transform: translateX(28%); opacity: .22; }
            100% { transform: translateX(118%); opacity: 0; }
          }
          @keyframes heroScrollBounce {
            0%, 100% { transform: translateY(0); opacity: .75; }
            50% { transform: translateY(6px); opacity: 1; }
          }
          .hero-bird { position: absolute; z-index: 5; width: 96px; height: 70px; overflow: hidden; pointer-events: none; background-image: url('/travel-birds-real.png'); background-repeat: no-repeat; background-size: 520px auto; background-color: transparent; filter: drop-shadow(0 3px 4px rgba(0,0,0,.25)); }
          .hero-bird::after { content: ''; position: absolute; inset: 0; background: transparent; }
          .hero-bird-one { top: 12%; left: 0; background-position: -14px -48px; animation: heroBirdOne 20s linear infinite; }
          .hero-bird-two { top: 25%; left: 0; background-position: -185px -42px; animation: heroBirdTwo 24s linear 3s infinite; }
          .hero-bird-three { top: 43%; left: 0; background-position: -335px -48px; animation: heroBirdThree 22s linear 7s infinite; }
          .hero-bird-four { top: 54%; left: 0; background-position: -425px -55px; animation: heroBirdFour 26s linear 1s infinite; }
          .hero-paraglider { position: absolute; z-index: 6; left: 0; top: 0; width: clamp(115px, 13vw, 205px); height: auto; pointer-events: none; transform-origin: 50% 55%; filter: drop-shadow(0 7px 7px rgba(0,0,0,.28)); }
          .hero-paraglider-one { animation: heroParagliderLeftToRight 22s ease-in-out infinite; }
          .hero-paraglider-two { animation: heroParagliderTopLeftToBottomRight 22s ease-in-out 27s infinite; }
          .hero-dusk-sweep { position: absolute; inset: 0; z-index: 3; pointer-events: none; background: linear-gradient(90deg, transparent 0%, rgba(8,22,47,.05) 34%, rgba(7,19,45,.28) 70%, rgba(3,10,27,.5) 100%); animation: heroDuskSweep 28s ease-in-out infinite; }
          .hero-stars { position: absolute; inset: 0; z-index: 4; pointer-events: none; animation: heroStarsGlow 24s ease-in-out infinite; }
          .hero-star { position: absolute; width: 3px; height: 3px; border-radius: 9999px; background: rgba(255,255,240,.95); box-shadow: 0 0 8px rgba(255,255,240,.75); animation: heroStarTwinkle 3.2s ease-in-out infinite; }
          .hero-shooting-star { position: absolute; width: 90px; height: 2px; border-radius: 999px; background: linear-gradient(90deg, transparent, rgba(255,255,255,.95)); transform-origin: right center; opacity: 0; animation: heroShootingStar 6.5s linear infinite; }
          .hero-shooting-one { top: 17%; right: 13%; animation-delay: 2s; }
          .hero-shooting-two { top: 30%; right: 26%; animation-delay: 5s; animation-duration: 8s; }
          .hero-shooting-three { top: 11%; right: 38%; animation-delay: 8s; animation-duration: 7.5s; }
          .hero-wind { position: absolute; z-index: 4; left: -20%; width: 46%; height: 24px; border-top: 1px solid rgba(245,249,238,.22); border-radius: 50%; filter: blur(.4px); animation: heroWind 9s linear infinite; pointer-events: none; }
          .hero-wind-one { top: 46%; } .hero-wind-two { top: 54%; transform: scale(.72); animation-delay: -3.5s; } .hero-wind-three { top: 62%; transform: scale(.54); animation-delay: -6.5s; }
          .hero-content-mask { position: absolute; z-index: 7; left: 50%; top: 31%; width: min(660px, 72vw); height: 40%; transform: translateX(-50%); border-radius: 42px; background: linear-gradient(180deg, rgba(9,19,29,.20), rgba(9,20,30,.42) 48%, rgba(9,19,29,.26)); backdrop-filter: blur(10px) saturate(.78); -webkit-backdrop-filter: blur(8px) saturate(.82); pointer-events: none; }
          .hero-scroll { animation: heroScrollBounce 1.8s ease-in-out infinite; }
          @media (prefers-reduced-motion: reduce) { .hero-birds, .hero-paraglider, .hero-dusk-sweep, .hero-stars, .hero-star, .hero-wind, .hero-scroll { animation: none !important; } .hero-stars { opacity: .5; } }
        `}</style>

        <img src="/banner.png" alt="Mountain valley at sunset turning into a starry night" className="absolute inset-0 z-0 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 z-[1] bg-black/10" />
        <div className="hero-dusk-sweep" />
        <div className="hero-stars" aria-hidden="true">
          <i className="hero-star" style={{ left: '61%', top: '11%', animationDelay: '-.8s' }} /><i className="hero-star" style={{ left: '69%', top: '18%', animationDelay: '-2.1s' }} /><i className="hero-star" style={{ left: '78%', top: '10%', animationDelay: '-1.3s' }} /><i className="hero-star" style={{ left: '88%', top: '21%', animationDelay: '-3.2s' }} /><i className="hero-star" style={{ left: '94%', top: '13%', animationDelay: '-.4s' }} /><i className="hero-star" style={{ left: '57%', top: '28%', animationDelay: '-2.6s' }} /><i className="hero-star" style={{ left: '83%', top: '29%', animationDelay: '-1.7s' }} />
          <i className="hero-shooting-star hero-shooting-one" /><i className="hero-shooting-star hero-shooting-two" /><i className="hero-shooting-star hero-shooting-three" />
        </div>
        <span className="hero-bird hero-bird-one" aria-hidden="true" /><span className="hero-bird hero-bird-two" aria-hidden="true" /><span className="hero-bird hero-bird-three" aria-hidden="true" /><span className="hero-bird hero-bird-four" aria-hidden="true" />
        <img src="/travel-paraglider-real.png" alt="" aria-hidden="true" className="hero-paraglider hero-paraglider-one" />
        <span className="hero-wind hero-wind-one" aria-hidden="true" /><span className="hero-wind hero-wind-two" aria-hidden="true" /><span className="hero-wind hero-wind-three" aria-hidden="true" />
        <div className="hero-content-mask" aria-hidden="true" />
        <Header />

        <div className="relative z-20 mx-auto flex min-h-[100svh] w-full max-w-[1240px] flex-col items-center justify-center px-5 pb-20 pt-28 text-center -translate-y-14 lg:px-8">
          <div className="w-full max-w-[700px]">
            <h1 className="font-display text-[42px] leading-[.96] tracking-[-.045em] text-[#e5ba7e] drop-shadow-[0_3px_12px_rgba(0,0,0,.42)] sm:text-[54px] md:text-[66px]">Nature waits,<br />let’s explore together.</h1>
            <label className="mx-auto mt-7 flex h-[58px] w-full max-w-[590px] cursor-text items-center gap-3 rounded-full border border-white/30 bg-white/95 px-5 text-left shadow-[0_10px_35px_rgba(0,0,0,.22)] backdrop-blur-sm" aria-label="Search destinations, trips or experiences">
              <Search size={19} className="shrink-0 text-[#17352a]/85" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" aria-label="Search destinations, trips or experiences" className="min-w-0 flex-1 bg-transparent text-[12px] font-medium text-[#17352a] caret-[#17352a] outline-none placeholder:text-[#52675d]" placeholder="Search destination, trip or experience..." data-testid="input-home-hero-search" />
            </label>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
              <span className="text-[11px] font-semibold text-white/90 drop-shadow">Trending:</span>
              {['Bir Billing','Spiti Valley','Kasol','Tirthan'].map((label) => <button key={label} type="button" onClick={() => setSearch(label.split(' ')[0])} className="rounded-full border border-white/30 bg-black/20 px-4 py-2 text-[10px] font-semibold text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-white/15" aria-label={`Search ${label}`} data-testid={`button-home-trending-${label.toLowerCase().replaceAll(' ', '-')}`}>{label}</button>)}
            </div>
          </div>
          <a href="#home-content" className="absolute bottom-8 left-1/2 z-30 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[.24em] text-white/85 drop-shadow-md" aria-label="Scroll down to explore">
            <span className="flex flex-col items-center gap-2">Scroll down <span className="hero-scroll text-[19px] leading-none">↓</span></span>
          </a>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-black/35 to-transparent" />
      </section>
      <div id="home-content" className="scroll-mt-20" />
      <section className="border-y border-border/70 bg-[#e4eadc]/55">
        <div className="mx-auto max-w-[1240px] px-5 py-10 lg:px-8 lg:py-14">
          <SectionTitle eyebrow="Find your kind of wild" title="What’s calling you?" action={<Link href="/trips" className="hidden items-center gap-1 text-[11px] font-bold text-primary md:flex" data-testid="link-explore-all">See all trips <ArrowRight size={14} /></Link>} />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[{ title: 'Mountains', sub: 'Peaks & pine trails', img: alpineHero, search: 'Himalayas' }, { title: 'Devotional', sub: 'Journeys with meaning', img: kedarnath, search: 'Devotional' }, { title: 'Weekend escapes', sub: 'A little time away', img: valleyFlowers, search: 'Easy' }, { title: 'Big expeditions', sub: 'Go further out', img: spitiValley, search: 'Moderate' }].map((item) => <button key={item.title} onClick={() => setSearch(item.search)} type="button" className="group relative h-36 overflow-hidden rounded-2xl text-left md:h-44" data-testid={`button-category-${item.title.toLowerCase().replaceAll(' ', '-')}`}><img src={item.img} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-[#10271f]/85 to-transparent" /><div className="absolute bottom-4 left-4 text-[#f7f1df]"><p className="font-display text-[20px]">{item.title}</p><p className="mt-0.5 text-[10px] text-[#e8e7d8]/80">{item.sub}</p></div></button>)}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1240px] px-5 py-11 lg:px-8 lg:py-16">
        <SectionTitle eyebrow="Picked for this season" title="Trips worth making" action={<Link href="/trips" className="flex items-center gap-1 text-[11px] font-bold text-primary" data-testid="link-all-trips">Browse all <ArrowRight size={14} /></Link>} />
        <div className="grid gap-4 md:grid-cols-3">{visibleTrips.slice(0, 3).map((trip) => <TripCard key={trip.id} trip={trip} wishlist={wishlist} onWishlist={onWishlist} />)}</div>
        {!visibleTrips.length && <EmptyState title="No trails found" text="Try a wider search, or let the mountains surprise you." action={<button onClick={() => setSearch('')} type="button" className="rounded-full bg-primary px-5 py-2.5 text-[11px] font-bold text-primary-foreground" data-testid="button-clear-home-search">Clear search</button>} />}
      </section>
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-[1240px] flex-col items-start gap-8 px-5 py-14 md:flex-row md:items-center md:justify-between lg:px-8 lg:py-20"><div><p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#e5ba7e]">The trails promise</p><h2 className="mt-3 max-w-[620px] font-display text-[39px] leading-[.98] tracking-[-.04em] md:text-[58px]">Less worries.<br /><em className="font-normal text-[#e5ba7e]">More mountains.</em></h2></div><div className="max-w-[350px] text-[13px] leading-relaxed text-[#e1e7d7]/75"><p>Travel lightly. Come back with stories. We’ll handle the route, the stays, and the little details in between.</p><div className="mt-5 flex flex-wrap items-center gap-5"><Link href="/support" className="inline-flex items-center gap-2 text-[11px] font-bold text-[#f0d29e]" data-testid="link-promise-support">How we make it easy <ArrowRight size={14} /></Link><Link href="/become-a-host" className="inline-flex items-center gap-2 text-[11px] font-bold text-[#f0d29e]" data-testid="link-become-a-host">Become a Host <ArrowRight size={14} /></Link></div></div></div>
      </section>
    </main>;
}
