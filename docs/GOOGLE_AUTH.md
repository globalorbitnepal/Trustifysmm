# Google & customer authentication

## Architecture

- **Not Base44** — native Next.js App Router routes under `/api/auth/*`
- **Customer store**: `data/runtime/customers.json` (preserves IDs, balances link to `data/runtime/api-store.json`)
- **Sessions**: HTTP-only `trustify_session` cookie (HMAC signed with `SESSION_SECRET`)
- **Orbit admin**: separate `/orbit` passkey flow — never grants admin via Google
- **PostgreSQL**: `prisma/schema.prisma` documents future `User` model; run `npx prisma migrate dev` when `DATABASE_URL` is ready

## Google Cloud setup

1. Create OAuth 2.0 **Web client** in Google Cloud Console.
2. Authorized redirect URI: `https://trustifysmm.com/api/auth/google/callback` (or `${SITE_URL}/api/auth/google/callback` for local dev with tunnel).
3. Set env vars on the server (see `.env.example`).

## Callback URL

If `GOOGLE_CALLBACK_URL` is empty, callback is:

`${SITE_URL}/api/auth/google/callback`

## Manual test checklist

1. New Google signup → lands on `/dashboard`, customer row created, `role: CUSTOMER` only.
2. Google login again → same `id`, balance preserved via `apiKey`.
3. Email/password register + login → `/dashboard`.
4. Cancel Google (`access_denied`) → `/signin?error=access_denied`.
5. Logout → cookie cleared; `/dashboard` redirects to sign-in.
6. Duplicate email: password account + Google with same verified email → links `googleId`, keeps balance & `apiKey`.
7. `/orbit` still requires `ORBIT_PASSKEY` — customer session does not grant Orbit access.