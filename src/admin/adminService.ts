import {
  collection,
  getDocs,
  type DocumentData,
} from 'firebase/firestore';
import type {
  Booking,
  ContactMessage,
  Trip,
  UserRecord,
} from '@/types/models';
import { db } from '@/services/firebase';

export type AdminDashboardData = {
  users: UserRecord[];
  bookings: Booking[];
  trips: Trip[];
  messages: ContactMessage[];
};

function timestampToString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    return (
      value as { toDate: () => Date }
    ).toDate().toISOString();
  }

  if (
    value &&
    typeof value === 'object' &&
    'toMillis' in value &&
    typeof (value as { toMillis?: unknown }).toMillis === 'function'
  ) {
    return new Date(
      (value as { toMillis: () => number }).toMillis()
    ).toISOString();
  }

  return undefined;
}

function normalizeUser(
  id: string,
  data: DocumentData
): UserRecord {
  return {
    id,
    name: String(data.name || ''),
    email: String(data.email || ''),
    mobile: String(data.mobile || ''),
    address: data.address,
    profileImageUrl: data.profileImageUrl,
    emergencyNumber: data.emergencyNumber,
    role: data.role,
    provider: data.provider,
    isActive: data.isActive,
    createdAt: timestampToString(data.createdAt),
    updatedAt: timestampToString(data.updatedAt),
  };
}

function normalizeBooking(
  id: string,
  data: DocumentData
): Booking {
  const people = Number(
    data.people ||
      data.numberOfPersons ||
      data.travellers?.length ||
      1
  );

  return {
    ...(data as Booking),
    id,
    userId: data.userId,
    tripId: data.tripId || data.trip?.id,
    trip: data.trip,
    people,
    numberOfPersons: people,
    travellers: Array.isArray(data.travellers)
      ? data.travellers
      : [],
    bookingStatus: data.bookingStatus,
    status: data.status,
    totalAmount: Number(data.totalAmount || 0),
    createdAt: timestampToString(data.createdAt),
    updatedAt: timestampToString(data.updatedAt),
    timestamp:
      timestampToString(data.timestamp) ||
      new Date().toISOString(),
  };
}

function normalizeMessage(
  id: string,
  data: DocumentData
): ContactMessage {
  return {
    id,
    userId: String(data.userId || ''),
    message: String(data.message || ''),
    status: data.status,
    createdAt: timestampToString(data.createdAt),
    updatedAt: timestampToString(data.updatedAt),
  };
}

async function getCollectionDocs<T>(
  collectionName: string,
  mapper: (id: string, data: DocumentData) => T
): Promise<T[]> {
  if (!db) {
    throw new Error(
      'Firebase Firestore is not configured.'
    );
  }

  const snapshot = await getDocs(
    collection(db, collectionName)
  );

  return snapshot.docs.map((item) =>
    mapper(item.id, item.data())
  );
}

export async function getAdminUsers(): Promise<UserRecord[]> {
  return getCollectionDocs('users', normalizeUser);
}

export async function getAdminBookings(): Promise<Booking[]> {
  const bookings = await getCollectionDocs(
    'bookings',
    normalizeBooking
  );

  return bookings.sort((a, b) => {
    const aDate = new Date(
      a.createdAt || a.timestamp
    ).getTime();

    const bDate = new Date(
      b.createdAt || b.timestamp
    ).getTime();

    return bDate - aDate;
  });
}

export async function getAdminMessages(): Promise<ContactMessage[]> {
  const messages = await getCollectionDocs(
    'contacts',
    normalizeMessage
  );

  return messages.sort((a, b) => {
    const aDate = new Date(
      a.createdAt || ''
    ).getTime();

    const bDate = new Date(
      b.createdAt || ''
    ).getTime();

    return bDate - aDate;
  });
}

export async function getAdminTrips(): Promise<Trip[]> {
  if (!db) {
    return [];
  }

  try {
    const firestoreTrips = await getCollectionDocs(
      'trips',
      (id, data) =>
        ({
          id,
          ...data,
        }) as Trip
    );

    return firestoreTrips;
  } catch (error) {
    console.warn(
      'Firestore trips could not be loaded for the admin panel.',
      error
    );

    return [];
  }
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const [
    users,
    bookings,
    trips,
    messages,
  ] = await Promise.all([
    getAdminUsers(),
    getAdminBookings(),
    getAdminTrips(),
    getAdminMessages(),
  ]);

  return {
    users,
    bookings,
    trips,
    messages,
  };
}