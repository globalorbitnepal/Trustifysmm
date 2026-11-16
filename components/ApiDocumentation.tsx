"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  API_BASE_PATH,
  apiDocEndpoints,
  apiErrorCodes,
} from "@/data/api-documentation";

function useSiteOrigin() {
  return useMemo(() => {
    if (typeof window !== "undefined") return window.location.origin;
    return "https://trustifysmm.com";
  }, []);
}

export function ApiDocumentation() {
  const origin = useSiteOrigin();
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  }

  const panelUrl = `${origin}${API_BASE_PATH}`;

  return (
    <div className="api-docs-layout">
      <aside className="api-docs-rail" aria-label="API sections">
        <p className="api-docs-rail-title">On this page</p>
        <a href="#api-overview">Overview</a>
        <a href="#api-auth">Authentication</a>
        <a href="#api-banker">Banker (balance)</a>
        <a href="#api-endpoints">Endpoints</a>
        <a href="#api-errors">Errors</a>
        <a href="#api-downloads">Downloads</a>
        <a href="#api-php">PHP examples</a>
      </aside>

      <div className="api-docs-main">
        <section className="api-docs-card" id="api-overview">
          <h2>Overview</h2>
          <p>
            TrustifySMM exposes a standard SMM panel API so your website, app, or reseller script can{" "}
            <strong>list services</strong>, <strong>check balance</strong>, <strong>place orders</strong>, and{" "}
            <strong>track status</strong> — plus a <strong>Banker</strong> endpoint to create crypto top-up
            invoices that credit the same API key automatically.
          </p>
          <dl className="api-docs-meta">
            <div>
              <dt>Panel API URL</dt>
              <dd>
                <code>{panelUrl}</code>
                <button type="button" className="api-docs-copy" onClick={() => copy(panelUrl, "base")}>
                  {copied === "base" ? "Copied" : "Copy"}
                </button>
              </dd>
            </div>
            <div>
              <dt>Format</dt>
              <dd>
                <code>application/x-www-form-urlencoded</code> or JSON (panel). Banker uses JSON.
              </dd>
            </div>
            <div>
              <dt>Method</dt>
              <dd>
                <code>POST</code> (recommended). <code>GET</code> with query string is supported for testing.
              </dd>
            </div>
          </dl>
          <p className="api-docs-note">
            Copy your API key after <Link href="/signup">sign up</Link> → Account → API. For live production,
            set <code>SMM_UPSTREAM_API_URL</code> on the server to forward requests to your master panel (optional).
          </p>
        </section>

        <section className="api-docs-card" id="api-auth">
          <h2>Authentication</h2>
          <p>Every panel request must include your secret key. Never expose it in client-side JavaScript.</p>
          <pre className="api-docs-pre">
            <code>{`POST ${panelUrl}
Content-Type: application/x-www-form-urlencoded

key=YOUR_API_KEY&action=balance`}</code>
          </pre>
        </section>

        <section className="api-docs-card" id="api-banker">
          <h2>Banker — add balance via API</h2>
          <p>
            Resellers can top up without opening the panel UI. Create an invoice, pay crypto (NOWPayments when
            configured), and our webhook credits the linked API key. Then call <code>action=balance</code> and{" "}
            <code>action=add</code> as usual.
          </p>
          <ol className="api-docs-steps">
            <li>
              <code>POST {origin}/api/banker/invoice</code> with JSON <code>{`{"key":"...","amount":25}`}</code>
            </li>
            <li>Redirect user to <code>payment_url</code> or show <code>pay_address</code>.</li>
            <li>
              Poll <code>GET {origin}/api/banker/status?id=INVOICE_ID</code> until <code>status: paid</code>.
            </li>
            <li>Place orders with the same key — balance updates instantly after webhook.</li>
          </ol>
        </section>

        <section className="api-docs-card" id="api-endpoints">
          <h2>Endpoints</h2>
          {apiDocEndpoints.map((ep) => {
            const curl = ep.curlExample.replace(/https:\/\/trustifysmm\.com/g, origin);
            return (
              <article key={ep.id} className="api-docs-endpoint" id={`api-${ep.id}`}>
                <header>
                  <span className="api-docs-method">{ep.method}</span>
                  <h3>{ep.title}</h3>
                  {ep.action ? (
                    <span className="api-docs-pill">
                      action=<strong>{ep.action}</strong>
                    </span>
                  ) : null}
                </header>
                <p>{ep.summary}</p>
                <p className="api-docs-path">
                  <code>
                    {ep.method} {origin}
                    {ep.path}
                  </code>
                </p>
                <table className="api-docs-table">
                  <thead>
                    <tr>
                      <th>Parameter</th>
                      <th>Required</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ep.params.map((p) => (
                      <tr key={p.name}>
                        <td>
                          <code>{p.name}</code>
                        </td>
                        <td>{p.required ? "Yes" : "No"}</td>
                        <td>{p.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="api-docs-codegrid">
                  <div>
                    <p className="api-docs-code-label">cURL</p>
                    <pre className="api-docs-pre">
                      <code>{curl}</code>
                    </pre>
                    <button type="button" className="api-docs-copy" onClick={() => copy(curl, `curl-${ep.id}`)}>
                      {copied === `curl-${ep.id}` ? "Copied" : "Copy cURL"}
                    </button>
                  </div>
                  <div>
                    <p className="api-docs-code-label">Response</p>
                    <pre className="api-docs-pre">
                      <code>{ep.responseExample}</code>
                    </pre>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="api-docs-card" id="api-errors">
          <h2>Errors</h2>
          <table className="api-docs-table">
            <thead>
              <tr>
                <th>Message</th>
                <th>Meaning</th>
              </tr>
            </thead>
            <tbody>
              {apiErrorCodes.map((row) => (
                <tr key={row.code}>
                  <td>
                    <code>{row.code}</code>
                  </td>
                  <td>{row.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="api-docs-card" id="api-downloads">
          <h2>Downloads</h2>
          <p>Ready-made client you can drop into any PHP site or cron job.</p>
          <div className="api-docs-downloads">
            <a className="btn btn-primary" href="/downloads/trustifysmm-api-client.php" download>
              Download PHP client (.php)
            </a>
            <a className="btn btn-ghost" href="/downloads/trustifysmm-api-client.php" target="_blank" rel="noreferrer">
              View source
            </a>
          </div>
        </section>

        <section className="api-docs-card" id="api-php">
          <h2>Long PHP integration example</h2>
          <p>Typical flow: check balance → create invoice if low → place order → poll status.</p>
          <pre className="api-docs-pre api-docs-pre--tall">
            <code>{`<?php
require __DIR__ . '/trustifysmm-api-client.php';

$api = new TrustifySmmApi('YOUR_API_KEY', '${panelUrl}');

$balance = $api->balance();
if (isset($balance['error'])) {
    die($balance['error']);
}

if ((float) ($balance['balance'] ?? 0) < 5) {
    $inv = $api->createInvoice(25.00);
    if (!empty($inv['payment_url'])) {
        header('Location: ' . $inv['payment_url']);
        exit;
    }
}

$order = $api->add(101, 'https://instagram.com/username', 1000);
if (isset($order['order'])) {
    $status = $api->status((int) $order['order']);
    file_put_contents(__DIR__ . '/last-order.json', json_encode($status, JSON_PRETTY_PRINT));
}`}</code>
          </pre>
          <button
            type="button"
            className="api-docs-copy"
            onClick={() =>
              copy(
                `<?php\nrequire __DIR__ . '/trustifysmm-api-client.php';\n$api = new TrustifySmmApi('YOUR_API_KEY', '${panelUrl}');\n`,
                "php-long",
              )
            }
          >
            {copied === "php-long" ? "Copied" : "Copy PHP snippet"}
          </button>
        </section>
      </div>
    </div>
  );
}