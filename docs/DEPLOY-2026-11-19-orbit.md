# Deployment record — Orbit admin rebuild + geo traffic

## Releases

| Field | Value |
| --- | --- |
| Admin rebuild | `c52a5d0` |
| Geo traffic | `c6ded11` |
| Rollback reference | `1a3af41` (previous working production) |
| Live upstream | 3038 (front door `:3036`) |
| Release folder | `.releases/p3038` |

## What changed in `/orbit`

**Dashboard**
- The decorative welcome banner (3D social icons, marketing line) is gone. It is replaced by
  a command strip showing wallet liability, revenue, open tickets and gateway state — the
  four numbers an operator checks before doing anything else.
- Live traffic panel now shows three columns: visitor sources, top countries, top landing pages.

**Mobile**
- Below 920px the sidebar becomes a slide-over drawer with a scrim, a close button and a
  body-scroll lock. Every admin table collapses into stacked labelled cards, so no screen
  forces a horizontal scroll on a phone.

**Article editor** (`/orbit/blog`)
- Two-column publishing layout: title, permalink, cover upload, body on the left; publish
  status, slug, category and a live SEO gauge on the right.
- Live SEO checklist measures the actual fields: title length, description length,
  focus keyword set, keyword in title / slug / description, OG title, OG description,
  OG image. Each failing row has a "Fix" button that jumps to the field.
- Google SERP preview with real truncation.
- Existing articles load back into the editor through `GET /api/orbit/blog?slug=`.

**Page editor** (`/orbit/pages/[slug]`)
- Same SEO checklist and SERP preview in the SEO tab.
- Pages hub is now a card grid showing which routes still need a meta title or description.

**Customers**
- List shows signup method, last login and last IP.
- Detail page rebuilt: identity card with status tags, six KPI figures, explicit credit/debit
  wallet form with a required reason, account controls, and four tabs (orders, wallet ledger,
  API activity, logins) with IP addresses.

**Navigation**
- Removed duplicate entries: `Categories` (pointed at an anchor that no longer existed),
  `Wallet Management` (duplicate of Customer Wallets), and the 10 per-page links that
  duplicated the pages hub.
- Dead code removed: `OrbitDashboard.tsx` (never mounted) and `OrbitHeroArt` import.

## Traffic geo

`POST /api/track` reads the CDN edge header (`CF-IPCountry`, with Vercel and generic
fallbacks) and stores only the two-letter country code. No raw IP is written to the traffic
log and no external geolocation service is called.

Verified after deploy: a hit with `CF-IPCountry: NP` returned 200 and the log recorded
`"country":"NL"` for a real visitor.

## Verification performed

| Check | Result |
| --- | --- |
| `tsc --noEmit` | 0 errors |
| `vitest run` | 172/172 pass (6 new SEO-score tests) |
| `eslint` | 0 errors, 39 pre-existing warnings |
| `next build` | success |
| Homepage, `/smm-panel`, `/signin` | 200 |
| `/orbit`, `/orbit/pages`, `/orbit/blog`, `/orbit/customers` | 307 → login |
| `/dashboard` | 307 → signin |
| `/api/dashboard/session`, `/api/orbit/config` | 401 |
| Sitemap | 61 URLs unchanged |
| Canonicals | unchanged |
| Customer register → session → dashboard | 200 / 200 / 200 |
| NOWPayments currencies, payments, transactions | 200 |
| New admin CSS in payload | drawer, WP editor, SEO gauge, customer KPIs, page cards |
| PM2 — other apps | untouched |

## Not changed

Database, migrations, wallet balances, NOWPayments integration, OAuth, session logic,
customer authentication, `/orbit` authorization, production env vars, other PM2 apps.
