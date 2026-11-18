# NOWPayments pre-deployment checklist

Audit performed: 2026-11-18 (UTC+05:45)  
Project: `/srv/apps/trustifysmm` (real path, not a symlink)  
**Status: NOT deployed. No restart, no push, no invoice, no balance change.**

---

## 1. Production process

| Item | Value |
| --- | --- |
| PM2 app | `trustifysmm` (pm_id 3) |
| Status | `online`, 98 restarts (historical), pid 3465635 |
| Working directory | `/srv/apps/trustifysmm` |
| Start command | `npm run start -- --port 3036` |
| Resolved script | `next start --port 3010` + `--port 3036` → **listening on 3036** |
| Exec mode | `fork_mode`, `instances = 1` |
| Node listener | `next-server` pid 3465649 on `*:3036` — exactly **one** server process |
| Reverse proxy | nginx → `127.0.0.1:3036`, Cloudflare in front |
| Live build id | `kefiBjkveC1pRMUfcXDNvp` (`.next/BUILD_ID`, built 18:20) |
| Process started | 2026-11-18 18:29:34 |

### Single-process requirement — satisfied
`lib/runtime-lock.ts` serialises store writes with an **in-process promise chain**, not a filesystem lock. Two Node processes would corrupt `api-store.json`. PM2 runs `fork_mode` with one instance, so the constraint holds. **Do not switch to `cluster` mode or add instances.**

⚠️ Note: `npm run start` hardcodes `--port 3010`; PM2 appends `--port 3036`, and Next honours the last flag. Keep the PM2 args as they are, or change `package.json` `start` and PM2 together.

---

## 2. Backup

**Location:** `/home/sysadmin/backups/trustifysmm/2026-11-18_131030`  
(Outside the application build directory. `/srv` is root-owned and `sudo` is unavailable to `sysadmin`, so this is the writable location that is not inside `/srv/apps`.)

Directory mode `700`, all files mode `600`. No pre-existing backup was overwritten — the timestamped directory was created with a exists-check that aborts.

| File | Size (bytes) | Contents |
| --- | --- | --- |
| `data.tar.gz` | 103,895 | `data/` — `runtime/api-store.json`, `customers.json`, `customer-panel.json`, `orbit-audit.json`, `service-admin.json`, `data/orbit/*` |
| `env.tar.gz` | 905 | `.env` only (mode preserved, archive `600`) |
| `source.tar.gz` | 47,630,403 | application source, **excluding** `node_modules`, `.next`, `.git`, `data`, `.env`, logs |
| `next-build.tar.gz` | 142,630,267 | the live `.next` production build (for rollback) |
| `SHA256SUMS` | 319 | checksums of the four archives above |

### Verification performed
- `gzip -t` passed on all four archives.
- `data.tar.gz` listing confirmed to contain all five runtime JSON files plus `data/orbit/`.
- `next-build.tar.gz` contains `.next/BUILD_ID` and `.next/required-server-files.json`; extracted `BUILD_ID` = `kefiBjkveC1pRMUfcXDNvp`, matching the live server.
- `.env` archive inspected **by key name only** (no values printed) — 12 keys present.
- `api-store.json` inside the backup hashes identically to the live file: `08561dff…4e19d7` → the payment ledger snapshot is exact.

### Issue found and corrected during the backup
The first `source.tar.gz` accidentally included `.env` because the exclusion list did not cover it. It was rebuilt with `--exclude=.env`, and the unsafe archive was shredded. The shipped `source.tar.gz` now contains only `.env.example`. This is why the archive timestamp is 18:57 while its siblings are 18:55.

### Live data drift
Between the backup and the end of the audit, `customer-panel.json` gained one record: a customer Google login (`lin_74d8aff87c2d`, 2026-11-18T13:11:11Z). This is expected live traffic, not a payment. `api-store.json`, `customers.json`, `orbit-audit.json` and `service-admin.json` are byte-identical to the backup. If you want a snapshot that also includes that login, re-run the data backup before deploying.

---

## 3. Production configuration

Verified by key name and safe scalar values only. **No credential value was printed, logged, or stored in this repository.**

| Setting | Result |
| --- | --- |
| `SITE_URL` | `https://trustifysmm.com` ✅ |
| `NOWPAYMENTS_BASE_URL` | `https://api.nowpayments.io` ✅ production host (not sandbox) |
| `NOWPAYMENTS_SANDBOX` | `false` ✅ |
| `NOWPAYMENTS_API_KEY` | present, server-side only ✅ |
| `NOWPAYMENTS_IPN_SECRET` | present, server-side only ✅ |
| `NOWPAYMENTS_MIN_DEPOSIT_USD` | not set → code default `$1` |
| `NOWPAYMENTS_MAX_DEPOSIT_USD` | not set → code default `$50,000` |
| `NOWPAYMENTS_PAYMENT_EXPIRY_MINUTES` | not set → code default `60` |
| `BANKER_PAY_CURRENCIES` | `usdttrc20,btc,eth` |
| Effective IPN URL | `https://trustifysmm.com/api/payments/nowpayments/ipn` |
| `.env` permissions | `-rw------- sysadmin sysadmin` ✅ |
| Live IPN reachability | `POST` unsigned → **401 `Invalid signature`** ✅ (public and loopback) |
| Live currencies endpoint | `200`, returns `usdttrc20, btc, eth`, `live: true`, `sandbox: false` ✅ |

### Enabled currency/network configuration
`BANKER_PAY_CURRENCIES` is an **allowlist**, and the UI intersects it with `GET /v1/full-currencies` (`enable: true`) plus the provider's real `network` field. Currently three coins are offered:

| Provider code | Coin | Network |
| --- | --- | --- |
| `usdttrc20` | USDT | TRON (TRC20) |
| `btc` | BTC | Bitcoin |
| `eth` | ETH | Ethereum |

Every other verified provider currency (USDT ERC20, USDT BSC, USDC, USDC Polygon, LTC, DOGE, TRX, BNB, SOL, …) is **intentionally hidden** until you add it to `BANKER_PAY_CURRENCIES`. Adding a code there is the only switch; no code change is needed.

---

## 4. Security audit

| Control | Result | Evidence |
| --- | --- | --- |
| API key and IPN secret server-side only | ✅ PASS | `lib/nowpayments/config.ts` reads `process.env` only; no `NEXT_PUBLIC_` variant exists. Scanned every file in `.next/static` for the real secret values → **0 hits**. The only matches were env **names** inside user-facing error copy ("Set `NOWPAYMENTS_API_KEY`"). |
| No secrets in Git | ✅ PASS | `git ls-files` matches only `.env.example`; `.gitignore` has `.env`, `.env.*`, `!.env.example`; `git log --all -- .env` is empty — the file was never committed. |
| Strict IPN signature | ✅ PASS | HMAC-SHA512 over recursively key-sorted JSON, compared with `timingSafeEqual`. Missing secret → 503, missing/invalid/malformed signature → 401, bad JSON → 400. Verified live: unsigned POST returns 401. |
| Only verified `finished` can credit | ✅ PASS | `providerStatusCreditsWallet()` gates the policy first; `markInvoicePaid` also refuses NOWPayments invoices unless `meta.source === "ipn"`. |
| Payment ID validated | ✅ PASS | `payment_id_mismatch` → review when the invoice already holds a different id. |
| Order / deposit ID validated | ✅ PASS | `order_id_mismatch` → review; unknown deposit → ignored without side effects. |
| Customer ownership | ✅ PASS | Every credit path resolves the invoice's `apiKey`; `customer_missing` → review. Status routes require the customer session and compare `invoice.apiKey`. |
| Currency validated | ✅ PASS | `pay_currency` must equal the invoice `payCurrency` (exact provider code, so network-specific). Mismatch → review. |
| Network validated | ✅ PASS **with caveat** | Mismatch → review when **both** sides carry a network. If the invoice has no stored network, the check is skipped — but `pay_currency` (`usdttrc20` vs `usdterc20`) is already network-specific, so a wrong network cannot pass. |
| USD amount validated | ✅ PASS | `price_currency` must be `usd`, `price_amount` must equal `invoice.amountUsd` exactly (BigInt at 2 dp). No floats anywhere in money math. |
| Underpayment → manual review | ✅ PASS | `actually_paid < pay_amount` → `review` (`underpaid`). `actually_paid_at_fiat < amountUsd` → `review` (`fiat_equivalent_insufficient`). Never credits. |
| Missing verification data → review | ✅ PASS | `paid_amount_missing`, `quoted_pay_amount_mismatch`, `price_amount_invalid`, `fiat_equivalent_invalid` all route to review. |
| Overpayment does not inflate USD | ✅ PASS | Credit is capped at `invoice.amountUsd`; the crypto excess is stored in `overpaidCrypto` only. |
| Duplicate IPN cannot double-credit | ✅ PASS | `walletCredited` / `status === "paid"` short-circuit, plus a `transactions.ref === invoice.id` guard inside the store lock. Covered by a test. |
| Uses existing `finalizeDepositCredit` | ✅ PASS | `markInvoicePaid` → `finalizeDepositCredit` → `creditWalletDepositLocked`. No second wallet, no new balance field. |
| Atomic credit | ✅ PASS | All mutation runs inside `withStoreLock` (serialised read-modify-write + single `persist`). |
| Manual NOWPayments credit blocked | ✅ PASS | `POST /api/orbit/banker` with `action: "credit"` → **403** with an explicit message. The Orbit Credit button was removed. |
| Manual adjustment controls | ✅ PASS | Requires `confirm: true`, a reason ≥ 8 chars, and an idempotency key matching `^[A-Za-z0-9_-]{8,80}$`. Writes `type: "adjustment"` with `adminId`, `reason`, and a unique `ref`; duplicate refs rejected; negative balances rejected. It never touches invoice status. |
| Frontend cannot mark a deposit paid | ✅ PASS | The only success state comes from `/api/payments/nowpayments/status/[depositId]` (server-verified) polling; submitting a tx hash moves the deposit to `confirming` only. |
| Rate limits | ✅ PASS | Create: 12/min per customer. Quote: 30/min. |
| Orbit route protection | ✅ PASS | Middleware guards `/orbit` and `/api/orbit` with the signed `orbit_session` cookie. |
| Demo auto-pay | ✅ PASS | `site-config.json → banker.demoAutoPay = false` and `BANKER_DEMO_AUTO_PAY` unset. Even if enabled, `markInvoicePaid` refuses NOWPayments invoices from non-IPN sources. |

---

## 5. Build and tests

| Command | Result |
| --- | --- |
| `npm run typecheck` | ✅ PASS (no diagnostics) |
| `npm test` | ✅ PASS — 8 files, **90 tests** |
| `npm run build` | ✅ PASS |

Re-verified for step 6 (reconciliation): typecheck PASS, 90/90 tests PASS, isolated build PASS.

The build runs in a **throwaway copy** at `/tmp/tsm-b1-build` (`--exclude=node_modules .next .git .env data/runtime`, with `node_modules` symlinked). Production files are never edited: `.next/BUILD_ID` was `kefiBjkveC1pRMUfcXDNvp` before and after, and the temp copy was deleted afterwards.

### Test coverage (43)
**Signature / status mapping / credit policy (18)**
1. IPN signature over sorted JSON
2. Nested-key sorting; missing signature
3. Tampered / invalid signature
4. Every provider status → internal mapping
5. Only `finished` credits the wallet
6. Exact finished payment credits the original USD amount
7. Underpayment → review
8. Overpayment recorded, USD credit unchanged
9. Wrong currency **and** wrong network rejected
10. Insufficient fiat equivalent → review
11. Payment identity mismatch → review
12. Unfinished statuses never credit
13. Manual adjustment requires confirmation + reason, rejects duplicates
14. Wallet credits once, duplicate call is a no-op
15. No credit for another user / missing wallet
16. Create rate limit
17. Provider identifiers keep USDT networks separate
18. Disabled provider currencies excluded; unconfigured gateway returns empty

**B1 access control (18)**
19. Unauthenticated `GET /api/banker/status` → 401
20. Invalid API key → 404, body contains no address / provider id / amount
21. Valid owning reseller key → 200
22. `Authorization: Bearer <key>` → 200
23. Valid `x-deposit-token` → 200 for that deposit only
24. Missing/forged deposit token → 404, no data leaked
25. Another customer's key cannot read the deposit → 404
26. Foreign id and non-existent id return byte-identical 404 bodies
27. API key in the query string is rejected (401)
28. Missing `id` → 400
29. `GET /api/banker/pay?confirm=1` with a valid key does **not** credit: invoice stays `pending`, `walletCredited` false, ledger empty, balance unchanged
30. Unauthenticated `/api/banker/pay` → 401
31. Foreign deposit on `/api/banker/pay` → 404
32. `POST/PUT/PATCH/DELETE` on `/api/banker/pay` → 405 with `Allow: GET`; invoice untouched
33. Access token has ≥40 chars and stores only a 64-char hash
34. Tokens are unique per issue
35. Token verification accepts only the exact token
36. `constantTimeEquals` rejects wrong content, wrong length and empty input

**API-key extraction (7)**
37. `x-api-key` header trimmed and returned
38. Bearer token parsed
39. Query-string key ignored
40. Missing key → empty string
41. Header preferred over bearer
42. Non-bearer scheme ignored
43. `resellerKeyMatchesInvoiceKey` accepts only the owner's key

**Duplicate credit protection** is asserted twice: `creditWalletDepositLocked` (test 14) and the `/api/banker/pay` mutation test (test 29), which verifies the ledger stays empty after a confirm attempt.

No network call to NOWPayments is made by the suite; all responses are mocked. No invoice was created and no balance changed.

---

## 6. Findings and blockers

### Resolved during this audit

**B1 — Legacy `/api/banker/status` was unauthenticated (information disclosure). FIXED.**
`GET /api/banker/status?id=TSM-…` previously returned the deposit address, provider payment ID, amount, network and status to anyone holding a deposit ID — no API key, no session. Confirmed live before the fix (`200` with a real `pay_address` for the existing pending deposit).

Fix applied (approved by the operator). The final implementation is a full hardening, not just an API-key gate:

| Route | Before | After |
| --- | --- | --- |
| `GET /api/banker/status` | no auth; returned address + provider id to anyone with an id | Auth required. `401` with no credential, `404` for a foreign/unknown id, `200` only for the owner |
| `GET /api/banker/pay` | no auth; `?confirm=1` could mark a demo invoice paid | Read-only. Auth required; `POST/PUT/PATCH/DELETE` return `405`. No path to `markInvoicePaid` remains |

**Authentication (one of):**
- `x-api-key: <reseller API key>` — or `Authorization: Bearer <key>`. The key is compared to the invoice owner's key with a constant-time SHA-256 comparison (`constantTimeEquals`).
- `x-deposit-token: <payment access token>` — a 256-bit, base64url token returned **once** at invoice creation. Only its SHA-256 hash is stored on the invoice (`accessTokenHash`), so the data file cannot be replayed as a bearer credential. Scope is read-only for that one deposit.

**Supporting controls:**
- Query-string secrets are rejected. `?key=` and `?token=` are ignored in favour of headers, so keys no longer land in access logs, proxy logs, Referer headers or browser history.
- `getBankerInvoiceStatus` is fail-closed: no credential → `Invoice not found`. It never distinguishes "wrong owner" from "does not exist", so deposit ids cannot be enumerated.
- Rate limiting: 120 req/min per client IP on both routes.
- Every 401/404 body is a generic message with no address, payment id, amount, network or owner information.
- `submitInvoiceHash` and `/api/dashboard/payments/[id]` now use constant-time key comparison too.
- `markInvoicePaid` remains IPN-gated (`source === "ipn"` only), so the verified-`finished` crediting rules are untouched.
- Demo invoices no longer receive a `/api/banker/pay?confirm=1` `payment_url`. That link is gone because the endpoint is now a key-protected API, not a browser payment page. Live deposits still get the provider's `invoice_url`.
- `BANKER_DEMO_AUTO_PAY` is retained as a no-op for local tooling compatibility, documented as such in `.env.example`. `site-config.json → demoAutoPay` stays `false` and can no longer cause a credit.

### Callers inspected and updated

| Caller | Change |
| --- | --- |
| `app/api/dashboard/payments/[id]` | passes the customer session's key; constant-time ownership check; uniform 404 |
| `app/api/payments/nowpayments/status/[depositId]` | passes `{ apiKey: user.apiKey }`; uniform 404 |
| `app/api/dashboard/payments` (create) | returns `deposit_access_token` and `token_header` from `createBankerInvoice` |
| `public/downloads/trustifysmm-api-client.php` | `invoiceStatus()` sends `x-api-key`; maps 401/404 to clear errors |
| `data/api-documentation.ts` | documents `x-api-key`, marks `/api/banker/pay` read-only, exports `bankerAuthMigration` |
| `components/ApiDocumentation.tsx` | polling step shows the header; renders the migration notice |
| `data/support-faq.ts` | two answers now mention the `x-api-key` requirement |
| `app/globals.css` | `.api-docs-callout` styling for the migration notice |

No customer-facing polling depended on the unauthenticated route: the add-funds page and the payments history poll `/api/payments/nowpayments/status/[depositId]` (session + ownership), and the dashboard detail page polls `/api/dashboard/payments/[id]`. Both were already authenticated and now also enforce constant-time ownership.

### Deposit id predictability

`TSM-` + 48 bits of `randomBytes` (12 hex chars) — about 2.8×10¹⁴ values. Not brute-forceable, but **not** treated as authorisation: a valid id alone now yields `404` unless the caller also holds a key or token.

### Backward compatibility impact

| Client | Before | After | Action |
| --- | --- | --- | --- |
| `POST /api/banker/invoice` | key in JSON body | unchanged | none |
| `GET /api/banker/status?id=…` **with** `x-api-key` | worked | works | none |
| `GET /api/banker/status?id=…&key=…` | worked | `401` | move key to the header |
| `GET /api/banker/status?id=…` (no credential) | worked | `401` | add the header |
| Bundled PHP client `invoiceStatus()` | worked | works (updated) | re-download the client |
| `GET /api/banker/pay?confirm=1` demo credit | credited | `405`/read-only | none — demo credit is intentionally removed |
| Customer panel polling | worked | works | none |

There is **no** unauthenticated fallback and no compatibility window that leaves the data exposed. The breaking change is immediate and deliberate.

### Reseller migration steps

1. Stop sending the key in the URL. Move it to the `x-api-key` header.
2. Confirm `Authorization: Bearer <key>` also works if that is easier for your stack.
3. Expect `401` when the key is missing or invalid, and `404` both for a deposit that does not exist **and** for one belonging to a different account — do not treat `404` as "retry with a different key".
4. Re-download `https://trustifysmm.com/downloads/trustifysmm-api-client.php` if you use the bundled PHP client.
5. If you display deposit details in a browser, create the invoice through your own backend and proxy the read — never ship a reseller key to the browser. A browser-only flow can instead use the `deposit_access_token` returned by `POST /api/banker/invoice`, sent as the `x-deposit-token` header.
6. Remove any use of `/api/banker/pay?confirm=1`; it no longer credits anything.

### Non-blocking observations

1. **`package.json` `start` hardcodes port 3010.** PM2 works only because its `--port 3036` wins. Align them or the next hand-run `npm start` will bind the wrong port.
2. **`data/runtime/` is gitignored but not backed up by any schedule.** This audit's archive is a manual snapshot; add a cron for `api-store.json` if you want point-in-time recovery.
3. **Deposit amount limits are defaults** (`$1`/`$50,000`) because no override is set. If you want tighter limits, set `NOWPAYMENTS_MAX_DEPOSIT_USD` before going live.
4. **Network check is skipped when the invoice has no stored network.** Safe today because `pay_currency` is network-specific; if NOWPayments ever returns a non-network-specific code, revisit.
5. **`adminId` is the constant `orbit-superadmin`** — Orbit still has one shared passkey, so adjustments cannot be attributed to a named person.
6. **Live build predates this work.** `/api/payments/nowpayments/estimate` returns 404 on the running server and the currencies payload has no `options[]`; that is expected and resolves on deploy.
7. **`data/orbit/traffic.jsonl` and `.live-check.html`** are untracked working-directory artifacts. Harmless, but exclude them from any commit.

---

## 7. Deployment commands (run only after approval)

Do **not** run these from this audit. They will replace the live `.next` and restart the process.

```bash
cd /srv/apps/trustifysmm

# 0. Fresh data snapshot immediately before the switch
STAMP=$(date -u +%Y-%m-%d_%H%M%S)
mkdir -p /home/sysadmin/backups/trustifysmm/$STAMP && chmod 700 /home/sysadmin/backups/trustifysmm/$STAMP
tar -czpf /home/sysadmin/backups/trustifysmm/$STAMP/data.tar.gz data
cp /srv/apps/trustifysmm/.next/BUILD_ID /home/sysadmin/backups/trustifysmm/$STAMP/BUILD_ID.before

# 1. Install + build
npm ci
npm run typecheck
npm test
npm run build

# 2. Restart the single existing process (fork_mode, 1 instance)
pm2 restart trustifysmm --update-env
pm2 describe trustifysmm | grep -E "status|exec mode|instances|restarts"

# 3. Smoke test
curl -s -o /dev/null -w "%{http_code}\n" https://trustifysmm.com/api/payments/nowpayments/currencies
curl -s https://trustifysmm.com/api/payments/nowpayments/currencies | head -c 400   # expect options[] with networks
curl -s -o /dev/null -w "%{http_code}\n" -X POST -H 'content-type: application/json' \
  -d '{"payment_id":"1","payment_status":"finished"}' \
  https://trustifysmm.com/api/payments/nowpayments/ipn    # expect 401

# B1 verification
curl -s -o /dev/null -w "status no-auth=%{http_code}\n" "https://trustifysmm.com/api/banker/status?id=TSM-TEST"
curl -s -o /dev/null -w "status bad-key=%{http_code}\n" -H "x-api-key: wrong" \
  "https://trustifysmm.com/api/banker/status?id=TSM-TEST"
curl -s -o /dev/null -w "pay no-auth=%{http_code}\n" "https://trustifysmm.com/api/banker/pay?id=TSM-TEST&confirm=1"
curl -s -o /dev/null -w "pay POST=%{http_code}\n" -X POST "https://trustifysmm.com/api/banker/pay?id=TSM-TEST"
# expect: 401, 404, 401, 405
```

Post-deploy checks: `401` on unauthenticated `/api/banker/status`, `404` for a deposit you do not own, `405` on `POST /api/banker/pay`, `/dashboard/add-funds` shows the searchable picker with network badges, `/orbit` → payments shows the new columns, filters and drawer, the manual Credit button is gone, and exactly one PM2 process is running.

---

## 8. Rollback

Everything needed is in `/home/sysadmin/backups/trustifysmm/2026-11-18_131030`.

```bash
cd /srv/apps/trustifysmm
BK=/home/sysadmin/backups/trustifysmm/2026-11-18_131030
(cd "$BK" && sha256sum -c SHA256SUMS)      # verify archives first

# 1. Stop writing before restoring data
pm2 stop trustifysmm

# 2. Restore the previous production build
rm -rf .next
tar -xzf "$BK/next-build.tar.gz" -C /srv/apps/trustifysmm
cat .next/BUILD_ID                          # expect kefiBjkveC1pRMUfcXDNvp

# 3. Restore application source (no node_modules, no data, no .env)
tar -xzf "$BK/source.tar.gz" -C /srv/apps/trustifysmm

# 4. Restore payment/customer data — this rewinds the ledger to backup time
tar -xzpf "$BK/data.tar.gz" -C /srv/apps/trustifysmm
sha256sum data/runtime/api-store.json       # expect 08561dffaa2f2487f0dd99a2f8e22c1ffb0706d15ecb0c35b8867d49a24e19d7

# 5. Only if .env was changed (it should not be): restore it
#    tar -xzpf "$BK/env.tar.gz" -C /srv/apps/trustifysmm && chmod 600 .env

# 6. Bring the single process back
pm2 start trustifysmm
pm2 logs trustifysmm --lines 40
```

⚠️ **Step 4 rewinds wallet balances and deposits to the backup moment.** If the rollback happens after real customers were credited, restoring `data/` will silently erase those credits. In that case, restore code + `.next` only and leave `data/` untouched — then reconcile from NOWPayments.

⚠️ `node_modules` is not in the backup. If `npm ci` produced an incompatible tree, run `npm ci` again at the previous `package-lock.json` (it *is* in `source.tar.gz`).

---

## 9. Step 2 — Reseller migration preparation

Status: **prepared, not distributed.** No emails were sent and no reseller was contacted.

### Deliverable

`docs/RESELLER_AUTH_MIGRATION_NOTICE.md` — complete reseller-facing notice covering:

- Public unauthenticated payment-status access is no longer supported
- `GET /api/banker/status` now requires authentication
- Send reseller API keys in the `x-api-key` request header
- `?key=` query authentication is no longer accepted
- `GET /api/banker/pay` is read-only
- `?confirm=1` demo auto-credit is permanently removed
- `POST /api/banker/invoice` is unchanged (two additive response fields only)

It includes before/after cURL and PHP examples, a status-code table, a reseller checklist, and key-rotation guidance. **All values are placeholders** — verified programmatically against all 15 live secrets (6 reseller keys, 5 customer keys, 4 environment secrets): 0 matches, and 0 occurrences of the real `tsm_…` key pattern.

### In-product documentation already updated

| Surface | Change |
| --- | --- |
| `data/api-documentation.ts` | `banker-status` documents `x-api-key`; new `banker-pay` read-only entry; `bankerAuthMigration` export (before/after) |
| `components/ApiDocumentation.tsx` | Polling step shows the header; renders the migration callout |
| `app/globals.css` | `.api-docs-callout` styling |
| `data/support-faq.ts` | Two answers now state the `x-api-key` requirement |
| `public/downloads/trustifysmm-api-client.php` | `invoiceStatus()` sends `x-api-key`; maps 401/404 to clear errors |

### Verification of the notice content against source

| Claim in notice | Verified in source |
| --- | --- |
| Status requires auth | `app/api/banker/status/route.ts` → 401 without credential |
| `?key=` rejected | `lib/banker/api-key.ts` reads headers only |
| `/api/banker/pay` read-only | `app/api/banker/pay/route.ts` → `405` for POST/PUT/PATCH/DELETE |
| `?confirm=1` removed | No `markInvoicePaid` import or call remains in that route |
| Invoice creation unchanged | `createBankerInvoice` request shape untouched |
| Token returned once | `deposit_access_token` in the create response; only the hash is stored |
| 120 req/min limit | `rateLimit(..., 120, 60_000)` on both routes |

---

## 10. Step 2 — Credential rotation inventory

**Nothing was rotated.** No `.env` value was read out, printed, or changed.

### Environment credentials

| Credential | Configured in | Used by | Rotation recommended? | Dependent configuration |
| --- | --- | --- | --- | --- |
| `NOWPAYMENTS_API_KEY` | `/srv/apps/trustifysmm/.env` (mode `600`, never committed) | `lib/nowpayments/config.ts` → `client.ts` (create payment, status, estimate, full-currencies) | **Yes** — it was pasted into a chat transcript earlier in this project, so treat it as disclosed | Update `.env`, then `pm2 restart trustifysmm --update-env`. No provider-side URL or callback depends on the key. |
| `NOWPAYMENTS_IPN_SECRET` | same `.env` | `lib/nowpayments/signature.ts` via `ipn-handler.ts` | **Yes** — same exposure path as the API key | Must be rotated in the NOWPayments dashboard **and** `.env` in one window. A mismatch silently rejects every IPN (401) and stops all auto-crediting. Rotate during low traffic and watch for 401s afterwards. |
| `SESSION_SECRET` | same `.env` | `lib/customer/session.ts`, `session-edge.ts`, `auth-response.ts` | Optional | Rotating invalidates every customer session and the middleware's HMAC check — all users must sign in again. No URL exposure. |
| `ORBIT_PASSKEY` | same `.env` | `lib/orbit/auth.ts` via middleware | **Recommended** — it is only 9 characters | Rotating invalidates the current Orbit admin session. No URL exposure. |
| `GOOGLE_CLIENT_SECRET` | same `.env` | `lib/customer/google-oauth.ts` | Not required | Must be rotated in Google Cloud Console together with `.env`. `GOOGLE_CALLBACK_URL` stays unchanged. |
| `DATABASE_URL` | same `.env` | `prisma.config.ts` | Not required for this deploy | Prisma is not used for deposits; changing it has no effect on the wallet ledger. |

### Reseller and customer API keys

| Item | Where | Count | Rotation recommended? | Dependent configuration |
| --- | --- | --- | --- | --- |
| Reseller API keys | `data/runtime/api-store.json` → `accounts[].key`, mirrored on `data/runtime/customers.json` → `users[].apiKey` | 6 accounts (1 demo `trus…`, 5 `tsm_…`) | **Yes, for any key that was ever sent as `?key=`** | Self-service: dashboard → Account → API key → Regenerate. `rotateAccountKey()` re-points orders, invoices and ledger rows to the new key, so history stays accessible. The old key stops working immediately — the reseller must update their integration in the same window. |
| Customer API keys | same stores | 5 (`tsm_…`, 52 chars = `tsm_` + 48 hex) | Same rule | Same mechanism; customers regenerate from their own account page. |
| `DEMO_API_KEY` | `lib/smm-api/demo-store.ts` seed path, read via `demoKeyFromEnv()` | 1 seeded demo account (`demo@trustifysmm.com`, `demo: true`, balance $100) | **FIXED** — see §15 | No hardcoded default exists any more. Set `DEMO_API_KEY` to a random value in `.env`; leave it empty to keep the demo account unusable. Only the SHA-256 hash is stored. |

### Credentials previously passed through URLs

| Credential | Previously accepted as | Still accepted? | Evidence of exposure |
| --- | --- | --- | --- |
| Reseller/customer API key | `?key=` on `/api/banker/status` and `/api/banker/pay` | **No** — headers only since B1 | `nginx access.log`: **0** requests containing `key=`, **0** hits to `banker/status`, **0** hits to `banker/pay`. Git history: no `?key=` ever committed. Documentation previously *showed* the keyless form, and the PHP client sent no key at all, so real keys were unlikely to have travelled in URLs. |
| Deposit access token | not previously implemented | New; `x-deposit-token` header only | n/a |
| NOWPayments API key / IPN secret | never in a URL | Server-side headers only | Never sent to the browser; not present in `.next/static` |

### Log and artifact exposure check

- `/var/log/nginx/access.log` is readable by `sysadmin`; grep for `key=`, `banker/status`, `banker/pay` returned zero matches.
- Root-owned logs (rotated archives) could not be scanned — no `sudo`. If you want certainty, have an operator run `zgrep -c 'key=' /var/log/nginx/access.log*.gz`.
- `.env` mtime is 18:29:35, unchanged since the credentials were first added. Nothing in this step wrote to it.
- `deploy/LIVE.md` and `deploy/nginx/LIVE.md` contain only the placeholder `ORBIT_PASSKEY=your-secret`; the real value is not present.

### Rotation is blocked pending approval

No credential was rotated, no `.env` line was modified, and no key was regenerated. The NOWPayments key and IPN secret should be rotated **before** the deploy window opens, because both were exposed in a chat transcript.

---

## 11. Step 2 — Deployment preparation verification

| Check | Result |
| --- | --- |
| B1 patch present in source | ✅ `lib/banker/access.ts`, `lib/banker/api-key.ts`, `getBankerInvoiceStatus` fail-closed, both routes guarded |
| `?key=` rejected | ✅ header-only extraction |
| `/api/banker/pay` read-only | ✅ `405` on POST/PUT/PATCH/DELETE, no `markInvoicePaid` call |
| Tests pass | ✅ `npm test` — 5 files, 43 tests |
| Typecheck | ✅ PASS |
| Production `.next` untouched | ✅ `BUILD_ID` = `kefiBjkveC1pRMUfcXDNvp` |
| PM2 process | ✅ online, pid 3465635, **restarts still 98** — no restart occurred |
| Backup intact | ✅ `sha256sum -c SHA256SUMS` → all 4 archives `OK` |
| Payment records unchanged | ✅ 2 invoices (`<deposit-id>` demo pending, `<deposit-id>` nowpayments pending), **0 transactions** |
| Wallet balances unchanged | ✅ demo 100, all customer accounts 0 |
| `api-store.json` hash | ✅ `08561dff…4e19d7`, identical to the backup |
| No real invoices created | ✅ invoice count still 2 |
| No wallet credits | ✅ ledger empty |

---

## 12. Exact manual steps required before deployment

Complete these **in order**, all before any restart. Steps marked ⛔ need your explicit approval.

1. ⛔ **Rotate `NOWPAYMENTS_API_KEY`** — zero-downtime procedure in §18.4/§18.5. New key can overlap the old one; delete the old key only after §18.8 passes.
2. ⛔ **Rotate `NOWPAYMENTS_IPN_SECRET`** — **no overlap exists; the old secret dies the moment you click Regenerate** (§18.3). Stage the new value in `.env` first, then Regenerate, then restart within the same minute. Verify with the positive-signature test (§18.8 test 5). This step is irreversible — see §18.9.
3. ✅ **Demo key migration — DONE (§17).** Demo account revoked, credential removed, $100 isolated. No action needed at deploy time. `DEMO_API_KEY` remains absent, which is correct.
4. ⛔ **Rotate `ORBIT_PASSKEY`** (currently 9 characters) to a strong random value of at least 20 characters.
4. **Optionally rotate `SESSION_SECRET`** — this signs every customer session out.
5. **Notify resellers** using `docs/RESELLER_AUTH_MIGRATION_NOTICE.md`. Do not send it until you are ready to deploy; the notice says "effective at the next deploy".
6. **Rotate reseller keys that were ever sent in a URL.** Evidence says none were, so this is precautionary. Rotation invalidates the old key immediately, so coordinate with each reseller.
7. **Take a fresh data snapshot** immediately before the switch, because a live customer login landed in `customer-panel.json` after the existing backup:
   ```bash
   STAMP=$(date -u +%Y-%m-%d_%H%M%S)
   D=/home/sysadmin/backups/trustifysmm/$STAMP
   mkdir -p "$D" && chmod 700 "$D"
   tar -czpf "$D/data.tar.gz" data && chmod 600 "$D/data.tar.gz"
   sha256sum "$D/data.tar.gz" > "$D/SHA256SUMS"
   ```
8. **Decide on deposit limits.** Defaults are `$1` / `$50,000`. Set `NOWPAYMENTS_MAX_DEPOSIT_USD` if you want tighter caps.
9. **Align the start port.** `package.json` `start` hardcodes `--port 3010` and only PM2's `--port 3036` keeps it correct. Fix both or leave PM2 as-is and never run `npm start` by hand.
10. **Deploy** with the commands in §7, then run the smoke tests including the four B1 checks.

---

## 13. Remaining blockers

| # | Blocker | Severity | Owner |
| --- | --- | --- | --- |
| 1 | `NOWPAYMENTS_API_KEY` and `NOWPAYMENTS_IPN_SECRET` were exposed in a chat transcript and are **not yet rotated** — full procedure prepared in **§18** | **High** | Operator (dashboard access) |
| 2 | ~~Demo account uses the public source default key~~ — **RESOLVED AND MIGRATED (§15, §17)**. Demo account revoked, no credential, $100 isolated. | ✅ Done | — |
| 3 | Resellers have not been notified; their integrations will break on deploy | **High (operational)** | Business owner |
| 4 | `ORBIT_PASSKEY` is only 9 characters | Medium | Operator |
| 5 | Backup predates one live customer login — a fresh data snapshot is required at deploy time | Low | Operator |
| 6 | No named admin accounts or 2FA on Orbit; `adminId` is the constant `orbit-superadmin` | Medium | Product decision |
| 7 | Rotation of reseller keys is precautionary and not yet done | Low | Optional |
| 8 | Rate limiting is in-process, per-instance, and resets on restart | Low | Accepted |
| 9 | `data/runtime/` has no scheduled backup | Medium | Ops |

### Note on blocker 2 (resolved)

The demo account no longer has any usable default credential. Verified at implementation time:

| Record | Before | After (code) | After (runtime, first store load) |
| --- | --- | --- | --- |
| `demo@trustifysmm.com` | key = public source default, `revoked: false`, $100 | no hardcoded default exists; seeding uses only a `DEMO_API_KEY` hash, and that env var is unset | account revoked, plaintext key removed, `keyHash: undefined` |
| `<deposit-id>` (real NOWPayments deposit) | owned by a 52-char `tsm_…` key | unchanged | unchanged — never touched by the demo cleanup |

The cleanup only ever touches **denylisted** key material, so no real customer key or balance is modified. See §15 for the full change list.

Nothing here blocks a *technical* deploy — the code is ready and tested. Items 1 and 3 should be cleared first, because deploying with exposed provider credentials and uninformed resellers is an operational risk rather than a code defect.

---

## 14. Verdict

**The code is ready to deploy. Production is still untouched, and two operational items should be cleared first.**

All financial controls pass: verified-`finished`-only crediting, exact decimal comparisons, strict signed IPN, no duplicate credit, no manual provider credit, atomic ledger writes, and no secret exposure in the client bundle or Git. The running build is backed up and restorable, and the production `.next` was not modified.

**B1 is closed.** Deposit details are no longer readable with a deposit id alone. Both legacy routes require the owner's reseller API key (header only) or a high-entropy single-deposit access token, use constant-time comparison, return a uniform `404` for foreign and missing ids, are rate-limited, and leak nothing in error bodies. `GET /api/banker/pay` is read-only and rejects every mutating verb. IPN-only crediting is unchanged.

**Step 2 is complete.** The reseller migration notice is written (`docs/RESELLER_AUTH_MIGRATION_NOTICE.md`) but **not distributed** — no emails sent, no resellers contacted. The credential inventory is complete with no secret values recorded anywhere. Verified: 43/43 tests pass, PM2 has not restarted (still 98), 2 invoices and 0 ledger entries, balances unchanged, backup checksums all `OK`.

**Step 3 is complete** — migration executed and verified (§17). Demo account revoked with no credential.**

**Clear these before deploying:**
1. Rotate `NOWPAYMENTS_API_KEY` and `NOWPAYMENTS_IPN_SECRET` — procedure in **§18** (the IPN secret has no overlap window and cannot be rolled back; read §18.3 and §18.9 first).
2. Notify resellers, or expect immediate `401` on their status polling.
3. ~~Run the demo key migration~~ — **done**, see §17.
4. Strengthen `ORBIT_PASSKEY` (9 characters).
5. Take a fresh `data/` snapshot at deploy time.
6. Decide how to handle the missing provider reconciliation (§18.11) before the credential window opens. **Resolved** — manual Refresh now exists (§19); a scheduled sweep does not.

No deploy, restart, push, `.env` change, key rotation, invoice creation, or balance change was performed.

---

## 15. Demo API key hardening (completed)

The demo account no longer has any hardcoded or publicly-known credential.

### Root cause

`lib/smm-api/demo-store.ts` seeded `demo@trustifysmm.com` with
`process.env.DEMO_API_KEY?.trim() || "<hardcoded literal>"`. The env var was unset in production,
so the live account used the literal — a value visible to anyone reading the repository. The
account held $100 and was not revoked.

### Changes

| File | Change |
| --- | --- |
| `lib/smm-api/api-keys.ts` *(new)* | Key primitives: `generateApiKey()` (192 bits via `crypto.randomBytes`), `hashApiKey()` (SHA-256), `keyMatchesRecord()` (constant-time), `isDenylistedKey()` / `isDenylistedKeyHash()`, `demoKeyFromEnv()` (returns `null` unless the value is present, ≥32 chars, and not denylisted) |
| `lib/smm-api/demo-store.ts` | Removed the hardcoded fallback. `defaultStore()` seeds the demo account with `demo: true` and **no key material** unless `DEMO_API_KEY` is valid. `getAccountByKey()` resolves by constant-time hash comparison, refuses denylisted keys, and refuses revoked accounts. New `quarantineRetiredKeys()` runs on every store load: it revokes any account holding denylisted material and deletes the plaintext key. `isDemoAccount()` added. `findAccountByRef()` resolves plaintext-FK *and* hash references. `creditWalletDepositLocked()` refuses to credit the demo wallet. `ensureDemoAccount()` stores a hash and never persists plaintext for demo records |
| `lib/smm-api/types.ts` | `DemoAccount.key` is now optional; added `keyHash?: string` and `demo?: boolean` |
| `lib/banker/handler.ts` | `createBankerInvoice()` rejects the demo account, so it cannot create a real provider invoice |
| `.env.example` | `DEMO_API_KEY=` is empty, with instructions and a generation one-liner. No default literal remains |
| `data/support-faq.ts` | Removed the advice to "match `DEMO_API_KEY`" as a public default |
| `scripts/migrate-demo-key.mjs` *(new)* | One-time, idempotent, `--dry-run`-first migration. Prints counts and account emails only — never key material |

### Behaviour

| Situation | Result |
| --- | --- |
| `DEMO_API_KEY` unset | demo account exists for ledger isolation but has **no** key material and cannot authenticate |
| `DEMO_API_KEY` set, ≥32 chars, not denylisted | only `keyHash` stored; the account authenticates with that key |
| `DEMO_API_KEY` set to the retired default | rejected — treated as unset |
| Store still holds the retired plaintext key | revoked and stripped on first load; no plaintext remains |
| Demo account attempts a crypto deposit | rejected: "The demo account cannot create crypto deposits" |
| Demo account reaches a credit path | rejected: "The demo account cannot receive real deposit credits" |
| Real customer account | unchanged — still authenticates, still receives IPN credits |

### Tests added (`tests/demo-api-key.test.ts`, 19)

1. Retired default denylisted by value and by shape
2. Retired default cannot match a legacy plaintext record
3. Retired default cannot match its stored hash
4. Account lookup rejects the retired default
5. Store load quarantines it: revoked, plaintext removed
6. Unrelated real account untouched by quarantine (balance preserved)
7. `demoKeyFromEnv()` → null when unset
8. → null when blank
9. → null when too short
10. → null when it equals the retired default
11. Accepts a strong configured key
12. Seeds **no** credential when the env var is absent; empty input rejected
13. Seeds only a hash when configured; plaintext absent from the raw file
14. Generated keys are prefixed, unique, ≥50 chars, 64-char hash
15. Correct key matches, wrong/empty/null do not
16. Demo wallet refuses a deposit credit (balance unchanged, ledger empty)
17. Real customer wallet still credits normally (25 → 75)
18. Demo account cannot create a provider invoice; no invoice row written
19. Reseller auth still works — real key authenticates, wrong key and revoked key rejected

### Verification

| Check | Result |
| --- | --- |
| `npm run typecheck` | ✅ PASS |
| `npm test` | ✅ PASS — 6 files, **62 tests** (43 existing + 19 new) |
| Isolated `npm run build` | ✅ PASS (throwaway copy; live `.next` untouched, `BUILD_ID` unchanged) |
| Migration dry-run on production data | ✅ 1 retired key found, fail-closed, **file hash unchanged** |
| Production `api-store.json` | ✅ untouched — `08561dff…4e19d7`, still 6 accounts / 2 invoices / 0 transactions |
| `.env` | ✅ not modified |
| PM2 | ✅ not restarted |

### Operator steps for the demo account

```bash
cd /srv/apps/trustifysmm

# Option A — production recommended: leave the demo account unusable
#   .env:  DEMO_API_KEY=
node scripts/migrate-demo-key.mjs --dry-run   # confirm 1 retired key
node scripts/migrate-demo-key.mjs             # revoke + strip plaintext

# Option B — keep the demo account working with a NEW key
node -e "console.log('tsm_'+require('crypto').randomBytes(24).toString('hex'))"   # copy into .env
#   .env:  DEMO_API_KEY=<the value you just generated>
node scripts/migrate-demo-key.mjs --dry-run
node scripts/migrate-demo-key.mjs

# Verify the retired key is dead (expect 404)
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "x-api-key: <the retired public default>" \
  "https://trustifysmm.com/api/banker/status?id=<a-demo-deposit-id>"
```

The migration script is optional for the runtime path — `quarantineRetiredKeys()` performs the
same cleanup automatically on the first store load after deploy. The script exists so the change
is explicit, auditable, and dry-runnable before the restart.

### Remaining limitation

Customer and reseller accounts still store their API key in plaintext (`accounts[].key`), because
that value is the foreign key used by invoices, orders and ledger rows and is shown in the
dashboard. They now *also* carry a `keyHash`, and authentication always compares hashes in
constant time. Hashing-only storage for real accounts would require migrating those foreign keys —
out of scope here and not required to close the demo-key finding.

---

## 16. Step 3 — Demo key migration readiness (Option A: demo account disabled)

Status: **prepared and dry-run verified. The actual migration has NOT been executed.**

### 16.1 `DEMO_API_KEY` state

| Check | Result |
| --- | --- |
| Present in `/srv/apps/trustifysmm/.env` | **No** — the key is absent entirely (not merely empty) |
| Present in the PM2 process environment | **No** — not set |
| Effect | `demoKeyFromEnv()` returns `null`; the demo account has no usable credential |

Because the variable is absent, no configuration change is needed for Option A. Adding
`DEMO_API_KEY=` explicitly is optional and would behave identically.

### 16.2 Denylist verification

| Check | Result |
| --- | --- |
| Denylist hash in `lib/smm-api/api-keys.ts` | `2ef9cfb9…afe73b` |
| SHA-256 of the retired default recomputed locally | **identical** to the stored entry |
| Shape check | any key starting with `trustify-demo-key` is also refused |
| Legacy plaintext record | refused — `keyMatchesRecord()` bails before comparison |
| Stored-hash record | refused — `isDenylistedKeyHash()` matches |

### 16.3 Migration script review

`scripts/migrate-demo-key.mjs` — reviewed line by line and tightened during this step.

| Property | Implementation |
| --- | --- |
| `--dry-run` | Supported; prints `mode: DRY RUN (no writes)` and never calls `writeFile` |
| Dry-run isolation | Returns before `backupStore()` and `writeAtomic()` |
| Idempotent | Second run finds `retired keys found: 0` and reports `nothing to change`; the Option A branch only counts a change when the account is not already disabled |
| Scope | Only denylisted material is touched. Non-demo accounts are never modified |
| Backup before write | Copies the store to `/home/sysadmin/backups/trustifysmm/api-store.pre-demo-migration-<timestamp>.json` (override with `TSM_BACKUP_DIR`) |
| Atomic write | temp file → `writeFile` → `fsync` → `chmod` → `rename`, so a crash cannot truncate the store |
| Permission preservation | Original file mode is read and re-applied — verified 664 → 664 (an earlier draft forced 600 and was fixed) |
| Secret handling | Prints only counts and account emails; the configured key is hashed before use and never echoed |
| Failure mode | Unreadable store → exits non-zero without touching anything |

### 16.4 Dry-run against production data

```
mode                  : DRY RUN (no writes)
store                 : data/runtime/api-store.json
accounts scanned      : 6
retired keys found    : 1 (demo@trustifysmm.com)
demo account          : OPTION A — retired key revoked, credential stripped, account disabled
result                : dry run complete, 1 change(s) NOT written
```

| Metric | Value |
| --- | --- |
| Retired keys found | **1** |
| Affected accounts | **1** — `demo@trustifysmm.com` only |
| Accounts untouched | 5 real customer accounts |
| Invoices affected | 0 |
| Ledger rows affected | 0 |

### 16.5 No-modification proof

| Artifact | Before | After | Verdict |
| --- | --- | --- | --- |
| `data/runtime/api-store.json` | `08561dff…4e19d7` | `08561dff…4e19d7` | **unchanged** |
| `.env` | mtime 18:29:35, 1221 bytes | same | **unchanged** |
| `/home/sysadmin/backups/trustifysmm/` | contains only `2026-11-18_131030` | same | **no stray backup** |
| Accounts / invoices / transactions | 6 / 2 / 0 | 6 / 2 / 0 | **unchanged** |
| Demo account | plaintext key, `revoked: false`, $100 | same | **not migrated** |
| Balance total | $100 | $100 | **unchanged** |
| Live build | `kefiBjkveC1pRMUfcXDNv` | same | **unchanged** |

### 16.6 Apply-path rehearsal (isolated copies only)

The real migration was rehearsed twice on throwaway copies under `/tmp`, never on production data:

| Scenario | Result |
| --- | --- |
| Option A apply | 1 change written; demo revoked, plaintext and hash removed, balance preserved at $100; real accounts untouched; backup file created; `retired plaintext keys remaining: none` |
| Option A re-run | `retired keys found: 0`, `nothing to change` — idempotent |
| Option B apply (`DEMO_API_KEY` set) | 2 changes; demo `keyHash` installed, `revoked: false`; grep of the store for the plaintext key returned **0** matches |
| Mode preservation | 664 before → 664 after |

All temp directories were deleted afterwards.

### 16.7 Demo account guard verification (source)

| Guard | Location | Behaviour |
| --- | --- | --- |
| Invoice creation | `lib/banker/handler.ts` → `createBankerInvoice` | `isDemoAccount(account)` → error "The demo account cannot create crypto deposits" — no provider call, no invoice row |
| Wallet credit | `lib/smm-api/demo-store.ts` → `creditWalletDepositLocked` | `isDemoAccount(target)` → error "The demo account cannot receive real deposit credits" — balance and ledger untouched |
| Authentication | `getAccountByKey` | revoked accounts return `null`; denylisted keys return `null` |

So even before the migration runs, a demo account cannot create a real NOWPayments invoice or
credit a real wallet. The migration removes the credential itself, which closes the last gap
(reading its own balance/orders via the API).

### 16.8 Approved migration command (do not run yet)

```bash
cd /srv/apps/trustifysmm

# 1. Confirm the state one more time (read-only)
sha256sum data/runtime/api-store.json
node scripts/migrate-demo-key.mjs --dry-run     # expect: retired keys found: 1

# 2. Apply (writes a timestamped backup first, then atomically replaces the store)
node scripts/migrate-demo-key.mjs

# 3. Verify
python3 -c "
import json; s=json.load(open('data/runtime/api-store.json'))
d=[a for a in s['accounts'] if a['email']=='demo@trustifysmm.com'][0]
print('revoked:', d.get('revoked'), '| plaintext:', bool(d.get('key')), '| hash:', bool(d.get('keyHash')), '| balance:', d['balance'])"
```

Expected after step 3: `revoked: True | plaintext: False | hash: False | balance: 100`.

Run this with the service stopped, or immediately before the restart, because the running process
holds the store in memory and can rewrite the file from its own copy.

### 16.9 Verification results for this step

| Command | Result |
| --- | --- |
| `npm run typecheck` | ✅ PASS |
| `npm test` | ✅ PASS — 6 files, **62 tests** |
| Isolated `npm run build` | ✅ PASS (throwaway copy; live `.next` untouched) |
| Dry-run on production data | ✅ 1 retired key, 1 affected account, file unchanged |

No migration, `.env` change, PM2 restart, deploy, push, credential rotation, invoice creation, or
balance change was performed in this step.

---

## 17. Step 4 — Demo key migration EXECUTED (Option A)

Executed: 2026-11-18 19:19 (UTC+05:45), with operator approval. **No PM2 restart, no deploy.**

### 17.1 Process handling

The PM2 app was **online** (pid 3465635, fork_mode, 1 instance) throughout. It was deliberately
**not** stopped, because the task forbade restarting it and stopping it was not required:

| Check | Finding |
| --- | --- |
| Store cached in process memory? | **No** — `ensureStore()` calls `readFile()` on every access; there is no module-level cache |
| Store mtime before migration | `18:56:11` — idle for 23 minutes |
| Store-writing requests since 18:56 | **0** (only `GET /api/dashboard/payments` reads) |
| mtime drift over a 10 s monitor | none |
| Migration write | atomic `temp → fsync → chmod → rename`, so a concurrent reader sees either the old or the new file, never a partial one |

Because every request re-reads the file, the running process picked up the migrated store on its
next access. No process control was needed.

### 17.2 Hashes

| Stage | SHA-256 |
| --- | --- |
| Before migration | `08561dffaa2f2487f0dd99a2f8e22c1ffb0706d15ecb0c35b8867d49a24e19d7` |
| After migration | `101940320c8f7cbf7eb41a792d9a09cd56715f9af280d53675d951574c686f9a` |
| After second (idempotency) run | `101940320c8f7cbf7eb41a792d9a09cd56715f9af280d53675d951574c686f9a` — unchanged |
| After third run | unchanged |

### 17.3 Final dry-run (before applying)

`retired keys found: 1 (demo@trustifysmm.com)` — exactly one, as expected. Store hash unchanged by
the dry-run.

### 17.4 Apply output

```
mode                  : APPLY
accounts scanned      : 6
retired keys found    : 1 (demo@trustifysmm.com)
demo account          : OPTION A — retired key revoked, credential stripped, account disabled
backup                : .../api-store.pre-demo-migration-2026-11-18T13-34-43-725Z.json
result                : 1 change(s) written
retired plaintext keys remaining: none
```

### 17.5 Backup

| Property | Value |
| --- | --- |
| Path | `/home/sysadmin/backups/trustifysmm/api-store.pre-demo-migration-2026-11-18T13-34-43-725Z.json` |
| Size | 2393 bytes |
| SHA-256 | `08561dffaa2f2487f0dd99a2f8e22c1ffb0706d15ecb0c35b8867d49a24e19d7` — **matches the pre-migration store exactly** |
| Valid JSON | ✅ |
| Permissions | `664 sysadmin:sysadmin` (matches the live store) |
| Duplicate created by re-runs | **No** — only one backup file exists |

### 17.6 Verification results

| # | Check | Result |
| --- | --- | --- |
| 1 | Demo `revoked` | **`true`** |
| 2 | Demo plaintext `key` | **removed** |
| 3 | Demo `keyHash` | **removed** |
| 4 | Demo balance | **$100** — unchanged |
| 5 | Five real customer accounts | **deep-equal to before**, verified field by field |
| 6 | Invoices | **deep-equal** — 2 rows, both still `pending`, `walletCredited` unchanged |
| 7 | Ledger (`transactions`) | **deep-equal** — 0 rows |
| 8 | Orders / idempotency / nextOrderId | **deep-equal** |
| 9 | Account count / total balance | **6** / **$100** |
| 10 | Second run | `retired keys found: 0`, `nothing to change`, file hash unchanged — **idempotent** |

### 17.7 Exact diff

Only two fields changed in the entire file:

```
demo account  key     : present -> absent
demo account  revoked : absent  -> true
```

Everything else — all five real accounts, both invoices, the ledger, orders, idempotency map and
`nextOrderId` — is byte-identical.

### 17.8 Residual finding and fix (important)

After the migration, the **demo invoice row** `<deposit-id>` still stores the retired literal in
its `apiKey` foreign-key field. That row was intentionally not modified (the approval restricted the
migration to the demo account, and the task requires invoices to remain unchanged).

Inspection revealed that `resellerKeyMatchesInvoiceKey()` compared only against the stored
`invoice.apiKey` and **did not consult the denylist**. That meant the publicly-known retired key
could still have authenticated a request for that one demo invoice via `x-api-key`.

**Fixed in code** (`lib/banker/api-key.ts`):

```ts
export function resellerKeyMatchesInvoiceKey(presented: string, invoiceApiKey: string) {
  if (!presented || isDenylistedKey(presented)) return false;
  if (!invoiceApiKey || isDenylistedKey(invoiceApiKey)) return false;
  return constantTimeEquals(presented, invoiceApiKey);
}
```

The denylist is now checked on **both** sides before any comparison, so a legacy invoice whose
foreign key was never migrated cannot be used for authentication. Covered by a new test
("refuses a retired public default even when a legacy invoice still stores it").

The invoice's `apiKey` field remains on disk, but:

- it can never authenticate (denylisted on presentation **and** on the stored value),
- the invoice is `provider: "demo"` with `address`, `nowPaymentId`, `network`, `payCurrency` and
  `payAmount` all `null`, so there is no deposit address or provider id to disclose,
- it can never be credited — `markInvoicePaid` is IPN-gated and the demo account is now revoked.

### 17.9 Verification commands after this step

| Command | Result |
| --- | --- |
| `npm run typecheck` | ✅ PASS |
| `npm test` | ✅ PASS — 6 files, **63 tests** (62 + 1 new denylist test) |
| Isolated `npm run build` | ✅ PASS (live `.next` untouched) |
| PM2 | ✅ **never stopped, never restarted** — same pid 3465635, same restart count 98 |
| `.env` | ✅ untouched (mtime 18:29:35, no `DEMO_API_KEY`) |
| Live build | ✅ untouched (`kefiBjkveC1pRMUfcXDNv`) |
| NOWPayments credentials | ✅ not rotated |
| Real balances | ✅ unchanged |

### 17.10 Demo account status

The demo account still exists (for ledger isolation and historical reference) with these properties:

| Property | Value |
| --- | --- |
| Email | `demo@trustifysmm.com` |
| `revoked` | `true` |
| Usable credential | **none** (`key` and `keyHash` both absent) |
| Balance | $100 (isolated, unspendable, uncreditable) |
| Can create a NOWPayments invoice | **No** — `createBankerInvoice` rejects demo accounts |
| Can receive a wallet credit | **No** — `creditWalletDepositLocked` rejects demo accounts |
| Can authenticate over the API | **No** — `getAccountByKey` returns `null` for revoked accounts |

To re-enable the demo account later, set a strong `DEMO_API_KEY` in `.env` and re-run
`node scripts/migrate-demo-key.mjs`; it will install the hash and clear `revoked`.

---

## 18. Step 5 — NOWPayments credential rotation procedure

**Prepared only. No credential was generated, rotated, revoked, or written.** `.env` is unchanged
and PM2 was not restarted.

### 18.1 Where the credentials live

| Variable | File | Format | Consumed by |
| --- | --- | --- | --- |
| `NOWPAYMENTS_API_KEY` | `/srv/apps/trustifysmm/.env` (mode `600`, gitignored) | 31 chars | `lib/nowpayments/config.ts` → `client.ts` (`x-api-key` header), `currencies.ts` |
| `NOWPAYMENTS_IPN_SECRET` | same | 32 chars | `lib/nowpayments/config.ts` → `signature.ts` (HMAC-SHA512), `ipn-handler.ts` |

Non-secret companions: `NOWPAYMENTS_BASE_URL=https://api.nowpayments.io`,
`NOWPAYMENTS_SANDBOX=false`, `BANKER_PAY_CURRENCIES=usdttrc20,btc,eth`.

Both secrets are read **only** through `process.env` in server modules. No client component imports
`lib/nowpayments/*` or `lib/banker/*` (verified: zero `.tsx` matches), and `.next/static` contains no
`NEXT_PUBLIC_*` payment variable. The only bundle occurrence of the string `NOWPAYMENTS_IPN_SECRET`
is inside a user-facing error message telling the operator to set it — no value.

### 18.2 How the code uses them

**API key** — `lib/nowpayments/client.ts`:

```ts
const cfg = loadNowPaymentsConfig();
headers: { "x-api-key": cfg.apiKey, "Content-Type": "application/json" }
```

`loadNowPaymentsConfig()` reads `process.env` **on every call**. There is no module-level cache, so a
process restart is the only way to pick up a new value — and a restart is sufficient, with no
rebuild.

**IPN secret** — `lib/nowpayments/signature.ts`:

```ts
sortNowPaymentsPayload(payload)            // recursive key sort
JSON.stringify(sorted)                     // canonical body
createHmac("sha512", secret).digest("hex") // expected signature
timingSafeEqual(expected, header)          // constant-time compare
```

`ipn-handler.ts` returns `503` when the secret is missing, `401` when the signature does not match.

**Config gate** — `loadNowPaymentsConfig()` sets `configured = Boolean(apiKey && ipnSecret)` and
`live = configured`. If either value is blank, `payCurrencies` becomes `[]` and the UI shows
"provider unavailable". That means a half-applied rotation (one new, one missing) degrades to
unavailable rather than silently accepting unsigned webhooks.

### 18.3 Provider-side capability — **the critical constraint**

Researched against the official NOWPayments API docs and help centre:

| Capability | Supported? | Detail |
| --- | --- | --- |
| Multiple **API keys** simultaneously | **Yes** | Dashboard → Settings → Payments → API keys → "Add new API key". Keys are listed with labels and can be deleted individually |
| Multiple **IPN secrets** simultaneously | **No** | Exactly **one** IPN secret per account |
| Overlap window for the IPN secret | **No** | Clicking "Regenerate" invalidates the old secret **immediately**. Both signatures cannot be valid at the same time |
| IPN secret retrievable later | **No** | Shown in full only once at generation; afterwards masked |
| Per-key IPN secret | **No** | The secret is account-wide, not per API key |

**Consequence:** the IPN secret cannot be rotated without an unavoidable window where the old secret
is dead. The only way to shrink that window to near zero is to have the new `.env` value ready
*before* clicking Regenerate, then restart immediately. The API key, by contrast, supports a true
zero-downtime overlap.

### 18.4 Dashboard steps

**API key (zero-downtime, safe to overlap):**

1. Sign in to the NOWPayments dashboard.
2. Settings → Payments → **API keys** tab.
3. "Add new API key" → label it e.g. `trustifysmm-prod-2026-11`.
4. Copy the new key once (shown once). Do **not** paste it into chat, a ticket, or a screenshot.
5. Leave the old key active until verification succeeds (§18.8), then delete it.

**IPN secret (disruptive, no overlap):**

1. Settings → Payments → **Instant payment notifications** tab.
2. Note the current webhook URL is `https://trustifysmm.com/api/payments/nowpayments/ipn` — do not
   change it.
3. Have the server session open and `.env` ready to edit **before** clicking Regenerate.
4. Click **Regenerate** next to the IPN secret.
5. Copy the new secret immediately (shown once only).
6. Paste it into `.env` and restart within the same minute.

### 18.5 Coordinated update procedure

Order matters: stage everything that does not require the provider yet, then execute the two
provider actions back-to-back.

```bash
# 0) Pre-flight (read-only) — confirm nothing is mid-flight
cd /srv/apps/trustifysmm
pm2 describe trustifysmm | grep -E "status|restarts"
curl -s -o /dev/null -w "gateway=%{http_code}\n" https://trustifysmm.com/api/payments/nowpayments/currencies

# 1) Back up BOTH files before touching anything (values never echoed)
STAMP=$(date -u +%Y-%m-%d_%H%M%S)
D=/home/sysadmin/backups/trustifysmm/$STAMP-credential-rotation
mkdir -p "$D" && chmod 700 "$D"
cp -p .env "$D/env.before" && chmod 600 "$D/env.before"
cp -p data/runtime/api-store.json "$D/api-store.before.json"
ls -l "$D"

# 2) NEW API KEY — add it under a temporary name first (old key still active)
#    Edit .env:  NOWPAYMENTS_API_KEY_NEXT=<new key>
#    Do NOT remove or change NOWPAYMENTS_API_KEY yet.

# 3) NEW IPN SECRET — same pattern
#    Edit .env:  NOWPAYMENTS_IPN_SECRET_NEXT=<new secret>

# 4) Verify both staged values are present and non-empty, without printing them
node -e "const e=process.env; " # (placeholder; use the checker below instead)
```

Staged-value checker (prints lengths only, never values):

```bash
set -a; . ./.env; set +a
for v in NOWPAYMENTS_API_KEY_NEXT NOWPAYMENTS_IPN_SECRET_NEXT; do
  val="${!v:-}"
  printf '%s length=%s\n' "$v" "${#val}"
done
```

Expected: two non-zero lengths. If either is empty, **stop** — do not promote.

```bash
# 5) Promote atomically in one edit, then restart immediately
#    .env:
#      NOWPAYMENTS_API_KEY=<value of NOWPAYMENTS_API_KEY_NEXT>
#      NOWPAYMENTS_IPN_SECRET=<value of NOWPAYMENTS_IPN_SECRET_NEXT>
#      (delete the two _NEXT lines)
pm2 restart trustifysmm --update-env

# 6) Verify (§18.8) before deleting the old API key in the dashboard
```

⚠️ Step 5 must be a **single edit**. Never leave `NOWPAYMENTS_IPN_SECRET` pointing at the old value
while the dashboard already holds the new one — every IPN will return `401` and no deposit will
credit.

### 18.6 Why old and new IPN secrets cannot silently mismatch

The failure mode is loud, not silent:

| Situation | Behaviour |
| --- | --- |
| `.env` has the old secret, dashboard has the new one | Every IPN → `401 Invalid signature`. Nothing credits |
| `.env` has the new secret, dashboard still has the old one | Same — `401` |
| `.env` secret blank | `503 Webhook secret is not configured` (handler fails closed) |
| Both blank | Gateway reports unavailable; `payCurrencies: []`; UI blocks deposits |

There is no code path that "falls back" to a previous secret, and no dual-secret acceptance. The
only silent case would be *both* sides accidentally left on the old value — which is why §18.8
includes a positive signature test rather than only checking that a bad signature is rejected.

Recommended monitoring during the window: watch for `401` on the IPN route in the nginx log.

```bash
grep -c "POST /api/payments/nowpayments/ipn" /var/log/nginx/access.log
```
…combined with the response code column — a burst of `401` immediately after the rotation is the
signal that a mismatch occurred.

### 18.7 Keeping credentials out of Git, bundles, logs and reports

| Surface | Status |
| --- | --- |
| Git | `.env` is gitignored (`.gitignore:16`); `git ls-files` contains only `.env.example`, which has blank values |
| Client bundle | No client component imports any `lib/nowpayments/*` or `lib/banker/*` module; no `NEXT_PUBLIC_*` payment variable |
| Server logs | No `console.*` call in `lib/nowpayments`, `lib/banker` or `app/api/payments` prints a config value |
| API responses | `publicGatewayConfig()` returns only `live`, `currencies`, `minDepositUsd`, `maxDepositUsd`, `provider`, `sandbox` |
| Reports / docs | This document and the migration notice record key **lengths** only, never values |
| Backups | `env.before` is mode `600` inside a `700` directory and never leaves the server |
| Screenshots | Never capture the dashboard IPN secret field or `.env`; mask the key list column before any screen share |

### 18.8 Post-deployment verification

Run these in order. None of them prints a secret.

```bash
# 1. Gateway reachable and authenticated (server-side key)
curl -s -o /dev/null -w "currencies=%{http_code}\n" https://trustifysmm.com/api/payments/nowpayments/currencies
curl -s https://trustifysmm.com/api/payments/nowpayments/currencies | head -c 300
# expect: 200, "live": true, sandbox false, options[] with networks

# 2. Provider reachability through our client (a real, read-only provider call)
#    The status route is customer-authenticated, so use the currencies endpoint which
#    proxies /v1/full-currencies with the server key.
#    200 + non-empty options proves the API key authenticates.

# 3. IPN rejects a bad signature (proves the handler is live and strict)
curl -s -o /dev/null -w "unsigned=%{http_code}\n" -X POST \
  -H 'content-type: application/json' -d '{"payment_id":1,"payment_status":"finished"}' \
  https://trustifysmm.com/api/payments/nowpayments/ipn
# expect: 401

# 4. IPN rejects a forged signature
curl -s -o /dev/null -w "forged=%{http_code}\n" -X POST \
  -H 'content-type: application/json' -H 'x-nowpayments-sig: deadbeef' \
  -d '{"payment_id":1,"payment_status":"finished"}' \
  https://trustifysmm.com/api/payments/nowpayments/ipn
# expect: 401

# 5. POSITIVE signature test (proves the secret matches the dashboard)
#    Run on the server, never in a shared terminal history you do not control.
node -e '
const {createHmac}=require("crypto");
const payload={payment_id:1,payment_status:"waiting",price_amount:1,price_currency:"usd"};
const sorted=JSON.stringify(payload,Object.keys(payload).sort());
console.log(createHmac("sha512",process.env.NOWPAYMENTS_IPN_SECRET).update(sorted).digest("hex"));
' > /tmp/sig.txt
curl -s -o /dev/null -w "selfsigned=%{http_code}\n" -X POST \
  -H 'content-type: application/json' -H "x-nowpayments-sig: $(cat /tmp/sig.txt)" \
  -d '{"payment_id":1,"payment_status":"waiting","price_amount":1,"price_currency":"usd"}' \
  https://trustifysmm.com/api/payments/nowpayments/ipn
rm -f /tmp/sig.txt
# expect: 200 (body will be {"ignored":true,"reason":"unknown_deposit"} — that is correct,
#          it proves the signature verified without touching any real deposit)

# 6. Confirm no 401 burst after the rotation
grep "POST /api/payments/nowpayments/ipn" /var/log/nginx/access.log | tail -20
```

Test 5 is the decisive one: a `200` with `unknown_deposit` proves the `.env` secret and the
dashboard secret agree. A `401` means they do not — roll back per §18.9.

### 18.9 Rollback without exposing old credentials

The pre-rotation `.env` is preserved at
`/home/sysadmin/backups/trustifysmm/<stamp>-credential-rotation/env.before` (mode `600`).

```bash
cd /srv/apps/trustifysmm
D=/home/sysadmin/backups/trustifysmm/<stamp>-credential-rotation

# Restore both values together — never partially
install -m 600 "$D/env.before" .env
pm2 restart trustifysmm --update-env
```

Because the restored file is a complete copy, the API key and IPN secret roll back as a matched
pair; there is no chance of one reverting while the other stays new.

Provider-side rollback:

| Credential | Rollback action |
| --- | --- |
| API key | Re-enable the old key in the dashboard (it was never deleted) and delete the new one |
| IPN secret | **Not reversible.** Regenerating again produces a *third* secret. You must copy it into `.env` and restart; the old value cannot be restored |

That asymmetry is the single biggest operational hazard in this rotation: **an IPN-secret rotation
cannot be undone**, only repeated. Do it in a quiet window with the dashboard session open.

⚠️ Never paste the restored `.env` contents into a terminal, chat, ticket, or report. Read it only
through the application.

### 18.10 Provider-side limitations and risks

| # | Limitation | Impact | Mitigation |
| --- | --- | --- | --- |
| 1 | Only one IPN secret per account, no overlap | Unavoidable sub-minute crediting gap during rotation | Prepare the new value first; restart immediately; verify with test 5 |
| 2 | IPN secret rotation is irreversible | A botched rotation needs a *second* regeneration, not a rollback | Do it in a quiet window; keep the dashboard open |
| 3 | IPN secret shown once | Losing it means another regeneration | Paste directly into `.env`, never via chat |
| 4 | **No automatic reconciliation** — `reconcileNowPaymentsDeposit()` now exists and is exposed in `/orbit` as a per-deposit **Refresh** action (§19), but nothing runs it on a schedule | Medium | Operator presses Refresh after any suspected missed IPN |
| 5 | IPN retries depend on dashboard settings | Provider re-sends on non-2xx; a `401` is a non-2xx so retries do occur, but the retry schedule is account-configured | Confirm "Number of recurrent notifications" in the same settings tab; do not set it to 0 |
| 6 | Secrets are account-wide | A key leak cannot be contained to one integration | Delete the old key promptly after verification |
| 7 | Env is read at process start only | A new `.env` value needs a restart | `pm2 restart --update-env`; no rebuild required |

### 18.11 Residual risk: reconciliation is manual

**Update:** the recovery mechanism this section asked for has since been implemented — see §19.
`/orbit` now has a per-deposit **Refresh** action that re-reads the provider status server-side and
runs the identical credit policy.

What remains manual: nothing runs on a schedule. If an IPN is missed, an operator must open the
deposit in `/orbit` and press Refresh. Before rotating credentials, either accept that manual step
or add a scheduled reconciliation job (still a follow-up, not implemented).

The historical pending deposit `<deposit-id>` (25 USD, `usdttrc20`, provider payment
`<redacted provider id>`) was created at `2026-11-18T12:47:25Z` and expired at `13:07:25Z` — already 30+
minutes expired before this step began, so no live payment was at risk from the rotation.

A reconciliation endpoint is a sensible follow-up but is **out of scope** for this step and was not
implemented.

No credential was generated, rotated, revoked, or written. `.env` is unchanged and PM2 was not
restarted.

---

## 19. Step 6 — Super Admin payment reconciliation (implemented)

Adds the recovery path that §18.11 identified as missing. A missed IPN can now be resolved from
`/orbit` without any manual store editing.

### 19.1 How it works

```
Orbit UI "Refresh"
   → POST /api/orbit/banker { action: "reconcile", invoiceId }
      → middleware: Orbit session required (401 otherwise)
         → rateLimit 10/min per deposit
            → reconcileNowPaymentsDeposit()
               → getNowPaymentStatus(paymentId)      server-side API key, GET /v1/payment/:id
                  → provider payment id cross-check
                     → applyNowPaymentsPayload()       ← SAME function the IPN uses
                        → evaluateNowPaymentsCredit()  ← SAME policy, exact decimals
                           → finalizeDepositCredit()   ← SAME atomic write + duplicate guard
```

The browser supplies **only a deposit id**. There is no request field for status, amount, currency,
network or payment id, so a client cannot influence the decision.

### 19.2 Shared validation — no bypass path

`processNowPaymentsIpnPayload()` was refactored so the IPN and reconciliation both funnel into one
exported function, `applyNowPaymentsPayload(invoice, payload, { source })`:

| Concern | Handled by | Shared? |
| --- | --- | --- |
| Status → credit decision | `evaluateNowPaymentsCredit()` | ✅ identical |
| USD / crypto decimal comparison | `lib/nowpayments/money.ts` (BigInt) | ✅ identical |
| Currency + network matching | credit policy | ✅ identical |
| Underpayment / fiat shortfall | credit policy → `review` | ✅ identical |
| Atomic wallet write | `finalizeDepositCredit()` | ✅ identical |
| Duplicate-credit prevention | `walletCredited` flag + ledger `ref` unique | ✅ identical |
| IPN-only rule | `markInvoicePaid` now accepts `source: "ipn" \| "reconcile"`; both are provider-verified, `demo` is still refused | ✅ preserved |

`source: "reconcile"` is reachable **only** from `reconcileNowPaymentsDeposit()`, which is reachable
**only** from the passkey-protected Orbit route. No customer route, no public API, and no browser
payload can select it.

### 19.3 Additional guards specific to reconciliation

| Guard | Behaviour |
| --- | --- |
| Already credited | Returns `already_credited` **without calling the provider** — the primary duplicate guard |
| Provider payment id mismatch | `review`, nothing credited |
| Provider unreachable / non-2xx | `provider_unavailable`, nothing changed, audited as `error` |
| Deposit is not NOWPayments | `not_nowpayments`, no provider call |
| No stored provider id | `no_provider_id`, no provider call |
| Provider echoes a foreign `order_id` | Payload is re-bound to the local invoice id, so a credit can only land on the deposit the admin opened |
| Provider returns `finished` but incomplete | `review` (`paid_amount_missing`) — never a blind credit |
| Rate limit | 10 reconciles/minute per deposit → `429` |

### 19.4 Audit trail

Every attempt writes to the invoice:

| Field | Content |
| --- | --- |
| `reconciledAt` | ISO timestamp |
| `reconciledBy` | admin identity (`orbit-superadmin` until named admins exist) |
| `reconcileResult` | `credited` \| `already_credited` \| `review` \| `no_credit` \| `error` |
| `reconcileProviderStatus` | the provider's own status string |
| `reconcileHistory[]` | last 30 entries: `{ at, adminId, providerStatus, result, reason }` |

Additionally `recordAdminAction("deposit.reconcile", …)` writes to the Orbit admin audit log, and
the existing `statusHistory` records any status transition caused by the refresh.

Shown in the Orbit drawer under **Reconciliation audit**.

### 19.5 UI

- A **Refresh** button appears per row only when the deposit is NOWPayments, has a provider payment
  id, and is not yet credited.
- While running: label changes to "Checking…", button disabled.
- Result banner is `role="status" aria-live="polite"`, styled green for success and red for errors.
- Table reloads after every attempt so status/credited columns reflect the new state.
- The drawer shows *Last reconciled* plus the full audit list.

### 19.6 What is never exposed

| Surface | Exposure |
| --- | --- |
| Customer APIs | No reconciliation data at all — no new customer-facing endpoint was added |
| Orbit response | Only `ok`, `outcome`, `message`, `providerStatus`, `duplicate` |
| Provider raw response | Never returned. `data` is used server-side and discarded |
| API key / IPN secret | Never read into a response; `getNowPaymentStatus` uses the server key inside `npFetch` |
| Error messages | Generic (`provider_unavailable`, `Held for manual review: …`) with no internal identifiers |

### 19.7 Tests (27 new, 90 total)

`tests/reconcile.test.ts` — 23 tests:

1. Missed IPN + `finished` → credits once, balance 10 → 35, one ledger row
2. Audit fields recorded (admin, provider status, result, timestamp, history)
3. `waiting` → no credit
4. `confirming` → no credit
5. `failed` → no credit, status `failed`
6. `expired` → no credit, status `expired`
7. Wrong provider payment id → review
8. Wrong currency → review, status `review`
9. Wrong network → review
10. Underpayment → review
11. USD amount mismatch → review
12. Incomplete payload (`paid_amount_missing`) → review
13. Unknown deposit → refused **without** calling the provider
14. Demo deposit → `not_nowpayments`, no credit
15. Three consecutive refreshes → one credit, `already_credited` ×2, 3 audit rows
16. Already-credited deposit → provider never called
17. IPN-credited deposit + refresh → single ledger row, balance unchanged
18. Provider 503 → nothing changed, audited as `error`
19. Browser-supplied `payment_status: "finished"` ignored — provider says `waiting`, no credit
20. Provider echoing a foreign `order_id` still credits only the local deposit
21. `markInvoicePaid` refuses `source: "demo"` for NOWPayments
22. `markInvoicePaid` accepts `source: "ipn"` (existing behaviour preserved)
23. Demo-provider deposit cannot be reconciled

`tests/orbit-auth.test.ts` — 4 tests:

24. Unauthenticated reconcile route → `401`
25. Forged Orbit cookie → `401`
26. Customer session cookie on an Orbit API route → `401`
27. Valid Orbit session passes middleware

All 63 pre-existing tests (IPN signature, credit policy, demo key hardening, banker auth) still pass.

### 19.8 Verification

| Command | Result |
| --- | --- |
| `npm run typecheck` | ✅ PASS |
| `npm test` | ✅ PASS — 8 files, **90 tests** |
| Isolated `npm run build` | ✅ PASS (throwaway copy; live `.next` untouched, `BUILD_ID` unchanged) |

No production data was modified, no invoice was created, and no real wallet was credited — every
test runs against a temporary store in `os.tmpdir()` with a mocked provider.

### 19.9 Files changed

| File | Change |
| --- | --- |
| `lib/smm-api/types.ts` | `reconciledAt`, `reconciledBy`, `reconcileResult`, `reconcileProviderStatus`, `reconcileHistory[]`, `DepositReconcileEntry` |
| `lib/banker/handler.ts` | Extracted `applyNowPaymentsPayload()`; `markInvoicePaid` accepts `source: "reconcile"`; new `reconcileNowPaymentsDeposit()` + `recordReconcile()`; IPN handler now delegates to the shared core |
| `app/api/orbit/banker/route.ts` | `action: "reconcile"`, rate limit, admin audit, richer GET fields |
| `components/orbit/screens-finance.tsx` | Refresh button, loading state, result banner, reconciliation audit list, extended `Deposit` type |
| `app/orbit/orbit.css` | `.ob-reconcile-note`, `.ob-reconcile-log` |
| `tests/reconcile.test.ts` *(new)* | 23 tests |
| `tests/orbit-auth.test.ts` *(new)* | 4 tests |

### 19.10 Residual limitations

1. **One deposit at a time.** There is no bulk reconcile. An operator checking a batch must click
   each row.
2. **No automatic sweep.** Nothing polls the provider on a schedule; someone must press Refresh.
   A cron reconciliation job remains a sensible follow-up.
3. **Provider must still have the payment.** If NOWPayments has pruned the payment record, the
   refresh returns `provider_unavailable` / not-found and the deposit stays as it was.
4. **`adminId` is still the shared `orbit-superadmin`** — reconciliation is attributable to "an
   Orbit admin", not a named person, until named admin accounts exist.
5. **Provider payload is not archived.** Only the derived fields are stored; the raw provider
   response is intentionally not persisted. If you need it for a dispute, capture it from the
   NOWPayments dashboard.
