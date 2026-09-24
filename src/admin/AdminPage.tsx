import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  getTripAverageRating,
  type Booking,
  type ContactMessage,
  type Trip,
  type TripReview,
  type UserRecord,
} from '@/types/models';
import { auth, db } from '@/services/firebase';
import {
  saveTripDocument,
  saveTripReviewsToFirestore,
  saveTripVisibilityToFirestore,
} from '@/services/storage';
import { getAdminDashboardData, type AdminDashboardData } from './adminService';
import './admin.css';

type AdminPageKey =
  | 'dashboard'
  | 'users'
  | 'bookings'
  | 'trips'
  | 'payments'
  | 'messages'
  | 'analytics'
  | 'settings';

const navItems: Array<{
  key: AdminPageKey;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'bookings', label: 'Bookings', icon: BookOpen },
  { key: 'trips', label: 'Trips', icon: Map },
  { key: 'payments', label: 'Payments', icon: CircleDollarSign },
  { key: 'messages', label: 'Messages', icon: MessageSquare },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'settings', label: 'Settings', icon: Settings },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function bookingStatus(booking: Booking) {
  return booking.bookingStatus ?? (booking.status || 'confirmed').toLowerCase();
}

function getUserName(user?: UserRecord | null) {
  return user?.name?.trim() || 'Admin';
}

function MetricCard({
  title,
  value,
  note,
  icon: Icon,
}: {
  title: string;
  value: string;
  note: string;
  icon: typeof Users;
}) {
  return (
    <div className="admin-card admin-metric-card">
      <div className="admin-metric-icon">
        <Icon size={19} />
      </div>
      <div className="admin-metric-copy">
        <p>{title}</p>
        <strong>{value}</strong>
        <span>{note}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  const className =
    normalized.includes('cancel')
      ? 'admin-badge admin-badge-danger'
      : normalized.includes('pending')
        ? 'admin-badge admin-badge-warning'
        : normalized.includes('complete')
          ? 'admin-badge admin-badge-info'
          : 'admin-badge admin-badge-success';

  return <span className={className}>{status}</span>;
}

type TripDraft = {
  id?: string;
  title: string;
  description: string;
  blurb: string;
  place: string;
  location: string;
  category: string;
  difficulty: string;
  days: string;
  nights: string;
  price: string;
  rating: string;
  groupSize: string;
  dates: string;
  image: string;
  galleryImages: string[];
  itinerary: string[];
  highlights: string[];
  inclusion: string[];
  exclusion: string[];
};

function createEmptyTripDraft(): TripDraft {
  return {
    title: '',
    description: '',
    blurb: '',
    place: '',
    location: '',
    category: 'Himalayas',
    difficulty: 'Moderate',
    days: '3',
    nights: '2',
    price: '6999',
    rating: '4.8',
    groupSize: '8',
    dates: '',
    image: '',
    galleryImages: [''],
    itinerary: [''],
    highlights: [''],
    inclusion: [''],
    exclusion: [''],
  };
}

function ensureListValues(values?: unknown): string[] {
  if (Array.isArray(values)) {
    const cleaned = values.map((value) => String(value ?? '').trim()).filter(Boolean);
    return cleaned.length ? cleaned : [''];
  }

  if (typeof values === 'string') {
    const cleaned = values
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
    return cleaned.length ? cleaned : [''];
  }

  return [''];
}

function toList(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function addListItem(current: string[]) {
  return [...current, ''];
}

function updateListItem(current: string[], index: number, value: string) {
  const next = [...current];
  next[index] = value;
  return next;
}

function removeListItem(current: string[], index: number) {
  const next = current.filter((_, itemIndex) => itemIndex !== index);
  return next.length ? next : [''];
}

function FieldHeaderWithAdd({
  title,
  onAdd,
}: {
  title: string;
  onAdd?: () => void;
}) {
  return (
    <div className="admin-trip-form-label-header">
      <span>{title}</span>
      {onAdd && (
        <button
          type="button"
          className="admin-trip-form-add-button"
          onClick={onAdd}
          aria-label={`Add more ${title.toLowerCase()}`}
          title={`Add another ${title.toLowerCase()}`}
        >
          <Plus size={12} />
        </button>
      )}
    </div>
  );
}

export function AdminPage() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState<AdminPageKey>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState('');
  const [dataError, setDataError] = useState('');
  const [currentAdmin, setCurrentAdmin] = useState<UserRecord | null>(null);
  const [tripFormOpen, setTripFormOpen] = useState(false);
  const [tripDraft, setTripDraft] = useState<TripDraft>(createEmptyTripDraft());
  const [reviewManagerTripId, setReviewManagerTripId] = useState<string | null>(null);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, string>>({});
  const [data, setData] = useState<AdminDashboardData>({
    users: [],
    bookings: [],
    trips: [],
    messages: [],
  });

  useEffect(() => {
    let active = true;

    if (!auth) {
      setLoading(false);
      setAccessError('Firebase Authentication is not available. Check your Firebase configuration.');
      return () => {
        active = false;
      };
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!active) return;

      if (!firebaseUser) {
        setLoading(false);
        setAccessError('Please log in with an admin account to continue.');
        setLocation('/login');
        return;
      }

      if (!db) {
        setLoading(false);
        setAccessError('Firebase Firestore is not available. Check your Firebase configuration.');
        return;
      }

      try {
        setLoading(true);
        setAccessError('');
        setDataError('');

        const userSnapshot = await getDoc(doc(db, 'users', firebaseUser.uid));

        if (!userSnapshot.exists()) {
          throw new Error('Your user profile was not found in Firestore.');
        }

        const profile = {
          id: userSnapshot.id,
          ...userSnapshot.data(),
        } as UserRecord;

        if (!active) return;

        setCurrentAdmin(profile);

        try {
          const dashboardData = await getAdminDashboardData();
          if (active) setData(dashboardData);
        } catch (error) {
          console.error('Failed to load admin data.', error);
          if (active) {
            setDataError(
              error instanceof Error
                ? error.message
                : 'Some admin data could not be loaded.'
            );
          }
        }
      } catch (error) {
        console.error('Admin access check failed.', error);
        if (active) {
          setAccessError(
            error instanceof Error
              ? error.message
              : 'Unable to verify admin access.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [setLocation]);

  const stats = useMemo(() => {
    const bookings = data.bookings;
    const cancelled = bookings.filter(
      (item) => bookingStatus(item) === 'cancelled'
    ).length;
    const pending = bookings.filter(
      (item) => bookingStatus(item) === 'pending'
    ).length;
    const revenue = bookings
      .filter((item) => bookingStatus(item) !== 'cancelled')
      .reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);

    return {
      users: data.users.length,
      bookings: bookings.length,
      revenue,
      trips: data.trips.length,
      pending,
      cancelled,
      messages: data.messages.filter((item) => item.status === 'new').length,
    };
  }, [data]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data.users;
    return data.users.filter((user) =>
      [user.name, user.email, user.mobile].some((value) =>
        String(value || '').toLowerCase().includes(q)
      )
    );
  }, [data.users, search]);

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data.bookings;
    return data.bookings.filter((booking) =>
      [
        booking.id,
        booking.trip?.title,
        booking.userId,
        booking.status,
        booking.bookingStatus,
      ].some((value) => String(value || '').toLowerCase().includes(q))
    );
  }, [data.bookings, search]);

  const filteredTrips = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data.trips;
    return data.trips.filter((trip) =>
      [trip.title, trip.place, trip.location, trip.category].some((value) =>
        String(value || '').toLowerCase().includes(q)
      )
    );
  }, [data.trips, search]);

  const filteredMessages = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data.messages;
    return data.messages.filter((message) => {
      const sender = data.users.find((user) => user.id === message.userId);
      return [
        message.message,
        message.userId,
        sender?.name,
        sender?.gender,
        sender?.age,
        message.status,
      ].some((value) => String(value || '').toLowerCase().includes(q));
    });
  }, [data.messages, data.users, search]);

  const openTripForm = (trip?: Trip) => {
    if (trip) {
      const tripImages = Array.isArray(trip.images)
        ? trip.images
        : typeof trip.image === 'string' && trip.image
          ? [trip.image]
          : [];

      const tripItinerary = Array.isArray(trip.itinerary) ? trip.itinerary : [];

      setTripDraft({
        id: trip.id,
        title: trip.title || '',
        description: trip.description || '',
        blurb: trip.blurb || trip.description || '',
        place: trip.place || trip.location || '',
        location: trip.location || trip.place || '',
        category: trip.category || 'Himalayas',
        difficulty: trip.difficulty || trip.difficultyLevel || 'Moderate',
        days: String(trip.days ?? 3),
        nights: String(trip.nights ?? 2),
        price: String(trip.price ?? 0),
        rating: String(getTripAverageRating(trip) || 0),
        groupSize: String(trip.groupSize ?? 1),
        dates: trip.dates || '',
        image: trip.image || tripImages[0] || '',
        galleryImages: ensureListValues(tripImages),
        itinerary: ensureListValues(
          tripItinerary.map((item) => {
            if (typeof item === 'string') {
              return item;
            }

            if (item && typeof item === 'object') {
              const itineraryEntry = item as Partial<Record<string, string>>;
              if (itineraryEntry.departure) {
                return `${itineraryEntry.departure} | ${itineraryEntry.destination || 'Destination'} | ${itineraryEntry.description || ''}`;
              }

              return itineraryEntry.description || '';
            }

            return '';
          })
        ),
        highlights: ensureListValues(trip.highlights),
        inclusion: ensureListValues(trip.inclusion),
        exclusion: ensureListValues(trip.exclusion),
      });
    } else {
      setTripDraft(createEmptyTripDraft());
    }

    setTripFormOpen(true);
  };

  const updateTripReviewState = (tripId: string, nextReviews: TripReview[]) => {
    setData((current) => ({
      ...current,
      trips: current.trips.map((trip) =>
        trip.id === tripId
          ? {
              ...trip,
              reviews: nextReviews,
              rating: getTripAverageRating({ ...trip, reviews: nextReviews }),
            }
          : trip
      ),
    }));
  };

  const handleTripVisibilityToggle = async (trip: Trip) => {
    const nextHidden = !Boolean(trip.isHidden);
    const confirmationText = nextHidden
      ? `Are you sure you want to hide “${trip.title}” from the public trips page?`
      : `Are you sure you want to show “${trip.title}” to users again?`;

    if (!window.confirm(confirmationText)) {
      return;
    }

    setData((current) => ({
      ...current,
      trips: current.trips.map((item) =>
        item.id === trip.id ? { ...item, isHidden: nextHidden } : item
      ),
    }));

    await saveTripVisibilityToFirestore(trip.id, nextHidden);
  };

  const handleReviewDelete = async (tripId: string, reviewIndex: number) => {
    const trip = data.trips.find((item) => item.id === tripId);
    const nextReviews = (trip?.reviews || []).filter((_, index) => index !== reviewIndex);

    if (!trip) {
      return;
    }

    updateTripReviewState(tripId, nextReviews);
    await saveTripReviewsToFirestore(tripId, nextReviews);
  };

  const handleReviewSave = async (tripId: string, reviewIndex: number) => {
    const trip = data.trips.find((item) => item.id === tripId);
    if (!trip) {
      return;
    }

    const key = `${tripId}-${reviewIndex}`;
    const nextValue = (reviewDrafts[key] ?? '').trim();
    if (!nextValue) {
      return;
    }

    const nextReviews = [...(trip.reviews || [])];
    nextReviews[reviewIndex] = {
      ...nextReviews[reviewIndex],
      description: nextValue,
    };

    updateTripReviewState(tripId, nextReviews);
    setReviewDrafts((current) => ({ ...current, [key]: '' }));
    await saveTripReviewsToFirestore(tripId, nextReviews);
  };

  const closeTripForm = () => {
    setTripFormOpen(false);
    setTripDraft(createEmptyTripDraft());
  };

  async function handleTripSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!tripDraft.title.trim()) {
      setDataError('A trip title is required before saving.');
      return;
    }

    try {
      const galleryImages = tripDraft.galleryImages
        .map((item) => item.trim())
        .filter(Boolean);
      const highlights = tripDraft.highlights
        .map((item) => item.trim())
        .filter(Boolean);
      const inclusion = tripDraft.inclusion
        .map((item) => item.trim())
        .filter(Boolean);
      const exclusion = tripDraft.exclusion
        .map((item) => item.trim())
        .filter(Boolean);
      const itineraryEntries = tripDraft.itinerary
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => {
          const segments = entry.split('|').map((item) => item.trim());
          if (segments.length >= 3) {
            return {
              departure: segments[0],
              destination: segments[1],
              description: segments[2],
              imageUrl: segments[3] || '',
            };
          }

          const match = entry.match(/^\s*(?:Day\s*)?(\d+)\s*[:\-]?\s*(.*)$/i);
          return {
            departure: match ? `Day ${match[1]}` : 'Day 1',
            destination: 'Destination',
            description: match ? match[2].trim() : entry,
            imageUrl: '',
          };
        });

      const savedTrip = await saveTripDocument({
        id: tripDraft.id,
        title: tripDraft.title,
        description: tripDraft.description,
        blurb: tripDraft.blurb || tripDraft.description,
        place: tripDraft.place || tripDraft.location || 'India',
        location: tripDraft.location || tripDraft.place || 'India',
        category: tripDraft.category || 'Himalayas',
        difficulty: tripDraft.difficulty || 'Moderate',
        difficultyLevel: tripDraft.difficulty || 'Moderate',
        days: Number(tripDraft.days) || 3,
        nights: Number(tripDraft.nights) || 2,
        price: Number(tripDraft.price) || 0,
        rating: Number(tripDraft.rating) || 0,
        groupSize: Number(tripDraft.groupSize) || 8,
        dates: tripDraft.dates || `${Number(tripDraft.days) || 3} Days`,
        image: tripDraft.image,
        images: galleryImages.length ? galleryImages : tripDraft.image ? [tripDraft.image] : [],
        highlights,
        itinerary: itineraryEntries,
        inclusion,
        exclusion,
      });

      setData((current) => {
        const exists = current.trips.some((trip) => trip.id === savedTrip.id);
        const trips = exists
          ? current.trips.map((trip) => (trip.id === savedTrip.id ? savedTrip : trip))
          : [savedTrip, ...current.trips];

        return {
          ...current,
          trips,
        };
      });

      closeTripForm();
      setDataError('');
    } catch (error) {
      console.error('Trip save failed.', error);
      setDataError(
        error instanceof Error ? error.message : 'Unable to save the trip right now.'
      );
    }
  }

  async function logout() {
    if (!auth) {
      setLocation('/login');
      return;
    }

    try {
      await signOut(auth);
    } finally {
      setLocation('/login');
    }
  }

  function renderPage() {
    if (page === 'users') {
      return (
        <section className="admin-section-card">
          <SectionHeader title="Users" subtitle="All traveller and admin profiles stored in Firestore." />
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td><strong>{user.name || 'Unnamed user'}</strong></td>
                    <td>{user.email || '—'}</td>
                    <td>{user.mobile || '—'}</td>
                    <td><StatusBadge status={user.role || 'traveller'} /></td>
                    <td>{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!filteredUsers.length && <EmptyState text="No users match your search." />}
        </section>
      );
    }

    if (page === 'bookings') {
      return (
        <section className="admin-section-card">
          <SectionHeader title="Bookings" subtitle="Booking records connected to the existing booking flow." />
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Trip</th>
                  <th>Travellers</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td><strong>{booking.id.slice(0, 14)}…</strong></td>
                    <td>{booking.trip?.title || booking.tripId || '—'}</td>
                    <td>{booking.numberOfPersons ?? booking.people ?? booking.travellers?.length ?? 1}</td>
                    <td>{formatCurrency(Number(booking.totalAmount || 0))}</td>
                    <td><StatusBadge status={booking.status || booking.bookingStatus || 'Confirmed'} /></td>
                    <td>{formatDate(booking.createdAt || booking.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!filteredBookings.length && <EmptyState text="No bookings match your search." />}
        </section>
      );
    }

    if (page === 'trips') {
      return (
        <section className="admin-section-card">
          <SectionHeader
            title="Trips"
            subtitle="Create, edit, and publish trips for the public trips listing."
          />

          <div className="admin-trip-toolbar">
            <button type="button" className="admin-primary-button" onClick={() => openTripForm()}>
              <Plus size={15} /> Add new trip
            </button>
          </div>

          {tripFormOpen && (
            <form className="admin-trip-form" onSubmit={handleTripSubmit}>
              <div className="admin-trip-form-grid">
                <label>
                  <span>Trip title</span>
                  <input
                    value={tripDraft.title}
                    onChange={(event) =>
                      setTripDraft((current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder="Bir Billing Weekend"
                    required
                  />
                </label>

                <label>
                  <span>Location</span>
                  <input
                    value={tripDraft.location}
                    onChange={(event) =>
                      setTripDraft((current) => ({ ...current, location: event.target.value }))
                    }
                    placeholder="Himachal Pradesh"
                  />
                </label>

                <label>
                  <span>Place</span>
                  <input
                    value={tripDraft.place}
                    onChange={(event) =>
                      setTripDraft((current) => ({ ...current, place: event.target.value }))
                    }
                    placeholder="Bir village"
                  />
                </label>

                <label>
                  <span>Category</span>
                  <select
                    value={tripDraft.category}
                    onChange={(event) =>
                      setTripDraft((current) => ({ ...current, category: event.target.value }))
                    }
                  >
                    <option>Himalayas</option>
                    <option>Devotional</option>
                    <option>Weekend getaway</option>
                    <option>International</option>
                  </select>
                </label>

                <label>
                  <span>Difficulty</span>
                  <select
                    value={tripDraft.difficulty}
                    onChange={(event) =>
                      setTripDraft((current) => ({ ...current, difficulty: event.target.value }))
                    }
                  >
                    <option>Easy</option>
                    <option>Moderate</option>
                    <option>Challenging</option>
                  </select>
                </label>

                <label>
                  <span>Price (₹)</span>
                  <input
                    type="number"
                    min="0"
                    value={tripDraft.price}
                    onChange={(event) =>
                      setTripDraft((current) => ({ ...current, price: event.target.value }))
                    }
                  />
                </label>

                <label>
                  <span>Days</span>
                  <input
                    type="number"
                    min="1"
                    value={tripDraft.days}
                    onChange={(event) =>
                      setTripDraft((current) => ({ ...current, days: event.target.value }))
                    }
                  />
                </label>

                <label>
                  <span>Nights</span>
                  <input
                    type="number"
                    min="0"
                    value={tripDraft.nights}
                    onChange={(event) =>
                      setTripDraft((current) => ({ ...current, nights: event.target.value }))
                    }
                  />
                </label>

                <label>
                  <span>Rating</span>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={tripDraft.rating}
                    onChange={(event) =>
                      setTripDraft((current) => ({ ...current, rating: event.target.value }))
                    }
                  />
                </label>

                <label>
                  <span>Group size</span>
                  <input
                    type="number"
                    min="1"
                    value={tripDraft.groupSize}
                    onChange={(event) =>
                      setTripDraft((current) => ({ ...current, groupSize: event.target.value }))
                    }
                  />
                </label>

                <label className="admin-trip-form-span-2">
                  <span>Primary image URL or local asset</span>
                  <input
                    value={tripDraft.image}
                    onChange={(event) =>
                      setTripDraft((current) => ({ ...current, image: event.target.value }))
                    }
                    placeholder="https://... or alpine-hero.jpg or /src/assets/alpine-hero.jpg"
                  />
                </label>

                <label className="admin-trip-form-span-2">
                  <FieldHeaderWithAdd
                    title="Gallery image URLs"
                    onAdd={() =>
                      setTripDraft((current) => ({
                        ...current,
                        galleryImages: addListItem(current.galleryImages),
                      }))
                    }
                  />
                  <div className="admin-trip-form-list">
                    {tripDraft.galleryImages.map((item, index) => (
                      <div className="admin-trip-form-list-item" key={`gallery-${index}`}>
                        <input
                          value={item}
                          onChange={(event) =>
                            setTripDraft((current) => ({
                              ...current,
                              galleryImages: updateListItem(current.galleryImages, index, event.target.value),
                            }))
                          }
                          placeholder="https://... or /src/assets/your-image.jpg"
                        />
                        {tripDraft.galleryImages.length > 1 && (
                          <button
                            type="button"
                            className="admin-trip-form-remove-button"
                            onClick={() =>
                              setTripDraft((current) => ({
                                ...current,
                                galleryImages: removeListItem(current.galleryImages, index),
                              }))
                            }
                            aria-label="Remove gallery image"
                            title="Remove image"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </label>

                <label className="admin-trip-form-span-2">
                  <span>Short summary</span>
                  <textarea
                    rows={2}
                    value={tripDraft.blurb}
                    onChange={(event) =>
                      setTripDraft((current) => ({ ...current, blurb: event.target.value }))
                    }
                    placeholder="Short trip summary shown on cards..."
                  />
                </label>

                <label className="admin-trip-form-span-2">
                  <span>Dates</span>
                  <input
                    value={tripDraft.dates}
                    onChange={(event) =>
                      setTripDraft((current) => ({ ...current, dates: event.target.value }))
                    }
                    placeholder="20 Sep – 22 Sep 2026"
                  />
                </label>

                <label className="admin-trip-form-span-2">
                  <span>Description</span>
                  <textarea
                    rows={3}
                    value={tripDraft.description}
                    onChange={(event) =>
                      setTripDraft((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="Describe the trip experience..."
                  />
                </label>

                <label className="admin-trip-form-span-2">
                  <FieldHeaderWithAdd
                    title="Itinerary"
                    onAdd={() =>
                      setTripDraft((current) => ({
                        ...current,
                        itinerary: addListItem(current.itinerary),
                      }))
                    }
                  />
                  <div className="admin-trip-form-list">
                    {tripDraft.itinerary.map((item, index) => (
                      <div className="admin-trip-form-list-item" key={`itinerary-${index}`}>
                        <textarea
                          rows={2}
                          value={item}
                          onChange={(event) =>
                            setTripDraft((current) => ({
                              ...current,
                              itinerary: updateListItem(current.itinerary, index, event.target.value),
                            }))
                          }
                          placeholder="Day 1 | Arrival | Bir | Check-in and welcome meal"
                        />
                        {tripDraft.itinerary.length > 1 && (
                          <button
                            type="button"
                            className="admin-trip-form-remove-button"
                            onClick={() =>
                              setTripDraft((current) => ({
                                ...current,
                                itinerary: removeListItem(current.itinerary, index),
                              }))
                            }
                            aria-label="Remove itinerary item"
                            title="Remove item"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </label>

                <label className="admin-trip-form-span-2">
                  <FieldHeaderWithAdd
                    title="Highlights"
                    onAdd={() =>
                      setTripDraft((current) => ({
                        ...current,
                        highlights: addListItem(current.highlights),
                      }))
                    }
                  />
                  <div className="admin-trip-form-list">
                    {tripDraft.highlights.map((item, index) => (
                      <div className="admin-trip-form-list-item" key={`highlight-${index}`}>
                        <input
                          value={item}
                          onChange={(event) =>
                            setTripDraft((current) => ({
                              ...current,
                              highlights: updateListItem(current.highlights, index, event.target.value),
                            }))
                          }
                          placeholder="Waterfall trek"
                        />
                        {tripDraft.highlights.length > 1 && (
                          <button
                            type="button"
                            className="admin-trip-form-remove-button"
                            onClick={() =>
                              setTripDraft((current) => ({
                                ...current,
                                highlights: removeListItem(current.highlights, index),
                              }))
                            }
                            aria-label="Remove highlight"
                            title="Remove highlight"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </label>

                <label className="admin-trip-form-span-2">
                  <FieldHeaderWithAdd
                    title="Includes"
                    onAdd={() =>
                      setTripDraft((current) => ({
                        ...current,
                        inclusion: addListItem(current.inclusion),
                      }))
                    }
                  />
                  <div className="admin-trip-form-list">
                    {tripDraft.inclusion.map((item, index) => (
                      <div className="admin-trip-form-list-item" key={`inclusion-${index}`}>
                        <input
                          value={item}
                          onChange={(event) =>
                            setTripDraft((current) => ({
                              ...current,
                              inclusion: updateListItem(current.inclusion, index, event.target.value),
                            }))
                          }
                          placeholder="Stay, meals, local guide"
                        />
                        {tripDraft.inclusion.length > 1 && (
                          <button
                            type="button"
                            className="admin-trip-form-remove-button"
                            onClick={() =>
                              setTripDraft((current) => ({
                                ...current,
                                inclusion: removeListItem(current.inclusion, index),
                              }))
                            }
                            aria-label="Remove included item"
                            title="Remove item"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </label>

                <label className="admin-trip-form-span-2">
                  <FieldHeaderWithAdd
                    title="Excludes"
                    onAdd={() =>
                      setTripDraft((current) => ({
                        ...current,
                        exclusion: addListItem(current.exclusion),
                      }))
                    }
                  />
                  <div className="admin-trip-form-list">
                    {tripDraft.exclusion.map((item, index) => (
                      <div className="admin-trip-form-list-item" key={`exclusion-${index}`}>
                        <input
                          value={item}
                          onChange={(event) =>
                            setTripDraft((current) => ({
                              ...current,
                              exclusion: updateListItem(current.exclusion, index, event.target.value),
                            }))
                          }
                          placeholder="Flights, personal expenses, insurance"
                        />
                        {tripDraft.exclusion.length > 1 && (
                          <button
                            type="button"
                            className="admin-trip-form-remove-button"
                            onClick={() =>
                              setTripDraft((current) => ({
                                ...current,
                                exclusion: removeListItem(current.exclusion, index),
                              }))
                            }
                            aria-label="Remove excluded item"
                            title="Remove item"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </label>
              </div>

              <div className="admin-trip-form-actions">
                <button type="button" className="admin-secondary-button" onClick={closeTripForm}>
                  Cancel
                </button>
                <button type="submit" className="admin-primary-button">
                  {tripDraft.id ? 'Save trip' : 'Create trip'}
                </button>
              </div>
            </form>
          )}

          {(() => {
            const activeReviewTrip = data.trips.find((trip) => trip.id === reviewManagerTripId) ?? null;

            return (
              <>
                <div className="admin-trip-grid">
                  <button type="button" className="admin-trip-add-card" onClick={() => openTripForm()}>
                    <span className="admin-trip-add-icon">+</span>
                    <span>Add new trip</span>
                  </button>

                  {filteredTrips.map((trip) => (
                    <article key={trip.id} className="admin-trip-card">
                      <div
                        className="admin-trip-image"
                        style={{
                          backgroundImage: `url(${trip.image || trip.images?.[0] || ''})`,
                        }}
                      />
                      <div className="admin-trip-content">
                        <div>
                          <p className="admin-eyebrow">{trip.category || trip.difficulty || 'Trip'}</p>
                          <h3>{trip.title}</h3>
                          <p>{trip.location || trip.place || 'Destination not specified'}</p>
                        </div>

                        <div className="admin-trip-meta-row">
                          <strong className="admin-trip-price">{formatCurrency(Number(trip.price || 0))}</strong>
                          <div className="admin-trip-card-actions">
                            <button
                              type="button"
                              className="admin-ghost-button"
                              onClick={() => handleTripVisibilityToggle(trip)}
                            >
                              {trip.isHidden ? 'Show' : 'Hide'}
                            </button>
                            <button
                              type="button"
                              className="admin-ghost-button"
                              onClick={() => setReviewManagerTripId((current) => current === trip.id ? null : trip.id)}
                            >
                              Reviews
                            </button>
                            <button type="button" className="admin-ghost-button" onClick={() => openTripForm(trip)}>
                              <Pencil size={12} /> Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {activeReviewTrip && (
                  <div className="admin-review-modal-backdrop" onClick={() => setReviewManagerTripId(null)}>
                    <div className="admin-review-modal" onClick={(event) => event.stopPropagation()}>
                      <div className="admin-review-modal-header">
                        <div>
                          <span className="admin-eyebrow">Trip reviews</span>
                          <h3>{activeReviewTrip.title}</h3>
                        </div>
                        <button type="button" className="admin-icon-button admin-review-close" onClick={() => setReviewManagerTripId(null)} aria-label="Close reviews">
                          <X size={14} />
                        </button>
                      </div>

                      <div className="admin-review-modal-summary">
                        <strong>{getTripAverageRating(activeReviewTrip) > 0 ? getTripAverageRating(activeReviewTrip).toFixed(1) : 'No rating'}</strong>
                        <span>{(activeReviewTrip.reviews || []).length} review{(activeReviewTrip.reviews || []).length === 1 ? '' : 's'}</span>
                      </div>

                      <div className="admin-review-list">
                        {(activeReviewTrip.reviews || []).length ? (
                          (activeReviewTrip.reviews || []).map((review, reviewIndex) => {
                            const key = `${activeReviewTrip.id}-${reviewIndex}`;
                            const isEditing = Boolean(reviewDrafts[key]);

                            return (
                              <div key={key} className="admin-review-item">
                                <div className="admin-review-item-top">
                                  <strong>{review.userName || 'Traveller'}</strong>
                                  <span>{review.rating}/5</span>
                                </div>

                                {isEditing ? (
                                  <>
                                    <textarea
                                      value={reviewDrafts[key] ?? review.description}
                                      rows={4}
                                      onChange={(event) =>
                                        setReviewDrafts((current) => ({
                                          ...current,
                                          [key]: event.target.value,
                                        }))
                                      }
                                    />
                                    <div className="admin-review-actions">
                                      <button type="button" className="admin-secondary-button" onClick={() => setReviewDrafts((current) => ({ ...current, [key]: '' }))}>Cancel</button>
                                      <button type="button" className="admin-primary-button" onClick={() => handleReviewSave(activeReviewTrip.id, reviewIndex)}>Save</button>
                                    </div>
                                  </>
                                ) : (
                                  <p>{review.description}</p>
                                )}

                                {!isEditing && (
                                  <div className="admin-review-actions">
                                    <button
                                      type="button"
                                      className="admin-ghost-button"
                                      onClick={() =>
                                        setReviewDrafts((current) => ({
                                          ...current,
                                          [key]: review.description,
                                        }))
                                      }
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="admin-ghost-button"
                                      onClick={() => {
                                        if (window.confirm('Are you sure you want to delete this review?')) {
                                          void handleReviewDelete(activeReviewTrip.id, reviewIndex);
                                        }
                                      }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="admin-review-empty">No reviews yet for this trip.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}


          {!filteredTrips.length && !tripFormOpen && (
            <EmptyState text="No trips match your search. Add a new trip to get started." />
          )}
        </section>
      );
    }

    if (page === 'payments') {
      const payments = data.bookings
        .filter((booking) => booking.bookingStatus !== 'cancelled')
        .sort(
          (a, b) =>
            new Date(b.createdAt || b.timestamp).getTime() -
            new Date(a.createdAt || a.timestamp).getTime()
        );

      return (
        <section className="admin-section-card">
          <SectionHeader
            title="Payments"
            subtitle="Revenue is currently derived from booking totalAmount records."
          />
          <div className="admin-payment-summary">
            <div>
              <span>Total recorded revenue</span>
              <strong>{formatCurrency(stats.revenue)}</strong>
            </div>
            <div>
              <span>Payment-linked bookings</span>
              <strong>{payments.length}</strong>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Trip</th>
                  <th>Amount</th>
                  <th>Payment person</th>
                  <th>Recorded</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.id.slice(0, 14)}…</td>
                    <td>{booking.trip?.title || booking.tripId || '—'}</td>
                    <td>{formatCurrency(Number(booking.totalAmount || 0))}</td>
                    <td>{booking.payment?.paymentPersonName || '—'}</td>
                    <td>{formatDate(booking.createdAt || booking.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    if (page === 'messages') {
      return (
        <section className="admin-section-card">
          <SectionHeader title="Messages" subtitle="Messages from the existing contacts collection." />
          <div className="admin-message-list">
            {filteredMessages.map((message) => {
              const sender = data.users.find((user) => user.id === message.userId);
              const senderName = sender?.name || 'Unknown user';
              const senderGender = sender?.gender || 'Gender not shared';
              const senderAge = sender?.age ? `${sender.age} yrs` : 'Age not shared';

              return (
                <article key={message.id} className="admin-message-card">
                  <div className="admin-message-icon"><MessageSquare size={17} /></div>
                  <div className="admin-message-content">
                    <div className="admin-message-top">
                      <strong>{senderName}</strong>
                      <StatusBadge status={message.status || 'new'} />
                    </div>
                    <div className="admin-message-meta">
                      <span>{senderGender}</span>
                      <span>{senderAge}</span>
                    </div>
                    <p>{message.message}</p>
                    <span>{formatDate(message.createdAt)}</span>
                  </div>
                </article>
              );
            })}
          </div>
          {!filteredMessages.length && <EmptyState text="No messages match your search." />}
        </section>
      );
    }

    if (page === 'analytics') {
      return <AnalyticsView bookings={data.bookings} trips={data.trips} />;
    }

    if (page === 'settings') {
      return (
        <section className="admin-section-card">
          <SectionHeader title="Settings" subtitle="Admin account and integration information." />
          <div className="admin-settings-grid">
            <div className="admin-setting">
              <ShieldCheck size={19} />
              <div>
                <strong>Admin access</strong>
                <p>Verified from users/{currentAdmin?.id} using the role field.</p>
              </div>
            </div>
            <div className="admin-setting">
              <Activity size={19} />
              <div>
                <strong>Data source</strong>
                <p>Firebase Authentication + Firestore.</p>
              </div>
            </div>
            <div className="admin-setting">
              <CircleDollarSign size={19} />
              <div>
                <strong>Payments</strong>
                <p>Currently calculated from confirmed booking totalAmount values.</p>
              </div>
            </div>
          </div>
        </section>
      );
    }

    return (
      <>
        <section className="admin-welcome">
          <div>
            <p className="admin-eyebrow">Travel with Trails · Admin Panel</p>
            <h2>Good morning, {getUserName(currentAdmin)}!</h2>
            <p>Here’s what’s happening with your travel community today.</p>
          </div>
          <div className="admin-welcome-art">
            <Map size={74} strokeWidth={1.2} />
          </div>
        </section>

        <section className="admin-metric-grid">
          <MetricCard title="Total Users" value={String(stats.users)} note="Firestore user profiles" icon={Users} />
          <MetricCard title="Total Bookings" value={String(stats.bookings)} note="All booking records" icon={BookOpen} />
          <MetricCard title="Total Revenue" value={formatCurrency(stats.revenue)} note="From booking totals" icon={CircleDollarSign} />
          <MetricCard title="Active Trips" value={String(stats.trips)} note="Available trip records" icon={Map} />
          <MetricCard title="Pending Bookings" value={String(stats.pending)} note="Require attention" icon={CalendarDays} />
          <MetricCard title="Cancelled" value={String(stats.cancelled)} note="Cancelled bookings" icon={X} />
          <MetricCard title="New Messages" value={String(stats.messages)} note="Unread/new contacts" icon={MessageSquare} />
        </section>

        <section className="admin-dashboard-grid">
          <RevenueCard bookings={data.bookings} />
          <TripPopularity trips={data.trips} bookings={data.bookings} />
        </section>

        <section className="admin-section-card">
          <SectionHeader title="Recent Bookings" subtitle="Latest records from the booking collection." />
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Trip</th>
                  <th>Travellers</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.bookings.slice(0, 6).map((booking) => (
                  <tr key={booking.id}>
                    <td><strong>{booking.trip?.title || booking.tripId || 'Unknown trip'}</strong></td>
                    <td>{booking.numberOfPersons ?? booking.people ?? 1}</td>
                    <td>{formatCurrency(Number(booking.totalAmount || 0))}</td>
                    <td><StatusBadge status={booking.status || booking.bookingStatus || 'Confirmed'} /></td>
                    <td>{formatDate(booking.createdAt || booking.timestamp)}</td>
                    <td><ChevronRight size={16} className="admin-table-arrow" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-dashboard-grid admin-dashboard-grid-bottom">
          <RecentUsers users={data.users} />
          <RecentMessages messages={data.messages} users={data.users} />
        </section>
      </>
    );
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p>Loading admin dashboard…</p>
      </div>
    );
  }

  if (accessError) {
    return (
      <div className="admin-access-denied">
        <div className="admin-access-card">
          <ShieldCheck size={34} />
          <h1>Admin access required</h1>
          <p>{accessError}</p>
          <button type="button" onClick={() => setLocation('/')}>Back to Travel with Trails</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="admin-brand">
          <div className="admin-brand-mark"><Map size={21} /></div>
          <div>
            <strong>Travel with Trails</strong>
            <span>ADMIN PANEL</span>
          </div>
          <button
            type="button"
            className="admin-mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close admin menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="admin-nav" aria-label="Admin navigation">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              className={page === key ? 'is-active' : ''}
              onClick={() => {
                setPage(key);
                setMobileOpen(false);
                setSearch('');
              }}
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <div className="admin-avatar">{getUserName(currentAdmin).charAt(0).toUpperCase()}</div>
            <div>
              <strong>{getUserName(currentAdmin)}</strong>
              <span>Administrator</span>
            </div>
          </div>
          <button type="button" className="admin-logout" onClick={logout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <button
          type="button"
          className="admin-mobile-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        />
      )}

      <main className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-menu-button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open admin menu"
          >
            <Menu size={19} />
          </button>

          <div className="admin-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users, bookings, trips, messages..."
              aria-label="Search admin data"
            />
          </div>

          <div className="admin-top-actions">
            <button type="button" className="admin-icon-button" aria-label="Notifications">
              <Bell size={18} />
              {stats.messages > 0 && <span />}
            </button>
            <div className="admin-top-user">
              <div className="admin-avatar">{getUserName(currentAdmin).charAt(0).toUpperCase()}</div>
              <div>
                <strong>{getUserName(currentAdmin)}</strong>
                <span>Admin</span>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content">
          {dataError && (
            <div className="admin-data-warning">
              <span>{dataError}</span>
              <button type="button" onClick={() => window.location.reload()}>Retry</button>
            </div>
          )}

          <div className="admin-page-heading">
            <div>
              <p className="admin-eyebrow">Travel with Trails</p>
              <h1>{navItems.find((item) => item.key === page)?.label || 'Dashboard'}</h1>
            </div>
            <div className="admin-date">
              <CalendarDays size={16} />
              {new Intl.DateTimeFormat('en-IN', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }).format(new Date())}
            </div>
          </div>

          {renderPage()}
        </div>
      </main>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="admin-section-header">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="admin-empty">{text}</div>;
}

function RevenueCard({ bookings }: { bookings: Booking[] }) {
  const monthTotals = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    const month = date.getMonth();
    const year = date.getFullYear();

    const total = bookings
      .filter((booking) => booking.bookingStatus !== 'cancelled')
      .filter((booking) => {
        const value = new Date(booking.createdAt || booking.timestamp);
        return value.getMonth() === month && value.getFullYear() === year;
      })
      .reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0);

    return {
      label: date.toLocaleString('en-IN', { month: 'short' }),
      value: total,
    };
  });

  const max = Math.max(...monthTotals.map((item) => item.value), 1);

  return (
    <section className="admin-section-card">
      <SectionHeader title="Revenue Overview" subtitle="Monthly booking revenue from Firestore." />
      <div className="admin-chart">
        <div className="admin-chart-bars">
          {monthTotals.map((item) => (
            <div className="admin-chart-column" key={`${item.label}-${item.value}`}>
              <div className="admin-chart-bar-wrap">
                <div
                  className="admin-chart-bar"
                  style={{ height: `${Math.max(8, (item.value / max) * 100)}%` }}
                  title={formatCurrency(item.value)}
                />
              </div>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TripPopularity({
  trips,
  bookings,
}: {
  trips: Trip[];
  bookings: Booking[];
}) {
  const counts = trips
    .map((trip) => ({
      trip,
      count: bookings.filter((booking) => booking.tripId === trip.id).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <section className="admin-section-card">
      <SectionHeader title="Trip Popularity" subtitle="Booking count by trip." />
      <div className="admin-popularity-list">
        {counts.map(({ trip, count }) => (
          <div className="admin-popularity-row" key={trip.id}>
            <div className="admin-popularity-thumb" style={{ backgroundImage: `url(${trip.image || trip.images?.[0] || ''})` }} />
            <div className="admin-popularity-copy">
              <strong>{trip.title}</strong>
              <span>{count} booking{count === 1 ? '' : 's'}</span>
            </div>
            <TrendingUp size={16} />
          </div>
        ))}
        {!counts.length && <EmptyState text="No trip booking data yet." />}
      </div>
    </section>
  );
}

function RecentUsers({ users }: { users: UserRecord[] }) {
  return (
    <section className="admin-section-card">
      <SectionHeader title="Recent Users" subtitle="Latest registered profiles." />
      <div className="admin-mini-list">
        {users.slice(0, 5).map((user) => (
          <div className="admin-mini-row" key={user.id}>
            <div className="admin-avatar">{(user.name || 'U').charAt(0).toUpperCase()}</div>
            <div>
              <strong>{user.name || 'Unnamed user'}</strong>
              <span>{user.email || 'No email'}</span>
            </div>
            <small>{formatDate(user.createdAt)}</small>
          </div>
        ))}
        {!users.length && <EmptyState text="No users yet." />}
      </div>
    </section>
  );
}

function RecentMessages({
  messages,
  users,
}: {
  messages: ContactMessage[];
  users: UserRecord[];
}) {
  return (
    <section className="admin-section-card">
      <SectionHeader title="Recent Messages" subtitle="Latest contact messages." />
      <div className="admin-mini-list">
        {messages.slice(0, 5).map((message) => {
          const sender = users.find((user) => user.id === message.userId);
          const senderName = sender?.name || 'Unknown user';
          const senderGender = sender?.gender || 'Gender not shared';
          const senderAge = sender?.age ? `${sender.age} yrs` : 'Age not shared';

          return (
            <div className="admin-mini-row" key={message.id}>
              <div className="admin-message-icon"><MessageSquare size={16} /></div>
              <div>
                <strong>{senderName}</strong>
                <span>{senderGender} • {senderAge}</span>
                <span>{message.message}</span>
              </div>
              <StatusBadge status={message.status || 'new'} />
            </div>
          );
        })}
        {!messages.length && <EmptyState text="No messages yet." />}
      </div>
    </section>
  );
}

function AnalyticsView({
  bookings,
  trips,
}: {
  bookings: Booking[];
  trips: Trip[];
}) {
  const confirmed = bookings.filter((item) => bookingStatus(item) !== 'cancelled').length;
  const cancelled = bookings.filter((item) => bookingStatus(item) === 'cancelled').length;
  const average =
    confirmed > 0
      ? bookings
          .filter((item) => bookingStatus(item) !== 'cancelled')
          .reduce((sum, item) => sum + Number(item.totalAmount || 0), 0) / confirmed
      : 0;

  return (
    <section className="admin-section-card">
      <SectionHeader title="Analytics" subtitle="Calculated from the current Firestore records." />
      <div className="admin-analytics-grid">
        <div className="admin-analytics-card">
          <TrendingUp size={19} />
          <span>Confirmed bookings</span>
          <strong>{confirmed}</strong>
        </div>
        <div className="admin-analytics-card">
          <X size={19} />
          <span>Cancelled bookings</span>
          <strong>{cancelled}</strong>
        </div>
        <div className="admin-analytics-card">
          <CircleDollarSign size={19} />
          <span>Average booking value</span>
          <strong>{formatCurrency(average)}</strong>
        </div>
        <div className="admin-analytics-card">
          <Map size={19} />
          <span>Available trips</span>
          <strong>{trips.length}</strong>
        </div>
      </div>
    </section>
  );
}

export default AdminPage;
