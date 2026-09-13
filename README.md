# Travel with Trails

A Vite + React + TypeScript travel booking and trip-planning front-end for a trail-focused travel experience. The project currently ships a front-end UI with trip discovery, booking, profile, itinerary, auth, and support flows backed by localStorage-based prototype storage. Firebase and Google environment placeholders are prepared for future app integration.

## Project Overview

Travel with Trails is a front-end web application that helps travellers browse curated trips, understand destinations, manage bookings, and maintain traveller and profile data. The repository uses a Vite + React + TypeScript structure, route-based screens, shadcn-style UI components, and local prototype data storage while keeping the design aligned with a warm outdoor/green travel theme.

## Technology Badges

![Vite](https://img.shields.io/badge/Vite-7.1.3-646CFF?style=for-the-badge&logo=vite)
![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=for-the-badge&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-4.1.12-06B6D4?style=for-the-badge&logo=tailwindcss)
![Firebase](https://img.shields.io/badge/Firebase-Firestore%20Auth-FFCA28?style=for-the-badge&logo=firebase)
![Wouter](https://img.shields.io/badge/Wouter-routing-5F9EA0?style=for-the-badge&logo=react)

## Folder Structure

```text
.
├── public/
│   └── robots.txt
├── src/
│   ├── app/
│   │   └── Router.tsx
│   ├── assets/
│   ├── components/
│   │   ├── common.tsx
│   │   └── ui/
│   ├── data/
│   │   ├── navigation.ts
│   │   └── trips.ts
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   │   ├── Auth/
│   │   ├── BookingDetails/
│   │   ├── BookingFlow/
│   │   ├── Bookings/
│   │   ├── Home/
│   │   ├── Itinerary/
│   │   ├── Profile/
│   │   ├── Support/
│   │   ├── TripDetails/
│   │   └── Trips/
│   ├── security/
│   ├── services/
│   └── types/
│       └── models.ts
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Installation

1. Clone the repository.
2. Open the project directory.
3. Install dependencies:

```bash
npm install
```

## Environment Configuration

Create a local `.env` file from the example template:

```bash
copy .env.example .env
```

The project is designed around Firebase Auth and Firestore. It should not use Google Cloud or Realtime Database environment keys. Configure your public environment values as follows:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_AUTH_PROVIDER=google

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

VITE_FIRESTORE_DATABASE_ID=(default)
VITE_FIREBASE_FIRESTORE_API=https://firestore.googleapis.com
```

## Scripts

```bash
npm run dev
npm run build
npm run typecheck
npm run preview
```

## Features

- Responsive travel landing and support page flows
- Trip listing and detail screen
- Local booking and cancellation flows
- Auth page with login, signup, and Google sign-in prototype behavior
- Profile page with user, mobile, emergency contact, address, and profile image URL layout
- Local prototype data storage using localStorage
- UI pattern aligned with Travel with Trails cards, sections, and typography

## Security and Privacy

Do not commit `.env`, `node_modules`, credential files, service-account JSON files, logs, or generated build output. Keep production credentials in a secure environment and use the example file for public configuration templates.
