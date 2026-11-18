import type { BlogEnrichment } from "@/data/blog-enrichment/types";

export const enrichmentApiAutomation: BlogEnrichment = {
  extraBlocks: [
  {
    "type": "h2",
    "id": "observability",
    "text": "Observability: logs, alerts and dashboards"
  },
  {
    "type": "p",
    "text": "Log every action=add with latency, HTTP code and parsed error. Alert on error rate above two percent over fifteen minutes."
  },
  {
    "type": "p",
    "text": "Chart balance runway daily. Auto-create Banker invoice when runway drops below three days of spend."
  },
  {
    "type": "h2",
    "id": "rate-limits",
    "text": "Rate limits and backoff"
  },
  {
    "type": "p",
    "text": "Batch status polling with multi_status instead of hundreds of status calls. Exponential backoff on 502/503 from upstream."
  },
  {
    "type": "p",
    "text": "Cache services JSON for twenty-four hours unless webhooks notify catalog updates."
  }
],
  faq: [
  {
    "q": "What is the TrustifySMM API base URL?",
    "a": "Use /api/v2 on your site domain with POST form bodies or JSON. Your storefront keeps its own API keys per client while the catalogue and delivery stay fully white-label."
  },
  {
    "q": "How do I avoid duplicate orders?",
    "a": "Persist idempotency keys from your checkout. On timeout, call status or search your DB for panel order ID before retrying add."
  },
  {
    "q": "Where is the PHP download?",
    "a": "Visit /api and download trustifysmm-api-client.php from the documentation page. It includes Banker invoice helpers."
  },
  {
    "q": "Can I use GET instead of POST?",
    "a": "GET works for testing but POST is recommended for production to avoid key leakage in logs and proxies."
  },
  {
    "q": "How do I test Banker locally?",
    "a": "Use POST /api/banker/invoice with demo API key. Configure BANKER_DEMO_AUTO_PAY=1 for controlled test credits via pay endpoint."
  },
  {
    "q": "What fields come back on status?",
    "a": "Typically charge, start_count, status, remains and currency. Map them directly to client dashboards."
  },
  {
    "q": "Should I version my service cache?",
    "a": "Yes. Hash the services payload daily. If hash changes, notify ops to diff new IDs before auto-fulfillment breaks."
  }
],
};
