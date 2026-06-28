# Mobile App Implementation Plan
# Ahadu Fresh Meat Reservation — React Native (Expo)

> This plan is derived from the **actual current web codebase** (`web/`), not the
> original web plan. It mirrors the real features, the real Supabase schema/RLS,
> the real "Premium Butcher" design, and the real email/admin architecture that
> shipped. The mobile app reuses the **same Supabase backend** — no backend rebuild.

---

## Table of Contents
1. [Goals & Scope](#1-goals--scope)
2. [What already exists (the shared backend)](#2-what-already-exists-the-shared-backend)
3. [Tech Stack & Rationale](#3-tech-stack--rationale)
4. [Critical Architecture Decisions](#4-critical-architecture-decisions)
5. [Project Setup](#5-project-setup)
6. [Configuration & Environment](#6-configuration--environment)
7. [Folder Structure](#7-folder-structure)
8. [Design System Port (Premium Butcher → NativeWind)](#8-design-system-port)
9. [Shared Code (types, constants, supabase client)](#9-shared-code)
10. [Navigation Map](#10-navigation-map)
11. [Screen-by-Screen Spec](#11-screen-by-screen-spec)
12. [Realtime](#12-realtime)
13. [Push Notifications (recommended)](#13-push-notifications-recommended)
14. [Email Confirmation on Mobile](#14-email-confirmation-on-mobile)
15. [Testing Strategy](#15-testing-strategy)
16. [Build & Release (EAS)](#16-build--release-eas)
17. [Phased Timeline (~6 days)](#17-phased-timeline)
18. [Decisions to Confirm](#18-decisions-to-confirm)
19. [Handover Notes](#19-handover-notes)

---

## 1. Goals & Scope

Build a **mobile-friendly native app** (iOS + Android) that mirrors the web
customer experience and talks to the **same Supabase project** as the web app
(`dqduwkruqkxjtbtinqxv`).

**Customer features:**
- Register / Login / email verification / forgot password
- Place an order (name, phone, pickup date, 6 meat types w/ pounds, notes)
- Order confirmation screen + confirmation email
- "My Orders" with live status tracking (pending → confirmed → ready → picked up)
- WhatsApp share of the order link
- Premium Butcher look & feel ported to native

**Admin features (the app serves BOTH roles):**
- Admin login (Supabase auth + `admin_users` membership check, like web)
- Dashboard: all orders, search, status filter, date filter, **today/total pounds**
- Change order status (forward/back, like the web dropdown)
- Live updates (realtime) as orders come in / change
- Export orders (share as CSV/file) — mobile equivalent of the web Excel export
- Manage admins: add / remove (remove-self blocked) via a secure Edge Function

**Role-based app:** after login the app checks `admin_users`. Admins land in the
**Admin area**; customers land in the **customer tabs**. One binary, two experiences —
the same person could even have both (an admin can still place orders). See §10.

> **Backend impact:** almost all admin actions already work on mobile through RLS +
> the admin's own session (no service-role key). The **only** new backend piece is a
> Supabase **Edge Function** for add/remove-admin (which needs the service-role key
> server-side). This Edge Function also lets the **web** drop its two Next.js admin
> API routes later, unifying both platforms. See [§4.2](#4-critical-architecture-decisions).

---

## 2. What already exists (the shared backend)

The mobile app consumes the **exact same backend** the web app uses. Nothing here
needs rebuilding:

### Database (Supabase Postgres) — see `supabase/migrations/`
- **`orders`** table: `id, customer_name, customer_phone, customer_email,
  pickup_date, tire_lbs, kitfo_lbs, tibs_lbs, godin_lbs, gubet_lbs, kidney_lbs,
  notes, status, created_at, user_id`
- **`admin_users`** table: `id, email, created_at`
- **`order_status`** enum: `pending | confirmed | ready | picked_up`
- **RLS (migration 006):**
  - Anyone (anon/authenticated) can **INSERT** an order
  - Customers can **SELECT** only their own orders (`customer_email = jwt email` OR `user_id = auth.uid()`)
  - Admins (in `admin_users`, checked via `is_admin()`) can read/update/delete all
- **Realtime** enabled on `orders`
- **`is_admin(uuid)`** SECURITY DEFINER function (non-recursive admin check)

### Auth (Supabase GoTrue)
- Email/password, **email confirmation required**
- **Site URL** set to the production web domain (confirmation links land on web)

### Email (⚠️ web-specific, see §4 & §14)
- Currently a **Next.js API route** `web/src/app/api/send-confirmation/route.ts`
  using **nodemailer + Gmail SMTP** (env vars on Vercel). This is server code that
  the mobile app cannot run directly — it must either call the deployed endpoint or
  we move email to a Supabase Edge Function.

### Admin user management (⚠️ web-specific)
- Next.js API routes `create-user` / `delete-user` using the **service-role key**.
  Server-only by design.

### Reference values (from the live app)
- `EXPO_PUBLIC_SUPABASE_URL = https://dqduwkruqkxjtbtinqxv.supabase.co`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY = <the anon public key>` (safe to ship in the app —
  protected by RLS, exactly like the web app)
- Meat types & statuses: identical to `web/src/lib/constants.ts` (see §9)

---

## 3. Tech Stack & Rationale

| Concern | Choice | Why |
|---|---|---|
| Framework | **Expo (managed)** | No Xcode/Android Studio needed locally; build iOS from Linux via EAS; test on a real phone via Expo Go. Best fit for your machine + no prior mobile experience. |
| Language | **TypeScript** | Same as web; reuse `types` + `constants` almost verbatim. |
| Navigation | **Expo Router** | File-based routing — feels like Next.js App Router you already know. |
| Styling | **NativeWind v4** | Tailwind classes in React Native — reuse the same "Premium Butcher" tokens and mental model from the web rebuild. |
| Backend SDK | **`@supabase/supabase-js`** | Same client API as web (`createClient`, `auth`, `from`, realtime channels). |
| Session storage | **`@react-native-async-storage/async-storage`** | Supabase needs a storage adapter in RN to persist the login session. |
| Fonts | **`expo-font` + `@expo-google-fonts/fraunces` + `@expo-google-fonts/plus-jakarta-sans`** | Same typeface pairing as web (Fraunces display + Plus Jakarta Sans body). |
| Dates | **`date-fns`** | Same as web for pickup/created formatting. |
| Sharing | **`expo-linking` / React Native `Linking`** | WhatsApp share via `wa.me` URL. |
| Notifications (opt) | **`expo-notifications`** | Push order-status updates — the killer native feature. |
| Build/Release | **EAS Build + EAS Submit** | Cloud builds (iOS without a Mac), store submission. |

---

## 4. Critical Architecture Decisions

These are the places where the mobile app **cannot** simply copy the web app,
because the web app relies on server-only Next.js code.

### 4.1 Confirmation email
The web sends the order email from a **Next.js server route** (`/api/send-confirmation`)
using nodemailer. A mobile app has no server. Two options:

- **Option A (fast, recommended for v1):** mobile `POST`s the order details to the
  **already-deployed** endpoint
  `https://meat-reservation.vercel.app/api/send-confirmation`. Zero new backend
  work; reuses what already works. (Optionally lock the route to a shared secret.)
- **Option B (cleanest long-term):** move emailing into a **Supabase Edge Function**
  triggered by a **DB webhook on `orders` INSERT**. Then *both* web and mobile get
  emails automatically with no client call at all — true shared backend. Requires a
  new Edge Function + webhook (one-time). Recommended once v1 is stable.

➡️ **v1 uses Option A.** Flagged as a follow-up to migrate to Option B.

### 4.2 Admin features (admin is on BOTH platforms)
Split admin actions into two buckets:

**Bucket A — works on mobile with NO new backend (via RLS + admin session):**
- View **all** orders, search/filter (RLS policy "admins read all orders" via `is_admin()`)
- **Change order status** (RLS "admins update orders")
- Totals per meat type (computed client-side from the orders, like web)
- Read the admin list (RLS "admins read admin list")
- Realtime on `orders`

These are plain `supabase-js` calls authenticated with the admin's normal session —
the **web dashboard itself uses the anon-key client, not the service-role key**, so
mobile does exactly the same. ✅ Zero backend changes for the whole dashboard.

**Bucket B — needs the service-role key (must NOT ship in the app):**
- **Create admin** (creates an `auth.users` record via Admin API) and **delete admin**
  (removes auth user + `admin_users` row).

The web does Bucket B through two **Next.js API routes** that authenticate via the
SSR **cookie**. Mobile has a **Bearer token**, not a cookie, so it can't reuse those
as-is. ➡️ **Solution: one Supabase Edge Function `admin-manage`** that:
1. Receives the caller's JWT (`Authorization: Bearer <access_token>`)
2. Verifies the caller is an admin (`is_admin(auth.uid())`)
3. Uses the **service-role key (server-side, inside the function)** to create/delete
4. Returns success/error

Both **mobile and web** call this same function with their auth token. This is the
proper cross-platform pattern and lets the web later retire its two API routes.
The service-role key lives only in the Edge Function's secrets — never in any client.

> Net: building admin-on-both adds **one Edge Function** (for add/remove admin). The
> entire order dashboard needs no backend work.

### 4.3 Auth session persistence
In React Native, `supabase-js` needs an explicit storage adapter or the user is
logged out on every app restart. Use AsyncStorage + `autoRefreshToken` + an
`AppState` listener to refresh tokens in the foreground (see §9.3).

### 4.4 Email-confirmation link target
The Supabase **Site URL** points to the web domain, so the confirmation link opens
the **website**. For v1 that's fine: user taps confirm in the email (opens web "email
confirmed"), then returns to the app and logs in. *(Optional polish: configure a deep
link `ahadu://` + add it to Supabase redirect allow-list so confirm reopens the app.)*

### 4.5 The anon key is safe to ship
Same as web — the anon key only grants the `anon` role; **RLS** protects data. The
service-role key must never appear in the app.

---

## 5. Project Setup

Run from the repo root so the app lives beside `web/`:

```bash
# 1. Scaffold (TypeScript + Expo Router template)
npx create-expo-app@latest mobile --template
cd mobile

# 2. Core dependencies
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage
npx expo install react-native-url-polyfill            # required by supabase-js in RN
npx expo install expo-linking expo-constants expo-secure-store

# 3. Styling (NativeWind)
npm install nativewind tailwindcss@^3.4
npx tailwindcss init                                   # creates tailwind.config.js

# 4. Fonts + dates
npx expo install expo-font @expo-google-fonts/fraunces @expo-google-fonts/plus-jakarta-sans
npm install date-fns

# 5. UI bits used by customer + admin
npx expo install expo-linear-gradient @react-native-community/datetimepicker
npx expo install @react-native-picker/picker expo-sharing expo-file-system  # admin status picker + CSV export

# 6. (optional) push notifications + PDF print
npx expo install expo-notifications expo-device expo-print

# 7. Run it — scan the QR with Expo Go on your phone
npx expo start
```

> **Disk note:** this footprint is ~1–1.5 GB and you test on your physical phone via
> **Expo Go** — no Android Studio/emulator needed (you don't have the disk for those).

---

## 6. Configuration & Environment

Expo exposes public env vars prefixed `EXPO_PUBLIC_`.

**`mobile/.env`**
```bash
EXPO_PUBLIC_SUPABASE_URL=https://dqduwkruqkxjtbtinqxv.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon public key — same as web>
EXPO_PUBLIC_APP_URL=https://meat-reservation.vercel.app           # for WhatsApp share link
EXPO_PUBLIC_EMAIL_ENDPOINT=https://meat-reservation.vercel.app/api/send-confirmation
```

**`mobile/app.json`** (key fields)
```jsonc
{
  "expo": {
    "name": "Ahadu Fresh Meat",
    "slug": "ahadu-fresh-meat",
    "scheme": "ahadu",                  // deep-link scheme (for optional email deep links)
    "ios":     { "bundleIdentifier": "com.ahadu.freshmeat", "supportsTablet": true },
    "android": { "package": "com.ahadu.freshmeat" },
    "plugins": ["expo-router", "expo-font", "expo-secure-store"],
    "userInterfaceStyle": "light"       // app is light-themed (Premium Butcher)
  }
}
```

**`mobile/metro.config.js` + `babel.config.js`** — per NativeWind v4 setup
(add the NativeWind preset + the `nativewind/babel` plugin).

---

## 7. Folder Structure

```
mobile/
  app/                          # Expo Router (file-based routes)
    _layout.tsx                 # root: fonts, auth provider, gates auth
    index.tsx                   # redirect → (tabs) or /login based on session
    login.tsx
    register.tsx
    verify-email.tsx
    forgot-password.tsx
    (tabs)/                     # authenticated CUSTOMER area (bottom tabs)
      _layout.tsx               # Tab navigator (Order | My Orders | Profile)
      order.tsx                 # the order form (home)
      orders.tsx                # My Orders list
      profile.tsx               # account + sign out
    order/
      success.tsx               # order placed confirmation
      [id].tsx                  # order detail (optional)
    (admin)/                    # authenticated ADMIN area (bottom tabs, admins only)
      _layout.tsx               # Tab navigator (Orders | Admins | Account); guards is_admin
      dashboard.tsx             # all orders + search/filter/totals + status change
      admins.tsx                # add / remove admins (calls admin-manage Edge Function)
      account.tsx               # admin email + sign out
  src/
    lib/
      supabase.ts               # supabase client w/ AsyncStorage (see §9.3)
      constants.ts              # MEAT_TYPES, STATUS_LABELS, STATUS_NEXT (copy of web)
      email.ts                  # POST to EXPO_PUBLIC_EMAIL_ENDPOINT
      theme.ts                  # Premium Butcher tokens (mirrors web @theme)
    types/index.ts              # Order, MeatType, AdminUser, OrderStatus (copy of web)
    components/
      MeatCounter.tsx
      StatusBadge.tsx
      StatusProgress.tsx        # the pending→picked-up tracker
      PasswordInput.tsx         # show/hide eye toggle (like web)
      Button.tsx                # wine gradient primary button
      Field.tsx                 # labeled text input
      Screen.tsx                # safe-area + cream background wrapper
      WhatsAppButton.tsx
      Skeleton.tsx              # shimmer loading
      OrderRow.tsx              # admin: one order row (customer, meats, status picker)
      TotalsPanel.tsx           # admin: pounds-per-meat totals (mirrors web)
    lib/
      adminApi.ts               # calls the admin-manage Edge Function w/ the JWT
      exportCsv.ts              # build CSV + share via expo-sharing (mobile "Export")
    context/AuthContext.tsx     # session + role (isAdmin) state + helpers
  tailwind.config.js            # NativeWind theme = Premium Butcher palette
  global.css                    # NativeWind directives
  .env
  app.json
```

---

## 8. Design System Port

Recreate the web "Premium Butcher" palette in `tailwind.config.js` so the same
class names work in RN via NativeWind.

```js
// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{tsx,ts}', './src/**/*.{tsx,ts}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        cream:   { 50:'#FDFBF7',100:'#FAF6F0',200:'#F3ECE1',300:'#E9DECF' },
        wine:    { 50:'#FBF1F2',100:'#F6DFE2',300:'#D98A95',500:'#A82234',600:'#8A1A29',700:'#7A1420',800:'#5E0F19' },
        brass:   { 300:'#E2C98F',400:'#D4B16A',500:'#C8A35B',600:'#A9863F' },
        charcoal:'#1F1A17',
        warmgray:{ 400:'#A89C8E',500:'#8A7E70',600:'#6B6157' },
      },
      fontFamily: {
        display: ['Fraunces_600SemiBold'],
        sans:    ['PlusJakartaSans_400Regular'],
        semibold:['PlusJakartaSans_600SemiBold'],
        bold:    ['PlusJakartaSans_700Bold'],
      },
    },
  },
}
```

**Design rules to carry over from the web rebuild:**
- Backgrounds: `cream-100`; cards: `cream-50` with soft shadow + `cream-300` border
- Primary action: wine gradient (`#8A1A29 → #5E0F19`) — use `expo-linear-gradient`
- Headings: Fraunces serif (`font-display`); body: Plus Jakarta Sans
- Accents: brass for logo, step numbers, dividers
- Status colors (StatusBadge): pending=amber, confirmed=wine, ready=emerald, picked_up=warm gray
- Motion: subtle fade/scale on mount (`react-native-reanimated` `FadeInUp`), pressable
  scale-down on buttons, skeleton shimmer for lists. Keep it tasteful (matches web choice).

> Native gradients need `expo-linear-gradient` (`npx expo install expo-linear-gradient`).

---

## 9. Shared Code

### 9.1 Types (`src/types/index.ts`)
Copy `web/src/types/index.ts` **verbatim** — `Order`, `MeatType`, `AdminUser`,
`OrderStatus` are platform-agnostic.

### 9.2 Constants (`src/lib/constants.ts`)
Copy `web/src/lib/constants.ts` **verbatim** — `MEAT_TYPES` (with emoji icons),
`STATUS_LABELS`, `STATUS_NEXT`. The 6 meats and 4 statuses must match exactly so
both apps write/read the same columns.

### 9.3 Supabase client (`src/lib/supabase.ts`) — the one real difference vs web
```ts
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { AppState } from 'react-native'

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,   // no URL-based sessions in RN
    },
  }
)

// Keep tokens fresh while app is foregrounded
AppState.addEventListener('change', (s) => {
  if (s === 'active') supabase.auth.startAutoRefresh()
  else supabase.auth.stopAutoRefresh()
})
```

### 9.4 Email helper (`src/lib/email.ts`)
```ts
// Fire-and-forget; never blocks order success (mirrors web behavior)
export function sendConfirmation(order: Record<string, unknown>) {
  fetch(process.env.EXPO_PUBLIC_EMAIL_ENDPOINT!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  }).catch(() => {})
}
```

---

## 10. Navigation Map

```
Not signed in:
  index → /login
  /login ↔ /register ↔ /forgot-password
  /register → /verify-email → /login

Signed in — role decides the area (checked once on login via admin_users):

  CUSTOMER → (tabs) bottom bar:
    (tabs)/order      "Order"      🥩  — place a reservation (default)
    (tabs)/orders     "My Orders"  📋  — history + live status
    (tabs)/profile    "Account"    👤  — email, sign out

  ADMIN → (admin) bottom bar:
    (admin)/dashboard "Orders"     📊  — all orders, search/filter/totals, status change
    (admin)/admins    "Admins"     👥  — add/remove admins
    (admin)/account   "Account"    👤  — email, sign out

  order flow: (tabs)/order → submit → /order/success → back to tabs
```

**Role routing:** `AuthContext` resolves `isAdmin` after sign-in by querying
`admin_users` (`select id where id = auth.uid()` — RLS allows this). `index.tsx`
redirects: no session → `/login`; admin → `(admin)/dashboard`; else → `(tabs)/order`.
Each area's `_layout.tsx` re-guards (admins-only / signed-in-only) so deep links can't
bypass it. The root `app/_layout.tsx` loads fonts, mounts `AuthContext`, and subscribes
to `onAuthStateChange`.

> Optional nicety: since an admin may also want to place a personal order, the admin
> Account screen can have a "Switch to ordering" link into `(tabs)/order`.

---

## 11. Screen-by-Screen Spec

Each screen maps 1:1 to a web surface so behavior stays consistent.

### 11.1 Login (`app/login.tsx`) ← mirrors `web/src/app/login/page.tsx`
- Fields: email, password (`PasswordInput` with eye toggle)
- `supabase.auth.signInWithPassword` → on success router replaces to `(tabs)/order`
- Error → "Invalid email or password."
- Links to Register + Forgot Password
- Premium look: brass logo, Fraunces "Welcome back", wine button

### 11.2 Register (`app/register.tsx`) ← mirrors `register/page.tsx`
- Fields: full name, email, password (min 6)
- `supabase.auth.signUp({ email, password, options:{ data:{ full_name } } })`
- On success → `verify-email` screen (mirrors the web "check your email" screen)

### 11.3 Verify Email (`app/verify-email.tsx`)
- Static instructional screen ("Open the email → tap Confirm → come back & sign in")
- Button → `/login`. (See §4.4 re: confirmation link target.)

### 11.4 Forgot Password (`app/forgot-password.tsx`) — *new vs current web*
- `supabase.auth.resetPasswordForEmail(email)` → "check your inbox" state
- *(The web doesn't have this yet; mobile can lead. Reset completion still happens via
  the web Site URL link unless deep linking is configured.)*

### 11.5 Order / Home (`app/(tabs)/order.tsx`) ← mirrors `OrderForm.tsx` + `page.tsx` hero
- Prefill name/email from `supabase.auth.getUser()` (same as web)
- Fields: full name, phone, **pickup date** (`@react-native-community/datetimepicker`,
  min = today), 6 × `MeatCounter`, notes
- Running **total lbs** badge; validation identical to web (name/phone/email/date
  required, total > 0)
- Submit: `supabase.from('orders').insert([{ ...fields, status:'pending', user_id }])`
  then `sendConfirmation(...)` (fire-and-forget) → navigate `/order/success`
- Serif hero ("Reserve your cut, pick up fresh") + 3-step strip at top

### 11.6 MeatCounter (`src/components/MeatCounter.tsx`) ← mirrors web component
- Row: emoji tile (wine-tinted when value>0), label + description, − / value / +
- `Pressable` +/− with active scale; disabled − at 0

### 11.7 Order Success (`app/order/success.tsx`) ← mirrors `OrderSuccessMessage.tsx`
- Brass check medallion, "Order received!", "confirmation sent to {email}"
- Buttons: "View my orders" → `(tabs)/orders`; "Place another" → `(tabs)/order`

### 11.8 My Orders (`app/(tabs)/orders.tsx`) ← mirrors `my-orders/page.tsx`
- `supabase.from('orders').select('*').order('created_at',{ascending:false})`
  (RLS already scopes to the user's own orders — no extra filter needed, but keep
  `.eq('customer_email', user.email)` as belt-and-suspenders like web)
- Card per order: serif pickup date, meat chips, notes, `StatusBadge`,
  `StatusProgress` (4-step pending→picked up tracker)
- **Skeleton** list while loading; empty state with 🥩 + "Place an order"
- **Realtime**: subscribe to `orders` changes → refetch (see §12)
- Pull-to-refresh (`RefreshControl`)

### 11.9 Order Detail (`app/order/[id].tsx`) — optional
- Full breakdown + bigger status tracker + WhatsApp share of this order's link

### 11.10 Profile / Account (`app/(tabs)/profile.tsx`)
- Show email/name, "Sign out" (`supabase.auth.signOut()` → `/login`)
- WhatsApp share button (shares the order-page link, like web header)
- App version

### 11.11 Admin Login
- The **same** `login.tsx` is used. After `signInWithPassword`, `AuthContext` checks
  `admin_users`; if the user is an admin, routing sends them to `(admin)/dashboard`
  instead of the customer tabs. (Mirrors the web admin-login admin check — no separate
  admin login screen needed, but you may add one at `/admin-login` if you prefer a
  distinct entry point.)

### 11.12 Admin Dashboard (`app/(admin)/dashboard.tsx`) ← mirrors `admin/dashboard/page.tsx`
- `supabase.from('orders').select('*').order('created_at',{ascending:false})` — RLS
  returns **all** orders because the user is an admin (no service-role key).
- **TotalsPanel** (port of web): pounds per meat type; follows the date filter
  (overall by default, that day's totals when a date is picked) + grand total.
- Controls: search (name/phone/email), status filter, date filter — same logic as web.
- Each order = `OrderRow`: customer, pickup date, meat chips, notes, `StatusBadge`,
  and a **status picker** (mobile equivalent of the web dropdown — `@react-native-picker/picker`
  or an action sheet) → `supabase.from('orders').update({status}).eq('id', id)`
  (RLS "admins update orders"). Forward **and** backward, like web.
- **Realtime** + pull-to-refresh; **Skeleton** while loading.
- **Export**: `exportCsv.ts` builds a CSV of the filtered orders and shares it via
  `expo-sharing` (mobile analogue of the web Excel export). *(Print is web-only;
  optional PDF via `expo-print` if the client wants it.)*

### 11.13 Admin — Manage Admins (`app/(admin)/admins.tsx`) ← mirrors `admin/admins/page.tsx`
- List current admins from `admin_users` (RLS "admins read admin list"); show "You"
  badge on own row; **no Remove button on own row** (same self-protection as web).
- **Add admin** (email + password) and **Remove admin** call the **`admin-manage`
  Edge Function** via `adminApi.ts` (passes the admin's `access_token` as Bearer).
  The function verifies `is_admin`, then uses the service-role key to create/delete.
- Success/error banners (warm styling, like web).

### 11.14 Admin — Account (`app/(admin)/account.tsx`)
- Admin email, "Sign out", app version, optional "Switch to ordering" link.

### 11.15 Backend: `admin-manage` Edge Function (the ONE new backend piece)
`supabase/functions/admin-manage/index.ts` (Deno) — deployed via
`supabase functions deploy admin-manage`. Outline:
```ts
// pseudo-outline
serve(async (req) => {
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  // 1) client bound to caller's JWT — verify they're an admin
  const caller = createClient(URL, ANON, { global:{ headers:{ Authorization:`Bearer ${jwt}` } } })
  const { data:{ user } } = await caller.auth.getUser()
  const { data: isAdmin } = await caller.rpc('is_admin', { uid: user.id })  // or select admin_users
  if (!user || !isAdmin) return json({ error:'Unauthorized' }, 401)

  // 2) service-role client (key from function secrets) does the privileged work
  const admin = createClient(URL, SERVICE_ROLE_KEY)
  const { action, email, password, userId } = await req.json()
  if (action === 'create') { /* admin.auth.admin.createUser + insert admin_users */ }
  if (action === 'delete') { /* block self; admin_users delete + auth.admin.deleteUser */ }
  return json({ success:true })
})
```
- Secrets: `supabase secrets set SERVICE_ROLE_KEY=... ` (already have `SUPABASE_URL`,
  `ANON` available). Add this to `HANDOVER.md` deploy steps.
- This is **not SQL** — it does NOT go in `migrations/` (per CLAUDE.md); it lives in
  `supabase/functions/` and is deployed with the Supabase CLI.

### 11.16 Shared components to port
- `StatusBadge` (color map from web), `PasswordInput` (eye toggle), `Button`
  (wine gradient + press scale), `Field`, `Screen` (SafeArea + cream bg),
  `WhatsAppButton` (`Linking.openURL('https://wa.me/?text=...')`), `Skeleton`,
  `OrderRow` + `TotalsPanel` (admin).

---

## 12. Realtime

Same pattern as the web dashboard, in `My Orders`:
```ts
useEffect(() => {
  fetchOrders()
  const ch = supabase
    .channel('orders-mobile')
    .on('postgres_changes', { event:'*', schema:'public', table:'orders' }, fetchOrders)
    .subscribe()
  return () => { supabase.removeChannel(ch) }
}, [])
```
So when the owner marks an order **Ready** in the web admin, the customer's phone
updates live.

---

## 13. Push Notifications (recommended)

The standout native feature: notify the customer when their order status changes.

- Client: `expo-notifications` → request permission → get Expo push token → store it
  (add a `push_token` column to a `profiles`/`device_tokens` table, or on `orders`).
- Trigger: a **Supabase Edge Function** on `orders` UPDATE (status change) →
  call Expo Push API (`https://exp.host/--/api/v2/push/send`) for that customer's token.
- This pairs naturally with the Email Option B (Edge Function + webhook) migration.

➡️ Treat as **Phase 2 / stretch** — not required for description.md parity, but a big
"wow" for the client.

---

## 14. Email Confirmation on Mobile

- **v1:** `sendConfirmation()` POSTs the order to the deployed
  `EXPO_PUBLIC_EMAIL_ENDPOINT` (the existing Vercel route). Works today, no backend
  changes. Consider adding a shared-secret header to the route so only our apps call it.
- **v2 (recommended):** Supabase Edge Function + DB webhook on `orders` INSERT, so
  email is automatic for **both** web and mobile and the web route can be retired.
  This is the "true shared backend" end state and also unlocks push (§13).

---

## 15. Testing Strategy

- **Primary:** Expo Go on your physical phone — `npx expo start`, scan QR, hot reload.
- **Manual E2E checklist (mirror the web verification):**
  1. Register → verify email → login
  2. Order form prefills name/email
  3. All 6 meat counters increment/decrement; total updates
  4. Validation blocks empty/zero-lbs submit
  5. Submit → success screen → confirmation email arrives
  6. My Orders shows the new order; only **your** orders (RLS)
  7. Change status in web admin → phone updates live (realtime)
  8. WhatsApp share opens with correct link
  9. Kill & reopen app → still logged in (AsyncStorage session)
  10. Sign out → back to login
- **Devices:** test on at least one Android phone; for iOS use a physical iPhone via
  Expo Go (or a TestFlight build from EAS).

---

## 16. Build & Release (EAS)

No Mac required — builds run in Expo's cloud.

```bash
npm install -g eas-cli
eas login
eas build:configure

# Android (APK to sideload / AAB for Play Store)
eas build --platform android --profile preview     # installable APK for testing
eas build --platform android --profile production   # AAB for Play Store

# iOS (needs an Apple Developer account; build happens in cloud)
eas build --platform ios --profile production

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

- Set the same `EXPO_PUBLIC_*` values as **EAS secrets** (or `eas.json` env) for builds.
- Store assets needed: app icon (1024²), splash, screenshots, descriptions.
- iOS requires an **Apple Developer Program** account ($99/yr); Android a one-time
  **Play Console** fee ($25). Flag these to the client — they're external costs.

---

## 17. Phased Timeline (~6 days)

Admin-on-both adds ~1.5 days, so plan for ~7 days (or trim the optional items).

| Day | Deliverable |
|---|---|
| **1** | Scaffold Expo + Expo Router + NativeWind; port theme, fonts, types, constants, supabase client (AsyncStorage); app boots on phone with Premium Butcher styling. |
| **2** | Auth: login, register, verify-email, forgot-password; `AuthContext` with **role (isAdmin)** resolution + role-based routing/guards. |
| **3** | Customer order form: fields, date picker, 6 MeatCounters, validation, total; insert order + email; success screen. |
| **4** | Customer My Orders: list, StatusBadge, StatusProgress, skeleton, empty state, realtime, pull-to-refresh; Profile/sign out. |
| **5** | **Admin dashboard:** all orders, TotalsPanel, search/status/date filters, status change, realtime, CSV export. |
| **6** | **Admin manage-admins** + deploy `admin-manage` **Edge Function**; admin account; polish, WhatsApp share, motion; full E2E manual test (both roles) on device. |
| **7** | EAS build (Android APK + iOS), install on real devices, smoke test both roles, store assets, hand off. *(Stretch: push notifications.)* |

---

## 18. Decisions to Confirm

1. ~~Admin on mobile?~~ **DECIDED: admin on BOTH.** The app is role-based (customer
   tabs vs admin tabs). Dashboard works via RLS; add/remove-admin via the new
   `admin-manage` Edge Function. (See §1, §4.2, §11.12–11.15.)
2. **Email path** — confirm v1 = call the existing Vercel endpoint (yes/no); plan v2 = Edge Function.
3. **Push notifications** — in v1 or Phase 2? (Recommended Phase 2.)
4. **Deep linking** for email confirm/reset — simple web-link flow for v1, or set up
   `ahadu://` deep links now?
5. **Store accounts** — who owns the Apple Developer + Play Console accounts (client vs you)?
6. **App identity** — final app name, icon, splash, bundle IDs.
7. **Web admin routes** — after `admin-manage` Edge Function exists, optionally retire
   the web's `create-user`/`delete-user` Next.js routes so both platforms share one path.

---

## 19. Handover Notes

- The mobile app is **additive** — it reuses the same Supabase project. No DB schema
  changes are required (except the optional `push_token` storage if doing §13). The
  one new backend artifact is the **`admin-manage` Edge Function** (for add/remove
  admin) — deploy it with `supabase functions deploy admin-manage` and set its
  `SERVICE_ROLE_KEY` secret. Add this to `HANDOVER.md`'s deploy steps. (It's an Edge
  Function, not SQL, so it does NOT go in `migrations/`.)
- Anon key ships in the app (safe; RLS-protected). **Service-role key must never** be
  in the mobile app.
- Keep `src/lib/constants.ts` and `src/types/index.ts` **in sync** with the web app —
  if a meat type or status ever changes on web, update both. (Consider extracting a
  shared package later if the project grows.)
- When the client moves to their own Supabase project (per `HANDOVER.md`), update the
  mobile `.env` / EAS secrets with their URL + anon key, and their email endpoint.
