# Web Implementation Plan
# Ahadu Fresh Meat Reservation

**Version:** 1.0  
**Date:** June 26, 2026  
**Stack:** Next.js 14 (App Router) + Tailwind CSS + Supabase  
**Audience:** Developer implementing the web application

---

## Table of Contents

1. [Project Setup](#1-project-setup)
2. [Supabase Setup](#2-supabase-setup)
3. [Environment Variables](#3-environment-variables)
4. [Folder Structure](#4-folder-structure)
5. [Shared Components](#5-shared-components)
6. [Page: Customer Order Form (`/`)](#6-page-customer-order-form-)
7. [Page: Admin Login (`/admin/login`)](#7-page-admin-login-adminlogin)
8. [Page: Admin Dashboard (`/admin/dashboard`)](#8-page-admin-dashboard-admindashboard)
9. [Page: Admin Management (`/admin/admins`)](#9-page-admin-management-adminadmins)
10. [Supabase Edge Function — Email Notification](#10-supabase-edge-function--email-notification)
11. [Auth Flow and Middleware](#11-auth-flow-and-middleware)
12. [State Management Approach](#12-state-management-approach)
13. [Excel Export Implementation](#13-excel-export-implementation)
14. [Print Implementation](#14-print-implementation)
15. [WhatsApp Share Button](#15-whatsapp-share-button)
16. [Deployment to Vercel](#16-deployment-to-vercel)

---

## 1. Project Setup

### 1.1 Initialize Next.js

```bash
npx create-next-app@14 ahadu-meat-reservation \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd ahadu-meat-reservation
```

Say **Yes** to all prompts. This sets up:
- TypeScript
- Tailwind CSS (preconfigured)
- ESLint
- App Router (the `app/` directory, inside `src/`)
- The `@/*` import alias for clean imports

### 1.2 Install Dependencies

```bash
# Supabase client
npm install @supabase/supabase-js @supabase/ssr

# Excel export
npm install xlsx

# Date utilities (for formatting pickup dates)
npm install date-fns
```

### 1.3 Tailwind Configuration

Open `tailwind.config.ts` and extend the theme with the brand crimson color and any custom utilities:

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        crimson: {
          50:  '#fdf2f2',
          100: '#fde8e8',
          200: '#fbd5d5',
          300: '#f8b4b4',
          400: '#f98080',
          500: '#f05252',
          600: '#e02424',
          700: '#c81e1e',
          800: '#9b1c1c',
          900: '#8B0000',   // Primary brand color
          950: '#5a0000',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
```

Add the Inter font to `src/app/layout.tsx` via `next/font/google`.

### 1.4 Global CSS

In `src/app/globals.css`, keep the Tailwind directives and add print media query resets (detailed in Section 14):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Print styles are added here — see Section 14 */
```

---

## 2. Supabase Setup

### 2.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Name it `ahadu-meat-reservation`
4. Choose a strong database password (save it somewhere safe)
5. Select a region close to your users (e.g., `us-east-1` if customers are in the US)
6. Click **Create new project** and wait ~2 minutes for it to provision

### 2.2 Database Schema

Open the **SQL Editor** in your Supabase dashboard and run the following SQL in order.

#### Create the `orders` Table

```sql
-- Create status enum
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'ready', 'picked_up');

-- Create orders table
CREATE TABLE orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name  TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  pickup_date   DATE NOT NULL,
  tire_lbs      NUMERIC(6,2) NOT NULL DEFAULT 0,
  kitfo_lbs     NUMERIC(6,2) NOT NULL DEFAULT 0,
  tibs_lbs      NUMERIC(6,2) NOT NULL DEFAULT 0,
  godin_lbs     NUMERIC(6,2) NOT NULL DEFAULT 0,
  gubet_lbs     NUMERIC(6,2) NOT NULL DEFAULT 0,
  kidney_lbs    NUMERIC(6,2) NOT NULL DEFAULT 0,
  notes         TEXT,
  status        order_status NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for searching by name and phone
CREATE INDEX idx_orders_customer_name  ON orders (customer_name);
CREATE INDEX idx_orders_customer_phone ON orders (customer_phone);
CREATE INDEX idx_orders_pickup_date    ON orders (pickup_date);
CREATE INDEX idx_orders_status         ON orders (status);
```

#### Create the `admin_users` Table

Supabase Auth handles the actual authentication. The `admin_users` table links to `auth.users` so we can list and display admin accounts in the UI.

```sql
CREATE TABLE admin_users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.3 Row-Level Security (RLS) Policies

Enable RLS on both tables, then define policies precisely.

```sql
-- Enable RLS
ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ORDERS TABLE POLICIES
-- ============================================================

-- Anyone (including unauthenticated users) can INSERT a new order
-- (Customers submit orders without logging in)
CREATE POLICY "Allow public order submission"
  ON orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated admins can read orders
CREATE POLICY "Allow admins to read orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated admins can update order status
CREATE POLICY "Allow admins to update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only authenticated admins can delete orders (if needed)
CREATE POLICY "Allow admins to delete orders"
  ON orders
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- ADMIN_USERS TABLE POLICIES
-- ============================================================

-- Only authenticated admins can read the admin list
CREATE POLICY "Allow admins to read admin list"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated admins can insert new admins
CREATE POLICY "Allow admins to add admins"
  ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated admins can delete other admins
CREATE POLICY "Allow admins to remove admins"
  ON admin_users
  FOR DELETE
  TO authenticated
  USING (true);
```

### 2.4 Seed the First Admin

The very first admin (the shop owner) must be created directly in Supabase because there is no public signup.

**Step 1:** Go to Supabase Dashboard → **Authentication** → **Users** → **Invite user** (or **Add user**).  
Enter the owner's email and a temporary password. Click **Create user**.

**Step 2:** Copy the new user's UUID from the Users list.

**Step 3:** In the SQL Editor, insert that user into `admin_users`:

```sql
INSERT INTO admin_users (id, email)
VALUES (
  '<paste-the-uuid-here>',
  'owner@example.com'  -- replace with actual email
);
```

The owner can now log in at `/admin/login`.

### 2.5 Enable Realtime on the `orders` Table

In Supabase Dashboard → **Database** → **Replication**, enable Realtime for the `orders` table. This allows the admin dashboard to receive live updates when new orders arrive without polling.

Or via SQL:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
```

### 2.6 Edge Function — Email Trigger

Covered in detail in [Section 10](#10-supabase-edge-function--email-notification). The database trigger that fires it:

```sql
-- Function that calls the edge function
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/send-order-confirmation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body    := row_to_json(NEW)::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on INSERT
CREATE TRIGGER on_order_created
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_order();
```

Note: The `net.http_post` approach requires enabling the `pg_net` extension in Supabase:

```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

Alternatively (and more reliably), use Supabase's **Database Webhooks** (in the Dashboard under Database → Webhooks) to POST to the Edge Function URL on INSERT into `orders` — no SQL trigger needed, just point-and-click in the dashboard. This is the recommended approach.

---

## 3. Environment Variables

Create a `.env.local` file in the project root. **Never commit this file to git.** Add `.env.local` to `.gitignore` (Next.js does this by default).

```bash
# .env.local

# Supabase — get these from: Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key

# Service role key — used ONLY in server-side code / Edge Functions
# NEVER expose this to the browser (no NEXT_PUBLIC_ prefix)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# The public URL of this app (used in WhatsApp share links and email confirmation links)
NEXT_PUBLIC_APP_URL=https://ahadu-meat-reservation.vercel.app
```

For the Edge Function (set these as Supabase Secrets):
```
GMAIL_USER=clientsgmail@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx   # 16-char Google App Password
FROM_NAME=Ahadu Fresh Meat
```

Set Edge Function secrets with the Supabase CLI:
```bash
supabase secrets set GMAIL_USER=clientsgmail@gmail.com
supabase secrets set GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"
supabase secrets set FROM_NAME="Ahadu Fresh Meat"
```

---

## 4. Folder Structure

```
ahadu-meat-reservation/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── layout.tsx                # Root layout (font, global nav elements)
│   │   ├── globals.css               # Tailwind directives + print styles
│   │   ├── page.tsx                  # Customer order form (route: /)
│   │   ├── admin/
│   │   │   ├── layout.tsx            # Admin layout (wraps all /admin/* pages)
│   │   │   ├── login/
│   │   │   │   └── page.tsx          # Admin login page (route: /admin/login)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx          # Admin dashboard (route: /admin/dashboard)
│   │   │   └── admins/
│   │   │       └── page.tsx          # Admin management (route: /admin/admins)
│   │
│   ├── components/                   # Reusable UI components
│   │   ├── ui/                       # Generic, app-agnostic components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── Card.tsx
│   │   ├── order/                    # Customer order form components
│   │   │   ├── OrderForm.tsx         # Full form wrapper
│   │   │   ├── MeatCounter.tsx       # Single meat type +/- counter
│   │   │   └── OrderSuccessMessage.tsx
│   │   ├── admin/                    # Admin-specific components
│   │   │   ├── OrderTable.tsx        # The orders data table
│   │   │   ├── OrderRow.tsx          # Single row in the table
│   │   │   ├── TotalsPanel.tsx       # Today's meat totals grid
│   │   │   ├── SearchBar.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   └── AdminHeader.tsx       # Top nav bar for admin pages
│   │   └── shared/
│   │       ├── SiteHeader.tsx        # Public site header with logo
│   │       └── WhatsAppButton.tsx    # WhatsApp share button
│   │
│   ├── lib/                          # Utility functions and clients
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser-side Supabase client (singleton)
│   │   │   ├── server.ts             # Server-side Supabase client (for Server Components)
│   │   │   └── middleware.ts         # Supabase client for Next.js middleware
│   │   ├── excel.ts                  # SheetJS export logic
│   │   ├── utils.ts                  # General helpers (formatting, etc.)
│   │   └── constants.ts              # Meat types array, status labels, etc.
│   │
│   ├── types/
│   │   └── index.ts                  # TypeScript type definitions
│   │
│   └── middleware.ts                 # Next.js route protection middleware
│
├── supabase/
│   └── functions/
│       └── send-order-confirmation/
│           └── index.ts              # Deno Edge Function for email
│
├── public/
│   ├── logo.png                      # Ahadu Market logo
│   └── meat-icons/                   # SVG icons for each meat type (optional)
│
├── .env.local                        # Local environment variables (gitignored)
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 5. Shared Components

### 5.1 Type Definitions (`src/types/index.ts`)

```ts
export type OrderStatus = 'pending' | 'confirmed' | 'ready' | 'picked_up'

export interface Order {
  id: string
  customer_name: string
  customer_phone: string
  customer_email: string
  pickup_date: string          // ISO date string: "2026-06-28"
  tire_lbs: number
  kitfo_lbs: number
  tibs_lbs: number
  godin_lbs: number
  gubet_lbs: number
  kidney_lbs: number
  notes: string | null
  status: OrderStatus
  created_at: string
}

export interface MeatType {
  key: keyof Pick<Order, 'tire_lbs' | 'kitfo_lbs' | 'tibs_lbs' | 'godin_lbs' | 'gubet_lbs' | 'kidney_lbs'>
  label: string
  description: string
}

export interface AdminUser {
  id: string
  email: string
  created_at: string
}
```

### 5.2 Constants (`src/lib/constants.ts`)

```ts
import { MeatType } from '@/types'

export const MEAT_TYPES: MeatType[] = [
  { key: 'tire_lbs',   label: 'Tire / Tere', description: 'Raw beef' },
  { key: 'kitfo_lbs',  label: 'Kitfo',       description: 'Minced raw beef' },
  { key: 'tibs_lbs',   label: 'Tibs',        description: 'Sautéed beef' },
  { key: 'godin_lbs',  label: 'Godin',       description: 'Beef ribs' },
  { key: 'gubet_lbs',  label: 'Gubet',       description: 'Tripe / Offal' },
  { key: 'kidney_lbs', label: 'Kidney',      description: 'Beef kidney' },
]

export const STATUS_LABELS: Record<string, string> = {
  pending:   'Pending',
  confirmed: 'Confirmed',
  ready:     'Ready',
  picked_up: 'Picked Up',
}

export const STATUS_NEXT: Record<string, string | null> = {
  pending:   'confirmed',
  confirmed: 'ready',
  ready:     'picked_up',
  picked_up: null,   // terminal state
}
```

### 5.3 Supabase Browser Client (`src/lib/supabase/client.ts`)

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### 5.4 Supabase Server Client (`src/lib/supabase/server.ts`)

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* Server Component — cookies set in middleware */ }
        },
      },
    }
  )
}
```

### 5.5 StatusBadge Component (`src/components/admin/StatusBadge.tsx`)

```tsx
'use client'

import { OrderStatus } from '@/types'
import { STATUS_LABELS } from '@/lib/constants'

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending:   'bg-amber-100 text-amber-800 border border-amber-200',
  confirmed: 'bg-blue-100 text-blue-800 border border-blue-200',
  ready:     'bg-green-100 text-green-800 border border-green-200',
  picked_up: 'bg-gray-100 text-gray-600 border border-gray-200',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
      ${STATUS_STYLES[status]}
    `}>
      {STATUS_LABELS[status]}
    </span>
  )
}
```

### 5.6 WhatsApp Share Button (`src/components/shared/WhatsAppButton.tsx`)

```tsx
'use client'

export function WhatsAppButton() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
  const message = encodeURIComponent(`Place your meat order at Ahadu Fresh Market here: ${appUrl}`)
  const href = `https://wa.me/?text=${message}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="
        inline-flex items-center gap-2 px-4 py-2 rounded-lg
        bg-green-500 hover:bg-green-600 text-white text-sm font-medium
        transition-colors duration-150
      "
    >
      {/* WhatsApp icon SVG */}
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15
          -.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075
          -.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059
          -.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52
          .149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52
          -.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51
          -.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372
          -.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074
          .149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625
          .712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413
          .248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.523 5.847L0 24l6.335-1.502
          A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818
          a9.818 9.818 0 01-5.001-1.371l-.36-.214-3.728.884.939-3.629-.235-.373
          A9.818 9.818 0 1112 21.818z"/>
      </svg>
      Share on WhatsApp
    </a>
  )
}
```

### 5.7 Site Header (`src/components/shared/SiteHeader.tsx`)

```tsx
import { WhatsAppButton } from './WhatsAppButton'

export function SiteHeader() {
  return (
    <header className="bg-crimson-900 text-white shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <img src="/logo.png" alt="Ahadu Market" className="w-10 h-10 object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Ahadu Fresh Meat</h1>
            <p className="text-crimson-200 text-sm">Reserve your order online</p>
          </div>
        </div>
        <WhatsAppButton />
      </div>
    </header>
  )
}
```

---

## 6. Page: Customer Order Form (`/`)

### 6.1 Overview

The public homepage. No authentication required. Customers fill out this form to submit a meat reservation.

**Route:** `/`  
**File:** `src/app/page.tsx`  
**Type:** Client Component (uses React state for form fields and counters)

### 6.2 Layout and UI Description

The page has three visual sections:

**Section A — Site Header** (see `SiteHeader` component above)
- Deep crimson (`bg-crimson-900`) horizontal bar
- Logo on the left, WhatsApp share button on the right

**Section B — Order Form Card**
- Centered, max-width `max-w-2xl`, padded `px-4`
- White background card with subtle shadow and rounded corners (`rounded-2xl shadow-md`)
- Card title: "Place Your Order" in dark crimson heading
- Subtitle: "Reserve your fresh meat — we'll confirm by phone"

Inside the card:

**Personal Info Section**
```
[ Full Name         ]  [ Phone Number      ]
[ Email Address                           ]
[ Pickup Date       ]
```
Each field is a labeled input with a bottom border or full border style. Labels are small gray text above each input. Inputs have `border border-gray-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-crimson-500`.

**Meat Selection Section**
Title: "Select Your Meats (in pounds)" in a smaller section heading.

Each of the 6 meat types is a card row:
```
┌─────────────────────────────────────────┐
│  [Icon]  Tire / Tere        Raw beef    │
│                        [ – ] [ 0 ] [ + ]│
└─────────────────────────────────────────┘
```
- Meat name bold, description in gray smaller text
- `[ – ]` and `[ + ]` are buttons: `w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-lg font-bold hover:bg-crimson-50 hover:border-crimson-400 transition-colors`
- The current pound count is displayed between them: `w-12 text-center text-lg font-semibold text-gray-800`
- Minus button is disabled (grayed out, cursor-not-allowed) when the count is 0

**Notes Section**
A `<textarea>` with label "Special Requests (optional)", `rows={3}`, same styling as inputs.

**Submit Button**
Full-width, deep crimson: `w-full py-3 rounded-xl bg-crimson-900 hover:bg-crimson-800 text-white text-base font-semibold transition-colors`  
Text: "Submit Order"  
Shows a loading spinner when submission is in progress.

**Success State**
When order is submitted successfully, replace the form with a success card:
- Green checkmark icon (large, centered)
- "Your order has been received!" heading
- "We'll confirm your order by phone. A confirmation has been sent to [email]."
- "Place Another Order" button that resets the form

**Error State**
If submission fails, show a red error banner above the submit button:
- "Something went wrong. Please try again or call us directly."

### 6.3 Component Structure

```
page.tsx (Client Component)
└── SiteHeader
└── OrderForm (Client Component — owns all form state)
    ├── Inputs: name, phone, email, pickupDate
    ├── MeatCounter × 6 (one per meat type)
    ├── Notes textarea
    ├── Submit button
    └── OrderSuccessMessage (shown after successful submit)
```

### 6.4 MeatCounter Component (`src/components/order/MeatCounter.tsx`)

```tsx
'use client'

interface MeatCounterProps {
  label: string
  description: string
  value: number
  onChange: (newValue: number) => void
}

export function MeatCounter({ label, description, value, onChange }: MeatCounterProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div>
        <p className="font-semibold text-gray-800">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
          className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center
            text-gray-600 font-bold text-lg
            hover:bg-crimson-50 hover:border-crimson-400 hover:text-crimson-900
            disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300
            transition-colors"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span className="w-12 text-center text-lg font-semibold text-gray-800 tabular-nums">
          {value} lb{value !== 1 ? 's' : ''}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center
            text-gray-600 font-bold text-lg
            hover:bg-crimson-50 hover:border-crimson-400 hover:text-crimson-900
            transition-colors"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  )
}
```

### 6.5 Form State and Submission Logic

The `OrderForm` component manages state with `useState`:

```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MEAT_TYPES } from '@/lib/constants'
import { MeatCounter } from './MeatCounter'

type FormState = {
  customer_name: string
  customer_phone: string
  customer_email: string
  pickup_date: string
  tire_lbs: number
  kitfo_lbs: number
  tibs_lbs: number
  godin_lbs: number
  gubet_lbs: number
  kidney_lbs: number
  notes: string
}

const INITIAL_STATE: FormState = {
  customer_name: '',
  customer_phone: '',
  customer_email: '',
  pickup_date: '',
  tire_lbs: 0,
  kitfo_lbs: 0,
  tibs_lbs: 0,
  godin_lbs: 0,
  gubet_lbs: 0,
  kidney_lbs: 0,
  notes: '',
}

export function OrderForm() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const supabase = createClient()

  const totalLbs = MEAT_TYPES.reduce((sum, mt) => sum + form[mt.key], 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validation
    if (!form.customer_name.trim()) return setError('Please enter your name.')
    if (!form.customer_phone.trim()) return setError('Please enter your phone number.')
    if (!form.customer_email.trim()) return setError('Please enter your email address.')
    if (!form.pickup_date) return setError('Please select a pickup date.')
    if (totalLbs === 0) return setError('Please select at least one meat type.')

    setLoading(true)

    const { error: insertError } = await supabase
      .from('orders')
      .insert([{
        customer_name:  form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_email: form.customer_email.trim(),
        pickup_date:    form.pickup_date,
        tire_lbs:       form.tire_lbs,
        kitfo_lbs:      form.kitfo_lbs,
        tibs_lbs:       form.tibs_lbs,
        godin_lbs:      form.godin_lbs,
        gubet_lbs:      form.gubet_lbs,
        kidney_lbs:     form.kidney_lbs,
        notes:          form.notes.trim() || null,
        status:         'pending',
      }])

    setLoading(false)

    if (insertError) {
      setError('Something went wrong submitting your order. Please try again.')
      return
    }

    setSubmittedEmail(form.customer_email)
    setSuccess(true)
  }

  if (success) {
    return <OrderSuccessMessage email={submittedEmail} onReset={() => { setForm(INITIAL_STATE); setSuccess(false) }} />
  }

  // ... render form JSX
}
```

### 6.6 Validation Rules Summary

| Field | Rule |
|-------|------|
| customer_name | Non-empty string |
| customer_phone | Non-empty string |
| customer_email | Non-empty, valid email format (use `input type="email"`) |
| pickup_date | Non-empty date string |
| Meat quantities | At least one must be > 0 |
| Any individual meat | Cannot go below 0 |

---

## 7. Page: Admin Login (`/admin/login`)

### 7.1 Overview

A private login page. Admins navigate here directly. If already authenticated, redirect to `/admin/dashboard`.

**Route:** `/admin/login`  
**File:** `src/app/admin/login/page.tsx`  
**Type:** Client Component

### 7.2 Layout and UI Description

Centered page, full-screen height. Background: `bg-gray-50`.

**Login Card** (`max-w-md mx-auto mt-20 bg-white rounded-2xl shadow-lg p-8`):

- Top: Logo (centered) + "Ahadu Market Admin" heading + subtitle "Staff Access Only"
- Email input with label
- Password input with label (type="password")
- "Sign In" button: full-width, crimson, same style as order form submit
- Error message in red if credentials are invalid

**On Success:** `router.push('/admin/dashboard')`

### 7.3 Logic

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
      return
    }

    router.push('/admin/dashboard')
  }

  // ... render JSX
}
```

---

## 8. Page: Admin Dashboard (`/admin/dashboard`)

### 8.1 Overview

The main admin view. Shows all orders, today's meat totals, search bar, and order status management.

**Route:** `/admin/dashboard`  
**File:** `src/app/admin/dashboard/page.tsx`  
**Type:** Client Component (needs interactivity for search, status updates, real-time)

### 8.2 Layout and UI Description

**Admin Header** (top of all admin pages — see component below)
- Dark crimson bar with "Ahadu Admin" on the left
- Navigation links: "Orders" | "Admins" | Sign Out button on the right

**Page Content** (`max-w-7xl mx-auto px-4 py-6`):

**Row 1 — Page title + Action buttons**
```
Orders                    [ Print ] [ Export Excel ] [ + Share on WhatsApp ]
```
- "Orders" as H1 heading
- Buttons right-aligned:
  - Print: `bg-white border border-gray-200 text-gray-700 hover:bg-gray-50`
  - Export Excel: `bg-white border border-gray-200 text-gray-700 hover:bg-gray-50`
  - WhatsApp Share: green, same as public-facing component

**Row 2 — Today's Totals Panel**

A card with gray background:
```
Today's Pickup Totals — [Today's Date]
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│  Tire    │  Kitfo   │  Tibs    │  Godin   │  Gubet   │  Kidney  │
│  12 lbs  │   8 lbs  │   0 lbs  │   3 lbs  │   0 lbs  │   2 lbs  │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```
Each cell: label small gray, number large bold crimson, "lbs" small gray below.  
Layout: 6 columns on desktop (`grid grid-cols-6`), 3 columns on mobile (`grid-cols-3`).

**Row 3 — Search Bar**
```
[ 🔍 Search by name or phone...                                    ]
```
Full width input. Client-side filtering of the orders array.

**Row 4 — Orders Table**

A horizontal scroll wrapper on mobile: `overflow-x-auto`.

Table (`w-full text-sm text-left`):

| Column | Width / Notes |
|--------|---------------|
| Customer | Name + phone below in gray |
| Pickup Date | Formatted (e.g., "Jun 28, 2026") |
| Order Details | Meat name: X lbs, only those > 0. Stacked list |
| Notes | Truncated to 1 line, full text in tooltip |
| Status | `<StatusBadge>` |
| Actions | "Advance Status" button; hidden if `picked_up` |

**Table Header:** `bg-gray-50 text-gray-500 uppercase text-xs tracking-wider`  
**Table Rows:** Alternating `bg-white` / `bg-gray-50`, hover `bg-crimson-50/30`

**Advance Status Button:**
- Text shows next status: e.g., "Mark Confirmed", "Mark Ready", "Mark Picked Up"
- Style: `text-xs px-2 py-1 rounded border border-crimson-200 text-crimson-800 hover:bg-crimson-50`
- Clicking calls Supabase UPDATE and refreshes the row

**Empty State** (when no orders or no search results):
- Centered, gray text: "No orders found."

### 8.3 TotalsPanel Component (`src/components/admin/TotalsPanel.tsx`)

```tsx
'use client'

import { Order } from '@/types'
import { MEAT_TYPES } from '@/lib/constants'
import { format } from 'date-fns'

interface TotalsPanelProps {
  orders: Order[]
}

export function TotalsPanel({ orders }: TotalsPanelProps) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayOrders = orders.filter(o => o.pickup_date === today)

  const totals = MEAT_TYPES.map(mt => ({
    label: mt.label,
    total: todayOrders.reduce((sum, o) => sum + (o[mt.key] ?? 0), 0),
  }))

  return (
    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 mb-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Today's Pickup Totals — {format(new Date(), 'MMMM d, yyyy')}
      </h2>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {totals.map(({ label, total }) => (
          <div key={label} className="text-center">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-crimson-900">{total}</p>
            <p className="text-xs text-gray-400">lbs</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 8.4 Data Fetching and Real-Time Updates

```tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order } from '@/types'

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) setOrders(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()

    // Real-time subscription for new orders
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchOrders()  // Refetch on any change
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchOrders])

  // Client-side search filter
  const filtered = orders.filter(o =>
    o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_phone.includes(search)
  )

  async function advanceStatus(order: Order) {
    const nextStatus = STATUS_NEXT[order.status]
    if (!nextStatus) return

    await supabase
      .from('orders')
      .update({ status: nextStatus })
      .eq('id', order.id)

    // Real-time will trigger refetch, but optimistically update:
    setOrders(prev =>
      prev.map(o => o.id === order.id ? { ...o, status: nextStatus as any } : o)
    )
  }

  // ... render JSX with filtered orders
}
```

### 8.5 Admin Header Component (`src/components/admin/AdminHeader.tsx`)

```tsx
'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AdminHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors ${
        pathname === href
          ? 'text-white'
          : 'text-crimson-200 hover:text-white'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <header className="bg-crimson-900 text-white shadow print:hidden">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg">Ahadu Admin</span>
          <nav className="flex items-center gap-4">
            {navLink('/admin/dashboard', 'Orders')}
            {navLink('/admin/admins', 'Admins')}
          </nav>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-crimson-200 hover:text-white transition-colors"
        >
          Sign Out
        </button>
      </div>
    </header>
  )
}
```

---

## 9. Page: Admin Management (`/admin/admins`)

### 9.1 Overview

Allows logged-in admins to view, add, and remove other admin accounts.

**Route:** `/admin/admins`  
**File:** `src/app/admin/admins/page.tsx`  
**Type:** Client Component

### 9.2 Layout and UI Description

**Page Title:** "Admin Accounts" H1

**Add Admin Section** (card at the top):
- Heading: "Add New Admin"
- Two inputs side by side: Email | Password
- "Add Admin" button (crimson)
- Success/error feedback inline

**Admin List Section** (card below):
- Heading: "Current Admins"
- Table with columns: Email | Date Added | Actions
- Each row has a "Remove" button (red, outlined)
- The row for the currently logged-in admin shows "You" instead of a remove button (cannot self-remove)

### 9.3 Logic

```tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AdminUser } from '@/types'

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [addSuccess, setAddSuccess] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id ?? null)

      const { data } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: true })

      if (data) setAdmins(data)
    }
    load()
  }, [])

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault()
    setAddLoading(true)
    setAddError(null)
    setAddSuccess(false)

    // Call a Next.js API route that uses the service role key to create the user
    // (cannot use service role key client-side)
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, password: newPassword }),
    })

    const json = await res.json()

    if (!res.ok) {
      setAddError(json.error ?? 'Failed to create admin.')
    } else {
      setAddSuccess(true)
      setNewEmail('')
      setNewPassword('')
      // Refresh list
      const { data } = await supabase.from('admin_users').select('*').order('created_at')
      if (data) setAdmins(data)
    }

    setAddLoading(false)
  }

  async function handleRemoveAdmin(adminId: string) {
    if (!confirm('Remove this admin? They will no longer be able to log in.')) return

    await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: adminId }),
    })

    setAdmins(prev => prev.filter(a => a.id !== adminId))
  }

  // ... render JSX
}
```

### 9.4 API Routes for Admin User Management

Because creating and deleting Supabase Auth users requires the **service role key**, which must never be exposed in the browser, create two Next.js API route handlers:

**`src/app/api/admin/create-user/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  // Verify the requesting user is an authenticated admin
  // (In a more rigorous setup, verify the session cookie here)

  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required.' }, { status: 400 })
  }

  // Create user in Supabase Auth
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Add to admin_users table
  await supabaseAdmin
    .from('admin_users')
    .insert([{ id: data.user.id, email: data.user.email }])

  return NextResponse.json({ success: true })
}
```

**`src/app/api/admin/delete-user/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { userId } = await req.json()

  if (!userId) {
    return NextResponse.json({ error: 'userId required.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Cascade delete in admin_users is handled by the ON DELETE CASCADE FK

  return NextResponse.json({ success: true })
}
```

---

## 10. Supabase Edge Function — Email Notification

### 10.1 Overview

When a new order is inserted into the `orders` table, a Supabase Edge Function sends a confirmation email to the customer.

**Function name:** `send-order-confirmation`  
**Trigger:** Database Webhook (INSERT on `orders` table) — configured in Supabase Dashboard  
**Runtime:** Deno (Supabase Edge Functions run on Deno)  
**Email library:** `denomailer`

### 10.2 Setting Up the Trigger (Dashboard Method)

1. Go to Supabase Dashboard → **Database** → **Webhooks**
2. Click **Create a new hook**
3. Name: `on-new-order-email`
4. Table: `orders`
5. Events: Check **INSERT** only
6. Type: **Supabase Edge Functions**
7. Edge Function: Select `send-order-confirmation`
8. HTTP Method: POST
9. Click **Confirm**

### 10.3 Edge Function Code

**File:** `supabase/functions/send-order-confirmation/index.ts`

```ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

interface OrderPayload {
  record: {
    id: string
    customer_name: string
    customer_phone: string
    customer_email: string
    pickup_date: string
    tire_lbs: number
    kitfo_lbs: number
    tibs_lbs: number
    godin_lbs: number
    gubet_lbs: number
    kidney_lbs: number
    notes: string | null
    status: string
    created_at: string
  }
}

const MEAT_LABELS: Record<string, string> = {
  tire_lbs:   'Tire / Tere',
  kitfo_lbs:  'Kitfo',
  tibs_lbs:   'Tibs',
  godin_lbs:  'Godin',
  gubet_lbs:  'Gubet',
  kidney_lbs: 'Kidney',
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function buildOrderSummary(record: OrderPayload['record']): string {
  const meatKeys = ['tire_lbs', 'kitfo_lbs', 'tibs_lbs', 'godin_lbs', 'gubet_lbs', 'kidney_lbs']
  return meatKeys
    .filter(key => (record as any)[key] > 0)
    .map(key => `  • ${MEAT_LABELS[key]}: ${(record as any)[key]} lbs`)
    .join('\n')
}

serve(async (req) => {
  try {
    const payload: OrderPayload = await req.json()
    const order = payload.record

    // Only process inserts (webhook sends the inserted record)
    if (!order?.customer_email) {
      return new Response('No email address found', { status: 200 })
    }

    const gmailUser     = Deno.env.get('GMAIL_USER')!
    const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD')!
    const fromName      = Deno.env.get('FROM_NAME') ?? 'Ahadu Fresh Meat'

    const orderSummary = buildOrderSummary(order)
    const pickupDateFormatted = formatDate(order.pickup_date)

    const emailBody = `
Dear ${order.customer_name},

Thank you for your order with Ahadu Fresh Meat! We've received your reservation and will confirm it by phone shortly.

━━━━━━━━━━━━━━━━━━━━━━━━━━
ORDER SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━

Pickup Date: ${pickupDateFormatted}

Meat Ordered:
${orderSummary}

${order.notes ? `Special Requests: ${order.notes}\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━

If you need to make changes or have any questions, please call us directly.

We look forward to serving you!

Warm regards,
The Ahadu Fresh Meat Team
    `.trim()

    const client = new SMTPClient({
      connection: {
        hostname: 'smtp.gmail.com',
        port: 465,
        tls: true,
        auth: {
          username: gmailUser,
          password: gmailPassword,
        },
      },
    })

    await client.send({
      from: `${fromName} <${gmailUser}>`,
      to: order.customer_email,
      subject: `Your Ahadu Fresh Meat Order Confirmation — ${pickupDateFormatted}`,
      content: emailBody,
    })

    await client.close()

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    console.error('Email send error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
```

### 10.4 Deploying the Edge Function

Install the Supabase CLI if not already installed:
```bash
npm install -g supabase
```

Link to your project:
```bash
supabase login
supabase link --project-ref your-project-id
```

Deploy the function:
```bash
supabase functions deploy send-order-confirmation
```

Set secrets:
```bash
supabase secrets set GMAIL_USER=clientsgmail@gmail.com
supabase secrets set GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"
supabase secrets set FROM_NAME="Ahadu Fresh Meat"
```

### 10.5 Gmail App Password Setup

The client must do this in their Google Account:
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Navigate to **Security** → **2-Step Verification** (must be enabled first)
3. Scroll down to **App passwords**
4. Select **Mail** and **Other (Custom name)**: name it "Ahadu Meat App"
5. Click **Generate** — copy the 16-character password
6. Use this as `GMAIL_APP_PASSWORD`

---

## 11. Auth Flow and Middleware

### 11.1 How Authentication Works

Supabase Auth uses JWT tokens stored in HTTP-only cookies (via `@supabase/ssr`). When an admin logs in:

1. Supabase returns an access token and refresh token
2. The `@supabase/ssr` helper stores these in cookies
3. Every subsequent request from that browser includes the cookies
4. The Next.js middleware checks the cookies and verifies the session

### 11.2 Middleware (`src/middleware.ts`)

This file runs on every request before the page renders. It protects all `/admin/*` routes except `/admin/login`.

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protect all /admin/* routes except /admin/login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // If already logged in and going to /admin/login, redirect to dashboard
  if (pathname === '/admin/login' && user) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

### 11.3 Admin Layout (`src/app/admin/layout.tsx`)

The admin layout wraps all `/admin/*` pages except login with the `AdminHeader`:

```tsx
import { AdminHeader } from '@/components/admin/AdminHeader'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <main>{children}</main>
    </div>
  )
}
```

Note: The login page is at `/admin/login`, which is inside `admin/layout.tsx`. To avoid showing the `AdminHeader` on the login page, either:
- Move login outside the admin layout directory, or
- Conditionally render `AdminHeader` based on pathname within the layout

Recommended: move the login page to `/login` (outside `/admin`) and update middleware accordingly. This simplifies the layout structure. For this project, a simpler approach — make login its own layout inside `/admin/login/(login-layout)/` — is also acceptable.

---

## 12. State Management Approach

This application uses a **simple, local-state approach** without Redux or Zustand. This is appropriate given the small scale.

### 12.1 Data Flow Summary

```
Supabase DB
    ↕ (Supabase JS Client)
Browser Client Component (useState)
    ↕ (props)
Child Components
```

### 12.2 Rules for Server vs Client Components

| Use Case | Component Type | Why |
|----------|---------------|-----|
| Pages that need real-time data, search, form state | `'use client'` | Requires hooks and browser APIs |
| Static or server-rendered layout shells | Server Component (default) | Better performance, no JS sent |
| Admin Header (needs router, auth state) | `'use client'` | Uses `useRouter`, `usePathname` |
| StatusBadge, MeatCounter (pure UI with events) | `'use client'` | Has onClick handlers |
| SiteHeader (static) | Server Component | No interactivity needed |

### 12.3 Supabase Client Lifecycle

- Create the browser Supabase client **once** using the `createClient()` helper from `src/lib/supabase/client.ts`
- In Client Components, call `createClient()` at the component level (not inside effects) — the `@supabase/ssr` client is designed to be instantiated per-render
- For Server Components and API routes, use the server client from `src/lib/supabase/server.ts`

### 12.4 Real-Time Subscription Pattern

Subscribe to real-time changes in the dashboard using `useEffect`:

```ts
useEffect(() => {
  const channel = supabase
    .channel('orders-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [])
```

This ensures the admin dashboard updates live when a customer submits a new order.

---

## 13. Excel Export Implementation

### 13.1 Overview

When the admin clicks "Export Excel", all currently visible orders (after search filter) are exported to an `.xlsx` file. This runs entirely client-side using SheetJS.

### 13.2 Implementation (`src/lib/excel.ts`)

```ts
import * as XLSX from 'xlsx'
import { Order } from '@/types'
import { format } from 'date-fns'
import { STATUS_LABELS, MEAT_TYPES } from './constants'

export function exportOrdersToExcel(orders: Order[], filename = 'ahadu-orders') {
  const rows = orders.map(o => {
    const meatDetails = MEAT_TYPES
      .filter(mt => o[mt.key] > 0)
      .map(mt => `${mt.label}: ${o[mt.key]} lbs`)
      .join(', ')

    return {
      'Customer Name':  o.customer_name,
      'Phone':          o.customer_phone,
      'Email':          o.customer_email,
      'Pickup Date':    format(new Date(o.pickup_date + 'T00:00:00'), 'MMM d, yyyy'),
      'Tire (lbs)':     o.tire_lbs,
      'Kitfo (lbs)':    o.kitfo_lbs,
      'Tibs (lbs)':     o.tibs_lbs,
      'Godin (lbs)':    o.godin_lbs,
      'Gubet (lbs)':    o.gubet_lbs,
      'Kidney (lbs)':   o.kidney_lbs,
      'Order Details':  meatDetails,
      'Notes':          o.notes ?? '',
      'Status':         STATUS_LABELS[o.status],
      'Ordered At':     format(new Date(o.created_at), 'MMM d, yyyy h:mm a'),
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)

  // Auto-fit column widths
  const colWidths = Object.keys(rows[0] ?? {}).map(key => ({
    wch: Math.max(key.length, ...rows.map(r => String((r as any)[key] ?? '').length))
  }))
  worksheet['!cols'] = colWidths

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders')

  const dateStr = format(new Date(), 'yyyy-MM-dd')
  XLSX.writeFile(workbook, `${filename}-${dateStr}.xlsx`)
}
```

### 13.3 Usage in Dashboard

```tsx
import { exportOrdersToExcel } from '@/lib/excel'

// In the dashboard component:
<button
  onClick={() => exportOrdersToExcel(filteredOrders)}
  className="..."
>
  Export Excel
</button>
```

Pass `filteredOrders` (the search-filtered array) so only what the admin sees gets exported.

---

## 14. Print Implementation

### 14.1 Approach

Use CSS `@media print` rules to hide all interactive admin UI elements and show only the orders table and totals panel when the admin triggers browser print (`Ctrl+P` or the "Print" button).

### 14.2 CSS (`src/app/globals.css`)

Add these rules after the Tailwind directives:

```css
@media print {
  /* Hide non-content elements */
  .print\:hidden,
  header,
  .no-print {
    display: none !important;
  }

  /* Full-width layout for print */
  body, main {
    margin: 0;
    padding: 0;
    background: white;
  }

  /* Remove shadows and borders from cards */
  .shadow,
  .shadow-md,
  .shadow-lg,
  [class*="shadow"] {
    box-shadow: none !important;
  }

  /* Ensure table doesn't break awkwardly */
  table {
    page-break-inside: auto;
  }

  tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }

  /* Reset background colors for print */
  .bg-crimson-900,
  .bg-gray-50,
  .bg-gray-100 {
    background: white !important;
    color: black !important;
  }

  /* Print header with shop name */
  .print-header {
    display: block !important;
    text-align: center;
    font-size: 1.25rem;
    font-weight: bold;
    margin-bottom: 1rem;
  }
}
```

### 14.3 Tailwind Print Utilities

Tailwind v3 has built-in `print:` variant support. Use these on admin elements to hide them:

```tsx
// In AdminHeader:
<header className="... print:hidden">

// Action buttons row:
<div className="flex gap-2 print:hidden">
  <button>Print</button>
  <button>Export Excel</button>
</div>

// Search bar:
<div className="print:hidden">
  <SearchBar ... />
</div>
```

Add a print-only heading in the dashboard that shows during print:

```tsx
<div className="hidden print:block text-center text-xl font-bold mb-4">
  Ahadu Fresh Meat — Orders Report
  <br />
  <span className="text-sm font-normal text-gray-500">
    Printed: {format(new Date(), 'MMMM d, yyyy h:mm a')}
  </span>
</div>
```

### 14.4 Print Button Implementation

```tsx
<button
  onClick={() => window.print()}
  className="..."
>
  Print
</button>
```

---

## 15. WhatsApp Share Button

### 15.1 How It Works

No WhatsApp API or Business Account needed. The standard `wa.me` URL opens WhatsApp with a pre-filled message:

```
https://wa.me/?text=<URL-encoded message>
```

When a user taps this on mobile, WhatsApp opens. On desktop, it opens WhatsApp Web.

### 15.2 Implementation

The `WhatsAppButton` component (already defined in Section 5.6) handles this. Key points:

- The message includes the app URL pulled from `NEXT_PUBLIC_APP_URL`
- The URL is encoded with `encodeURIComponent`
- Opens in a new tab with `target="_blank"`
- No API keys, no business account, no extra setup required

### 15.3 Placement

- **Customer form page:** In the `SiteHeader` (top right)
- **Admin dashboard:** In the action buttons row (top right of the orders list), beside Print and Export

---

## 16. Deployment to Vercel

### 16.1 Prerequisites

- A GitHub/GitLab/Bitbucket repository with the project code
- A Vercel account (free tier is sufficient)

### 16.2 Steps

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/ahadu-meat-reservation.git
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repository

3. Vercel auto-detects Next.js. Accept the default settings.

4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (set to your Vercel domain, e.g., `https://ahadu-meat-reservation.vercel.app`)

5. Click **Deploy**

6. Once deployed, update `NEXT_PUBLIC_APP_URL` if the final domain changes (e.g., a custom domain).

### 16.3 Custom Domain (Optional)

In the Vercel project settings → **Domains**, add the client's custom domain (e.g., `orders.ahadumarket.com`). Follow Vercel's DNS configuration instructions.

### 16.4 Continuous Deployment

Every push to the `main` branch will automatically trigger a new deployment on Vercel. No manual steps needed after the initial setup.

---

## Quick Reference: Key Files Checklist

| File | Purpose | Status |
|------|---------|--------|
| `src/middleware.ts` | Route protection | Must implement first |
| `src/lib/supabase/client.ts` | Browser Supabase client | Setup early |
| `src/lib/supabase/server.ts` | Server Supabase client | Setup early |
| `src/types/index.ts` | TypeScript types | Setup early |
| `src/lib/constants.ts` | Meat types, status labels | Setup early |
| `src/app/page.tsx` | Customer order form | Day 1–2 |
| `src/components/order/MeatCounter.tsx` | +/- counter | Day 1–2 |
| `src/app/admin/login/page.tsx` | Admin login | Day 3 |
| `src/app/admin/dashboard/page.tsx` | Order management | Day 3 |
| `src/components/admin/TotalsPanel.tsx` | Today's totals | Day 3 |
| `src/components/admin/StatusBadge.tsx` | Colored status pills | Day 3 |
| `src/app/admin/admins/page.tsx` | Admin user management | Day 4 |
| `src/app/api/admin/create-user/route.ts` | Create admin API | Day 4 |
| `src/app/api/admin/delete-user/route.ts` | Delete admin API | Day 4 |
| `src/lib/excel.ts` | SheetJS export | Day 4 |
| `src/app/globals.css` | Print styles | Day 4 |
| `supabase/functions/send-order-confirmation/index.ts` | Email function | Day 2 |

---

## Environment Variables Summary

| Variable | Where Used | Exposed to Browser? |
|----------|-----------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Yes (safe) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Yes (safe — has RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | API routes only | No (never) |
| `NEXT_PUBLIC_APP_URL` | WhatsApp button, emails | Yes (safe) |
| `GMAIL_USER` | Edge Function only | No (Supabase secret) |
| `GMAIL_APP_PASSWORD` | Edge Function only | No (Supabase secret) |
| `FROM_NAME` | Edge Function only | No (Supabase secret) |
