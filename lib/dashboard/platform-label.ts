import { livePricingData } from "@/lib/orbit/live-catalog";

export function platformDisplayLabel(platformId: string): string {
  const data = livePricingData();
  if (platformId === "other") return data.platformLabel.other || "Other Services";
  return data.platformLabel[platformId] || platformId;
}

export function mapPlatformCounts(counts: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [id, value] of Object.entries(counts)) {
    out[platformDisplayLabel(id)] = value;
  }
  return out;
}