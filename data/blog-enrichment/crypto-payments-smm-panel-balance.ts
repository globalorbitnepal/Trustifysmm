import type { BlogEnrichment } from "@/data/blog-enrichment/types";

export const enrichmentCryptoPayments: BlogEnrichment = {
  extraBlocks: [
  {
    "type": "h2",
    "id": "treasury",
    "text": "Treasury controls for reseller teams"
  },
  {
    "type": "p",
    "text": "Separate hot wallet for automated top-ups from cold storage for profits. Multi-sig for withdrawals above threshold."
  },
  {
    "type": "p",
    "text": "Match each Banker invoice to accounting memo with panel username or API key prefix."
  },
  {
    "type": "h2",
    "id": "fx-and-fees",
    "text": "FX, network fees and client pricing"
  },
  {
    "type": "p",
    "text": "USDT TRC20 is common for low fees. Pass through or absorb network fees explicitly in reseller terms."
  },
  {
    "type": "p",
    "text": "USD is your panel balance currency even when clients pay crypto — document conversion moment at invoice creation."
  }
],
  faq: [
  {
    "q": "How does TrustifySMM Banker work?",
    "a": "POST /api/banker/invoice with JSON key and USD amount. Client pays via payment_url or on-chain address. Webhook marks paid and credits the same API key for action=add orders."
  },
  {
    "q": "Which coins are supported?",
    "a": "Demo mode works without external providers. Production commonly uses NOWPayments with configurable pay currency such as USDT TRC20."
  },
  {
    "q": "How fast is balance credited?",
    "a": "After blockchain confirmations and IPN signature verification — typically minutes for TRC20, longer for BTC. Poll /api/banker/status until status is paid."
  },
  {
    "q": "Are crypto top-ups refundable?",
    "a": "Blockchain payments are generally irreversible. Set refund policy as account credit, not on-chain return, unless you manually send crypto."
  },
  {
    "q": "Do I need KYC for crypto?",
    "a": "Depends on payment provider and jurisdiction. Your terms should state compliance obligations for end clients and for your entity."
  },
  {
    "q": "How do I prevent duplicate IPN credits?",
    "a": "Store invoice_id as unique in your ledger. Ignore repeated paid webhooks if already processed — TrustifySMM demo store dedupes paid state."
  },
  {
    "q": "Can sub-accounts each have Banker?",
    "a": "Map one API key per client project. Create invoices keyed to that key so automation continues without manual balance transfers."
  }
],
};
