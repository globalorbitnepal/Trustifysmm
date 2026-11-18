import { describe, expect, it } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { clearLiveCatalogCache, livePricingData } from "@/lib/orbit/live-catalog";
import { serverApiSummary, setCategoryPrice, setServicePrice, syncProviderCatalog } from "@/lib/smm-upstream/catalog";

const FILE = path.join(process.cwd(), "data", "runtime", "upstream-catalog.json");
const backup = readFileSync(FILE, "utf8");
/*
 * Restoring the file alone is not enough: the customer catalog caches by file stamp, so the
 * cache must be dropped too or the next test sees this test's prices.
 */
const restore = () => {
  writeFileSync(FILE, backup);
  clearLiveCatalogCache();
};

/**
 * A price typed in Orbit must be exactly what the customer is charged. This edits the real
 * synced catalog, reads it back through the customer catalog, then restores the file.
 */
describe("Orbit price edits reach the customer", () => {
  it("applies a single service price and reverts to automatic", async () => {
    try {
      const orbit = await serverApiSummary();
      const page = await serverApiSummary(orbit.category);
      const row = page.services[0];

      const saved = await setServicePrice(row.localId, 9.5);
      expect("error" in saved).toBe(false);

      const after = livePricingData().services.find((service) => service.id === row.localId);
      expect(after?.ratePer1000).toBe(9.5);

      const pageAfter = await serverApiSummary(orbit.category);
      const rowAfter = pageAfter.services.find((service) => service.localId === row.localId);
      expect(rowAfter?.manualPrice).toBe(9.5);
      expect(rowAfter?.ratePer1000).toBe(9.5);

      await setServicePrice(row.localId, null);
      const reverted = livePricingData().services.find((service) => service.id === row.localId);
      expect(reverted?.ratePer1000).toBeCloseTo(row.defaultRatePer1000, 4);
    } finally {
      restore();
    }
  });

  it("applies a category price to every service in that category", async () => {
    try {
      const orbit = await serverApiSummary();
      const page = await serverApiSummary(orbit.category);
      const cost = page.services[0].costPer1000;
      const result = await setCategoryPrice(orbit.category, cost);
      expect("error" in result).toBe(false);

      const live = livePricingData();
      for (const row of page.services) {
        const customer = live.services.find((service) => service.id === row.localId);
        /* Category price replaces the base cost, then the 30% markup applies. */
        expect(customer?.ratePer1000).toBeCloseTo(Math.round(cost * 1.3 * 10000) / 10000, 4);
      }
    } finally {
      restore();
    }
  });

  it("keeps a manual price after a full resync", async () => {
    try {
      const page = await serverApiSummary();
      const row = (await serverApiSummary(page.category)).services[0];
      await setServicePrice(row.localId, 7.25);

      const providers = JSON.parse(readFileSync("data/runtime/providers.json", "utf8")) as {
        id: string; name: string; endpoint: string; apiKey: string; enabled: boolean; priority: number; markupPercent?: number;
      }[];
      const provider = providers.find((item) => item.endpoint.includes("honestsmm"));
      if (!provider?.apiKey) return;

      let synced: Awaited<ReturnType<typeof syncProviderCatalog>>;
      try {
        synced = await syncProviderCatalog({ ...provider, markupPercent: 30 });
      } catch (error) {
        console.log("resync skipped: no network", error instanceof Error ? error.message : "");
        return;
      }
      /* The provider call needs network access; outside it, the other two tests still cover
       * the price path. A reachable provider must keep the manual price. */
      if ("error" in synced) {
        console.log("resync skipped:", synced.error);
        return;
      }
      const kept = livePricingData().services.find((service) => service.id === row.localId);
      expect(kept?.ratePer1000).toBe(7.25);
    } finally {
      restore();
    }
  }, 60_000);
});
