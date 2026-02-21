# Smart Healthcare Platform (منصة صحية ذكية)

## Overview

A cross-platform mobile healthcare application built with React Native and Expo that connects patients with doctors and pharmacists. The platform enables users to search for doctors by specialty, find nearby pharmacies, search for medicines, and book appointments.

The application is bilingual (Arabic/English) with full RTL support and features a medical-modern design aesthetic with fluid animations and micro-interactions throughout.

## User Preferences

Preferred communication style: Simple, everyday language.

## Authentication Architecture

### Registration Flow
1. **In-App Registration**:
   - Single registration flow for everyone
   - Phone number + OTP verification only
   - NO role selection in the app

2. **Login Flow**:
   - User enters phone number
   - Grants location permission
   - Enters OTP code
   - App opens patient interface

### Test Phone Numbers (Development)
- Any number → Patient role

## System Architecture

### Frontend Architecture

**Framework**: React Native with Expo SDK 54, using the new architecture (`newArchEnabled: true`)

**Navigation Structure**:
- Patients: Bottom tab navigation (4 tabs: Home, Doctors, Medicines, Pharmacies) + drawer
- Native stack navigator for detail screens and modals

**State Management**:
- React Context (`AppContext`) for global app state including user session, language preferences, and translations
- TanStack React Query for server state management and API caching
- React Native Reanimated for animation state

**Theming System**:
- Dual theme support (light/dark) with automatic system preference detection
- Color palette centered on cyan (#5EDFFF) and blue (#1F6AE1)
- Centralized theme constants in `client/constants/theme.ts`
- Custom `useTheme` hook for theme access throughout components

**Animation Philosophy**:
- Every UI element has animated interactions (scale, fade, slide)
- Organic, breathing animations for a premium feel
- Reanimated-based spring and timing animations
- Haptic feedback on interactive elements

### Backend Architecture

**Server**: Express.js with TypeScript running on Node.js

**API Design**: REST API with `/api` prefix for all routes

**Database**: PostgreSQL with Drizzle ORM
- Schema defined in `shared/schema.ts`
- Migrations stored in `/migrations` directory
- Currently includes basic user schema with plans for expansion

**Storage Layer**: Abstracted storage interface (`IStorage`) with in-memory implementation (`MemStorage`) for development, designed to be swapped with database implementation

### Code Organization

```
client/           # React Native frontend
  ├── components/ # Reusable UI components
  ├── screens/    # Screen components
  ├── navigation/ # Navigation configuration
  ├── contexts/   # React contexts
  ├── hooks/      # Custom hooks
  ├── constants/  # Theme, colors, typography
  ├── data/       # Mock data for development
  ├── lib/        # API client and utilities

server/           # Express backend
  ├── index.ts    # Server entry point
  ├── routes.ts   # API route definitions
  ├── storage.ts  # Data access layer

shared/           # Shared code between client/server
  └── schema.ts   # Drizzle database schema + Zod validation
```

### Path Aliases

- `@/` maps to `./client/`
- `@shared/` maps to `./shared/`

## External Dependencies

### Core Mobile Framework
- **Expo SDK 54**: Managed workflow with native module support
- **React Native 0.81.5**: Core mobile framework
- **React Navigation 7.x**: Navigation library (native-stack, bottom-tabs, drawer)

### UI & Animation
- **React Native Reanimated 4.1**: High-performance animations
- **Expo Linear Gradient**: Gradient backgrounds
- **Expo Blur**: Blur effects for glass morphism
- **Expo Haptics**: Touch feedback

### Data & State
- **TanStack React Query 5.x**: Server state management
- **Drizzle ORM 0.39**: Database toolkit
- **Zod**: Schema validation (via drizzle-zod)

### Native Features
- **Expo Location**: GPS and location services
- **Expo Image Picker**: Camera and gallery access
- **React Native Maps**: Map display for doctor/pharmacy locations
- **AsyncStorage**: Local persistent storage

### Backend
- **Express 5.x**: HTTP server
- **PostgreSQL (pg)**: Database driver
- **http-proxy-middleware**: Development proxy

### Fonts
- **Tajawal**: Arabic-optimized Google Font (Regular, Medium, Bold weights)

### Build & Development
- **TypeScript**: Type safety across the codebase
- **Babel**: Transpilation with module-resolver for path aliases
- **ESBuild**: Server bundling for production