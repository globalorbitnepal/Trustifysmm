import type { ServicePricingData } from "@/data/service-pricing-types";

export type SeoSection = { heading: string; paragraphs: string[] };
export type SeoFaq = { q: string; a: string };
export type SeoStep = { title: string; text: string };

export type SeoLandingGroup = {
  /** Human label shown in the live price table, e.g. "Instagram followers". */
  label: string;
  /** Match services whose group contains any of these (case-insensitive). */
  groupMatch: string[];
  /** Optional extra name filter, e.g. only real/refill services. */
  nameMatch?: string[];
};

export type SeoLanding = {
  slug: string;
  family: "panel" | "platform";
  platform?: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  h1Accent?: string;
  breadcrumbLabel: string;
  keywords: string[];
  intro: string[];
  sections: SeoSection[];
  priceGroups: SeoLandingGroup[];
  howItWorks: SeoStep[];
  delivery: string[];
  ordering: string[];
  faq: SeoFaq[];
  related: string[];
  image: { src: string; alt: string };
  ctaTitle: string;
  ctaText: string;
};

export type PriceRow = {
  label: string;
  count: number;
  lowest: number;
  highest: number;
  sample: string[];
};

/**
 * Pulls real numbers out of the live catalog. If a page has no matching services
 * the row is dropped, so no page can advertise a price it cannot deliver.
 */
export function priceRowsFor(data: ServicePricingData, groups: SeoLandingGroup[]): PriceRow[] {
  const rows: PriceRow[] = [];
  for (const group of groups) {
    const matches = data.services.filter((service) => {
      if (group.groupMatch.length) {
        const haystack = `${service.group || ""} ${service.name}`.toLowerCase();
        if (!group.groupMatch.some((term) => haystack.includes(term.toLowerCase()))) return false;
      }
      if (group.nameMatch?.length) {
        const name = service.name.toLowerCase();
        if (!group.nameMatch.some((term) => name.includes(term.toLowerCase()))) return false;
      }
      return true;
    });
    if (!matches.length) continue;
    const rates = matches.map((service) => Number(service.ratePer1000)).filter((rate) => Number.isFinite(rate) && rate > 0);
    if (!rates.length) continue;
    rows.push({
      label: group.label,
      count: matches.length,
      lowest: Math.min(...rates),
      highest: Math.max(...rates),
      sample: matches
        .slice()
        .sort((a, b) => Number(a.ratePer1000) - Number(b.ratePer1000))
        .slice(0, 3)
        .map((service) => service.name),
    });
  }
  return rows;
}

/** Lowest honest "from" price across every matched group. */
export function startingPrice(rows: PriceRow[]): number | null {
  if (!rows.length) return null;
  return Math.min(...rows.map((row) => row.lowest));
}

export function formatRate(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (value >= 100) return `$${value.toFixed(0)}`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(3)}`;
  return `$${value.toFixed(4)}`;
}
