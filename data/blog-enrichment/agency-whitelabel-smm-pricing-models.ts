import type { BlogEnrichment } from "@/data/blog-enrichment/types";

export const enrichmentAgencyPricing: BlogEnrichment = {
  extraBlocks: [
  {
    "type": "h2",
    "id": "packaging",
    "text": "Packaging tiers clients understand"
  },
  {
    "type": "p",
    "text": "Starter: one platform, capped monthly units. Growth: two platforms plus reporting. Viral: launch window with dedicated pacing and WhatsApp updates."
  },
  {
    "type": "p",
    "text": "Name tiers by outcome language, not panel jargon."
  },
  {
    "type": "h2",
    "id": "enterprise",
    "text": "Enterprise quotes with Rate Deck proof"
  },
  {
    "type": "p",
    "text": "Attach /pricing screenshots with date stamp in proposals. Enterprise buyers expect audit trails."
  }
],
  faq: [
  {
    "q": "What markup should agencies use on SMM?",
    "a": "Common floors are 1.4x wholesale for self-serve and 2.2x–3x for managed campaigns with humans in the loop. Adjust for refill support burden."
  },
  {
    "q": "How do I white-label TrustifySMM?",
    "a": "Use your domain storefront and API keys per client. Never expose upstream panel branding in emails or PDFs."
  },
  {
    "q": "Should I publish retail prices?",
    "a": "Public retail helps SEO for local agencies. Hide enterprise tiers behind sales calls."
  },
  {
    "q": "How do retainers work with panels?",
    "a": "Pre-purchase panel balance monthly pool. Track burn rate vs client fee. Unused pool rolls or credits per contract."
  },
  {
    "q": "What is Rate Deck?",
    "a": "TrustifySMM /pricing layout with platform chapters and accordion categories — use it visually in sales decks."
  },
  {
    "q": "Do volume discounts matter?",
    "a": "Negotiate with panel owners after documented monthly spend. Until then, optimize SKU mix and cut low-margin IDs."
  },
  {
    "q": "How do I prevent sales from underpricing?",
    "a": "CRM guardrails: minimum margin per category, approval workflow for custom quotes."
  }
],
};
