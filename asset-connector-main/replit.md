# Smart Healthcare Platform (منصة صحية ذكية)

## Overview

A cross-platform mobile healthcare application built with React Native (Expo) and an Express backend that connects patients with doctors and pharmacists in Iraq. The platform enables patients to search for doctors by specialty and province, find medicines, locate nearby pharmacies, book appointments, and order medications. It supports three user roles — patient, doctor, and pharmacist — each with a distinct UI experience. The app is bilingual (Arabic/English) with full RTL support and uses a medical-modern design aesthetic with extensive animations powered by Reanimated.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

- **Framework**: React Native with Expo SDK 54, new architecture enabled (`newArchEnabled: true`)
- **Entry point**: `client/index.js` → `client/App.tsx`
- **Path aliases**: `@/` maps to `./client/`, `@shared/` maps to `./shared/`
- **Module resolution**: Babel `module-resolver` plugin handles aliases with platform-specific extensions (`.ios.js`, `.android.js`, etc.)
- **State management**: React Context (`AppContext` for language/i18n, `AuthContext` for authentication) plus TanStack React Query for server state
- **Navigation**: React Navigation v7 with a role-based hybrid system:
  - **Patient**: Bottom tab navigator (Home, Doctors, Medicines, Pharmacies) wrapped in a drawer navigator for settings/profile
  - **Doctor**: Drawer navigator (Dashboard, Appointments, Patients, Schedule, Profile)
  - **Pharmacist**: Drawer navigator (Dashboard, Orders, Inventory, Prescriptions, Profile)
  - **Root**: Native stack navigator handles auth screens (Login → Location Permission → OTP) and detail screens
- **Animations**: Heavy use of `react-native-reanimated` throughout — every card, button, transition, and list item is animated. Components like `AnimatedButton`, `AnimatedCard`, `ScrollFadeIn`, and `GlowingSearchBar` provide consistent animation patterns.
- **Theming**: Light/dark mode support via `useColorScheme` hook with a comprehensive color system defined in `client/constants/theme.ts`. Primary colors are cyan (#5EDFFF) and blue (#1F6AE1).
- **Fonts**: Tajawal (Arabic font family) loaded via `expo-font`
- **Platform-specific components**: `MapView.native.tsx` uses `react-native-maps` on mobile, `MapView.tsx` shows a placeholder on web

### Authentication Architecture

- **Registration is minimal**: Single flow for all users — phone number + OTP only. No role selection in the app.
- **Doctor/Pharmacist registration**: Done exclusively via an external admin website (not part of this codebase). Professional info, documents, and verification happen there.
- **Login flow**: Enter name → Enter phone → Grant location permission → Enter OTP → Server returns role → App opens appropriate interface
- **Role detection**: `GET /api/users/role/:phoneNumber` returns the user's role from the server
- **Dev/Preview mode**: Mock OTP (accepts `123456` or any 6-digit code), mock location permission (auto-grants with Baghdad coordinates), test phone numbers for different roles
- **Test phone numbers**: `07801111111` → doctor, `07802222222` → pharmacist, anything else → patient
- **Persistence**: Auth state saved to `AsyncStorage`

### Backend Architecture

- **Framework**: Express.js (v5) with TypeScript, compiled via `tsx` for dev and `esbuild` for production
- **Server entry**: `server/index.ts`
- **Routes**: `server/routes.ts` — currently minimal, primarily the role-lookup endpoint
- **Storage**: `server/storage.ts` — uses in-memory storage (`MemStorage`) with an `IStorage` interface designed for easy swap to database-backed implementation
- **CORS**: Configured to allow Replit domains and localhost origins for Expo web development
- **Static serving**: In production, serves Expo web build from `dist/` directory

### Database

- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: `shared/schema.ts` — currently defines a basic `users` table (id, username, password). The schema is shared between client and server via the `@shared` alias.
- **Validation**: `drizzle-zod` generates Zod schemas from Drizzle tables
- **Migrations**: Output to `./migrations/` directory, managed via `drizzle-kit push`
- **Note**: The database schema is minimal/starter — it needs to be expanded to support doctors, pharmacies, medicines, bookings, orders, etc. Currently most data comes from `client/data/mockData.ts`

### Data Layer

- **Mock data**: `client/data/mockData.ts` contains all sample data (doctors, pharmacies, medicines, specialties, provinces, bookings, orders, announcements) — this should eventually be replaced with API calls
- **API client**: `client/lib/query-client.ts` provides `apiRequest()` helper and TanStack Query configuration with the API base URL derived from `EXPO_PUBLIC_DOMAIN`

### Build & Development

- **Dev workflow**: Two processes needed — `npm run server:dev` (Express backend on port 5000) and `npm run expo:dev` (Expo Metro bundler)
- **Production build**: `npm run expo:static:build` creates web build, `npm run server:build` + `npm run server:prod` runs the production server
- **Database migrations**: `npm run db:push` pushes schema to PostgreSQL

## External Dependencies

### Core Framework
- **Expo SDK 54** — managed React Native workflow with new architecture
- **React Native 0.81** — mobile runtime
- **Express 5** — backend API server

### Navigation & UI
- **React Navigation 7** (native-stack, bottom-tabs, drawer) — all navigation
- **react-native-reanimated 4.1** — all animations
- **react-native-gesture-handler** — gesture support
- **expo-linear-gradient** — gradient backgrounds on buttons and cards
- **expo-blur / expo-glass-effect** — blur effects for tab bars and drawers
- **expo-haptics** — tactile feedback on interactions
- **react-native-maps** — native map views (mobile only)

### Data & State
- **TanStack React Query 5** — server state management
- **Drizzle ORM 0.39** — PostgreSQL ORM (schema in `shared/schema.ts`)
- **drizzle-zod** — schema validation
- **pg** — PostgreSQL client driver
- **Zod** — runtime validation

### Platform Services
- **expo-location** — location permissions and geolocation
- **expo-image-picker** — camera/gallery access (for AI medicine recognition feature)
- **@react-native-async-storage/async-storage** — persistent local storage
- **expo-font / @expo-google-fonts/tajawal** — Arabic typography

### Database
- **PostgreSQL** — primary database (requires `DATABASE_URL` environment variable)
- Currently using in-memory storage (`MemStorage`) as a fallback; needs PostgreSQL provisioned for production