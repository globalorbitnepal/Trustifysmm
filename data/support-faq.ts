export type SupportFaqCategory = {
  id: string;
  title: string;
  description: string;
  items: { q: string; a: string }[];
};

export const supportFaqCategories: SupportFaqCategory[] = [
  {
    id: "getting-started",
    title: "Getting started",
    description: "Accounts, first deposit, and finding the right service in the catalog.",
    items: [
      {
        q: "How do I create a TrustifySMM account?",
        a: "Click Sign Up, confirm your email, and complete your profile. You receive panel access, an API key under Account → API, and the same balance wallet for manual orders and automated API add calls. No setup fee is required to browse the public /services and /pricing catalogs before you fund.",
      },
      {
        q: "Where can I see all services and prices before I pay?",
        a: "Use the long-form catalog at /services with platform filters, category dropdown and search by service ID or keyword. The Rate Deck at /pricing shows accordion chapters per platform with horizontal rate strips. Both pages mirror panel pricing style so you can quote clients or map API IDs before signup.",
      },
      {
        q: "What is the minimum deposit or order?",
        a: "Order size follows each service’s catalog limits, often 10–100 units. Wallet top-ups use $10, $20, $25, $50, $100, $250, $500, and $1000. NOWPayments adds its fee on top, and that fee is shown with the crypto amount before you pay.",
      },
      {
        q: "Do you offer a test or trial balance?",
        a: "We occasionally run promotions for new accounts. For integration testing, use the documented demo API key on /api in local staging, or place micro orders on low-cost view services after your first small deposit. Resellers should always probe three SKUs before moving client campaigns.",
      },
    ],
  },
  {
    id: "orders",
    title: "Orders & delivery",
    description: "Start times, partial orders, cancellations, and status tracking.",
    items: [
      {
        q: "How fast do orders start?",
        a: "Most services show an average start time in the catalog. Automation can begin within minutes for popular SKUs; some premium or geo-targeted services queue longer during peak hours. API status moves from Pending to Processing when the upstream accepts the job. Weekend starts may be slower on niche categories.",
      },
      {
        q: "What do order statuses mean in the panel and API?",
        a: "Pending means queued. Processing or In progress means delivery has started. Completed means the target quantity was delivered per service rules. Partial means only part of the quantity arrived — check remains in action=status. Canceled means the order will not complete; balance handling depends on panel policy for that service.",
      },
      {
        q: "My order is stuck on Pending — what should I do?",
        a: "Wait at least the published average time plus a 30% buffer. If still Pending, open a ticket with your panel order ID, service ID, link and timestamp. Do not place a duplicate order until support or status confirms the first job failed — duplicate adds can double-charge your balance.",
      },
      {
        q: "What is a partial order?",
        a: "A partial completes below the ordered quantity. The API remains field shows how many units are left undelivered. Many services auto-stop and charge only for delivered amount; others require a manual cancel or refill request. Screenshot status JSON when contacting support.",
      },
      {
        q: "Can I cancel an order after submitting?",
        a: "Only if the service lists cancel: true in action=services and the job has not progressed too far. Use the panel cancel control or API cancel action when enabled. Instant-cancel is not available on every SKU — especially after Processing begins.",
      },
      {
        q: "How do I track many orders at once?",
        a: "Resellers should use action=multi_status with comma-separated order IDs from your database. Poll every five to fifteen minutes instead of per-order spam. Map remains and status to client-facing dashboards with your own SLA messaging.",
      },
    ],
  },
  {
    id: "refills",
    title: "Refills, drops & quality",
    description: "Refill windows, service naming, and what we need from you to help.",
    items: [
      {
        q: "What does 30D, 60D, 365D or Lifetime refill mean?",
        a: "It is the window during which drops on that metric may qualify for a refill per service policy. The label appears in the service name or description on /services. Lifetime does not mean the account lives forever — it means refill requests are accepted under that product’s long-term rules until the service is retired.",
      },
      {
        q: "How do I request a refill?",
        a: "Open a ticket from the panel with the original order ID, current count screenshot, and the date you noticed the drop. Submit inside the refill window. If your service supports automated refill API actions, include prior ticket IDs so we do not duplicate requests.",
      },
      {
        q: "Why did my followers or likes drop after delivery?",
        a: "Social platforms routinely purge inactive or low-quality accounts. Drops are industry-normal, especially on no-refill budget SKUs. Premium labeled services with explicit refill terms reduce but do not eliminate variance. Always sell refill language that matches the service title.",
      },
      {
        q: "What link format should I use?",
        a: "Use the full HTTPS URL required by the service — post permalink, channel link, or @username exactly as the order form specifies. Private accounts, age-restricted pages, or wrong links cause non-delivery without refund on many SKUs.",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments & Banker",
    description: "Balance, crypto top-ups, invoices, and reconciliation.",
    items: [
      {
        q: "Which payment methods do you support?",
        a: "TrustifySMM supports balance top-ups suitable for global resellers, including crypto via the Banker invoice flow documented on /api. Supported pay assets depend on your configured gateway (e.g. USDT TRC20 through NOWPayments). Card or local rails may be added in the panel when available in your region.",
      },
      {
        q: "How does the Banker API top-up work?",
        a: "POST /api/banker/invoice with JSON containing your API key and USD amount. You receive invoice_id and the provider payment_url. After on-chain payment, our webhook credits the same key used in the invoice. Poll GET /api/banker/status?id= with your API key in the x-api-key header until status is paid, then confirm with action=balance.",
      },
      {
        q: "I paid crypto but balance is not updated yet.",
        a: "Wait for blockchain confirmations and webhook delivery. Check invoice status via /api/banker/status with your API key in the x-api-key header. If paid shows on the gateway but not in panel after 60 minutes, email support with transaction hash, invoice_id and API key prefix (never send the full secret in public channels).",
      },
      {
        q: "Are deposits refundable?",
        a: "Added panel balance is generally non-refundable except where required by law or where a duplicate credit error is proven. Crypto sent to the wrong network or wrong address cannot always be recovered. Read /terms before large deposits.",
      },
      {
        q: "Do you charge hidden fees on top of the rate per 1,000?",
        a: "Catalog rates are per 1,000 units in USD. Payment rails may charge network or processor fees separate from panel balance. Your reseller margin should include both panel cost and payment friction.",
      },
    ],
  },
  {
    id: "api",
    title: "API & automation",
    description: "Keys, endpoints, errors, and reseller integration help.",
    items: [
      {
        q: "Where is the API documentation?",
        a: "Visit /api for the full long-form guide: services, add, status, multi_status, balance, Banker invoices, error table, cURL and a downloadable PHP client at /downloads/trustifysmm-api-client.php.",
      },
      {
        q: "Why do I get Invalid API key?",
        a: "Ensure you send the key parameter on every call, use the active key from Account → API, and avoid trimming or encoding errors. Production may forward to SMM_UPSTREAM_API_URL — keys must be valid on the upstream panel.",
      },
      {
        q: "Why do I get Not enough funds?",
        a: "Your panel balance is lower than the calculated charge for quantity × rate per 1,000. Top up via Banker or the panel wallet, then retry. Automations should check action=balance before add and alert finance under a threshold.",
      },
      {
        q: "Can I run the API from my website frontend?",
        a: "No. API keys must stay on your server. Call TrustifySMM from backend code, cron, or serverless functions only. Exposing keys in browser JavaScript is a security violation and leads to key rotation.",
      },
      {
        q: "Service not found — what happened?",
        a: "The service ID was removed, renamed, or never existed. Refresh your catalog daily with action=services and version your SKU-to-ID map. Do not hardcode names without IDs.",
      },
    ],
  },
  {
    id: "account",
    title: "Account & security",
    description: "Passwords, 2FA, reseller policy, and responsible use.",
    items: [
      {
        q: "Do you ever ask for my social media password?",
        a: "Never. Legitimate SMM delivery uses public links or usernames only. Anyone requesting passwords is not TrustifySMM staff — report phishing to support@trustifysmm.com immediately.",
      },
      {
        q: "Can I run a reseller or white-label store?",
        a: "Yes where permitted by /terms and applicable law. Use API automation, public pricing pages for your sales team, and honest client disclaimers. You are responsible for your storefront compliance and customer support.",
      },
      {
        q: "How do I rotate or reset my API key?",
        a: "Use the panel API settings to generate a new key, update your servers, then revoke the old key. Plan rotation during low-traffic windows and pause cron jobs to avoid half-migrated failures.",
      },
      {
        q: "Is using SMM services allowed by social networks?",
        a: "Most platforms prohibit artificial inflation in their terms. Clients assume risk when purchasing growth services. We provide education on safer velocities; we do not guarantee immunity from restrictions.",
      },
    ],
  },
];

export const supportQuickLinks = [
  { href: "/services", label: "Services catalog", desc: "Search 1,900+ SKUs and service IDs" },
  { href: "/pricing", label: "Rate Deck", desc: "Compare platform chapters and rates" },
  { href: "/api", label: "API & Banker", desc: "Integration docs and PHP download" },
  { href: "/blogs", label: "Guides & blogs", desc: "Long-form playbooks for resellers" },
  { href: "/terms", label: "Terms of Service", desc: "Usage, refunds and liability" },
  { href: "/privacy", label: "Privacy Policy", desc: "Data handling and cookies" },
] as const;

export const supportChannels = [
  {
    id: "email",
    title: "Email support",
    detail: "Billing, API issues, refill disputes, account access",
    action: "support@trustifysmm.com",
    href: "mailto:support@trustifysmm.com",
    sla: "Typical reply within 4–12 hours",
  },
  {
    id: "panel",
    title: "Panel tickets",
    detail: "Order IDs, partials, stuck Pending, refill requests",
    action: "Open after sign in",
    href: "/signin",
    sla: "Include order ID + service ID",
  },
  {
    id: "docs",
    title: "Self-serve docs",
    detail: "API, Banker, catalogs — available 24/7",
    action: "Browse /api",
    href: "/api",
    sla: "Instant answers for developers",
  },
] as const;