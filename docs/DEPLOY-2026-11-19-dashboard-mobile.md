# Deployment record — customer dashboard mobile fixes

| Field | Value |
| --- | --- |
| Commit | `7ae9e5f` |
| Deployed at | 2026-11-19 22:37 (UTC+5:45) |
| Previous production | `5153e94` |
| Live upstream | 3040 (front door `:3036`) |

## Problems found

1. **Dock unreadable in light mode.** `.cp-dock` hard-coded `rgba(12, 8, 28, 0.96)` while its
   labels inherited `--text`, which flips to `#14182e` in the light theme. Result: near-black
   text on a near-black bar. This is why the bottom nav looked blank.
2. **Random "logout" on mobile.** `DashboardShell` redirected to `/signin` on *any* non-OK
   response, including a dropped mobile connection or a backgrounded tab. There was no retry
   and no distinction between "server said 401" and "the fetch failed".
3. **Installable app had weak branding.** The manifest pointed at a 32×32 PNG scaled to 512,
   had no `maskable` icon, no `display_override`, and the service worker had no fetch handler,
   so an offline launch showed the browser error page instead of an app screen.
4. **Tap targets and labels were small.** 11px labels in a 56px row, and the tab labels were
   raw text nodes rather than elements that could carry `aria-current`.

## What changed

`app/dashboard/panel.css`
- Dock background is now `var(--top)` with a theme-aware shadow, so it follows light and dark.
- Dock rows are 58px tall with 12px labels, 23px icons and `-webkit-tap-highlight-color: transparent`.
- Active tab keeps the gradient pill, with an explicit lighter gradient override for light mode.
- Content bottom padding raised from 88px to 96px to clear the taller dock.
- Added `@media (display-mode: standalone)` rules for top-bar, sidebar and dock safe areas plus
  `overscroll-behavior-y: none` so an installed app does not rubber-band to a white page.
- Removed a duplicate `.cp-dock { display: grid }` rule.
- Added the session-recovery screen styles.

`components/dashboard/DashboardShell.tsx`
- Session load retries up to three times with backoff and only redirects on 401/403.
- Added a `visibilitychange` listener so a resumed PWA refreshes the session without a reload.
- A `sessionError` state renders a "Connection problem / Try again" card instead of a blank or
  a forced sign-in.
- Dock labels wrapped in `<span>` and each active tab marked `aria-current="page"`.

`public/manifest.webmanifest`
- `start_url: /dashboard`, `display_override: ["standalone", "minimal-ui"]`, portrait
  orientation, real description, categories, and three app shortcuts (New Order, Add Funds,
  My Orders).

`public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png`, `public/apple-icon.png`
- Generated from the 1024×1024 brand mark, with the maskable variant padded into the 78% safe
  zone so Android's circular crop never clips the logo.

`public/sw.js`, `public/offline.html`
- Caches only the offline page. Every navigation is network-first and no API, HTML or dashboard
  response is ever cached, so wallet balances and private pages cannot be served stale.

`app/layout.tsx` — icon metadata now references the real 192/512 sizes.

## Verification

| Check | Result |
| --- | --- |
| `tsc --noEmit` | 0 errors |
| `vitest run` | 172/172 pass |
| `eslint` | 0 errors, 39 pre-existing warnings |
| `next build` | success |
| 16 dashboard routes (local, authenticated) | all 200 |
| Live `/dashboard` with a real session | 200 |
| Dock markup live | 5 `<span>` labels, `aria-current="page"` |
| Live dock CSS | `var(--top)` present in `9e6d163140c1c35b.css` |
| `/icon-maskable-512.png`, `/offline.html`, `/sw.js` | 200 |
| `/orbit`, `/dashboard` unauthenticated | 307 |
| Homepage, `/smm-panel`, `/signin` | 200 |
| PM2 other apps | untouched |

## Manual test still needed

Lighthouse cannot run from this host and the browser tool cannot reach localhost, so the
following is verified structurally rather than visually:

- Dock contrast in light mode on a real device.
- Installed-app launch on Android/iOS (maskable crop, status bar, home indicator).
- Session survival after toggling Chrome desktop mode.

The CSS and manifest changes above address all three, but a device check is the confirmation.
