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

import {
  getTripAverageRating,
  type Booking,
  type Traveller,
  type Trip,
  type TripReview,
} from '@/types/models';

import { resolveTripImage } from '@/data/assetLibrary';
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

export function normalizeTravellerForFirestore(
  traveller: Partial<Traveller> & {
    id?: string;
    name?: string;
    dob?: string;
    gender?: string;
    mobile?: string;
    email?: string;
    emergencyName?: string;
    emergencyPhone?: string;
    relationship?: string;
    medical?: string;
  }
): {
  gender: 'Female' | 'Male' | 'Other';
  name: string;
  age: number;
  contactNumber: string;
  emergencyContactNumber: string;
  email: string;
  relationWithEmergencyContact: string;
  medicalCondition: string;
} {
  const dateOfBirth = traveller.dob;
  const parsedDob = dateOfBirth
    ? new Date(dateOfBirth)
    : null;

  const age =
    parsedDob && !Number.isNaN(parsedDob.getTime())
      ? Math.max(
          0,
          new Date().getFullYear() - parsedDob.getFullYear()
        )
      : 0;

  return {
    gender:
      traveller.gender === 'Female' ||
      traveller.gender === 'Male' ||
      traveller.gender === 'Other'
        ? traveller.gender
        : 'Other',
    name: traveller.name?.trim() || 'Traveller',
    age,
    contactNumber: traveller.mobile?.trim() || '',
    emergencyContactNumber:
      traveller.emergencyPhone?.trim() || '',
    email: traveller.email?.trim() || '',
    relationWithEmergencyContact:
      traveller.relationship?.trim() || '',
    medicalCondition: traveller.medical?.trim() || '',
  };
}

export async function saveUserProfileToFirestore(
  profile: {
    id: string;
    name?: string;
    email?: string;
    mobile?: string;
    passwordHash?: string;
    emergencyNumber?: string;
    profileImageUrl?: string;
    address?: string;
    role?: 'traveller' | 'admin' | 'guide';
    provider?: 'email' | 'google' | 'phone';
    isActive?: boolean;
  }
): Promise<void> {
  if (!db) {
    return;
  }

  const userRef = doc(db, 'users', profile.id);

  await setDoc(
    userRef,
    {
      id: profile.id,
      name: profile.name?.trim() || 'Traveller',
      email: (profile.email || '').trim().toLowerCase(),
      mobile: (profile.mobile || '').replace(/\D/g, '').trim(),
      passwordHash: profile.passwordHash || '',
      emergencyNumber: profile.emergencyNumber || '',
      profileImageUrl: profile.profileImageUrl || '',
      address: profile.address || '',
      role: profile.role || 'traveller',
      provider: profile.provider || 'email',
      isActive: profile.isActive ?? true,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

function normalizeTripList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry).trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\n|,/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

function parseTripItineraryText(value: string | undefined): Trip['itinerary'] {
  if (!value || !value.trim()) {
    return [];
  }

  const lines = value
    .split(/\n|;/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, index) => {
    const trimmed = line.replace(/^Day\s*\d+\s*[:\-]?\s*/i, '').trim();

    if (trimmed.includes('|')) {
      const segments = trimmed.split('|').map((part) => part.trim()).filter(Boolean);
      return {
        departure: segments[0] || `Day ${index + 1}`,
        destination: segments[1] || 'Destination',
        description: segments[2] || '',
        imageUrl: segments[3] || '',
      };
    }

    const match = line.match(/^\s*(?:Day\s*)?(\d+)\s*[:\-]?\s*(.*)$/i);
    const dayLabel = match ? `Day ${match[1]}` : `Day ${index + 1}`;

    return {
      departure: dayLabel,
      destination: 'Destination',
      description: match ? match[2].trim() : line,
      imageUrl: '',
    };
  });
}

function normalizeTripItinerary(value: unknown): Trip['itinerary'] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === 'string') {
        return {
          departure: 'Day 1',
          destination: 'Destination',
          description: item,
          imageUrl: '',
        };
      }

      if (item && typeof item === 'object') {
        const raw = item as Record<string, unknown>;
        return {
          departure: String(raw.departure || 'Day 1'),
          destination: String(raw.destination || 'Destination'),
          description: String(raw.description || ''),
          imageUrl: resolveTripImage(String(raw.imageUrl || '')),
        };
      }

      return null;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

export async function loadTripsFromFirestore(): Promise<Trip[]> {
  if (!db) {
    return [];
  }

  const snapshot = await getDocs(collection(db, 'trips'));

  return snapshot.docs
    .map((item) => {
      const raw = item.data() as Partial<Trip>;
      const imageCandidates = Array.isArray(raw.images)
        ? raw.images
        : raw.image
          ? [raw.image]
          : [];

      const normalizedImages = imageCandidates.map((value) => resolveTripImage(String(value || ''))).filter(Boolean);

      const reviews = Array.isArray(raw.reviews) ? raw.reviews : [];
      const computedRating = getTripAverageRating({
        rating: raw.rating,
        reviews,
      });
      const legacyHidden = Boolean((raw as { hidden?: boolean }).hidden);

      return {
        id: item.id,
        title: String(raw.title || 'Untitled trip'),
        description: raw.description || '',
        place: String(raw.place || raw.location || 'India'),
        location: String(raw.location || raw.place || 'India'),
        image: resolveTripImage(String(raw.image || normalizedImages[0] || '')),
        images: normalizedImages,
        price: raw.price ?? 0,
        days: Number(raw.days ?? 0),
        nights: Number(raw.nights ?? 0),
        difficulty: raw.difficulty || raw.difficultyLevel || 'Moderate',
        difficultyLevel: raw.difficultyLevel || raw.difficulty || 'Moderate',
        rating: computedRating > 0 ? computedRating : Number(raw.rating ?? 0),
        category: raw.category || 'Himalayas',
        groupSize: Number(raw.groupSize ?? 1),
        group: raw.group || `${Number(raw.groupSize ?? 1)} travellers`,
        highlights: normalizeTripList(raw.highlights),
        inclusion: normalizeTripList(raw.inclusion),
        exclusion: normalizeTripList(raw.exclusion),
        itinerary: normalizeTripItinerary(raw.itinerary),
        reviews,
        isHidden: Boolean(raw.isHidden ?? legacyHidden),
        createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
        updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined,
      } as Trip;
    })
    .sort((a, b) => {
      const dateA = new Date(String(a.updatedAt || a.createdAt || 0)).getTime();
      const dateB = new Date(String(b.updatedAt || b.createdAt || 0)).getTime();
      return dateB - dateA;
    });
}

export async function saveTripReviewsToFirestore(
  tripId: string,
  reviews: TripReview[]
): Promise<TripReview[]> {
  const normalizedReviews = Array.isArray(reviews)
    ? reviews.filter((review) => Boolean(review?.description?.trim()))
    : [];

  if (!db || !tripId) {
    return normalizedReviews;
  }

  try {
    const nextRating = getTripAverageRating({ reviews: normalizedReviews });

    await setDoc(
      doc(db, 'trips', tripId),
      {
        reviews: normalizedReviews,
        rating: nextRating,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return normalizedReviews;
  } catch (error) {
    console.error('Failed to save trip reviews to Firestore:', error);
    return normalizedReviews;
  }
}

export async function saveTripVisibilityToFirestore(
  tripId: string,
  isHidden: boolean
): Promise<boolean> {
  if (!db || !tripId) {
    return isHidden;
  }

  try {
    await setDoc(
      doc(db, 'trips', tripId),
      {
        isHidden,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return isHidden;
  } catch (error) {
    console.error('Failed to update trip visibility:', error);
    return isHidden;
  }
}

export async function saveTripDocument(
  trip: Partial<Trip> & {
    title: string;
    place?: string;
    price?: number | string;
    days?: number;
    difficultyLevel?: string;
    groupSize?: number;
  }
): Promise<Trip> {
  if (!db) {
    throw new Error(
      'Firebase Firestore is not available. Trip data cannot be saved right now.'
    );
  }

  const tripId = trip.id || `trip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const placeName = trip.place || trip.location || 'India';
  const locationName = trip.location || trip.place || placeName;
  const imageArray = (Array.isArray(trip.images)
    ? trip.images
    : trip.image
      ? [trip.image]
      : [])
    .map((item) => resolveTripImage(String(item || '')))
    .filter(Boolean)
    .slice(0, 5);

  const normalizedItinerary = Array.isArray(trip.itinerary)
    ? normalizeTripItinerary(trip.itinerary)
    : normalizeTripItinerary([]);

  const reviews = Array.isArray(trip.reviews) ? trip.reviews : [];
  const calculatedRating = getTripAverageRating({
    rating: trip.rating,
    reviews,
  });

  const payload: Trip & { createdAt: string; updatedAt: string } = {
    id: tripId,
    title: trip.title.trim() || 'Untitled trip',
    description: trip.description || '',
    place: placeName,
    location: locationName,
    images: imageArray,
    image: resolveTripImage(String(trip.image || imageArray[0] || '')),
    price: Number(trip.price ?? 0),
    days: Number(trip.days ?? 0),
    nights: Number(trip.nights ?? 0),
    difficultyLevel: trip.difficultyLevel || trip.difficulty || 'Moderate',
    difficulty: trip.difficultyLevel || trip.difficulty || 'Moderate',
    rating: calculatedRating > 0 ? calculatedRating : Number(trip.rating ?? 0),
    category: trip.category || 'Himalayas',
    blurb: trip.blurb || trip.description || `${trip.title} in ${locationName}`,
    group: trip.group || `${Number(trip.groupSize ?? 1)} travellers`,
    groupSize: Number(trip.groupSize ?? 1),
    dates: trip.dates || `${Number(trip.days ?? 3)} Days`,
    highlights: normalizeTripList(trip.highlights).slice(0, 6),
    itinerary: normalizedItinerary,
    inclusion: normalizeTripList(trip.inclusion).slice(0, 6),
    exclusion: normalizeTripList(trip.exclusion).slice(0, 10),
    reviews,
    isHidden: Boolean(trip.isHidden),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(
    doc(db, 'trips', tripId),
    { ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
    { merge: true }
  );

  return payload as Trip;
}

export async function createContactMessage(
  input: {
    userId?: string;
    message: string;
    status?: 'new' | 'read' | 'replied';
  }
): Promise<{ id: string; userId: string; message: string; status: string; createdAt: string; updatedAt: string }> {
  if (!db) {
    throw new Error(
      'Firebase Firestore is not available. Your message could not be saved.'
    );
  }

  const userId = input.userId || auth?.currentUser?.uid || 'guest';
  const message = input.message.trim();

  if (!message) {
    throw new Error('Please write a message before sending it.');
  }

  const contactRef = doc(collection(db, 'contacts'));
  const payload = {
    id: contactRef.id,
    userId,
    message,
    status: input.status || 'new',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(contactRef, payload);

  return {
    ...payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as {
    id: string;
    userId: string;
    message: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
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
      ? normalized.travellers.map(
          (traveller) =>
            normalizeTravellerForFirestore(
              traveller as Partial<Traveller>
            )
        )
      : [];

  const payment = {
    paymentPersonName:
      normalized.payment?.paymentPersonName ||
      travellers[0]?.name ||
      'Traveller',
    upiIdOrBankAccountNumber:
      normalized.payment?.upiIdOrBankAccountNumber || '',
    contactNumber:
      normalized.payment?.contactNumber ||
      travellers[0]?.contactNumber ||
      '',
    timestamp: new Date().toISOString(),
  };

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
    payment,
    tripStartDate:
      normalized.tripStartDate ||
      new Date().toISOString(),
    tripEndDate:
      normalized.tripEndDate ||
      new Date(
        Date.now() +
          (Number(normalized.trip.days ?? 3) || 3) *
            24 * 60 * 60 * 1000
      ).toISOString(),
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