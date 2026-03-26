# Smart Healthcare Platform (منصة صحية ذكية)

## Overview

A cross-platform mobile healthcare application built with React Native (Expo SDK 54) and an Express.js backend that connects patients with doctors and pharmacists in Iraq. The platform enables patients to search for doctors by specialty, find medicines (including AI-powered medicine recognition via camera), locate pharmacies, and book appointments. It supports three user roles — patient, doctor, and pharmacist — with role-based navigation and interfaces. The app is bilingual (Arabic/English) with full RTL support and features a medical-modern design aesthetic with fluid animations throughout.

The main application code lives in `Asset-Connector/` subdirectory. The root `package.json` is a workspace wrapper; the actual app is in `Asset-Connector/`.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

- **Framework**: React Native with Expo SDK 54, new architecture enabled (`newArchEnabled: true`)
- **Entry point**: `Asset-Connector/client/index.js` → `Asset-Connector/client/App.tsx`
- **Path aliases**: `@/` maps to `./client/`, `@shared/` maps to `./shared/` (configured in both `babel.config.js` and `tsconfig.json`)
- **Module resolution**: Babel `module-resolver` plugin handles aliases with platform-specific extensions (`.ios.js`, `.android.js`, etc.)

**State Management**:
- `AppContext` — language/i18n, user session, translation function `t()`
- `AuthContext` — authentication state, login/OTP flow, role detection
- `ThemeProvider` — light/dark/system theme mode with AsyncStorage persistence
- TanStack React Query — server state management and API caching

**Navigation** (React Navigation v7):
- **Patient**: Bottom tab navigator (Home, Doctors, Medicines, Pharmacies) wrapped in a drawer navigator for settings/profile
- **Doctor**: Drawer navigator (Dashboard, Appointments, Patients, Schedule, Profile)
- **Pharmacist**: Drawer navigator (Dashboard, Orders, Inventory, Prescriptions, Profile)
- **Root**: Native stack navigator handles auth screens (Login → Location Permission → OTP) and detail screens (DoctorDetail, PharmacyDetail, PharmacyPicker, PharmacyRoute, BookAppointment, etc.)

**Animation**: Heavy use of `react-native-reanimated` throughout. Components like `AnimatedButton`, `AnimatedCard`, `ScrollFadeIn`, and list items all use spring/timing animations. Every transition, card, and button has micro-interactions.

**Theming**: Light/dark/system mode support via custom `ThemeProvider` with persistence. Primary colors are cyan (#5EDFFF) and blue (#1F6AE1). Theme constants in `client/constants/theme.ts`.

**Fonts**: Tajawal (Arabic font family) loaded via `expo-font` from local assets.

**Platform-specific**: `MapView.native.tsx` uses `react-native-maps` on mobile; `MapView.tsx` uses OpenStreetMap iframe on web. `PharmacyRouteScreen` uses `react-native-maps` with `UrlTile` for OpenStreetMap tiles (light/dark) on native, and iframe fallback on web.

**i18n/RTL**: Bilingual Arabic/English with RTL layout support. Translations are inline in `AppContext`. Language toggle available in drawer.

### Authentication Architecture

- **Registration is minimal**: Phone number + OTP only. No role selection in the app.
- **Doctor/Pharmacist registration**: Done exclusively via an external admin website (not part of this codebase).
- **Login flow**: Enter name → Enter phone → Grant location permission → Enter OTP → Server returns role → App opens appropriate interface.
- **Role detection**: `GET /api/users/role/:phoneNumber` returns the user's role.
- **Dev/Preview mode**: Mock OTP (accepts `123456` or any 6-digit code), mock location permission (auto-grants with Baghdad coordinates).
- **Test phone numbers**: `07801111111` → doctor, `07802222222` → pharmacist, anything else → patient.
- **Persistence**: Auth state saved to AsyncStorage under `@smart_health_auth`.

### Backend Architecture

- **Framework**: Express.js (v5) with TypeScript
- **Dev server**: `tsx server/index.ts` on port 5000
- **Production build**: `esbuild` bundles to `server_dist/index.js`
- **Entry**: `Asset-Connector/server/index.ts`
- **Routes**: `Asset-Connector/server/routes.ts` — role-lookup endpoint, medicine analysis mock, medicine search with pagination, pharmacy availability, and chat endpoints
- **Mock data**: `Asset-Connector/server/mockData.ts` — medicines, pharmacies, availability mappings, chat messages
- **Storage**: `Asset-Connector/server/storage.ts` — in-memory `MemStorage` class implementing `IStorage` interface. Designed for easy swap to database-backed implementation.
- **CORS**: Permissive (`*`) for development
- **Static serving**: In production, serves Expo web build from `dist/` directory

### Database

- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: `Asset-Connector/shared/schema.ts` — currently has a `users` table with `id`, `username`, `password` fields. Uses `drizzle-zod` for validation schemas.
- **Config**: `Asset-Connector/drizzle.config.ts` requires `DATABASE_URL` environment variable
- **Migrations**: Output to `./migrations` directory
- **Current state**: Schema is defined but the app currently uses in-memory storage (`MemStorage`). The database needs to be provisioned and `db:push` run to create tables.

### Key Scripts (from Asset-Connector/package.json)

- `npm run dev` — runs both server and Expo simultaneously
- `npm run expo:web` — Expo web with `EXPO_OFFLINE=1` for stable preview
- `npm run server:dev` — Express dev server on port 5000
- `npm run db:push` — push Drizzle schema to PostgreSQL

## External Dependencies

### Core Framework
- **Expo SDK 54** — React Native framework with managed workflow
- **React Native 0.81.5** — mobile UI framework
- **React 19.1.0** — UI library

### Navigation & UI
- **React Navigation v7** — native-stack, bottom-tabs, drawer navigators
- **react-native-reanimated** — animation library (critical dependency, plugin in babel config)
- **react-native-gesture-handler** — gesture handling
- **expo-linear-gradient** — gradient backgrounds
- **expo-blur / expo-glass-effect** — blur/glass visual effects
- **@expo/vector-icons (Feather)** — icon set used throughout
- **react-native-safe-area-context** — safe area handling
- **react-native-keyboard-controller** — keyboard-aware scroll views

### Device APIs
- **expo-location** — GPS location for finding nearby doctors/pharmacies
- **expo-image-picker** — camera/gallery access for AI medicine recognition
- **expo-image-manipulator** — image processing before upload
- **expo-haptics** — haptic feedback on button presses
- **react-native-maps** — native map views (mobile only)

### Firebase Integration
- **Firebase Realtime Database** — stores appointment bookings at `appointments` path
- **Config file**: `Asset-Connector/client/lib/firebase.ts`
- **Project**: `ghath-c86ae` (Firebase console)
- **Database URL**: `https://ghath-c86ae-default-rtdb.firebaseio.com`
- **Data model** (appointments): `{ fullName, phoneNumber, doctorId, doctorNameAr, doctorNameEn, age, notes, status: "pending", createdAt }`
- **BookAppointmentScreen** pushes data to Firebase on confirm

### Data & Storage
- **@tanstack/react-query** — server state management
- **@react-native-async-storage/async-storage** — local persistence (auth, theme, language)
- **firebase** — Firebase SDK for Realtime Database
- **drizzle-orm** + **drizzle-zod** — PostgreSQL ORM and schema validation
- **pg** — PostgreSQL client (requires DATABASE_URL env var)

### Backend
- **Express v5** — HTTP server
- **http-proxy-middleware** — proxy support

### Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (required for database)
- `EXPO_PUBLIC_API_BASE_URL` — API base URL override
- `EXPO_PUBLIC_DOMAIN` — domain for API resolution
- `REPLIT_DOMAINS` / `REPLIT_DEV_DOMAIN` — auto-detected in Replit environment