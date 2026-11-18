# TrustifySMM NOWPayments production audit

## Remediation — 2026-11-18 (not deployed)

The two critical findings are fixed in source only. Production was not restarted, so the running server still has the previous behavior until an approved deploy.

| Finding | Status |
| --- | --- |
| Finished IPN credited the USD invoice without checking crypto actually paid or provider fiat | **Fixed in source.** Credit requires a verified `finished` status, matching payment id, order id, customer wallet, USD `price_amount`, pay currency, network when both sides send it, `actually_paid >= pay_amount`, and `actually_paid_at_fiat >= price_amount` when that provider field is positive. Underpayment, currency mismatch, network mismatch, and fiat shortfall go to `review` and do not credit. Overpaid crypto is stored and does not increase the USD credit. No local exchange-rate formula is used. |
| Orbit manual Credit could mark a NOWPayments deposit paid | **Fixed in source.** `action: "credit"` now returns HTTP 403. Manual balance changes are a separate ledger adjustment (`type: adjustment`, ref `manual:…`) and require a reason, confirmation, and a unique reference. They do not set provider status to finished. |

Remaining risk: the live PM2 process has not loaded this code. `actually_paid_at_fiat` of `0` is treated as “provider fiat not estimated”; crypto `actually_paid` is still required. Orbit still has a single passkey super-admin, not named staff accounts.

Date: 2026-11-18  
Scope: read-only production checks plus isolated unit tests.  
No real invoice, crypto transfer, wallet credit, deploy, or PM2 restart was performed.

Public customer deposits were **not** enabled by this audit. The gateway is already live in the running app because credentials are present (`GET /api/payments/nowpayments/currencies` returns `live: true`). Turning that off would be a production change and was not done.

## 1. Overall summary

The production process is the correct TrustifySMM app. Credentials are loaded, the public IPN URL rejects unsigned and bad signatures with HTTP 401, and the production API key is accepted by NOWPayments. Wallet credit is coded to run only after a verified `finished` IPN, with a ledger reference guard against a second credit.

It is **not** ready for an unattended public launch until these gaps are accepted or fixed:

- Finished IPNs credit the original USD invoice amount. `actually_paid` is stored but not compared before credit.
- Orbit admins can manually credit a deposit that is not `finished`.
- Authenticated create, status polling, and ownership were not exercised, because that would create or read real deposits.
- Orbit does not show payment id, network, provider status, credited flag, completed time, or pagination.
- Checkout QR encodes the address only.

## 2. Production configuration

| Check | Result |
| --- | --- |
| App cwd `/srv/apps/trustifysmm`, PM2 `trustifysmm` online, port 3036 | PASS |
| `SITE_URL=https://trustifysmm.com` | PASS |
| `NOWPAYMENTS_BASE_URL=https://api.nowpayments.io` | PASS |
| `NOWPAYMENTS_SANDBOX=false` | PASS |
| `BANKER_PAY_CURRENCIES=usdttrc20,btc,eth` | PASS |
| API key present | PASS (value not printed) |
| IPN secret present | PASS (value not printed) |
| `.env` gitignored | PASS |
| Secret strings in `.next/static` client bundles | PASS (0 hits) |
| Duplicate NOWPayments env blocks | PASS (single `.env` block) |

## 3. NOWPayments API (no invoice created)

| Check | Result |
| --- | --- |
| `GET /v1/status` with configured key | PASS — HTTP 200 in 0.08s |
| `GET /v1/currencies` with configured key | PASS — HTTP 200 in 0.03s, 185 currencies |
| `usdttrc20`, `btc`, `eth` in provider catalog | PASS |
| `GET /v1/payment/1` with configured key | PASS — HTTP 404 (authenticated, payment does not exist; no invoice created) |
| `GET /v1/payment/1` with a fake key | PASS — HTTP 403 |
| `GET /v1/currencies` and `/v1/status` with a fake key | WARNING — both returned HTTP 200, so those two routes do not prove the key |
| Timeout / network-failure code paths | NOT TESTED against a forced outage |
| Creating a payment or invoice | NOT TESTED (forbidden by this audit) |

## 4. Webhook security

Endpoint: `POST https://trustifysmm.com/api/payments/nowpayments/ipn`  
Legacy alias `POST /api/banker/webhook` uses the same handler.

| Check | Result |
| --- | --- |
| Public HTTPS reachability | PASS |
| Missing signature | PASS — HTTP 401 |
| Invalid HMAC | PASS — HTTP 401 |
| Empty body | PASS — HTTP 401 (rejected before processing) |
| Malformed JSON | WARNING — HTTP 401, not 400. Safe, but not a distinct parse error |
| Sorted JSON + HMAC-SHA512 + timing-safe compare | PASS — unit tests with a fixture secret |
| Valid signed payload posted to production | NOT TESTED (could touch a real deposit if the order id matched) |
| Duplicate, repeated, and out-of-order IPNs on the live store | NOT TESTED |
| Unknown order id on the live store | NOT TESTED. Code returns `{ ignored: true, reason: "unknown_deposit" }` without credit |

## 5. Payment creation API

`POST /api/payments/nowpayments/create` and `POST /api/dashboard/payments`.

| Check | Result |
| --- | --- |
| Unauthenticated create, including `0` and `-5` | PASS — HTTP 401 before any provider call |
| Authenticated amount, min, max, decimals, currency | NOT TESTED (would create a real invoice) |
| Rate limit 12 requests / 60s per user | PASS in unit test of the limiter only. Live limiter NOT TESTED |
| Customer can only create a deposit for their own API key | PASS by code review (`requireCustomer` uses the session user). Live NOT TESTED |
| Server uses the API key only on the server | PASS |

## 6. Status polling

`GET /api/payments/nowpayments/status/[depositId]`

| Check | Result |
| --- | --- |
| No session | PASS — HTTP 401, including unknown id `TSM-NOT-REAL` |
| Owner vs another customer | PASS by code review (`apiKey` mismatch returns Forbidden). Live NOT TESTED |
| Pending, confirming, finished, failed, expired, partial UI states | NOT TESTED in a browser |
| Provider timeout during poll | NOT TESTED. The status route reads the local store; it does not call NOWPayments on each poll |

## 7. Wallet credit

| Check | Result |
| --- | --- |
| Only `finished` is eligible | PASS — `waiting`, `confirming`, `confirmed`, `sending`, `partially_paid`, `failed`, `expired`, `refunded` do not credit |
| Invalid signature cannot credit | PASS — request stops at HTTP 401 |
| Isolated test wallet, first credit | PASS — 10 + 25 = 35, one ledger row, ref = deposit id |
| Second call on the same deposit | PASS — balance stays 35, still one ledger row |
| Missing wallet | PASS — no balance change |
| Concurrent callbacks | WARNING — `withStoreLock` is in-process only. One PM2 fork makes this acceptable today. A second process would not share the lock |
| Amount mismatch | FAIL — a verified `finished` IPN credits `invoice.amountUsd` even if `actually_paid` differs. The paid crypto amount is stored, not enforced |
| One deposit cannot credit a second user | PASS in the isolated fixture (unknown key does not move the other wallet) |
| Real customer balances during this audit | PASS — not modified. Store had 6 accounts, 0 ledger rows, 2 pending invoices (1 demo, 1 nowpayments), 0 credited flags |

## 8. Deposit store (`data/runtime/api-store.json`)

| Check | Result |
| --- | --- |
| Schema can store payment id, coin, expected amount, paid amount, network, provider status, credited flag, hash, address, timestamps, history | PASS by type review |
| Production rows checked for paid-without-ledger | PASS — 0 such rows |
| Migration | NOT PERFORMED |
| File-store risk | WARNING — one JSON file, no cross-process lock, no DB transaction. A crash between balance write and invoice flag is possible, though the ledger `ref` blocks a second credit |

## 9. Customer Add Funds UI

Code review of `WalletViews.tsx` and `CryptoDepositQr.tsx`. No logged-in browser session was used.

| Check | Result |
| --- | --- |
| NOWPayments card, presets $10–$250, custom USD, coin picker | PASS |
| Address and amount come from the provider response | PASS |
| QR | WARNING — encodes the address only, not a coin URI with amount |
| Copy address and copy amount | PASS |
| Success copy only when status is `paid` | PASS |
| Polling | WARNING — every 8s while pending. Stops on paid, expired, or failed |
| Loading / offline / error text | PASS |
| Tablet and mobile layout | NOT TESTED in a browser. CSS is fluid |
| Light mode | WARNING — dashboard tokens switch under `html[data-dash="light"]`. New funds classes were not screenshotted |
| Dark mode | WARNING — default theme exists. Not screenshotted in this audit |

## 10. Orbit admin

| Check | Result |
| --- | --- |
| Unauthenticated `/api/orbit/banker` | PASS — HTTP 401 |
| Gateway live / not configured pill | PASS in code |
| API returns payment id, provider status, network, credited flag | PASS |
| Table shows those fields | FAIL — table is deposit, customer, USD, coin, internal status, hash, created, actions |
| Search | WARNING — id, email, name, hash only |
| Status filters | PASS for pending, confirming, paid, failed, expired. No partial filter |
| Pagination and detail drawer | FAIL — not implemented |
| Manual Credit button | FAIL for the “only finished IPNs credit” rule. An admin can credit any non-paid deposit |
| Light / dark Orbit screenshots | NOT TESTED |

## 11. Existing payment compatibility

| Check | Result |
| --- | --- |
| `POST /api/dashboard/payments` still requires auth | PASS — HTTP 401 |
| `POST /api/banker/webhook` uses the same IPN verifier | PASS — HTTP 401 unsigned |
| `GET /api/dashboard/transactions` requires auth | PASS — HTTP 401 |
| Second wallet system | PASS — credits still go through `api-store.json` |
| Authenticated regression of an old deposit | NOT TESTED |

## 12. Automated tests

`npm test` — PASS. 1 file, 7 tests.

Covered: sorted HMAC, bad and missing signatures, status mapping, credit eligibility, isolated single credit, duplicate credit, missing wallet, rate limit.

Not covered: authenticated HTTP routes, live IPN with the production secret, amount mismatch, cross-user status reads.

## 13. Typecheck and build

| Command | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run build` | PASS, written to `.next-audit` then deleted so the live `.next` was not replaced |
| ESLint | WARNING — `eslint-config-next/core-web-vitals` module path. Build continued |
| CSS | WARNING — autoprefixer `end` vs `flex-end` in `app/orbit/orbit.css` |

Production PM2 was not restarted. Live `.next/BUILD_ID` remained in place.

## 14. Issues

### Critical

1. **Amount mismatch does not block credit.** A valid `finished` callback credits the quoted USD amount.
2. **Orbit manual credit bypasses NOWPayments `finished`.** Use it only after an out-of-band check.

### Medium

1. IPN verification is in-process. Do not run two Node processes against the same `api-store.json`.
2. Orbit list omits provider payment id, network, provider status, credited flag, and completed time.
3. No pagination.
4. Malformed IPN bodies return 401 instead of 400.
5. QR is address-only.
6. Status poll does not re-query NOWPayments; it trusts the last stored IPN.

### Minor

1. Eight-second polling.
2. Light and dark payment screens were not visually signed off.
3. Existing ESLint config warning.
4. One pending NOWPayments invoice and one demo invoice already exist. They were not touched.

## 15. Manual steps still required

1. Confirm the NOWPayments dashboard IPN URL is exactly `https://trustifysmm.com/api/payments/nowpayments/ipn`.
2. Decide whether amount mismatch and admin manual credit should be tightened before a public test.
3. Separately authorize one small real deposit. This audit did not do that.
4. After that deposit, confirm one ledger row, one balance increase, and a second identical IPN does not credit again.
5. Do not commit `.env`.

## 16. Code added by this audit

`tests/nowpayments.test.ts` was extended with isolated fixtures. No payment setting, wallet row, or process was changed.
