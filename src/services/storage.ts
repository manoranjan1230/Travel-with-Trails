import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from 'firebase/firestore';

import type {
  Booking,
  Traveller,
  Trip,
} from '@/types/models';

import { auth, db } from './firebase';

export const TRAVELLERS_KEY =
  'travel-with-trails-travellers-v1';

export const BOOKINGS_KEY =
  'travel-with-trails-bookings-v3';

export const CANCELLED_KEY =
  'travel-with-trails-cancelled-v3';

export function readTravellerStorage(): Traveller[] {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(TRAVELLERS_KEY) || '[]'
    );

    return Array.isArray(parsed)
      ? parsed.filter(
          (x): x is Traveller =>
            Boolean(x?.id && x?.name)
        )
      : [];
  } catch {
    return [];
  }
}

export function readBookingStorage(
  key: string
): Booking[] {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(key) || '[]'
    );

    if (Array.isArray(parsed)) {
      return parsed.filter(
        (x) => x?.trip?.id
      );
    }

    if (parsed?.trip?.id) {
      return [parsed];
    }
  } catch {
    // Ignore invalid local storage.
  }

  return [];
}

export function persistBookings(
  items: Booking[]
): void {
  localStorage.setItem(
    BOOKINGS_KEY,
    JSON.stringify(items)
  );
}

export function persistCancelled(
  items: Booking[]
): void {
  localStorage.setItem(
    CANCELLED_KEY,
    JSON.stringify(items)
  );
}

export function makeBookingId(
  tripId: string
): string {
  return `${tripId}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function normalizeBookings(
  items: Booking[]
): Booking[] {
  return items
    .filter(Boolean)
    .map((item) => {
      const raw = Number(item.people);

      const fallback =
        item.trip?.id ===
        'spiti-valley-expedition'
          ? 2
          : item.trip?.id ===
            'bir-billing-weekend'
          ? 2
          : 1;

      const people =
        Number.isFinite(raw) && raw > 0
          ? Math.floor(raw)
          : fallback;

      return {
        ...item,
        people,
        trip: {
          ...item.trip,
        },
        travellers: Array.isArray(
          item.travellers
        )
          ? item.travellers
          : undefined,
      };
    });
}

function toCurrencyNumber(
  value: string | number | undefined
): number {
  if (typeof value === 'number') {
    return Number.isFinite(value)
      ? value
      : 0;
  }

  if (typeof value === 'string') {
    return (
      Number(
        String(value).replace(
          /[^\d.-]/g,
          ''
        )
      ) || 0
    );
  }

  return 0;
}

function timestampToISOString(
  value: unknown,
  fallback?: string
): string {
  if (typeof value === 'string') {
    return value;
  }

  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as Timestamp).toDate ===
      'function'
  ) {
    return (
      value as Timestamp
    )
      .toDate()
      .toISOString();
  }

  if (
    value &&
    typeof value === 'object' &&
    'toMillis' in value &&
    typeof (value as Timestamp).toMillis ===
      'function'
  ) {
    return new Date(
      (
        value as Timestamp
      ).toMillis()
    ).toISOString();
  }

  return (
    fallback ||
    new Date().toISOString()
  );
}

function normalizeBookingRecord(
  item: Booking,
  userId: string
): Booking {
  const trip = (item.trip ?? {}) as Trip;

  const numberOfPersons = Math.max(
    1,
    Number(
      item.numberOfPersons ??
        item.people ??
        item.travellers?.length ??
        1
    ) || 1
  );

  const tripPrice = toCurrencyNumber(
    trip.price
  );

  const totalAmount = Number(
    item.totalAmount ??
      tripPrice * numberOfPersons
  );

  return {
    ...item,
    id: item.id,
    userId,
    tripId:
      item.tripId || trip.id,
    trip: {
      ...trip,
    },
    people: numberOfPersons,
    numberOfPersons,
    travellers: Array.isArray(
      item.travellers
    )
      ? item.travellers
      : [],
    bookingStatus:
      item.bookingStatus ===
      'cancelled'
        ? 'cancelled'
        : item.bookingStatus ||
          'confirmed',
    status:
      item.status === 'Cancelled'
        ? 'Cancelled'
        : item.status || 'Confirmed',
    totalAmount,
    timestamp:
      timestampToISOString(
        item.timestamp
      ),
    createdAt:
      timestampToISOString(
        item.createdAt
      ),
    updatedAt:
      timestampToISOString(
        item.updatedAt
      ),
  };
}

function requireAuthenticatedUser(
  requestedUserId?: string
): string {
  const firebaseUser =
    auth?.currentUser;

  if (!firebaseUser) {
    throw new Error(
      'Authentication required before accessing bookings. Please log in again.'
    );
  }

  if (
    requestedUserId &&
    requestedUserId !== firebaseUser.uid
  ) {
    throw new Error(
      'The authenticated user does not match the requested booking account.'
    );
  }

  return firebaseUser.uid;
}

export async function createBookingDocument(
  booking: Booking,
  userId?: string
): Promise<Booking> {
  if (!db) {
    throw new Error(
      'Firebase Firestore is not available. Please check your Firebase configuration and try again.'
    );
  }

  const authenticatedUserId =
    requireAuthenticatedUser(userId);

  const normalized =
    normalizeBookingRecord(
      booking,
      authenticatedUserId
    );

  const tripId =
    normalized.tripId ||
    normalized.trip?.id;

  const travellers =
    Array.isArray(
      normalized.travellers
    )
      ? normalized.travellers
      : [];

  if (
    !tripId ||
    !normalized.trip ||
    !travellers.length ||
    !normalized.totalAmount ||
    Number.isNaN(
      normalized.totalAmount
    )
  ) {
    throw new Error(
      'Booking payload is incomplete. Please check the trip details and selected travellers before confirming.'
    );
  }

  /*
   * Important:
   * Do not call getDoc() before creating a new booking.
   *
   * The booking ID is newly generated, and our Firestore
   * rules allow the owner to CREATE the booking but only
   * allow READ access to an existing booking owned by that
   * user. The unnecessary pre-create read could therefore
   * cause a "Missing or insufficient permissions" error.
   */

  const bookingRef = doc(
    db,
    'bookings',
    normalized.id
  );

  const bookingPayload = {
    ...normalized,
    userId: authenticatedUserId,
    tripId,
    numberOfPersons:
      normalized.numberOfPersons,
    travellers,
    bookingStatus: 'confirmed',
    status: 'Confirmed',
    totalAmount:
      normalized.totalAmount,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    timestamp:
      new Date().toISOString(),
  };

  await setDoc(
    bookingRef,
    bookingPayload
  );

  return normalizeBookingRecord(
    {
      ...normalized,
      bookingStatus: 'confirmed',
      status: 'Confirmed',
    },
    authenticatedUserId
  );
}

export async function loadUserBookings(
  userId: string
): Promise<Booking[]> {
  if (!db) {
    return [];
  }

  const authenticatedUserId =
    requireAuthenticatedUser(userId);

  const q = query(
    collection(db, 'bookings'),
    where(
      'userId',
      '==',
      authenticatedUserId
    )
  );

  const snapshot =
    await getDocs(q);

  return snapshot.docs.map(
    (document) => {
      const data =
        document.data() as Partial<Booking> & {
          trip?: Trip;
          travellers?: Traveller[];
        };

      const trip =
        data.trip ??
        ({
          id:
            data.tripId ??
            'unknown-trip',
        } as Trip);

      const numberOfPersons =
        Number(
          data.numberOfPersons ??
            data.people ??
            data.travellers
              ?.length ??
            1
        ) || 1;

      return normalizeBookingRecord(
        {
          id: document.id,
          trip,
          people: numberOfPersons,
          numberOfPersons,
          status:
            data.status ||
            (data.bookingStatus ===
            'cancelled'
              ? 'Cancelled'
              : 'Confirmed'),
          bookingStatus:
            data.bookingStatus ||
            'confirmed',
          travellers:
            Array.isArray(
              data.travellers
            )
              ? data.travellers
              : [],
          userId:
            data.userId ||
            authenticatedUserId,
          tripId:
            data.tripId ||
            trip.id,
          totalAmount: Number(
            data.totalAmount ??
              toCurrencyNumber(
                trip.price
              ) *
                numberOfPersons
          ),
          createdAt:
            timestampToISOString(
              data.createdAt
            ),
          updatedAt:
            timestampToISOString(
              data.updatedAt
            ),
          timestamp:
            timestampToISOString(
              data.timestamp
            ),
        },
        authenticatedUserId
      );
    }
  );
}

export async function cancelBookingDocument(
  bookingId: string
): Promise<Booking> {
  if (!db) {
    throw new Error(
      'Firebase Firestore is not available. Booking cancellation cannot proceed right now.'
    );
  }

  const authenticatedUserId =
    requireAuthenticatedUser();

  const bookingRef = doc(
    db,
    'bookings',
    bookingId
  );

  const current =
    await getDoc(bookingRef);

  if (!current.exists()) {
    throw new Error(
      `Booking ${bookingId} does not exist in Firestore.`
    );
  }

  const currentData =
    current.data() as Booking;

  if (
    currentData.userId !==
    authenticatedUserId
  ) {
    throw new Error(
      'You are not authorized to cancel this booking.'
    );
  }

  const updated = {
    bookingStatus: 'cancelled',
    status: 'Cancelled',
    updatedAt: serverTimestamp(),
  };

  await updateDoc(
    bookingRef,
    updated
  );

  return {
    ...currentData,
    id: bookingId,
    bookingStatus: 'cancelled',
    status: 'Cancelled',
    updatedAt:
      new Date().toISOString(),
  } as Booking;
}

export async function migrateLegacyBookingsToFirestore(
  userId: string
): Promise<number> {
  if (!db) {
    return 0;
  }

  const authenticatedUserId =
    requireAuthenticatedUser(userId);

  const legacyBookings = [
    ...readBookingStorage(
      BOOKINGS_KEY
    ),
    ...readBookingStorage(
      CANCELLED_KEY
    ),
  ];

  if (!legacyBookings.length) {
    return 0;
  }

  const migratedStorageKey =
    `travel-with-trails-bookings-migrated-${authenticatedUserId}`;

  let migratedKeys: string[] = [];

  try {
    const parsed = JSON.parse(
      localStorage.getItem(
        migratedStorageKey
      ) || '[]'
    );

    migratedKeys = Array.isArray(
      parsed
    )
      ? parsed
      : [];
  } catch {
    migratedKeys = [];
  }

  let migratedCount = 0;

  for (
    const legacyBooking of legacyBookings
  ) {
    if (
      !legacyBooking?.trip?.id
    ) {
      continue;
    }

    const bookingId =
      legacyBooking.id ||
      makeBookingId(
        legacyBooking.trip.id
      );

    if (
      migratedKeys.includes(
        bookingId
      )
    ) {
      continue;
    }

    const bookingRef = doc(
      db,
      'bookings',
      bookingId
    );

    /*
     * Legacy migration also avoids a pre-create getDoc().
     * We already know this booking belongs to the
     * authenticated local account.
     */
    const numberOfPersons =
      Number(
        legacyBooking.numberOfPersons ??
          legacyBooking.people ??
          legacyBooking.travellers
            ?.length ??
          1
      ) || 1;

    const normalized =
      normalizeBookingRecord(
        {
          ...legacyBooking,
          id: bookingId,
          userId:
            authenticatedUserId,
          tripId:
            legacyBooking.trip.id,
          numberOfPersons,
          bookingStatus:
            legacyBooking.bookingStatus ===
              'cancelled' ||
            legacyBooking.status ===
              'Cancelled'
              ? 'cancelled'
              : 'confirmed',
          status:
            legacyBooking.status ===
            'Cancelled'
              ? 'Cancelled'
              : 'Confirmed',
          travellers:
            Array.isArray(
              legacyBooking.travellers
            )
              ? legacyBooking.travellers
              : [],
          totalAmount: Number(
            legacyBooking.totalAmount ??
              toCurrencyNumber(
                legacyBooking
                  .trip.price
              ) *
                numberOfPersons
          ),
          timestamp:
            legacyBooking.timestamp ||
            new Date().toISOString(),
          createdAt:
            legacyBooking.createdAt ||
            legacyBooking.timestamp ||
            new Date().toISOString(),
          updatedAt:
            legacyBooking.updatedAt ||
            legacyBooking.timestamp ||
            new Date().toISOString(),
        },
        authenticatedUserId
      );

    await setDoc(
      bookingRef,
      {
        ...normalized,
        userId:
          authenticatedUserId,
        tripId:
          normalized.tripId ||
          normalized.trip.id,
        numberOfPersons:
          normalized.numberOfPersons,
        travellers:
          Array.isArray(
            normalized.travellers
          )
            ? normalized.travellers
            : [],
        bookingStatus:
          normalized.bookingStatus ===
          'cancelled'
            ? 'cancelled'
            : 'confirmed',
        status:
          normalized.bookingStatus ===
          'cancelled'
            ? 'Cancelled'
            : 'Confirmed',
        totalAmount:
          normalized.totalAmount,
        createdAt:
          serverTimestamp(),
        updatedAt:
          serverTimestamp(),
        timestamp:
          normalized.timestamp,
      }
    );

    migratedKeys.push(
      bookingId
    );

    migratedCount += 1;
  }

  localStorage.setItem(
    migratedStorageKey,
    JSON.stringify(
      Array.from(
        new Set(migratedKeys)
      )
    )
  );

  return migratedCount;
}