# NOWPayments integration — implementation plan

## Audit summary (existing TrustifySMM)

| Area | Finding |
|------|---------|
| Framework | Next.js 15 App Router, React 19, TypeScript |
| Customer auth | Cookie session (`requireCustomer`), JSON `customers.json` |
| Wallet | USD balance in `data/runtime/api-store.json` (per API key); panel reads wallet on each request |
| Add funds UI | `components/dashboard/WalletViews.tsx` → `POST /api/dashboard/payments` |
| Banker core | `lib/banker/handler.ts` creates NOWPayments `/v1/payment`, stores `BankerInvoice` in api-store |
| Webhook | `POST /api/banker/webhook` — HMAC present but **not** official sorted-payload verification |
| Credit | `markInvoicePaid` → `addBalance` + ledger + notification (idempotent if status already `paid`) |
| Admin | `/orbit` → `GET/POST /api/orbit/banker` lists deposits + manual credit |
| Other gateways | Demo fallback when API key missing; no separate card gateway in dashboard |
| Prisma | Schema present but **not** used for deposits; invoices remain in JSON store (reuse, no duplicate wallet) |

## Implementation (this delivery)

1. **`lib/nowpayments/*`** — config, API client, sorted JSON IPN signature, status mapping, rate limits
2. **Extend `BankerInvoice`** — provider payment id, provider status, history, wallet credited flag
3. **Harden `lib/banker/handler.ts`** — env min/max, expiry, fetch payment status, IPN processing
4. **Routes** — `POST /api/payments/nowpayments/create`, `GET .../status/[depositId]`, `POST .../ipn`, `GET .../currencies`; keep `/api/banker/*` compatible
5. **Customer UI** — NOWPayments card label, QR (real address), copy, polling, status states
6. **Orbit** — expose provider id / status on deposit list
7. **Tests** — Vitest for signature + credit eligibility
8. **`docs/NOWPAYMENTS_SETUP.md`** — production checklist

## Manual configuration required

Set on the server (never commit):

- `NOWPAYMENTS_API_KEY`
- `NOWPAYMENTS_IPN_SECRET`
- `SITE_URL=https://trustifysmm.com`
- Optional: `NOWPAYMENTS_BASE_URL`, `NOWPAYMENTS_*` limits, `BANKER_PAY_CURRENCIES`

Configure NOWPayments dashboard IPN URL: `https://trustifysmm.com/api/payments/nowpayments/ipn` (alias: `/api/banker/webhook`).