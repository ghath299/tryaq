# Smart Healthcare Platform - Design Guidelines

## Brand Identity

**Purpose**: Connect patients with doctors and pharmacists through an intelligent, animated healthcare ecosystem.

**Aesthetic Direction**: **Medical-Modern Fusion**
- Clean, trustworthy foundation with delightful micro-interactions
- Soft, organic shapes (no harsh corners) to convey care and comfort
- Fluid animations that guide attention without overwhelming
- Professional yet approachable - this is healthcare, not a game

**Memorable Element**: Every transition uses organic, breathing animations. Cards expand like living organisms, lists flow like water, buttons respond with gentle pulses.

## Navigation Architecture

### Root Navigation: Role-Based Hybrid System

**Patient**: Bottom Tab Navigation (4 tabs)
- Home
- Doctors
- Medicines
- Pharmacies

**Doctor/Pharmacist/Admin**: Drawer-Only Navigation

### Side Drawer (Global, All Roles)
- Always accessible via ☰ button in header (all screens)
- Content changes based on role
- Common items: Language, Dark/Light Mode, About, Privacy, Logout

### Screen List by Role

**Patient Screens**:
1. Home (feed with sliders, promotions)
2. Doctors List (search → specialty → city → results)
3. Doctor Profile (map, clinic info, booking form)
4. Medicines Search (text or AI camera)
5. Medicine Results (pharmacy list with distance)
6. Pharmacy Profile (map, inventory, order)
7. My Bookings
8. My Orders
9. Profile (from drawer)

**Doctor Screens**:
1. Dashboard (today summary)
2. Patient Queue (manual, search-enabled)
3. Schedule & Holidays
4. Doctor File (verification status, documents)
5. Work Log (last 15 days)

**Pharmacist Screens**:
1. Inventory Management (central library only)
2. Incoming Orders
3. Pharmacy File (verification status)
4. Pharmacy Log (last 15 days)

**Admin Screens**:
1. Pending Verifications (doctors/pharmacists)
2. Medicine Library Management
3. System Logs (15 days)
4. AI Suggestions Review

## Screen Specifications

### Universal Header
- Transparent background (content scrolls underneath)
- ☰ drawer button: always top-left (RTL) or top-right (LTR)
- Subtle shadow appears on scroll
- Height: 60px
- Safe area: insets.top + 60px + 16px

### Patient Home Screen
- Root: ScrollView
- Safe area: top = headerHeight + 16px, bottom = tabBarHeight + 16px
- Components:
  - Auto-playing slider (5s interval, dots indicator)
  - Section headers with "See All" links
  - Horizontal scrolling lists for promoted content
  - Floating AI camera button (bottom-right, above tab bar)

### Doctor/Medicine Search Flow
- Root: Searchable List
- Search bar embedded below header
- Filters as horizontal chips (scrollable)
- Required selections show as filled chips
- Empty state: illustration + "Start by selecting [required filter]"

### Profile Screens (Doctor/Pharmacy)
- Root: ScrollView with map header
- Map: 200px height, interactive
- Info cards below map
- Verification badge prominent if approved
- Safe area: top = headerHeight + 16px, bottom = insets.bottom + 16px

### Queue/Order Management (Doctor/Pharmacist)
- Root: FlatList with search
- Pull-to-refresh enabled
- Item actions: swipe gestures (Swipeable component)
- Action buttons: floating, pill-shaped
- Safe area: top = headerHeight + 60px (search bar), bottom = insets.bottom + 16px

### Forms (Booking, Registration)
- Root: KeyboardAwareScrollView
- Input fields: borderless, bottom-line only
- Submit button: floating at bottom (above tab bar if patient)
- Cancel: header left button
- Safe area: top = 16px, bottom = tabBarHeight + 16px (patient) or insets.bottom + 80px (others)

## Design System

### Color Palette

**Primary**: #00A896 (Teal) - Trustworthy medical green with modern vibrancy
**Primary Dark**: #008577

**Accent**: #FF6B6B (Warm coral) - Action, urgency, notifications

**Background Light**: #F8F9FA
**Background Dark**: #1A1D23

**Surface Light**: #FFFFFF
**Surface Dark**: #2C3038

**Text Primary Light**: #1A1D23
**Text Primary Dark**: #F8F9FA
**Text Secondary Light**: #6C757D
**Text Secondary Dark**: #ADB5BD

**Success**: #51CF66
**Warning**: #FFB84D
**Error**: #FF6B6B
**Info**: #4DABF7

### Typography

**Font**: Tajawal (Google Font) for Arabic, Inter for English fallback

**Type Scale**:
- Hero: 32px, Bold
- H1: 28px, Bold
- H2: 24px, SemiBold
- H3: 20px, SemiBold
- Body: 16px, Regular
- Small: 14px, Regular
- Caption: 12px, Regular

**Line Height**: 1.5x font size for body text

### Spacing System
```
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 24px
xxl: 32px
```

### Component Design

**Buttons**:
- Primary: Rounded pill (borderRadius: 24px), no shadow, press opacity: 0.85
- Secondary: Outlined pill, 2px border
- Floating Action: Circular (56px), shadow: offset(0,2), opacity 0.15, radius 4

**Cards**:
- borderRadius: 16px
- Light: white with border (#E9ECEF)
- Dark: surface color, no border
- Press: scale to 0.98, shadow expands

**Inputs**:
- No border, underline only (1px)
- Focused: underline thickens to 2px, primary color
- Error: red underline, shake animation

**Lists**:
- Item separator: 1px, color: border color with 50% opacity
- Pull indicator: primary color spinner

**Bottom Tab Bar**:
- Height: 60px
- Background: surface color with 95% opacity, blur effect
- Active: primary color with scale 1.1
- Inactive: text secondary color

**Drawer**:
- Width: 80% screen width (max 320px)
- Header: gradient overlay on surface color
- Items: no background, ripple effect on press
- Avatar: 64px circle

### Animations

**Principles**:
- Duration: 200-300ms (never instant, never sluggish)
- Easing: Cubic Bezier (0.4, 0.0, 0.2, 1) - Material ease-out
- Stagger: 50ms delay between list items

**Mandatory Animations**:
- Screen transitions: slide + fade
- Card press: scale down (0.98)
- Button press: scale + opacity pulse
- List items: fade + translate on mount
- Modal appearance: scale from center + fade
- Bottom tab switch: cross-fade icons
- Search bar focus: expand width
- Empty state: gentle float loop

### Visual Design
- Icons: Feather icon set from @expo/vector-icons
- No emojis anywhere
- Floating buttons: use specified shadow (offset 0,2, opacity 0.1, radius 2)
- Status badges: small pills with icon + text
- Distance indicators: show icon + "X km" in secondary text

### RTL Support
- All layouts use flexDirection with RTL auto-flip
- Icons flip for directional elements (arrows, navigation)
- Text alignment: natural (start/end, not left/right)

## Assets to Generate

**App Icon** (icon.png)
- Teal medical cross inside organic rounded square
- Usage: Device home screen

**Splash Icon** (splash-icon.png)
- Simplified version of app icon
- Usage: Launch screen

**Empty States**:
1. empty-doctors.png - Stethoscope illustration
   Usage: Doctors list when no results
2. empty-bookings.png - Calendar with checkmark
   Usage: My Bookings when empty
3. empty-medicines.png - Medicine bottle outline
   Usage: Medicine search no results
4. empty-queue.png - Peaceful waiting room chair
   Usage: Doctor queue when empty
5. empty-orders.png - Delivery box
   Usage: Pharmacist orders when none

**Onboarding**:
6. welcome-health.png - Abstract health symbols in teal/coral
   Usage: First launch welcome screen

**Authentication**:
7. verification-pending.png - Hourglass or clock in organic shape
   Usage: Doctor/Pharmacist pending approval screen

**Profile Avatars** (pre-generated):
8. avatar-1.png through avatar-4.png - Abstract geometric patterns in brand colors
   Usage: Default user avatars before photo upload

All illustrations: Organic shapes, 2-color (primary + accent), minimal line weight, PNG with transparency.