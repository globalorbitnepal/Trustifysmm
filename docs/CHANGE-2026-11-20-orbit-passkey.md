# Change record — Orbit passkey rotation

| Field | Value |
| --- | --- |
| Changed at | 2026-11-20 00:32 (UTC+5:45) |
| File changed | `.env` → `ORBIT_PASSKEY` |
| Git commit | none — `.env` is gitignored and never committed |
| Live upstream | 3040 (front door `:3036`) |

## What changed

`ORBIT_PASSKEY` was rotated. The previous value no longer authenticates; the new value is the
only one that opens `/orbit`.

`.env` is listed in `.gitignore` and has never been tracked, so this change is server-side only
and is not part of any commit. A timestamped backup of the previous `.env` was written to
`/tmp/env.backup-*` before the edit.

## Scope of the change

`ORBIT_PASSKEY` signs the Orbit admin session and acts as a fallback for the order-sync token.
It is **not** the customer session secret — `SESSION_SECRET` is set separately and was left
untouched, so customer logins, wallets and orders keep working.

Every existing Orbit session cookie is invalidated by a rotation, which is the intended effect.
The admin must sign in once with the new passkey.

## Verification

Local, against a clean production build:

| Check | Result |
| --- | --- |
| Login with the new passkey | 200, `orbit_session` cookie set |
| Login with the previous passkey | 401 |
| `/orbit` with the new session | 200 |
| `/orbit/seo` with the new session | 200 |
| `/orbit` without a cookie | 307 → login |
| All 11 admin APIs with the session | 200 |
| Customer register → session → dashboard | 200 / 200 / 200 |
| Customer cookie used against `/orbit` | 307 (no cross-access) |
| `oribit-auth` unit tests | 4/4 pass |

Live, after deploy:

| Check | Result |
| --- | --- |
| `POST /api/orbit/auth/login` with new passkey | 200 |
| `POST /api/orbit/auth/login` with old passkey | 401 |
| `/orbit` with new session | 200 |
| `/orbit` without cookie | 307 |
| `/api/orbit/config`, `customers`, `blog`, `services`, `overview` | 200 |
| `/`, `/smm-panel`, `/signin` | 200 |
| Customer `/dashboard` | 200 |

## Note found during testing

The first local test returned 500 on every dynamic route. That was a stale `.next` directory, not
the passkey change: static assets served fine while every rendered route failed. A clean
`rm -rf .next && npm run build` resolved it, and the deploy script builds into a fresh staging
directory so production was never affected.
