# Firestore Schema for Travel with Trails

This project uses a Firestore-ready structure with four primary collections:

1. `users`
2. `trips`
3. `bookings`
4. `contacts`

## 1) `users`

```ts
users/{userId}
{
  id: string,
  name: string,
  email: string,
  mobile: string,
  passwordHash?: string,           // recommended over plain `password`
  password?: string,               // optional only if required for legacy local auth
  emergencyNumber?: string,
  profileImageUrl?: string,
  address?: string,
  role?: 'traveller' | 'admin' | 'guide',
  provider?: 'email' | 'google' | 'phone',
  isActive?: boolean,
  createdAt?: timestamp,
  updatedAt?: timestamp
}
```

Recommended rules:
- Use Firebase Authentication for login and keep the password out of Firestore.
- If you store a password locally for legacy usage, store a hash, not plain text.
- Keep `role`, `provider`, `isActive`, and timestamps for access control and auditing.

## 2) `trips`

```ts
trips/{tripId}
{
  id: string,
  title: string,
  description: string,
  place: string,
  location?: string,
  images: string[],                // 0 to 5 URLs, recommended
  image?: string,
  price: number,
  days: number,
  nights?: number,
  difficultyLevel: 'Easy' | 'Moderate' | 'Difficult' | 'Expert',
  difficulty?: 'Easy' | 'Moderate' | 'Difficult' | 'Expert',
  rating: number,
  category?: string,
  groupSize: number,
  highlights: string[],           // max 6
  itinerary: [
    {
      day?: number,
      departure: string,
      destination: string,
      description: string,
      imageUrl: string
    }
  ],
  inclusion: string[],             // max 6
  exclusion: string[],            // max 10
  reviews: [
    {
      timestamp: timestamp,
      rating: number,
      userName: string,
      description: string
    }
  ],
  createdAt?: timestamp,
  updatedAt?: timestamp
}
```

Notes:
- `images` should hold up to 5 URLs. Keep it empty for a newly created trip until media is uploaded.
- `highlights`, `inclusion`, and `exclusion` should remain short, clear bullet-style strings.
- `itinerary` is usually the most useful structure for a trip detail page.
- If you want a public booking page, keep `rating`, `groupSize`, `difficultyLevel`, and `reviews` visible.

## 3) `bookings`

```ts
bookings/{bookingId}
{
  id: string,
  userId: string,
  tripId: string,
  trip?: {
    id: string,
    title?: string,
    price?: number,
    image?: string
  },
  bookingStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed',
  status?: string,
  tripStartDate: timestamp,
  tripEndDate: timestamp,
  numberOfPersons: number,
  travellers: [
    {
      gender: 'Female' | 'Male' | 'Other',
      name: string,
      age: number,
      contactNumber: string,
      emergencyContactNumber: string,
      email: string,
      relationWithEmergencyContact: string,
      medicalCondition: string
    }
  ],
  payment: {
    paymentPersonName: string,
    upiIdOrBankAccountNumber: string,
    contactNumber: string,
    timestamp?: timestamp
  },
  totalAmount: number,
  createdAt?: timestamp,
  updatedAt?: timestamp,
  timestamp?: timestamp
}
```

Additional notes:
- `bookingStatus` should be the main status used in filtering and UI badges.
- `travellers` holds one object per booked traveller, including emergency contact and medical details.
- `payment` should contain the payer’s details, the UPI ID, or the bank account number.
- `totalAmount` is the final payable amount; keep it numeric for analytics and reports.

## 4) `contacts`

```ts
contacts/{contactId}
{
  id: string,
  userId: string,
  message: string,
  createdAt?: timestamp,
  updatedAt?: timestamp,
  status?: 'new' | 'read' | 'replied'
}
```

Notes:
- `userId` refers to the corresponding user in `users`.
- `message` is the actual user query, complaint, or support message.

## Extra fields worth keeping

These are useful and align with the current app’s models:

- `users`: `passwordHash`, `isActive`, `provider`, `role`, `createdAt`, `updatedAt`
- `trips`: `location`, `nights`, `category`, `image`, `groupSize`, `createdAt`, `updatedAt`
- `bookings`: `trip`, `status`, `totalAmount`, `timestamp`
- `contacts`: `status`

## Recommended final structure

```ts
users/{userId}
trips/{tripId}
bookings/{bookingId}
contacts/{contactId}
```

This matches the current app’s Firestore model and keeps the data ready for the admin dashboard, trip listing, booking flow, and support/contact features.
