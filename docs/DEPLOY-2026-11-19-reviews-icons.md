# Deployment record — review editor, icon fixes, hero and footer polish

| Field | Value |
| --- | --- |
| Commit | `1cd99c0` |
| Deployed at | 2026-11-19 23:58 (UTC+5:45) |
| Previous production | `f4cbb5d` |
| Live upstream | 3038 (front door `:3036`) |

## 1. Review carousel is now fully editable

New component `components/orbit/ReviewsEditor.tsx`, mounted in the homepage page editor
(`/orbit/pages/home` → Home sections tab).

Per review you can:
- **Upload or replace the photo** — goes through `/api/orbit/media`, so the file lands in the
  media library and the returned URL is stored on the card.
- Remove the photo (falls back to the initial letter avatar).
- Edit name, country, flag emoji, quote and card tone.
- Reorder with ↑ / ↓ and delete.
- Add a new review.

Publishing calls the existing `PUT /api/orbit/config`, which clears the live catalog cache and
revalidates `/`, so the homepage reflects the change on the next request.

Two merge bugs were fixed in `lib/orbit/site-config-sync.ts`:

| Before | After |
| --- | --- |
| `raw.customerReviews?.length ? … : defaults` | `Array.isArray(raw.customerReviews) ? … : defaults` |

That rule meant deleting every review silently restored the built-in six. An empty array is now
a real decision. Covered by `tests/orbit-reviews-merge.test.ts` (3 cases: never edited, one
custom review with a replaced avatar, explicitly emptied).

The editor also seeds itself from the built-in reviews so it never opens blank on a config that
has never stored the field.

## 2. Icon fixes

| Icon | Problem | Fix |
| --- | --- | --- |
| Facebook (service cards, hero orbit, footer) | The source PNG carried a baked-in floor reflection, so the tile rendered twice and read as a double logo. Trimmed art measured 660×832 vs 654×658 for YouTube. | Cropped to a square anchored at the tile, regenerated all three WebP variants. |
| "Dedicated Support" headset (Why choose) | Path closed into a horseshoe, reading as an upside-down U. | Redrawn as a headband arc with two rounded ear cups. |
| "Get Results" rocket (How it works) | Tapered body read as a shuttlecock. | Redrawn with a distinct body, porthole window, two fins and a flame line. |
| "Support Ticket" quick action (dashboard) | Path drew a trophy/chalice shape. | Now a speech bubble with a tail and three dots. |
| "Transactions" quick action + sidebar | Two horizontal strokes read as a double-tilde. | Now a two-way exchange arrow between two cards. |

## 3. Hero, footer and page transitions

- Hero brand mark raised from `min(34%, 220px)` to `min(42%, 300px)`, with a double drop-shadow
  for the premium glow. Added breakpoints at 980px, 560px and 1800px so the mark stays
  proportionate from a 390px phone to an ultra-wide monitor.
- Footer: branded gradient hairline on the top edge, ambient purple/blue radial wash, social
  links turned into bordered chips with a hover lift, and nav links with a subtle indent on
  hover. Mobile keeps 26px social icons and tighter padding.
- Page transitions: a 240ms fade-and-rise on `.page`, transform-only so it cannot affect CLS, and
  disabled under `prefers-reduced-motion`.

## 4. Verification

| Check | Result |
| --- | --- |
| `tsc --noEmit` | 0 errors |
| `vitest run` | **175/175** pass (3 new merge tests) |
| `eslint` | 0 errors, 39 pre-existing warnings |
| `next build` | success |
| Live homepage | 200, renders all 6 reviews (24 cards after the marquee loop) |
| Live review avatars | 6 unique WebP files |
| Live facebook icon | 7,200 bytes, single logo |
| `/smm-panel`, `/signin` | 200 |
| `/orbit`, `/dashboard` | 307 |
| `data/orbit/site-config.json` | unchanged by testing (verified by diff) |

## 5. Not verified from this host

The browser tool cannot reach localhost and there is no Lighthouse binary here, so the visual
result of the icon redraws, hero size and footer polish was not captured as a screenshot. The
changes are stylesheet and inline-SVG edits that compile and ship in the live CSS/JS bundles;
a device check is the final confirmation.
