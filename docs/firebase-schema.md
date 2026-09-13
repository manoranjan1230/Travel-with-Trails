# Firestore Schema for Travel with Trails

This project uses a Firestore-ready data model with four primary collections:

1. `users`
2. `trips`
3. `bookings`
4. `contacts`

## `users`

```
users/{userId}
{
  id: string,
  name: string,
  email: string,
  mobile: string,
  passwordHash: string,
  emergencyNumber: string,
  profileImageUrl: string,
  address: string,
  role: 'traveller' | 'admin' | 'guide',
  provider: 'email' | 'google' | 'phone',
  isActive: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

Notes:
- Store `passwordHash`, not a plain-text password.
- `mobile` should be validated as exactly 10 digits and start with 6.
- `profileImageUrl` should be an image URL string.

## `trips`

```
trips/{tripId}
{
  id: string,
  title: string,
  description: string,
  place: string,
  images: string[],            // optional up to 5 image URLs
  price: number,
  days: number,
  difficultyLevel: 'Easy' | 'Moderate' | 'Difficult' | 'Expert',
  rating: number,
  groupSize: number,
  highlights: string[],        // up to 6 points
  itinerary: [
    {
      departure: string,
      destination: string,
      description: string,
      imageUrl: string
    }
  ],
  inclusion: string[],          // up to 6
  exclusion: string[],          // up to 10
  reviews: [
    {
      timestamp: timestamp,
      rating: number,
      userName: string,
      description: string
    }
  ],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

Notes:
- `images` should be an array of up to 5 URLs, but the array may be empty for a new trip.
- `price` should be stored as a number in INR to keep queries and filtering consistent.
- `reviews` is nested in the trip document. Each review entry has its own timestamp.

## `bookings`

```
bookings/{bookingId}
{
  id: string,
  userId: string,
  tripId: string,
  bookingStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed',
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
    contactNumber: string
  },
  totalAmount: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

Notes:
- `bookingId` is the document id or an explicit `id` field. Keep the same value in both if needed.
- `travellers` stores one record per booked person, including emergency and medical fields.
- `payment` should contain the payer or booking contact details.

## `contacts`

```
contacts/{contactId}
{
  id: string,
  userId: string,
  message: string,
  createdAt: timestamp,
  updatedAt: timestamp,
  status: 'new' | 'read' | 'replied'
}
```

Notes:
- `userId` points to the user record in `users`.
- `message` is the support or travel query description.
