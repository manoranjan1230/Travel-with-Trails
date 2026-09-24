import { useEffect, useState } from 'react';
import { Link, useParams } from 'wouter';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Heart,
  Leaf,
  Share2,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react';

import { trips as fallbackTrips } from '@/data/trips';
import { resolveTripImage } from '@/data/assetLibrary';
import {
  loadTripsFromFirestore,
  saveTripReviewsToFirestore,
} from '@/services/storage';

import { PageShell, Metric, InfoList } from '@/components/common';
import { getTripAverageRating, type Trip, type TripReview } from '@/types/models';

export function DetailPage({
  wishlist,
  onWishlist,
}: {
  wishlist: string[];
  onWishlist: (id: string) => void;
}) {
  const { id } = useParams<{ id: string }>();
  const [allTrips, setAllTrips] = useState<Trip[]>(fallbackTrips);
  const [loadingTrips, setLoadingTrips] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const firestoreTrips = await loadTripsFromFirestore();
        if (active) {
          setAllTrips(firestoreTrips.length ? firestoreTrips : fallbackTrips);
          setLoadingTrips(false);
        }
      } catch {
        if (active) {
          setAllTrips(fallbackTrips);
          setLoadingTrips(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const [tab, setTab] = useState('Overview');
  const [reviewDraft, setReviewDraft] = useState({ rating: 5, description: '' });

  const trip = allTrips.find((item) => String(item.id) === String(id)) ?? fallbackTrips.find((item) => String(item.id) === String(id)) ?? null;
  const [tripReviews, setTripReviews] = useState<TripReview[]>(() => (trip && Array.isArray(trip.reviews) ? trip.reviews : []));
  const liveReviews = tripReviews.length ? tripReviews : (Array.isArray(trip?.reviews) ? trip.reviews : []);
  const liveRating = getTripAverageRating({ ...trip, reviews: liveReviews });

  useEffect(() => {
    if (!trip?.id) return;

    const saved = localStorage.getItem(`trip-reviews-${trip.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as TripReview[];
        if (Array.isArray(parsed) && parsed.length) {
          setTripReviews(parsed);
          return;
        }
      } catch {
        // ignore malformed saved reviews and fall back to trip data
      }
    }

    setTripReviews(Array.isArray(trip.reviews) ? trip.reviews : []);
  }, [trip?.id, trip?.reviews]);

  useEffect(() => {
    if (!trip?.id) return;
    localStorage.setItem(`trip-reviews-${trip.id}`, JSON.stringify(tripReviews));
  }, [trip?.id, tripReviews]);

  if (loadingTrips) {
    return (
      <PageShell>
        <main className="mx-auto max-w-[1240px] px-5 py-12 lg:px-8">
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-primary">Loading trip</p>
            <h1 className="mt-3 font-display text-3xl">Fetching trip details…</h1>
          </div>
        </main>
      </PageShell>
    );
  }

  if (!trip) {
    return (
      <PageShell>
        <main className="mx-auto max-w-[1240px] px-5 py-12 lg:px-8">
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-primary">Trip not found</p>
            <h1 className="mt-3 font-display text-3xl">This trip is not available right now.</h1>
          </div>
        </main>
      </PageShell>
    );
  }

  const saved = wishlist.includes(trip.id);

  const primaryImage = resolveTripImage(trip.image ?? trip.images?.[0] ?? '') || '';
  const gallery: string[] = (trip.images?.length ? trip.images : trip.image ? [trip.image] : [])
    .map((image: string) => resolveTripImage(String(image || '')))
    .filter((image): image is string => Boolean(image))
    .slice(0, 5);

  const displayReviews: TripReview[] = liveReviews;

  const submitReview = async () => {
    const cleanMessage = reviewDraft.description.trim();
    if (!cleanMessage) {
      return;
    }

    const nextReview: TripReview = {
      timestamp: new Date().toISOString(),
      rating: Math.max(1, Math.min(5, reviewDraft.rating)),
      userName: 'You',
      description: cleanMessage,
    };

    const nextReviews = [nextReview, ...tripReviews];

    setTripReviews(nextReviews);
    setReviewDraft({ rating: 5, description: '' });

    try {
      await saveTripReviewsToFirestore(trip.id, nextReviews);
    } catch {
      // keep the local submit state even if Firestore write fails
    }
  };

  const tripDays = trip.days ?? 1;
  const tripNights = trip.nights ?? 0;
  const tripHighlights: string[] = trip.highlights?.length ? trip.highlights : [
    'Local stories and mountain hospitality',
    'Scenic route with handpicked stays',
    'Guided experiences and flexible pace',
    'Group support and local guides',
  ];
  const tripInclusions: string[] = trip.inclusion?.length ? trip.inclusion : [
    'Handpicked accommodation',
    'Daily breakfast and local meals',
    'Travel coordination and local guide',
    'On-trip support and logistics',
  ];
  const tripExclusions: string[] = trip.exclusion?.length ? trip.exclusion : [
    'Flights and personal travel',
    'Insurance not included',
    'Optional activities and shopping',
    'Meals outside the plan',
  ];
  const itineraryEntries: Array<{ departure: string; destination: string; description: string; imageUrl: string }> = trip.itinerary?.length ? trip.itinerary : [
    { departure: 'Day 1', destination: 'Arrival', description: 'Arrival and welcome briefing', imageUrl: primaryImage },
    { departure: 'Day 2', destination: 'Exploration', description: 'Sightseeing and local experiences', imageUrl: primaryImage },
    { departure: 'Day 3', destination: 'Departure', description: 'Final views and departure', imageUrl: primaryImage },
  ];

  return (
    <PageShell>
      <main className="mx-auto max-w-[1240px] px-5 py-6 lg:px-8 lg:py-9">
        <Link
          href="/trips"
          className="mb-5 inline-flex items-center gap-2 text-[11px] font-semibold text-muted-foreground hover:text-primary"
          data-testid="link-back-trips"
        >
          <ArrowLeft size={14} />
          Back to trips
        </Link>

        <div className="grid gap-7 lg:grid-cols-[1.25fr_.75fr]">
          <div>
            <div className="grid h-[360px] grid-cols-4 gap-2 overflow-hidden rounded-2xl md:h-[470px]">
              <div className="relative col-span-3 overflow-hidden">
                <img
                  src={primaryImage}
                  alt={trip.title}
                  className="size-full object-cover"
                />

                <div className="absolute inset-x-5 bottom-5 flex items-end justify-between text-[#f8f2e1]">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[.18em]">
                      {trip.location}
                    </p>

                    <h1 className="mt-1 font-display text-[37px] leading-none md:text-[53px]">
                      {trip.title}
                    </h1>
                  </div>

                  <span className="hidden rounded-full bg-[#f8f2e1]/90 px-3 py-2 text-[11px] font-bold text-primary sm:block">
                    {tripDays} days · {tripNights} nights
                  </span>
                </div>
              </div>

              <div className="grid grid-rows-3 gap-2 overflow-hidden">
                {gallery.slice(1).map((img: string, index: number) => (
                  <img
                    key={`${img}-${index}`}
                    src={img}
                    alt={`${trip.title} gallery ${index + 2}`}
                    className="size-full min-h-0 object-cover"
                  />
                ))}
              </div>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto">
              {[
                'Overview',
                'Itinerary',
                'Inclusions',
                'Exclusions',
                'Gallery',
                'Reviews',
              ].map((item) => (
                <button
                  key={item}
                  onClick={() => setTab(item)}
                  type="button"
                  className={`whitespace-nowrap border-b-2 px-3 py-3 text-[11px] font-semibold ${
                    tab === item
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  data-testid={`button-detail-tab-${item.toLowerCase()}`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="mt-7">
              {tab === 'Overview' && (
                <div className="grid gap-8 md:grid-cols-[1.2fr_.8fr]">
                  <div>
                    <h2 className="font-display text-[26px]">
                      About this trip
                    </h2>

                    <p className="mt-3 text-[13px] leading-[1.8] text-muted-foreground">
                      {trip.description || trip.blurb || 'Discover a thoughtfully planned trip that balances comfort, adventure, and local experiences.'}
                    </p>

                    <h3 className="mt-7 text-[11px] font-bold uppercase tracking-[.17em] text-primary">
                      Highlights
                    </h3>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {tripHighlights.map((item: string) => (
                        <p
                          key={item}
                          className="flex gap-2 text-[12px] text-muted-foreground"
                        >
                          <Check
                            size={15}
                            className="shrink-0 text-primary"
                          />
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-secondary/65 p-5">
                    <p className="font-display text-[23px] leading-tight">
                      “Higher views,
                      <br />
                      <em className="text-primary">happier you.”</em>
                    </p>

                    <div className="mt-8 rounded-xl border border-border bg-secondary/60 p-4 text-[12px] text-muted-foreground">
                      <p className="font-semibold text-primary">Trip vibe</p>
                      <p className="mt-2 leading-relaxed">{trip.blurb || trip.description || 'Thoughtful planning, local experiences, and plenty of room to breathe.'}</p>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'Itinerary' && (
                <div className="space-y-3">
                  {itineraryEntries.map((entry: { departure: string; destination: string; description: string; imageUrl: string }, index: number) => (
                    <div className="flex gap-4 rounded-2xl border border-border bg-card p-4" key={`${entry.departure}-${index}`}>
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-primary">
                        {String(entry.departure).replace(/[^0-9]/g, '') || index + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-bold">{entry.destination || entry.departure}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">{entry.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'Inclusions' && (
                <InfoList title="Everything considered" items={tripInclusions} />
              )}

              {tab === 'Exclusions' && (
                <InfoList title="Not included in the trip" items={tripExclusions} />
              )}

              {tab === 'Gallery' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {gallery.length ? (
                    gallery.map((img: string, index: number) => (
                      <img
                        key={`${img}-${index}`}
                        src={img}
                        alt={`Trip view ${index + 1}`}
                        className="h-56 w-full rounded-2xl object-cover"
                      />
                    ))
                  ) : (
                    <p className="text-[13px] text-muted-foreground">No gallery images were added for this trip.</p>
                  )}
                </div>
              )}

              {tab === 'Reviews' && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="flex items-center gap-3">
                      <span className="font-display text-4xl">
                        {liveRating > 0 ? liveRating.toFixed(1) : '—'}
                      </span>

                      <div>
                        <div className="flex text-accent">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              fill={star <= Math.round(liveRating || 0) ? 'currentColor' : 'none'}
                              size={16}
                              className={star <= Math.round(liveRating || 0) ? 'text-accent' : 'text-muted-foreground'}
                            />
                          ))}
                        </div>

                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {displayReviews.length ? `Based on ${displayReviews.length} traveller review${displayReviews.length > 1 ? 's' : ''}` : 'Be the first traveller to share feedback'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-dashed border-border p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[.16em] text-primary">Leave a review</p>

                      <div className="mt-3 flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewDraft((current) => ({ ...current, rating: star }))}
                            className="text-xl transition-colors"
                            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                          >
                            <Star
                              size={18}
                              fill={star <= reviewDraft.rating ? 'currentColor' : 'none'}
                              className={star <= reviewDraft.rating ? 'text-accent' : 'text-muted-foreground'}
                            />
                          </button>
                        ))}
                      </div>

                      <textarea
                        value={reviewDraft.description}
                        onChange={(event) => setReviewDraft((current) => ({ ...current, description: event.target.value }))}
                        rows={4}
                        className="mt-4 w-full rounded-xl border border-border bg-background px-3 py-2 text-[12px] text-foreground outline-none focus:border-primary"
                        placeholder="Share your experience of this trip..."
                      />

                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={submitReview}
                          className="rounded-full bg-primary px-4 py-2 text-[11px] font-semibold text-primary-foreground"
                        >
                          Submit review
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {displayReviews.length ? (
                      displayReviews.map((review: TripReview, index: number) => (
                        <div key={`${review.userName}-${review.timestamp}-${index}`} className="rounded-2xl border border-border bg-card p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[12px] font-semibold">{review.userName || 'Traveller'}</p>
                            <div className="flex items-center gap-1 text-accent">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={12}
                                  fill={star <= Number(review.rating || 0) ? 'currentColor' : 'none'}
                                  className={star <= Number(review.rating || 0) ? 'text-accent' : 'text-muted-foreground'}
                                />
                              ))}
                            </div>
                          </div>

                          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{review.description}</p>
                          <p className="mt-2 text-[10px] uppercase tracking-[.12em] text-muted-foreground">
                            {new Date(review.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border bg-card p-5 text-[13px] text-muted-foreground">
                        No reviews yet for this trip. Add the first one above.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 lg:h-fit">
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-[0_8px_25px_hsl(154_30%_20%/.08)]">
              <div className="grid grid-cols-3 divide-x divide-border border-b border-border pb-5">
                <Metric
                  icon={Clock3}
                  label={`${tripDays} Days`}
                  sub={`${tripNights} nights`}
                />

                <Metric
                  icon={Leaf}
                  label={trip.difficulty ?? 'Not specified'}
                  sub="Difficulty"
                />

                <Metric
                  icon={Users}
                  label="Group trip"
                  sub={trip.group ?? 'Group'}
                />
              </div>

              <div className="mt-5 flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[.13em] text-muted-foreground">
                    Starting from
                  </p>

                  <p className="mt-1 font-mono-ui text-[24px] font-bold">
                    {trip.price ?? 'Price unavailable'}
                  </p>

                  <p className="text-[10px] text-muted-foreground">
                    per person
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onWishlist(trip.id)}
                    type="button"
                    className={`flex size-10 items-center justify-center rounded-full border border-border ${
                      saved
                        ? 'bg-accent text-primary'
                        : 'hover:bg-secondary'
                    }`}
                    aria-label="Save trip"
                    data-testid="button-detail-wishlist"
                  >
                    <Heart
                      size={16}
                      fill={saved ? 'currentColor' : 'none'}
                    />
                  </button>

                  <button
                    type="button"
                    className="flex size-10 items-center justify-center rounded-full border border-border hover:bg-secondary"
                    aria-label="Share trip"
                    data-testid="button-share-trip"
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </div>

              <Link
                href={`/book/${trip.id}`}
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-[12px] font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
                data-testid="button-book-trip"
              >
                Book this trip
                <ArrowRight size={15} />
              </Link>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[10px] text-muted-foreground">
                <ShieldCheck size={13} className="text-primary" />
                No hidden fees · Easy cancellation
              </p>
            </div>

            <div className="mt-4 rounded-2xl bg-[#e5eadc] p-5">
              <p className="font-display text-[20px] leading-tight">
                A little planning.
                <br />
                <em className="text-primary">A lot more living.</em>
              </p>

              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                Our local team is one message away, from the first question to
                the last sunset.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </PageShell>
  );
}