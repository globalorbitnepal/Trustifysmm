# Deployment record — mobile performance (LCP) release

## Release identity

| Field | Value |
| --- | --- |
| Deployed commit | `990bcc5` |
| Commit title | Cut mobile LCP from a 900 KB PNG to an 8.9 KB WebP and fix list ARIA roles |
| Deployed at | 2026-11-19 21:05 (UTC+5:45) |
| Previous production commit | `f5f098d` |
| Rollback tag | `pre-perf-deploy-20261119` → `f5f098d` |
| Live upstream port | 3038 (front door `:3036`, unchanged) |
| Release folder | `.releases/p3038` |
| Build id | `zwVK2tYNH_sjcjqf1zQeAgit` |

The zero-downtime script rotates between ports 3037–3040 by design. Port 3040 was not
modified and remains available with its previous build (`1lxIShq3Nj73niU2v6QUF`).

## Rollback procedure

```bash
cd /srv/apps/trustifysmm
git checkout pre-perf-deploy-20261119   # or: git reset --hard f5f098d
bash scripts/deploy-live.sh
```

The script builds beside the live app, starts it on a free port and repoints `:3036`
only after `/signin` returns 200. If the new build fails its health check the live
site is left untouched.

## Verification performed after deploy

| Check | Result |
| --- | --- |
| Homepage | 200 |
| 40 SEO landing pages | 40/40 → 200 |
| Sitemap | 61 URLs |
| robots.txt | private paths disallowed, sitemap present |
| `/orbit`, `/orbit/seo` | 307 → login |
| `/dashboard` | 307 → signin |
| `/api/dashboard/session` (no auth) | 401 |
| LCP image | `img.orbit-core` → `glass-trustify-t-256.webp`, 8,900 B, `fetchPriority=high`, `loading=eager` |
| `/img/*` cache | `public, max-age=31536000, immutable` |
| `/brand/*` cache | `public, max-age=604800, stale-while-revalidate=2592000` |
| `/dashboard`, `/api/*` cache | `private, no-store, max-age=0` |
| Register → session → dashboard → logout | 200 / 200 / 200 / 200 |
| NOWPayments currencies, payments, transactions, estimate | 200 |
| `/api/banker/status` without `id` | 400 (expected — `id` is required by the route) |
| Legacy PNG/JPG assets | still served, 200 (nothing deleted) |
| `www` → apex | 308 |
| Sign-in noindex | intact |

## Measured before/after

| Metric | Before | After |
| --- | --- | --- |
| LCP element transfer | 900,015 B | 8,900 B |
| Homepage image payload (20 assets) | 12,405 KiB | 153 KiB |
| Images fetched on first mobile paint | 2, ~1,048 KB | 2, 26 KB |

Lighthouse was not run from the deployment host (no Chrome/Lighthouse binary available).
A fresh Google PageSpeed Insights run is still required before quoting a Performance
score; the numbers above are transfer measurements, not Lighthouse scores.

## Not changed

Database, migrations, wallet balances, NOWPayments integration, OAuth, session logic,
authentication, `/orbit` authorization, admin features, production env vars, other PM2
applications.
