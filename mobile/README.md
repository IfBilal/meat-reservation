# Ahadu Fresh Meat — Mobile App (Expo / React Native)

Native iOS + Android app that shares the **same Supabase backend** as the web app
(`web/`). Built with Expo Router + NativeWind, mirroring the web "Premium Butcher"
design and all features (customer ordering + admin dashboard).

## Stack
- Expo SDK 56 + Expo Router (file-based routing)
- NativeWind v4 (Tailwind for RN) — palette in `tailwind.config.js` / `src/lib/theme.ts`
- `@supabase/supabase-js` with AsyncStorage session persistence (`src/lib/supabase.ts`)
- Fraunces (display) + Plus Jakarta Sans (body) via `@expo-google-fonts`

## Setup
```bash
cd mobile
cp .env.example .env      # fill in Supabase URL + anon key + endpoints
npm install
npx expo start            # scan the QR with Expo Go on your phone
```

`.env` keys:
| Key | Purpose |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | anon public key (safe to ship; RLS-protected) |
| `EXPO_PUBLIC_APP_URL` | web app URL (WhatsApp share link) |
| `EXPO_PUBLIC_EMAIL_ENDPOINT` | order-confirmation endpoint (web `/api/send-confirmation`) |

## Testing on your phone
1. Install **Expo Go** (Play Store / App Store).
2. `npx expo start`, scan the QR. Hot reload is on.
3. Phone + laptop on the same Wi-Fi (or use `npx expo start --tunnel`).

## App structure
```
app/
  _layout.tsx          fonts + AuthProvider + Stack
  index.tsx            role-based redirect (login / customer / admin)
  login, register, verify-email, forgot-password
  (tabs)/              CUSTOMER: order, orders, profile
  (admin)/             ADMIN: dashboard, admins, account
  order/success.tsx
src/
  components/  Button, Field, PasswordField, Screen, MeatCounter,
               DateField, StatusBadge, StatusProgress, TotalsPanel, Skeleton
  context/AuthContext.tsx     session + isAdmin + signOut
  lib/  supabase, constants, theme, email, adminApi, exportCsv
  types/index.ts
```

## Roles
After login the app checks `admin_users`: admins land in `(admin)`, customers in
`(tabs)`. Add/remove admin goes through the **`admin-manage` Supabase Edge Function**
(`supabase/functions/admin-manage`) — the service-role key never ships in the app.

## Building (no Mac needed — cloud builds via EAS)
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview      # installable APK for testing
eas build --platform android --profile production    # AAB for Play Store
eas build --platform ios --profile production        # iOS (needs Apple Developer acct)
eas submit --platform android   # / ios
```
Set the `EXPO_PUBLIC_*` values as EAS secrets (or in `eas.json` env) for builds.

## Keep in sync with web
`src/lib/constants.ts` and `src/types/index.ts` mirror the web app. If a meat type or
order status changes on web, update both.
