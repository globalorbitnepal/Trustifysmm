# Reseller authentication migration notice

**Audience:** resellers and integrators using the TrustifySMM Banker API  
**Effective:** at the next production deploy (date to be confirmed)  
**Action required:** move your API key from the URL into the `x-api-key` header

---

## Summary

We have hardened the public Banker endpoints. Deposit details are **no longer readable with a deposit id alone**. Every request for payment information must now be authenticated with the API key that created the invoice.

This is a deliberate, immediate breaking change. There is no unauthenticated compatibility mode and no grace period that leaves payment data exposed.

| # | Change | Impact |
| --- | --- | --- |
| 1 | Public unauthenticated payment-status access is no longer supported | `GET /api/banker/status` without a credential returns `401` |
| 2 | `GET /api/banker/status` now requires authentication | Send `x-api-key` (or `Authorization: Bearer`) |
| 3 | Send reseller API keys in the `x-api-key` request header | No change to the key itself |
| 4 | `?key=` query authentication is no longer accepted | Move the key out of the URL |
| 5 | `GET /api/banker/pay` is read-only | It can never confirm or credit a payment |
| 6 | `?confirm=1` demo auto-credit is permanently removed | Demo credits must come from a verified provider webhook |
| 7 | Invoice creation API remains unchanged | `POST /api/banker/invoice` needs no changes |

---

## What changed in detail

### 1. Unauthenticated payment-status access removed

Previously a deposit id was enough to read the payment address, provider payment id, amount and network. Anyone who obtained or guessed an id could read those details. That is no longer possible.

Requests with no credential now receive:

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{ "error": "Authentication required. Send your API key as the x-api-key header, or the deposit access token as x-deposit-token." }
```

### 2. `GET /api/banker/status` requires authentication

Two credentials are accepted:

| Credential | Header | Use when |
| --- | --- | --- |
| Reseller API key | `x-api-key: YOUR_API_KEY` | Server-to-server integration (recommended) |
| Reseller API key | `Authorization: Bearer YOUR_API_KEY` | If your stack prefers bearer tokens |
| Deposit access token | `x-deposit-token: DEPOSIT_ACCESS_TOKEN` | One specific deposit, typically in a browser flow |

The deposit access token is returned **once**, in the response to `POST /api/banker/invoice`, as `deposit_access_token`. It is read-only, scoped to that single deposit, and cannot be recovered later. Store it if you need a browser-side status view; otherwise use your API key server-side.

### 3. API keys go in the `x-api-key` header

Header only. Never in the URL.

### 4. `?key=` query authentication is no longer accepted

A secret in a URL ends up in access logs, proxy logs, `Referer` headers and browser history. Query-string credentials are now ignored:

```http
GET /api/banker/status?id=TSM-XXXX&key=YOUR_API_KEY   →   401 Unauthorized
```

If your integration currently builds that URL, this is the one change you must make before deploying on our side.

### 5. `GET /api/banker/pay` is read-only

This endpoint returns deposit information and nothing else. It cannot confirm a payment, change a status, or credit a balance.

- `GET` requires the same authentication as `/api/banker/status`.
- `POST`, `PUT`, `PATCH` and `DELETE` return `405 Method Not Allowed` with `Allow: GET`.

### 6. `?confirm=1` demo auto-credit permanently removed

A `GET` request must never change wallet state. The `?confirm=1` demo credit is gone and will not return.

Balance credits happen **only** when the payment provider sends a signed webhook for a fully verified, `finished` payment. Nothing you can call over HTTP will credit a wallet.

### 7. Invoice creation is unchanged

```http
POST /api/banker/invoice
Content-Type: application/json

{ "key": "YOUR_API_KEY", "amount": 25 }
```

No changes. The response gains two additive fields:

```json
{
  "invoice_id": "TSM-XXXXXXXXXXXX",
  "deposit_id": "TSM-XXXXXXXXXXXX",
  "amount": "25.00",
  "currency": "USD",
  "status": "pending",
  "payment_url": "https://provider-checkout-url",
  "pay_address": "DEPOSIT_ADDRESS",
  "pay_currency": "usdttrc20",
  "pay_amount": "25.10000000",
  "network": "trx",
  "expires_at": "2026-01-01T00:00:00.000Z",
  "provider": "nowpayments",
  "deposit_access_token": "DEPOSIT_ACCESS_TOKEN",
  "token_header": "x-deposit-token",
  "message": "Send payment, then balance credits automatically after verified webhook confirmation."
}
```

Existing fields are unchanged, so parsers that ignore unknown keys keep working.

---

## Status codes

| Code | Meaning | What to do |
| --- | --- | --- |
| `200` | Success | — |
| `400` | Missing `id`, or invalid JSON | Fix the request |
| `401` | No credential supplied, or the key was sent in the URL | Send `x-api-key` |
| `404` | Invoice does not exist **or** belongs to another account | Do **not** retry with a different key — treat as not found |
| `405` | Non-`GET` verb on `/api/banker/pay` | Use `GET` only |
| `429` | More than 120 requests per minute from your IP | Back off and retry later |

`404` is intentionally ambiguous: we do not reveal whether a deposit id exists for another account. Do not build retry logic that treats `404` as "wrong key".

---

## cURL examples

All values are placeholders. Replace `YOUR_API_KEY`, `TSM-XXXXXXXXXXXX` and `DEPOSIT_ACCESS_TOKEN`.

### Before (no longer works)

```bash
curl "https://trustifysmm.com/api/banker/status?id=TSM-XXXXXXXXXXXX"
```

```bash
curl "https://trustifysmm.com/api/banker/status?id=TSM-XXXXXXXXXXXX&key=YOUR_API_KEY"
```

### After — reseller API key in the header

```bash
curl "https://trustifysmm.com/api/banker/status?id=TSM-XXXXXXXXXXXX" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Accept: application/json"
```

### After — bearer token form

```bash
curl "https://trustifysmm.com/api/banker/status?id=TSM-XXXXXXXXXXXX" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Accept: application/json"
```

### After — single-deposit access token

```bash
curl "https://trustifysmm.com/api/banker/status?id=TSM-XXXXXXXXXXXX" \
  -H "x-deposit-token: DEPOSIT_ACCESS_TOKEN" \
  -H "Accept: application/json"
```

### Read-only deposit view

```bash
curl "https://trustifysmm.com/api/banker/pay?id=TSM-XXXXXXXXXXXX" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Accept: application/json"
```

### Create an invoice (unchanged)

```bash
curl -X POST "https://trustifysmm.com/api/banker/invoice" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"key":"YOUR_API_KEY","amount":25}'
```

---

## PHP examples

Placeholders only. Never commit a real key.

### Before (no longer works)

```php
<?php
// Unauthenticated — now returns 401
$url = 'https://trustifysmm.com/api/banker/status?id=' . rawurlencode($invoiceId);
$raw = file_get_contents($url);
```

### After — cURL with the `x-api-key` header

```php
<?php
function trustifyInvoiceStatus(string $invoiceId, string $apiKey): array
{
    $url = 'https://trustifysmm.com/api/banker/status?id=' . rawurlencode($invoiceId);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_HTTPHEADER     => [
            'Accept: application/json',
            'x-api-key: ' . $apiKey,   // header — never the query string
        ],
    ]);

    $raw  = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($raw === false) {
        return ['error' => 'Status request failed'];
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        return ['error' => 'Invalid status JSON', 'http_code' => $code];
    }
    if ($code === 401) {
        return ['error' => 'API key rejected', 'http_code' => 401];
    }
    if ($code === 404) {
        return ['error' => 'Invoice not found for this key', 'http_code' => 404];
    }

    return $data;
}

// Usage
$status = trustifyInvoiceStatus('TSM-XXXXXXXXXXXX', 'YOUR_API_KEY');
if (($status['status'] ?? null) === 'paid') {
    // Balance was credited by the verified provider webhook.
}
```

### After — bundled PHP client

The official client at `https://trustifysmm.com/downloads/trustifysmm-api-client.php` already sends `x-api-key` in `invoiceStatus()`. Re-download it; no signature changes are required.

```php
<?php
require __DIR__ . '/trustifysmm-api-client.php';

$api = new TrustifySmmApi('YOUR_API_KEY');

$invoice = $api->createInvoice(25.00);      // unchanged
$status  = $api->invoiceStatus($invoice['invoice_id']);   // now authenticated internally
```

### After — deposit access token in a browser flow

```php
<?php
// Server-side only: create the invoice, then hand the token to your frontend.
$invoice = $api->createInvoice(25.00);
$token   = $invoice['deposit_access_token'];   // returned once
// Persist per session; never log it, never put it in a URL.
```

```js
// Browser: read-only status for that one deposit
const res = await fetch(`/api/banker/status?id=${encodeURIComponent(depositId)}`, {
  headers: { "x-deposit-token": depositToken },
});
```

> Do not ship a reseller API key to a browser. Use your own backend as a proxy, or the per-deposit token.

---

## Migration checklist for resellers

- [ ] Stop sending the API key as `?key=`; move it to `x-api-key`.
- [ ] Add `x-api-key` to every `GET /api/banker/status` call.
- [ ] Add `x-api-key` to every `GET /api/banker/pay` call.
- [ ] Confirm your client handles `401` (missing/invalid credential) and `404` (not found **or** not yours) distinctly from `500`.
- [ ] Remove any `?confirm=1` usage — it no longer credits anything.
- [ ] Re-download the bundled PHP client if you use it.
- [ ] Never log the `x-api-key` header value; scrub it from error reports.
- [ ] If you display deposit details in a browser, use the `deposit_access_token` from invoice creation instead of a reseller key.
- [ ] Rotate your API key if it was ever sent in a URL (see below).

---

## Key rotation

A key that was previously passed as `?key=` may exist in access logs, proxy logs, browser history or shell history. Rotating it is recommended, not mandatory.

Rotate from the dashboard: **Account → API key → Regenerate**. Regenerating replaces the key and re-points your existing orders, invoices and ledger entries to the new key, so historical deposits stay accessible with the new key. Your old key stops working immediately, so update your integration in the same window.

If you cannot rotate immediately, at minimum confirm you are no longer sending the key in URLs.

---

## Limits

- 120 requests per minute per client IP on `/api/banker/status` and `/api/banker/pay`.
- Polling every 10–30 seconds is well within the limit. Do not poll faster than once per second.
- Credit is never instant on the API side: it happens when the provider webhook arrives and passes verification. A `status: paid` response means the balance has already been credited.

---

## Questions

Contact support with your invoice id and the **first characters only** of your API key. Never send a full key, and never send it in a public channel.

---

## Document control

| Item | Value |
| --- | --- |
| Related change | B1 — public Banker endpoint authentication hardening |
| Source of truth | `docs/NOWPAYMENTS_PRE_DEPLOYMENT_CHECKLIST.md` |
| Status | Prepared, **not yet distributed** |
| Distribution | Manual only — no emails were sent and no resellers were contacted |
