# NOWPayments premium deposit upgrade — delivery report

Date: 2026-11-18  
Not deployed. Production was not restarted, no invoice was created, no real wallet was credited.

## Files changed

### New

| File | Purpose |
| --- | --- |
| `lib/nowpayments/currencies.ts` | Provider-verified deposit options (code + network), 10-minute cache, allowlist ∩ provider `enable` |
| `lib/nowpayments/money.ts` | Exact decimal compare/format (bigint, no float money math) |
| `lib/nowpayments/credit-policy.ts` | Credit eligibility + manual adjustment policy |
| `app/api/payments/nowpayments/estimate/route.ts` | Authenticated read-only provider quote |
| `components/dashboard/CoinLogo.tsx` | Verified brand logo paths + network-aware coin map |
| `components/dashboard/CryptoDepositQr.tsx` | QR from the real deposit address |
| `app/dashboard/deposit.css` | Premium deposit / checkout / receipt styles (light + dark tokens) |
| `tests/nowpayments.test.ts`, `tests/nowpayments-credit-policy.test.ts`, `tests/nowpayments-currencies.test.ts` | Isolated suites |
| `vitest.config.ts` | Test runner config |

### Modified

| File | Change |
| --- | --- |
| `app/api/payments/nowpayments/currencies/route.ts` | Returns `options[]` with provider network data |
| `app/api/payments/nowpayments/create/route.ts` | Server-side amount + coin/network validation |
| `app/api/payments/nowpayments/ipn/route.ts`, `app/api/banker/webhook/route.ts` | Strict signed IPN → policy |
| `app/api/orbit/banker/route.ts` | Deposit detail fields; manual `credit` disabled (403); safe `adjust` action |
| `lib/banker/handler.ts` | Credit only via verified IPN policy; review state; no provider bypass |
| `lib/nowpayments/client.ts` | Added `estimate` and `min-amount` calls |
| `lib/smm-api/types.ts`, `lib/smm-api/demo-store.ts` | `review` status, audit fields, exact manual adjustment |
| `lib/customer/user-store.ts` | Wallet → customer balance mirror after credit |
| `components/dashboard/WalletViews.tsx` | New Add Funds experience + receipt history |
| `components/orbit/screens-finance.tsx` | Pay analytics, filters, detail drawer, manual adjustment form |
| `app/orbit/orbit.css`, `app/dashboard/panel.css`, `app/dashboard/layout.tsx` | Styles + stylesheet import |
| `.env.example`, `docs/*` | Configuration and audit docs |

## Features completed

### Customer `/dashboard/add-funds`
- Header with available USD balance, provider status (shows unavailable instead of a fake live badge), secure-payments note.
- Searchable coin + network picker (name, symbol, network, provider code) with Popular and All sections.
- Separate options per provider currency: `usdttrc20`, `usdterc20`, `usdtbsc`, `usdc`, `usdcmatic`, `btc`, `eth`, `ltc`, `doge`, `trx`, `bnbbsc`, `matic`, `sol`.
- Verified coin logos from brand paths, plus a network label on every card and a distinctive selected-currency card.
- USD amount input, presets, min/max, live provider estimate (read-only `/v1/estimate`), fees note.
- Loading, empty, and error states; amount validated on client and server.

### Checkout
- Requested USD, exact crypto amount, network, address, real QR, expiry, provider payment ID, internal deposit ID.
- Copy address / amount / payment ID, refresh status, provider checkout link, "create another deposit".
- Explicit network warning. No fake address or QR is ever generated.

### Status tracking
- Waiting, confirming, confirmed/processing, successful, partially paid, expired, failed, manual review.
- 10-second polling, stops on paid/expired/failed, balance refresh on success.
- Success wording appears only when the backend reports `paid` after verified credit.

### Security / accounting
- Only `finished` credits; all other statuses never credit.
- Payment ID, order ID, customer wallet, USD `price_amount`, pay currency, network, `actually_paid` vs `pay_amount`, and `actually_paid_at_fiat` vs USD are all checked with exact decimals.
- Underpay / wrong coin / wrong network / fiat shortfall → `review`, no credit.
- Overpayment recorded, USD credit never exceeds the invoice.
- Duplicate IPN cannot double-credit (credited flag + ledger `ref` = deposit id).
- Manual adjustment is separate: reason + confirmation + unique ref, ledger type `adjustment`; it never marks a NOWPayments payment finished.
- No second wallet; existing `api-store` wallet and ledger are reused.

### Orbit
- Analytics: applications, successful, pending, failed, expired, manual review, verified USD, wallet credits (calculated from real records).
- Table: customer, email, deposit ID, NOWPayments ID, USD, coin, network, expected crypto, actually paid, verified USD, provider status, credited, created, completed, hash, actions.
- Filters: all, pending, finished, failed, expired, partially paid, manual review, credited, not credited; currency, network, and date range; search by customer/email/deposit/payment ID.
- Detail drawer with audit information and a manual-review warning.
- Manual adjustments are visibly separate from deposits.

### Customer history
- Date, deposit ID, USD, coin, network, status, credited flag, and a receipt modal.

## Currency / network verification

Verified from the live provider at audit time:

- `GET /v1/full-currencies` → `code`, `name`, `enable`, `network`, `logo_url`.
- Confirmed enabled: `USDTTRC20` (trx), `USDTERC20` (eth), `USDTBSC` (bsc), `USDC` (eth), `USDCMATIC` (matic), `BTC` (btc), `ETH` (eth), `LTC` (ltc), `DOGE` (doge), `TRX` (trx), `BNBBSC` (bsc), `MATIC` (eth), `SOL` (sol).
- Options are always our allowlist (`BANKER_PAY_CURRENCIES`) intersected with provider `enable: true`. Nothing is hardcoded as available; if the provider fails and no cache exists, the picker shows an unavailable state.

## Tests

`npm run typecheck` — PASS  
`npm test` — PASS, 3 files, 18 tests  
`npm run build` — PASS (built into a throwaway directory; live `.next` untouched)

Covered: signature generation/verification, sorted nested payloads, missing/invalid signature, every provider status mapping, credit eligibility, underpay, overpay, wrong coin, wrong network, insufficient fiat, payment/order ID mismatch, duplicate credit, missing wallet, rate limit, manual adjustment authorization/reason/duplicate, provider currency + network separation, disabled-currency exclusion, unconfigured gateway.

## Remaining limitations

1. Not deployed. Production still runs the previous code until an approved deploy and PM2 restart.
2. `actually_paid_at_fiat` of `0` is treated as "provider did not estimate"; crypto `actually_paid` is still required. No local rate conversion is performed.
3. Amount checking compares crypto and the provider's fiat field. If NOWPayments omits both `pay_amount` and `actually_paid`, the payment goes to manual review rather than crediting.
4. Orbit is still a single passkey super-admin; there are no named admin accounts, so `adminId` is a fixed `orbit-superadmin` label.
5. The store is a single JSON file with an in-process lock. Do not run two Node processes against it.
6. Orbit table has filtering and details but no server-side pagination yet.
7. No database migration was required; deposits stay in `api-store.json`.

## Deployment steps (requires approval)

```bash
cd /srv/apps/trustifysmm
npm ci
npm run build
pm2 restart trustifysmm
```

Then verify: `/dashboard/add-funds` shows the picker with provider networks, `/orbit` payments shows the new columns, and an unsigned IPN still returns 401.
