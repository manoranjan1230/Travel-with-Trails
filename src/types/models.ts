export type UserRecord = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  passwordHash?: string;
  password?: string;
  emergencyNumber?: string;
  profileImageUrl?: string;
  address?: string;
  gender?: string;
  dob?: string;
  age?: number;
  role?: 'traveller' | 'admin' | 'guide';
  provider?: 'email' | 'google' | 'phone';
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type TripReview = {
  timestamp: string;
  rating: number;
  userName: string;
  description: string;
};

export type TripItineraryDay = {
  departure: string;
  destination: string;
  description: string;
  imageUrl: string;
};

export type TravellerPerson = {
  gender: 'Female' | 'Male' | 'Other';
  name: string;
  age: number;
  contactNumber: string;
  emergencyContactNumber: string;
  email: string;
  relationWithEmergencyContact: string;
  medicalCondition: string;
};

export type TripBookingPayment = {
  paymentPersonName: string;
  upiIdOrBankAccountNumber: string;
  contactNumber: string;
  timestamp: string;
};

export type Trip = {
  id: string;
  title: string;
  description?: string;
  place?: string;
  location?: string;
  images?: string[];
  image?: string;
  price?: number | string;
  days?: number;
  nights?: number;
  difficultyLevel?: string;
  difficulty?: string;
  rating?: number | string;
  category?: string;
  blurb?: string;
  group?: string;
  groupSize?: number;
  dates?: string;
  highlights?: string[];
  itinerary?: TripItineraryDay[];
  inclusion?: string[];
  exclusion?: string[];
  reviews?: TripReview[];
  isHidden?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export function getTripAverageRating(trip?: Partial<Trip> | null): number {
  const reviews = Array.isArray(trip?.reviews) ? trip.reviews : [];

  if (reviews.length) {
    const total = reviews.reduce(
      (sum, review) => sum + Number(review?.rating || 0),
      0
    );

    return Number((total / reviews.length).toFixed(1));
  }

  const numericRating = Number(trip?.rating ?? 0);
  return Number.isFinite(numericRating) && numericRating > 0 ? numericRating : 0;
}

export type Booking = {
  id: string;
  trip: Trip;
  people?: number;
  numberOfPersons?: number;
  status?: string;
  bookingStatus?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  tripStartDate?: string;
  tripEndDate?: string;
  travellers?: Traveller[] | TravellerPerson[];
  payment?: TripBookingPayment;
  userId?: string;
  tripId?: string;
  totalAmount?: number;
  createdAt?: string;
  updatedAt?: string;
  timestamp: string;
};

export type ContactMessage = {
  id: string;
  userId: string;
  message: string;
  createdAt?: string;
  updatedAt?: string;
  status?: 'new' | 'read' | 'replied';
};

export type Traveller = {
  id: string;
  name: string;
  dob: string;
  gender: string;
  mobile: string;
  email: string;
  emergencyName: string;
  emergencyPhone: string;
  relationship: string;
  medical: string;
};