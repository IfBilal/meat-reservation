# Ahadu Fresh Meat — Deployment & Handover Guide

This guide takes the project from an empty Supabase project + Vercel account to a
fully working production deployment. Follow the steps in order.

---

## Overview

- **Web frontend:** Next.js app in `web/` (deploys to Vercel)
- **Mobile app:** Expo / React Native in `mobile/` (builds via EAS — see `mobile/README.md`)
- **Backend:** Supabase (Postgres + Auth + RLS) — **shared by web and mobile**
- **Email:** Gmail SMTP via the `/api/send-confirmation` route (nodemailer)
- **Edge Function:** `admin-manage` (add/remove admin) — used by both web and mobile

There are **three** places that hold configuration. All three must be set up:
1. **Supabase** — database schema, RLS, Auth Site URL, `admin-manage` Edge Function
2. **Vercel** — environment variables + root directory
3. **Gmail** — an App Password for sending confirmation emails

---

## 1. Supabase setup

### 1a. Create the project
1. Create a new project at https://supabase.com/dashboard
2. Note the **Project URL** and keys from **Settings → API**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` (safe to expose)
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**SECRET — server only**)

### 1b. Run the migrations
Open **SQL Editor** and run each file in `supabase/migrations/` **in numerical order**:

| Order | File | Purpose |
|------|------|---------|
| 1 | `001_initial_schema.sql` | Tables (orders, admin_users) + enums |
| 2 | `002_rls_policies.sql` | Initial RLS policies |
| 3 | `003_realtime.sql` | Realtime on orders |
| 4 | ~~`004_seed_admin.sql`~~ | **SKIP — see 1c below** |
| 5 | `005_add_user_id_to_orders.sql` | user_id column |
| 6 | `006_fix_rls_policies.sql` | Final RLS (admin/customer isolation, `is_admin()`) |

> ⚠️ **Do NOT run `004_seed_admin.sql`.** It inserts directly into `auth.users`,
> which does **not** work with Supabase Auth (the password won't authenticate).
> Create the first admin using the Admin API instead — see step 1c.

### 1c. Create the first admin (IMPORTANT)
Supabase Auth users **cannot** be created with SQL `INSERT`. Use the Admin API.
Run this in a terminal (replace email/password and use the project's **service_role** key):

```bash
SUPABASE_URL="https://YOUR-PROJECT-ref.supabase.co"
SERVICE_KEY="YOUR-service-role-key"

# 1) Create the auth user
NEW=$(curl -s -X POST "$SUPABASE_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ahadumarket.com","password":"CHANGE_ME","email_confirm":true}')
NEW_ID=$(echo "$NEW" | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")

# 2) Register them in the admin_users table (grants admin access)
curl -s -X POST "$SUPABASE_URL/rest/v1/admin_users" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"$NEW_ID\",\"email\":\"admin@ahadumarket.com\"}"
```

After this, the admin signs in at `/admin/login`. Further admins can be added
from the **Admin → Admins** page in the app (no terminal needed).

### 1d. Set the Auth Site URL (fixes confirmation email links)
**Authentication → URL Configuration:**
- **Site URL:** `https://YOUR-DOMAIN.vercel.app` (controls where confirmation
  email links point — if left as localhost, emails break in production)
- **Redirect URLs (allow list):** add
  `https://YOUR-DOMAIN.vercel.app/**` and `http://localhost:3000/**`

### 1e. (Recommended) Enable leaked-password protection
**Authentication → Policies →** enable "Leaked password protection"
(checks passwords against HaveIBeenPwned).

### 1f. Deploy the `admin-manage` Edge Function
Add/remove-admin (web + mobile) runs through this function — it verifies the caller
is an admin then uses the service-role key server-side. It is **not SQL** (not a
migration); deploy it with the Supabase CLI:
```bash
supabase functions deploy admin-manage --project-ref YOUR-PROJECT-REF
```
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected
automatically by the Supabase platform — no manual secrets needed. The function lives
in `supabase/functions/admin-manage/`. (Deploy with `--no-verify-jwt` is not required;
it was deployed with verify_jwt disabled because it does its own JWT + admin check,
which also lets browser CORS preflight through.)

---

## 2. Gmail setup (for confirmation emails)

1. Use a Gmail account for the shop (e.g. the client's business Gmail).
2. Enable **2-Step Verification** on that account.
3. Generate an **App Password**: Google Account → Security → 2-Step
   Verification → **App passwords**. Copy the 16-character password.
4. Use that Gmail address as `SMTP_USER` and the app password as `SMTP_PASS`
   (the normal account password will NOT work).

---

## 3. Vercel setup

### 3a. Import the repo
- Import the GitHub repo into Vercel.
- **Set Root Directory to `web`** (the Next.js app is in a subfolder — without
  this you get a 404).

### 3b. Environment variables
Add all of these in **Settings → Environment Variables** (Production + Preview):

| Variable | Example / Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://YOUR-ref.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (**secret**) |
| `NEXT_PUBLIC_APP_URL` | `https://YOUR-DOMAIN.vercel.app` (used by WhatsApp share link) |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | the shop Gmail address |
| `SMTP_PASS` | the 16-char Gmail App Password |
| `SMTP_FROM_NAME` | `Ahadu Fresh Meat` |

### 3c. Deploy
Trigger a deploy (push to `main`, or Deployments → Redeploy after setting vars).

---

## 4. Post-deploy smoke test

1. Register a new customer → confirmation email arrives and its link opens the
   **live** site (not localhost).
2. Log in → place an order → an order confirmation email arrives.
3. `/admin/login` with the admin account → dashboard shows the order.
4. Change an order's status → customer sees it update on **My Orders**.
5. Click **Share** (WhatsApp) → the message link points to the live domain.

---

## Quick reference — credentials & config locations

| Thing | Where it lives | Notes |
|---|---|---|
| DB schema & RLS | `supabase/migrations/*.sql` | run in order, skip 004 |
| First admin | created via Admin API | SQL insert does NOT work |
| Auth Site URL | Supabase dashboard | NOT in env/migrations |
| App env vars | Vercel dashboard + `web/.env.local` (local) | see `web/.env.example` |
| Gmail App Password | Vercel `SMTP_PASS` | not the normal password |

---

## Local development

```bash
cd web
cp .env.example .env.local   # then fill in real values
npm install
npm run dev                  # http://localhost:3000
```

## Mobile app

See **`mobile/README.md`** for full setup. Quick version:
```bash
cd mobile
cp .env.example .env         # Supabase URL + anon key + endpoints
npm install
npx expo start               # scan QR with Expo Go on your phone
```
- Reuses the **same Supabase project** — no separate backend.
- For store builds (iOS without a Mac), use **EAS Build** (`eas build ...`).
- Set the same Supabase URL/anon key (and the client's email endpoint) for the
  mobile `.env` / EAS secrets when handing over.
