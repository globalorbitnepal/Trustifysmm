# NOWPayments release candidate report

**Project:** `/srv/apps/trustifysmm`  
**Prepared:** 2026-11-18 19:30 (UTC+05:45)  
**Status:** Release candidate frozen. **Not deployed.** No restart, no push, no credential rotation.

---

## 1. Verdict

# ⚠️ CONDITIONAL GO

**Code: GO.** All financial controls verified, 93/93 tests pass, typecheck clean, isolated production build succeeds, and production artefacts are untouched.

**Deployment: NO-GO until three operator actions are completed.**

| Gate | Status | Blocking? |
| --- | --- | --- |
| Code correctness & financial controls | ✅ PASS | — |
| Test suite (93) | ✅ PASS | — |
| Typecheck | ✅ PASS | — |
| Isolated production build | ✅ PASS | — |
| Production artefacts untouched | ✅ PASS | — |
| **Rotate NOWPayments API key + IPN secret** | ❌ NOT DONE | **YES** |
| **Notify resellers of the `x-api-key` requirement** | ❌ NOT DONE | **YES** |
| **Rotate `ORBIT_PASSKEY` (9 chars)** | ❌ NOT DONE | Recommended |
| Fresh backup before switch | ❌ NOT DONE (by design) | Deploy-time step |

Reason for the conditional: both provider credentials were pasted into a chat transcript earlier in this project, and the B1 patch makes every unauthenticated reseller call return `401` from the first request. Deploying with exposed credentials and uninformed resellers is an operational failure, not a code defect.

---

## 2. Feature inventory

### 2.1 Customer deposit flow

| Feature | Status | Location |
| --- | --- | --- |
| Premium add-funds page, light/dark aware | ✅ | `components/dashboard/WalletViews.tsx`, `app/dashboard/deposit.css` |
| Searchable coin selector (name, symbol, network, provider code) | ✅ | `AddFundsView` |
| Popular + all-currencies sections, network badges | ✅ | `AddFundsView` |
| Verified brand coin logos (no emoji) | ✅ | `components/dashboard/CoinLogo.tsx` |
| Provider-verified currency list with 10-min cache | ✅ | `lib/nowpayments/currencies.ts` |
| Live USD→crypto quote (read-only) | ✅ | `/api/payments/nowpayments/estimate` |
| Min/max, presets, client + server validation | ✅ | `create/route.ts`, `createBankerInvoice` |
| Checkout: address, exact amount, QR, expiry, provider ID | ✅ | `AddFundsView`, `CryptoDepositQr.tsx` |
| Copy address / amount / payment ID | ✅ | `AddFundsView` |
| Status polling, stops on terminal states | ✅ | 10 s interval, `isTerminal()` |
| Wrong-network warning | ✅ | checkout panel |
| Receipt + history with filters and detail modal | ✅ | `PaymentsView` |

### 2.2 Security hardening

| Feature | Status | Location |
| --- | --- | --- |
| B1: reseller API-key auth on public banker endpoints | ✅ | `lib/banker/api-key.ts` |
| Per-deposit access token (256-bit, hash-only storage) | ✅ | `lib/banker/access.ts` |
| Constant-time comparison everywhere | ✅ | `constantTimeEquals`, `keyMatchesRecord`, `verifyDepositAccessToken` |
| Query-string secrets rejected | ✅ | header-only extraction |
| Uniform `404` for foreign and missing deposits | ✅ | status route, `getBankerInvoiceStatus` |
| `/api/banker/pay` read-only, 405 on mutations | ✅ | `pay/route.ts` |
| Rate limiting on create/quote/status/pay/reconcile | ✅ | `lib/nowpayments/rate-limit.ts` |
| Demo account: no hardcoded default, revoked, no credential | ✅ | `api-keys.ts`, `demo-store.ts` |
| Retired default key denylisted by value, shape and hash | ✅ | `DENYLISTED_KEY_HASHES` |
| Invoice-key auth also rejects the retired key | ✅ | `resellerKeyMatchesInvoiceKey` |
| Demo cannot create invoices or receive credits | ✅ | `createBankerInvoice`, `creditWalletDepositLocked` |
| Store writes serialised (incl. `updateInvoice`/`saveInvoice`) | ✅ | `withStoreLock` — fixed this step |

### 2.3 Money movement

| Feature | Status |
| --- | --- |
| Strict HMAC-SHA512 IPN verification | ✅ |
| Credit only on verified `finished` | ✅ |
| Exact-decimal comparisons (BigInt, no floats) | ✅ |
| Payment/order/customer/currency/network/amount checks | ✅ |
| Underpay, overpay, fiat shortfall → manual review | ✅ |
| Duplicate credit prevention (flag + ledger ref, both locked) | ✅ |
| Atomic `finalizeDepositCredit` | ✅ |
| Manual NOWPayments credit blocked (403) | ✅ |
| Separate manual adjustment (reason + confirm + adminId + unique ref) | ✅ |

### 2.4 Super Admin (/orbit)

| Feature | Status |
| --- | --- |
| Payment analytics (8 metrics from real records) | ✅ |
| 15-column deposit table | ✅ |
| Status filters + currency/network/date-range + search | ✅ |
| Detail drawer with audit fields | ✅ |
| **Provider reconciliation (Refresh)** | ✅ new |
| Reconciliation audit trail (last 30 entries) | ✅ |
| Manual Credit button removed | ✅ |
| Manual adjustment form (separate from deposits) | ✅ |

---

## 3. Files changed

### 3.1 New — NOWPayments core

```
lib/nowpayments/config.ts          env-driven config, no cache
lib/nowpayments/client.ts          npFetch, create, status, estimate, min-amount
lib/nowpayments/signature.ts       recursive key sort, HMAC-SHA512, timingSafeEqual
lib/nowpayments/credit-policy.ts   evaluateNowPaymentsCredit, planManualAdjustment
lib/nowpayments/money.ts           decimalToScaled / compareDecimal (BigInt)
lib/nowpayments/status.ts          provider → internal status mapping
lib/nowpayments/currencies.ts      provider-verified list, 10-min cache
lib/nowpayments/network-labels.ts  client-safe network names
lib/nowpayments/rate-limit.ts      in-process limiter
lib/nowpayments/ipn-handler.ts     fail-closed webhook entry
```

### 3.2 New — security

```
lib/banker/access.ts               deposit access tokens, constantTimeEquals
lib/banker/api-key.ts              header extraction, denylist-aware invoice match
lib/smm-api/api-keys.ts            generate/hash/verify/denylist/demo env gate
```

### 3.3 New — routes

```
app/api/payments/nowpayments/create/route.ts
app/api/payments/nowpayments/currencies/route.ts
app/api/payments/nowpayments/estimate/route.ts
app/api/payments/nowpayments/ipn/route.ts
app/api/payments/nowpayments/status/[depositId]/route.ts
```

### 3.4 New — UI

```
components/dashboard/CoinLogo.tsx
components/dashboard/CryptoDepositQr.tsx
app/dashboard/deposit.css
```

### 3.5 New — tooling & docs

```
scripts/migrate-demo-key.mjs
vitest.config.ts
tests/nowpayments.test.ts                    (16)
tests/nowpayments-credit-policy.test.ts      (8)
tests/nowpayments-currencies.test.ts         (3)
tests/banker-auth.test.ts                    (8)
tests/banker-access.test.ts                  (18)
tests/demo-api-key.test.ts                   (19)
tests/reconcile.test.ts                      (23)
tests/orbit-auth.test.ts                     (4)
tests/store-concurrency.test.ts              (3)
docs/NOWPAYMENTS_IMPLEMENTATION_PLAN.md
docs/NOWPAYMENTS_SETUP.md
docs/NOWPAYMENTS_PRODUCTION_AUDIT.md
docs/NOWPAYMENTS_DEPOSIT_UPGRADE_REPORT.md
docs/NOWPAYMENTS_PRE_DEPLOYMENT_CHECKLIST.md
docs/RESELLER_AUTH_MIGRATION_NOTICE.md
docs/NOWPAYMENTS_RELEASE_CANDIDATE_REPORT.md  (this file)
```

### 3.6 Modified

```
lib/banker/handler.ts                 create/status/credit, shared applyNowPaymentsPayload,
                                      reconcileNowPaymentsDeposit, markInvoicePaid gating
lib/smm-api/demo-store.ts             hashed keys, quarantine, demo guards, locks on
                                      saveInvoice/updateInvoice, demo credit block
lib/smm-api/types.ts                  invoice audit + reconcile fields, demo/keyHash
lib/customer/user-store.ts            balance sync after credit
app/api/banker/webhook/route.ts       forwards to IPN handler
app/api/banker/status/route.ts        API-key/token auth, rate limit
app/api/banker/pay/route.ts           read-only, 405 on mutations
app/api/dashboard/payments/route.ts   richer fields
app/api/dashboard/payments/[id]/route.ts  constant-time ownership
app/api/orbit/banker/route.ts         credit 403, adjust, reconcile, audit
app/api/payments/nowpayments/*/route.ts  (see 3.3; currencies/create modified after creation)
components/dashboard/WalletViews.tsx  full deposit UX + history
components/orbit/screens-finance.tsx  analytics, filters, drawer, reconcile UI
components/ApiDocumentation.tsx       migration callout
data/api-documentation.ts             x-api-key docs, bankerAuthMigration
data/support-faq.ts                   auth guidance
public/downloads/trustifysmm-api-client.php  sends x-api-key, maps 401/404
app/dashboard/layout.tsx              imports deposit.css
app/dashboard/panel.css, app/globals.css, app/orbit/orbit.css   styles
.env.example                          NOWPayments block, DEMO_API_KEY empty
package.json / package-lock.json      vitest, qrcode
tsconfig.json, next-env.d.ts          tooling
```

---

## 4. Security findings

### 4.1 Findings resolved

| # | Finding | Severity | Resolution |
| --- | --- | --- | --- |
| 1 | Public banker status endpoint leaked deposit address + provider ID with only a deposit id | **High** | B1: API key or access token required, uniform 404, rate limited |
| 2 | `/api/banker/pay?confirm=1` credited a wallet from a GET request | **High** | Endpoint is now read-only; 405 on mutations; demo autopay is a no-op |
| 3 | Demo account used a hardcoded public default key with $100 balance | **High** | Denylisted, revoked, no credential, migration executed; $100 isolated |
| 4 | Invoice-key auth did not consult the denylist | **Medium** | `resellerKeyMatchesInvoiceKey` now checks both sides |
| 5 | `updateInvoice`/`saveInvoice` wrote outside the store lock | **Medium** | Both now wrapped in `withStoreLock`; proven by concurrency tests |
| 6 | Missed IPN left a deposit pending forever with no recovery | **Medium** | `reconcileNowPaymentsDeposit` + Orbit Refresh |

### 4.2 Findings accepted

| # | Risk | Mitigation |
| --- | --- | --- |
| 1 | `NOWPAYMENTS_API_KEY` / `IPN_SECRET` were pasted into a chat transcript | **Rotate before deploy** (§7) |
| 2 | `ORBIT_PASSKEY` is 9 characters | Rotate; no URL exposure |
| 3 | Rate limiting is in-process only | Accepted for a single fork-mode process |
| 4 | Real accounts still store a plaintext `key` as a foreign key | They also carry `keyHash`; auth compares hashes. Full hashing needs an FK migration |
| 5 | `adminId` is the constant `orbit-superadmin` | Orbit has one passkey; named admins are a product change |
| 6 | No scheduled reconciliation sweep | Manual Refresh exists; cron is a follow-up |
| 7 | Demo invoice row still stores the retired literal in `apiKey` | Cannot authenticate (denylisted both sides), `provider: demo`, no address or provider ID |

### 4.3 Re-audited controls (all PASS)

| Control | Evidence |
| --- | --- |
| Secrets server-side only | No `NEXT_PUBLIC_*` payment var; no client component imports `lib/nowpayments/*` or `lib/banker/*` |
| No secrets in Git | `.env` gitignored; `git ls-files` shows only `.env.example` with blank values; zero credential-shaped strings outside tests/docs |
| No customer data committed | `data/runtime/` ignored; `git ls-files data/runtime` → **0** files |
| IPN strict | 503 no secret, 401 bad signature (verified live), 400 bad JSON |
| `finished`-only credit | Policy gate + `markInvoicePaid` source gate |
| Duplicate prevention | Flag + ledger ref, both inside the store lock |
| Atomic credit | `finalizeDepositCredit` under `withStoreLock` |
| Manual credit blocked | 403 |
| Adjustment audited | reason + confirm + adminId + unique ref + ledger row |
| Demo isolation | Invoice creation and credit both refused |

---

## 5. Test results

```
npm run typecheck    PASS
npm test             PASS — 9 files, 93 tests
npm run build        PASS (isolated copy; live .next untouched)
```

| File | Tests |
| --- | --- |
| `nowpayments.test.ts` | 16 |
| `nowpayments-credit-policy.test.ts` | 8 |
| `nowpayments-currencies.test.ts` | 3 |
| `banker-auth.test.ts` | 8 |
| `banker-access.test.ts` | 18 |
| `demo-api-key.test.ts` | 19 |
| `reconcile.test.ts` | 23 |
| `orbit-auth.test.ts` | 4 |
| `store-concurrency.test.ts` | 3 |
| **Total** | **93** |

Coverage of the required scenarios: missed IPN + finished, pending, failed, expired, wrong payment ID, wrong currency, wrong network, underpayment, duplicate reconciliation, unauthorized admin, provider unavailable, invalid IPN signature, wrong customer/deposit, duplicate webhook, duplicate credit, manual adjustment audit, old demo key rejected, missing demo credentials, reseller auth, concurrency.

No test creates a real invoice, calls the real provider, or touches a real balance — every suite uses a temp store in `os.tmpdir()` with a mocked `fetch`.

---

## 6. Release candidate freeze state

| Artefact | Value |
| --- | --- |
| Live `BUILD_ID` (unchanged) | `kefiBjkveC1pRMUfcXDNv` |
| Live payment store SHA-256 (unchanged) | `101940320c8f7cbf7eb41a792d9a09cd56715f9af280d53675d951574c686f9a` |
| `.env` mtime (unchanged) | `2026-11-18 18:29:35` |
| Accounts / invoices / ledger rows | 6 / 2 / 0 |
| Wallet balances | `[100, 0, 0, 0, 0, 0]` |
| PM2 | `trustifysmm`, `online`, **fork_mode**, **instances 1**, restarts 98 (never restarted this session) |
| Existing backups | `2026-11-18_131030/` (4 archives) + `api-store.pre-demo-migration-…json` |

### ⚠️ Live build is the OLD code

Verified by probe: `GET /api/banker/status?id=…` still returns **200 without auth** on the running server, and `/api/payments/nowpayments/estimate` returns **404**. The B1 patch is in source but **not live**. This is expected and resolves on deploy.

---

## 7. Credential rotation sequence

Full detail in checklist §18. Summary of the exact order:

| Step | Action | Overlap possible? |
| --- | --- | --- |
| 1 | Back up `.env` (mode 600) + `api-store.json` | — |
| 2 | **API key:** Dashboard → Settings → Payments → API keys → Add new → label `trustifysmm-prod-2026-11` | ✅ yes — old key keeps working |
| 3 | Stage both new values in `.env` as `NOWPAYMENTS_API_KEY_NEXT` / `NOWPAYMENTS_IPN_SECRET_NEXT` | — |
| 4 | Verify staged lengths are non-zero (**never print values**) | — |
| 5 | **IPN secret:** with the dashboard open, click **Regenerate**, copy immediately | ❌ **no overlap** — old secret dies instantly |
| 6 | Promote both values in **one edit**, delete the `_NEXT` lines | — |
| 7 | `pm2 restart trustifysmm --update-env` | — |
| 8 | Run post-deploy checks (§11), especially the positive-signature test | — |
| 9 | Delete the **old** API key in the dashboard | — |
| 10 | Confirm "Number of recurrent notifications" is ≥ 1 | — |

**Critical:** the IPN secret rotation is **irreversible**. A botched rotation requires *another* regeneration, not a rollback. Do it in a quiet window with the dashboard session already open.

**Second critical:** steps 6–7 must be back-to-back. If `.env` holds the old secret while the dashboard holds the new one, every IPN returns 401 and nothing credits until the restart.

---

## 8. Reseller notification requirements

**Must be sent before deploy.** The notice is written and ready: `docs/RESELLER_AUTH_MIGRATION_NOTICE.md`.

| # | What resellers must know | Breaking? |
| --- | --- | --- |
| 1 | `GET /api/banker/status` now requires `x-api-key` | **Yes** — 401 otherwise |
| 2 | `?key=` query auth no longer accepted | **Yes** — 401 |
| 3 | `GET /api/banker/pay` is read-only | **Yes** for anyone relying on `?confirm=1` |
| 4 | `?confirm=1` demo auto-credit permanently removed | **Yes** |
| 5 | `Bearer <key>` also accepted | No |
| 6 | `POST /api/banker/invoice` unchanged (two additive response fields) | No |
| 7 | 404 means "not found **or** not yours" — do not retry with another key | Behavioural |
| 8 | 120 req/min per IP | No |
| 9 | Re-download the PHP client if used | No |
| 10 | Rotate keys that were ever sent in a URL | Recommended |

Distribution is manual. No emails were sent and no reseller was contacted. The in-product API docs page already renders the same migration callout, so any reseller who checks `/api` sees the requirement.

---

## 9. Fresh backup procedure

Run immediately before the switch. Never overwrite an existing directory.

```bash
cd /srv/apps/trustifysmm
STAMP=$(date -u +%Y-%m-%d_%H%M%S)
D=/home/sysadmin/backups/trustifysmm/$STAMP
test -e "$D" && { echo "REFUSING: $D exists"; exit 1; }
mkdir -p "$D" && chmod 700 "$D"

# Payment + customer data (preserves modes)
tar -czpf "$D/data.tar.gz" data && chmod 600 "$D/data.tar.gz"

# Secrets, isolated (never mixed into the source archive)
tar -czpf "$D/env.tar.gz" .env && chmod 600 "$D/env.tar.gz"

# Source, excluding secrets and runtime data
tar -czf "$D/source.tar.gz" \
  --exclude=node_modules --exclude=.next --exclude=.git \
  --exclude=data/runtime --exclude=.env --exclude='*.log' .
chmod 600 "$D/source.tar.gz"

# Current production build (rollback artefact)
tar -czf "$D/next-build.tar.gz" .next && chmod 600 "$D/next-build.tar.gz"

cd "$D" && sha256sum data.tar.gz env.tar.gz source.tar.gz next-build.tar.gz > SHA256SUMS
chmod 600 SHA256SUMS
sha256sum -c SHA256SUMS

# Record the pre-deploy identity of the store
sha256sum data/runtime/api-store.json 2>/dev/null || (cd /srv/apps/trustifysmm && sha256sum data/runtime/api-store.json)
cat /srv/apps/trustifysmm/.next/BUILD_ID
```

Expected pre-deploy values: store `101940320c…686f9a` (or whatever the live value is at that moment), BUILD_ID `kefiBjkveC1pRMUfcXDNv`.

⚠️ Never run `npm run build` in place. It replaces `.next` and breaks the running process (`ENOENT required-server-files.json`). Build in a copy, or accept a planned restart window.

---

## 10. Deployment commands

Only after the three gates in §1 are cleared and you have approved.

```bash
cd /srv/apps/trustifysmm && source .env 2>/dev/null || true
# (source only so the migration and post-checks can read DEMO_API_KEY / provider vars;
#  never echo them)

# 1) Fresh backup (§9)
# 2) Rotate credentials (§7) — dashboard work happens here
# 3) Demo key migration (idempotent; already applied, safe to re-run)
node scripts/migrate-demo-key.mjs --dry-run
node scripts/migrate-demo-key.mjs

# 4) Install + verify
npm ci
npm run typecheck
npm test

# 5) Build — expect a short outage while .next is replaced
npm run build
cat .next/BUILD_ID          # must differ from kefiBjkveC1pRMUfcXDNv

# 6) Restart the single fork-mode process
pm2 restart trustifysmm --update-env
pm2 describe trustifysmm | grep -E "status|exec mode|instances|restarts"
# expect: online, fork, 1, and a restart count that incremented by 1

# 7) Verify (§11)
```

---

## 11. Post-deployment verification checklist

Run every line. None prints a secret.

```bash
# --- B1: public endpoints now require auth ---
curl -s -o /dev/null -w "status no-auth      = %{http_code}\n" \
  "https://trustifysmm.com/api/banker/status?id=<deposit-id>"          # expect 401
curl -s -o /dev/null -w "status retired-key    = %{http_code}\n" \
  -H "x-api-key: trustify-demo-key-change-me" \
  "https://trustifysmm.com/api/banker/status?id=<deposit-id>"          # expect 404
curl -s -o /dev/null -w "status bad-key        = %{http_code}\n" \
  -H "x-api-key: wrong" "https://trustifysmm.com/api/banker/status?id=<deposit-id>"  # 404
curl -s -o /dev/null -w "pay GET confirm=1    = %{http_code}\n" \
  "https://trustifysmm.com/api/banker/pay?id=<deposit-id>&confirm=1"   # expect 401 (no key)
curl -s -o /dev/null -w "pay POST             = %{http_code}\n" \
  -X POST "https://trustifysmm.com/api/banker/pay?id=<deposit-id>"    # expect 405

# --- IPN strictness ---
curl -s -o /dev/null -w "ipn unsigned         = %{http_code}\n" -X POST \
  -H 'content-type: application/json' -d '{"payment_id":1,"payment_status":"finished"}' \
  https://trustifysmm.com/api/payments/nowpayments/ipn                     # expect 401
curl -s -o /dev/null -w "ipn forged           = %{http_code}\n" -X POST \
  -H 'content-type: application/json' -H 'x-nowpayments-sig: deadbeef' \
  -d '{"payment_id":1,"payment_status":"finished"}' \
  https://trustifysmm.com/api/payments/nowpayments/ipn                     # expect 401

# --- IPN positive signature (proves .env secret == dashboard secret) ---
node -e '
const {createHmac}=require("crypto");
const p={payment_id:1,payment_status:"waiting",price_amount:1,price_currency:"usd"};
const s=JSON.stringify(p,Object.keys(p).sort());
process.stdout.write(createHmac("sha512",process.env.NOWPAYMENTS_IPN_SECRET).update(s).digest("hex"));
' > /tmp/sig.txt
curl -s -o /dev/null -w "ipn self-signed      = %{http_code}\n" -X POST \
  -H 'content-type: application/json' -H "x-nowpayments-sig: $(cat /tmp/sig.txt)" \
  -d '{"payment_id":1,"payment_status":"waiting","price_amount":1,"price_currency":"usd"}' \
  https://trustifysmm.com/api/payments/nowpayments/ipn                     # expect 200
rm -f /tmp/sig.txt

# --- New gateway surface ---
curl -s -o /dev/null -w "currencies           = %{http_code}\n" \
  https://trustifysmm.com/api/payments/nowpayments/currencies              # expect 200
curl -s https://trustifysmm.com/api/payments/nowpayments/currencies | head -c 400
# expect: {"live":true, ... "options":[{"code":"usdttrc20",...,"network":"trx",...}]}
curl -s -o /dev/null -w "estimate (unauth)    = %{http_code}\n" \
  "https://trustifysmm.com/api/payments/nowpayments/estimate?currency=usdttrc20&amount=25"  # 401

# --- Orbit ---
curl -s -o /dev/null -w "reconcile (unauth)   = %{http_code}\n" -X POST \
  -H 'content-type: application/json' -d '{"action":"reconcile","invoiceId":"x"}' \
  https://trustifysmm.com/api/orbit/banker                                 # expect 401

# --- Process ---
pm2 describe trustifysmm | grep -E "status|exec mode|instances"
```

### UI checks (browser, signed in as admin)

- [ ] `/orbit` → Payments shows the analytics strip and the 15-column table.
- [ ] Status filters, currency/network/date filters, and search all work.
- [ ] A NOWPayments deposit with a provider id shows a **Refresh** button; pressing it shows "Checking…" then a result banner.
- [ ] The detail drawer shows *Last reconciled* and the **Reconciliation audit** list after a refresh.
- [ ] The old **Credit** button is gone.
- [ ] Manual adjustment still requires a reason + confirmation.

### UI checks (customer)

- [ ] `/dashboard/add-funds` shows the searchable selector with network badges and logos.
- [ ] Selecting USDT shows TRON / Ethereum / BNB Smart Chain as distinct options.
- [ ] Amount presets, min/max text, and the live estimate populate.
- [ ] Creating a deposit shows address, amount, QR, expiry, provider ID, and the wrong-network warning.
- [ ] `/dashboard/payments` lists history with filters and a working receipt modal.
- [ ] Balance updates after a verified payment without a manual refresh.

### Log checks

```bash
grep "POST /api/payments/nowpayments/ipn" /var/log/nginx/access.log | tail -20
# no sustained 401 burst after the rotation
pm2 logs trustifysmm --lines 60 --nostream | grep -iE "error|unhandled|ENOENT"
```

---

## 12. Rollback procedure

Everything needed is in the timestamped backup from §9.

```bash
BK=/home/sysadmin/backups/trustifysmm/<STAMP>
cd "$BK" && sha256sum -c SHA256SUMS      # verify before using anything

cd /srv/apps/trustifysmm
pm2 stop trustifysmm

# 1) Previous build
rm -rf .next
tar -xzf "$BK/next-build.tar.gz" -C /srv/apps/trustifysmm
cat .next/BUILD_ID                        # expect kefiBjkveC1pRMUfcXDNv

# 2) Previous source (no node_modules, no data, no .env)
tar -xzf "$BK/source.tar.gz" -C /srv/apps/trustifysmm

# 3) Previous credentials as a matched pair
install -m 600 "$BK/env.tar.gz" /tmp/env.tar.gz
tar -xzpf /tmp/env.tar.gz -C /srv/apps/trustifysmm
chmod 600 .env
shred -u /tmp/env.tar.gz 2>/dev/null || rm -f /tmp/env.tar.gz

# 4) Previous data — ONLY if no real credits happened after the backup
tar -xzpf "$BK/data.tar.gz" -C /srv/apps/trustifysmm

pm2 start trustifysmm
pm2 logs trustifysmm --lines 40 --nostream
```

⚠️ **Step 4 rewinds wallet balances and deposits to the backup moment.** If customers were credited after the backup, restoring `data/` silently erases those credits. In that case restore code + `.next` + `.env` only, leave `data/` alone, and reconcile from the NOWPayments dashboard using `/orbit` → Refresh.

⚠️ `node_modules` is not backed up. Re-run `npm ci` if the tree is inconsistent; `package-lock.json` is inside `source.tar.gz`.

⚠️ Rolling back the **IPN secret** is not possible. If the rotation caused the failure, you must regenerate again and update `.env` — restoring `env.tar.gz` only works if the dashboard still holds the old secret.

---

## 13. Remaining operational risks

| # | Risk | Severity | Owner |
| --- | --- | --- | --- |
| 1 | Provider credentials were exposed in a chat transcript and are not yet rotated | **High** | Operator |
| 2 | Resellers not yet notified; their polling breaks on deploy | **High** | Business |
| 3 | IPN secret rotation has no overlap and is irreversible | **High** | Operator (mitigate per §7) |
| 4 | `ORBIT_PASSKEY` is 9 characters | Medium | Operator |
| 5 | No scheduled reconciliation — a missed IPN needs a manual Refresh | Medium | Ops |
| 6 | Fresh backup must be taken at deploy time (current one predates live traffic) | Medium | Operator |
| 7 | Rate limiting is per-process and resets on restart | Low | Accepted |
| 8 | Real accounts store a plaintext key alongside the hash | Low | Accepted (FK constraint) |
| 9 | `adminId` is shared, not per-person | Medium | Product |
| 10 | `npm run build` in place causes a short outage | Medium | Operator (planned window) |
| 11 | Single-process JSON store — cluster mode would corrupt data | Medium | Ops discipline |
| 12 | Demo invoice row still carries the retired literal in `apiKey` (cannot authenticate) | Low | Accepted |

---

## 14. Sign-off

| Item | Result |
| --- | --- |
| Code audit complete | ✅ 39 new files + 26 modified reviewed |
| Checklist reviewed through §19 | ✅ |
| No secrets committed | ✅ |
| No customer data committed | ✅ (`git ls-files data/runtime` → 0) |
| Demo account revoked, no credential | ✅ |
| Old demo key rejected by account auth | ✅ |
| Old demo key rejected by invoice-key auth | ✅ (fixed this step) |
| Reconciliation requires Orbit session | ✅ (401 verified) |
| IPN and reconcile share one validator | ✅ (`applyNowPaymentsPayload` line 259, called at 354 and 498) |
| Single fork-mode instance | ✅ (`fork_mode`, `instances: 1`) |
| Store write paths serialised | ✅ (lock extended to `updateInvoice`/`saveInvoice`, 3 new tests) |
| Typecheck / tests / build | ✅ PASS / 93 PASS / PASS |
| Production artefacts unchanged | ✅ |

**Recommendation: CONDITIONAL GO.** Clear the three gates, take a fresh backup, then deploy in a quiet window with the dashboard open for the IPN step.

No deploy, restart, push, `.env` change, credential rotation, invoice creation, or balance change was performed while preparing this report.
