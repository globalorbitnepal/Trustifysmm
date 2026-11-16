import type { BlogEnrichment } from "@/data/blog-enrichment/types";

export const enrichmentKpi: BlogEnrichment = {
  extraBlocks: [
  {
    "type": "h2",
    "id": "spreadsheet",
    "text": "Spreadsheet template that scales to BI"
  },
  {
    "type": "p",
    "text": "Week tab: revenue, panel cost, margin, tickets, top five SKUs by profit, worst five by tickets per order."
  },
  {
    "type": "p",
    "text": "When rows exceed ten thousand orders monthly, pipe the same schema to BigQuery or Metabase."
  },
  {
    "type": "h2",
    "id": "team-rituals",
    "text": "Monday ops ritual"
  },
  {
    "type": "p",
    "text": "Thirty-minute review of KPIs with support and sales. One action item: cut, fix or promote a SKU."
  }
],
  faq: [
  {
    "q": "What is the most important SMM reseller KPI?",
    "a": "Contribution margin after panel cost and support time, not gross revenue. A hot SKU with five percent ticket rate can destroy profit."
  },
  {
    "q": "How do I measure time-to-start?",
    "a": "Delta between createdAt and first Processing status from API logs. Track p50 and p90 per service ID."
  },
  {
    "q": "What is balance runway?",
    "a": "Current panel balance divided by average daily API spend. Alert below three days."
  },
  {
    "q": "Should I KPI individual sales reps?",
    "a": "Yes on margin and refund rate, not raw volume. Discourage toxic low-margin deals."
  },
  {
    "q": "How does multi_status help KPIs?",
    "a": "Batch polling reduces API noise and gives cleaner completion timestamps for analytics ETL."
  },
  {
    "q": "When do I kill a SKU?",
    "a": "When margin under fifteen percent and tickets over five percent of orders for two consecutive weeks."
  },
  {
    "q": "Can TrustifySMM feed my dashboard?",
    "a": "Use action=services, status and balance endpoints. Export nightly to your warehouse."
  }
],
};
