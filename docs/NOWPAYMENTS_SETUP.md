# NOWPayments production setup — TrustifySMM

## Required environment variables (server only)

```bash
SITE_URL=https://trustifysmm.com
NOWPAYMENTS_API_KEY=
NOWPAYMENTS_IPN_SECRET=
```

## Recommended

```bash
NOWPAYMENTS_BASE_URL=https://api.nowpayments.io
NOWPAYMENTS_SANDBOX=false
NOWPAYMENTS_MIN_DEPOSIT_USD=1
NOWPAYMENTS_MAX_DEPOSIT_USD=50000
NOWPAYMENTS_PAYMENT_EXPIRY_MINUTES=60
BANKER_PAY_CURRENCIES=usdttrc20,btc,eth
```

Never commit keys. Never expose keys to the browser. The admin UI only shows **Configured / Not configured**.

## NOWPayments dashboard

1. Create API key in NOWPayments merchant settings.
2. Generate **IPN secret**.
3. Set IPN callback URL to:
   - `https://trustifysmm.com/api/payments/nowpayments/ipn`
   - Legacy alias (also supported): `https://trustifysmm.com/api/banker/webhook`
4. Ensure HTTPS is public (no login, no CSRF on webhook routes).

## Customer flow

1. Dashboard → **Add Funds**
2. `POST /api/payments/nowpayments/create` (or `/api/dashboard/payments`)
3. Customer pays to generated address / hosted invoice
4. NOWPayments IPN → signature verified → wallet credited **once** on `finished`

## Troubleshooting

| Issue | Check |
|-------|--------|
| Gateway offline | `NOWPAYMENTS_API_KEY` + `NOWPAYMENTS_IPN_SECRET` set, PM2 restarted |
| IPN 401 | IPN secret mismatch; payload must be verified with sorted JSON |
| No credit | Payment status must be `finished`; check orbit deposits + ledger ref |
| Duplicate credit | Should not occur — ledger ref = deposit id |

## Sandbox

Set `NOWPAYMENTS_SANDBOX=true` and `NOWPAYMENTS_BASE_URL=https://api-sandbox.nowpayments.io` when your NOWPayments account supports sandbox API keys.

## Rollback

1. Unset `NOWPAYMENTS_API_KEY` (gateway shows offline; no new deposits).
2. Existing balances and ledger rows are unchanged.
3. Redeploy previous release if needed.