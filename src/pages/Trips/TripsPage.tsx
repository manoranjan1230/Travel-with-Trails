import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import type { Trip } from '@/types/models';
import {
  PageShell,
  SearchBox,
  TripCard,
  Filters,
  EmptyState,
} from '@/components/common';
import { loadTripsFromFirestore } from '@/services/storage';

export function TripsPage({
  wishlist,
  onWishlist,
}: {
  wishlist: string[];
  onWishlist: (id: string) => void;
}) {
  const [location, setLocation] = useLocation();
  const [sort, setSort] = useState('Most popular');
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadTrips() {
      try {
        const tripsFromFirestore = await loadTripsFromFirestore();
        if (active) {
          setAllTrips(tripsFromFirestore);
        }
      } catch (error) {
        console.error('Failed to load trips from Firestore.', error);
        if (active) {
          setAllTrips([]);
        }
      } finally {
        if (active) {
          setLoadingTrips(false);
        }
      }
    }

    loadTrips();

    return () => {
      active = false;
    };
  }, []);

  const getFilterState = () => {
    const queryString = location.includes('?')
      ? location.slice(location.indexOf('?') + 1)
      : '';

    const params = new URLSearchParams(queryString);

    return {
      query: params.get('query') || '',
      category: params.get('category') || '',
      difficulty:
        params.get('difficulty') || 'Any difficulty',
    };
  };

  const { query, category, difficulty } =
    getFilterState();

  const applyFilterState = (
    nextCategory: string,
    nextDifficulty: string,
    nextQuery: string
  ) => {
    const nextParams = new URLSearchParams();

    if (nextCategory) {
      nextParams.set('category', nextCategory);
    }

    if (
      nextDifficulty &&
      nextDifficulty !== 'Any difficulty'
    ) {
      nextParams.set('difficulty', nextDifficulty);
    }

    if (nextQuery) {
      nextParams.set('query', nextQuery);
    }

    setLocation(
      `/trips${
        nextParams.toString()
          ? `?${nextParams.toString()}`
          : ''
      }`
    );
  };

  const visibleTrips = useMemo(
    () => allTrips.filter((trip: Trip) => !trip.isHidden),
    [allTrips]
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    const normalizedCategory = category.trim();

    const result = visibleTrips.filter((trip: Trip) => {
      const searchableText = `${trip.title} ${
        trip.location ?? ''
      }`.toLowerCase();

      const matchesQuery =
        !normalizedQuery ||
        searchableText.includes(normalizedQuery);

      let matchesCategory = true;

      if (normalizedCategory) {
        if (
          normalizedCategory === 'Weekend getaway' ||
          normalizedCategory === 'Weekend'
        ) {
          matchesCategory = (trip.days ?? 0) <= 3;
        } else if (
          normalizedCategory === 'International'
        ) {
          matchesCategory = false;
        } else {
          matchesCategory =
            trip.category === normalizedCategory;
        }
      }

      const matchesDifficulty =
        difficulty === 'Any difficulty' ||
        trip.difficulty === difficulty;

      return (
        matchesQuery &&
        matchesCategory &&
        matchesDifficulty
      );
    });

    if (sort === 'Price: low to high') {
      return [...result].sort((a, b) => {
        const priceA = Number(
          String(a.price ?? 0).replace(/[^\d]/g, '')
        );

        const priceB = Number(
          String(b.price ?? 0).replace(/[^\d]/g, '')
        );

        return priceA - priceB;
      });
    }

    return result;
  }, [visibleTrips, query, category, difficulty, sort]);

  const resetFilters = () => {
    setLocation('/trips');
  };

  return (
    <PageShell>
      <main className="mx-auto max-w-[1240px] px-5 py-8 lg:px-8 lg:py-12">
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.23em] text-primary/70">
              Find your next story
            </p>

            <h1 className="mt-2 font-display text-[40px] font-semibold tracking-[-.04em] md:text-[54px]">
              All trips
            </h1>

            <p className="mt-2 max-w-[460px] text-[13px] text-muted-foreground">
              Handpicked journeys across the Himalayas, made for curious people
              and unhurried days.
            </p>
          </div>

          <div className="hidden rounded-full bg-secondary px-4 py-2 text-[11px] font-semibold text-primary md:block">
            {loadingTrips ? 'Loading…' : `${filtered.length} journeys`}
          </div>
        </div>

        <div className="mt-8 grid gap-7 lg:grid-cols-[220px_1fr]">
          <div className="hidden lg:block">
            <Filters
              category={category}
              setCategory={(nextCategory) => {
                applyFilterState(
                  nextCategory,
                  difficulty,
                  query
                );
              }}
              difficulty={difficulty}
              setDifficulty={(nextDifficulty) => {
                applyFilterState(
                  category,
                  nextDifficulty,
                  query
                );
              }}
              onClear={resetFilters}
            />
          </div>

          <div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <SearchBox
                value={query}
                onChange={(nextQuery) => {
                  applyFilterState(
                    category,
                    difficulty,
                    nextQuery
                  );
                }}
                placeholder="Search trips or destinations..."
              />

              <label className="flex h-12 shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 text-[11px] text-muted-foreground sm:w-[180px]">
                <span>Sort by</span>

                <select
                  value={sort}
                  onChange={(event) =>
                    setSort(event.target.value)
                  }
                  className="min-w-0 flex-1 bg-transparent font-semibold text-foreground outline-none"
                  data-testid="select-sort"
                >
                  <option>Most popular</option>
                  <option>Price: low to high</option>
                  <option>Newest</option>
                </select>
              </label>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {[
                'All',
                'Himalayas',
                'Devotional',
                'Weekend',
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() =>
                    applyFilterState(
                      chip === 'All' ? '' : chip,
                      difficulty,
                      query
                    )
                  }
                  type="button"
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-[10px] font-semibold ${
                    category ===
                    (chip === 'All' ? '' : chip)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card'
                  }`}
                  data-testid={`button-filter-chip-${chip.toLowerCase()}`}
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  wishlist={wishlist}
                  onWishlist={onWishlist}
                />
              ))}
            </div>

            {!filtered.length && (
              <EmptyState
                title="No trips match that trail"
                text="Try clearing a filter or searching for another destination."
                action={
                  <button
                    onClick={resetFilters}
                    type="button"
                    className="rounded-full bg-primary px-5 py-2.5 text-[11px] font-bold text-primary-foreground"
                    data-testid="button-reset-trip-search"
                  >
                    Reset filters
                  </button>
                }
              />
            )}
          </div>
        </div>
      </main>
    </PageShell>
  );
}