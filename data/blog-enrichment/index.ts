import type { BlogEnrichment } from "@/data/blog-enrichment/types";
import { enrichmentAgencyPricing } from "@/data/blog-enrichment/agency-whitelabel-smm-pricing-models";
import { enrichmentApiAutomation } from "@/data/blog-enrichment/trustifysmm-api-automation-guide";
import { enrichmentChoosePanel } from "@/data/blog-enrichment/how-to-choose-best-smm-panel-2026";
import { enrichmentCryptoPayments } from "@/data/blog-enrichment/crypto-payments-smm-panel-balance";
import { enrichmentInstagram } from "@/data/blog-enrichment/instagram-growth-strategy-for-resellers";
import { enrichmentKpi } from "@/data/blog-enrichment/smm-panel-kpi-dashboard-for-resellers";
import { enrichmentSafeOrdering } from "@/data/blog-enrichment/safe-ordering-avoid-social-media-bans";
import { enrichmentTelegramDiscord } from "@/data/blog-enrichment/telegram-discord-community-growth-smm";
import { enrichmentTiktok } from "@/data/blog-enrichment/tiktok-viral-metrics-smm-guide";
import { enrichmentYoutube } from "@/data/blog-enrichment/youtube-subscribers-watch-time-smm";

export type { BlogEnrichment } from "@/data/blog-enrichment/types";

export const blogEnrichment: Record<string, BlogEnrichment> = {
  "how-to-choose-best-smm-panel-2026": enrichmentChoosePanel,
  "instagram-growth-strategy-for-resellers": enrichmentInstagram,
  "tiktok-viral-metrics-smm-guide": enrichmentTiktok,
  "youtube-subscribers-watch-time-smm": enrichmentYoutube,
  "trustifysmm-api-automation-guide": enrichmentApiAutomation,
  "crypto-payments-smm-panel-balance": enrichmentCryptoPayments,
  "safe-ordering-avoid-social-media-bans": enrichmentSafeOrdering,
  "agency-whitelabel-smm-pricing-models": enrichmentAgencyPricing,
  "telegram-discord-community-growth-smm": enrichmentTelegramDiscord,
  "smm-panel-kpi-dashboard-for-resellers": enrichmentKpi,
};