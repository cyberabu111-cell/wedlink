# Module 1: System Architecture & Database Schema
*Keep this file as the foundational reference for your database tables, folder structure, and TypeScript interfaces.*

---

## 1. Tech Stack Overview
- **Framework:** Next.js 14/15 (App Router, TypeScript)
- **Database & Auth:** Supabase (PostgreSQL + Auth + Storage)
- **Styling & Animations:** Tailwind CSS + Framer Motion
- **Payment Gateway:** Cashfree Payments (PG v3 API - Orders & Webhooks)
- **Maps & Location:** Google Maps Places Autocomplete + Maps Embed API
- **Calendar:** Deep-link URL generator + `.ics` file generator (Zero OAuth friction for wedding guests)

---

## 2. Project Directory Structure

```text
wedding-saas/
├── src/
│   ├── app/
│   │   ├── (marketing)/             # Landing page, pricing, template showcase
│   │   ├── (dashboard)/             # Protected user dashboard
│   │   │   ├── studio/[weddingId]/  # Split-screen Form Editor + Live Preview
│   │   │   └── rsvps/[weddingId]/   # Guest RSVP table & CSV export
│   │   ├── invite/[slug]/           # Public dynamic wedding invitation route
│   │   │   └── page.tsx             # Fetches JSON & renders chosen Template
│   │   └── api/
│   │       ├── cashfree/
│   │       │   ├── create-order/    # Generates Cashfree payment session
│   │       │   └── webhook/         # Verifies payment signature & unlocks invite
│   │       └── rsvp/                # Public endpoint for guests to submit RSVPs
│   ├── templates/                   # Pre-built React Templates
│   │   ├── RoyalRajwada.tsx
│   │   ├── MinimalSage.tsx
│   │   ├── BohoFloral.tsx
│   │   └── index.ts                 # Template Registry map
│   ├── components/
│   │   ├── editor/                  # Form sections (CoupleForm, VenueMapPicker, etc.)
│   │   └── shared/                  # AddToCalendarButton, GoogleMapCard, AudioPlayer
│   ├── types/
│   │   └── wedding.ts               # Master TypeScript JSON Schema
│   └── utils/
│       ├── calendar.ts              # Google Calendar & Apple ICS link builders
│       └── cashfree.ts              # Cashfree SDK helpers
```

---

## 3. Master TypeScript Interface (`src/types/wedding.ts`)
Every template **must** accept this exact `WeddingData` structure as props so users can switch templates at any time without losing their entered data.

```typescript
export interface VenueEvent {
  id: string;
  eventName: string;          // e.g., "Haldi Ceremony", "Sangeet", "Muhurtham"
  date: string;               // ISO Date "2026-12-14"
  startTime: string;          // "10:00" (24h format for Calendar calculation)
  endTime: string;            // "14:00"
  venueName: string;          // e.g., "Taj Falaknuma Palace"
  venueAddress: string;       // Full address populated via Google Places
  googlePlaceId?: string;     // Place ID for accurate Maps Embed
  lat?: number;               // Latitude for Maps pin
  lng?: number;               // Longitude for Maps pin
  googleMapsUrl: string;      // Direct navigation link for guests
  dressCode?: string;         // e.g., "Traditional Yellow"
}

export interface WeddingData {
  couple: {
    brideName: string;
    groomName: string;
    brideBio?: string;
    groomBio?: string;
    hashtag?: string;         // e.g., "#RahulKiPriya"
    weddingDate: string;      // Primary countdown date
    coverPhotoUrl: string;
  };
  story: {
    title: string;
    content: string;
    milestones?: Array<{ year: string; title: string; description: string }>;
  };
  events: VenueEvent[];
  gallery: string[];          // Array of compressed WebP image URLs
  theme: {
    primaryColor: string;     // Hex code e.g., "#8B0000"
    secondaryColor: string;   // Hex code e.g., "#D4AF37"
    fontFamily: 'serif' | 'sans' | 'playfair';
    backgroundMusicUrl?: string;
  };
  rsvpConfig: {
    enabled: boolean;
    deadline?: string;
    askDietaryPreference: boolean;
    whatsappNumber?: string;  // Optional: also send RSVP via WhatsApp
  };
}
```

---

## 4. Supabase PostgreSQL Schema
Run this SQL in your Supabase SQL Editor to set up the database tables:

```sql
-- 1. Weddings Table (Stores the dynamic JSON data and payment state)
CREATE TABLE weddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  slug TEXT UNIQUE NOT NULL,                     -- e.g., "rahul-weds-priya"
  template_id TEXT NOT NULL DEFAULT 'royal-rajwada',
  plan_tier TEXT NOT NULL DEFAULT 'basic',       -- 'basic' (₹999) or 'premium' (₹1999)
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,        -- Unlocked via Cashfree Webhook
  wedding_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on slug for fast public page loads
CREATE INDEX idx_weddings_slug ON weddings(slug);

-- 2. Payments Table (Tracks Cashfree Orders)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  cf_order_id TEXT UNIQUE NOT NULL,              -- Cashfree Order ID
  cf_payment_session_id TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'PENDING',        -- 'PENDING', 'SUCCESS', 'FAILED'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Guest RSVPs Table
CREATE TABLE rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  guest_name TEXT NOT NULL,
  phone_number TEXT,
  attending BOOLEAN NOT NULL DEFAULT TRUE,
  guests_count INT NOT NULL DEFAULT 1,
  events_attending TEXT[],                       -- Array of event names
  dietary_notes TEXT,
  message_for_couple TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```