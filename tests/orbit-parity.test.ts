import { describe, expect, it } from "vitest";
import { livePricingData } from "@/lib/orbit/live-catalog";
import { serverApiSummary } from "@/lib/smm-upstream/catalog";
import { publicText } from "@/lib/smm-upstream/public-text";

/**
 * Parity audit between Orbit's Service API screen and the customer catalog.
 *
 * Both sides are read through the real functions the app uses, so a mismatch here is a
 * mismatch a customer would actually see: a service missing from the dashboard, a price that
 * differs between Orbit and the New Order list, or provider wording that reached the site.
 */
describe("Orbit and customer catalog agree", () => {
  it("lists every Orbit service in the customer catalog at the same price", async () => {
    const orbit = await serverApiSummary();
    const customer = livePricingData();
    const byId = new Map(customer.services.map((row) => [row.id, row]));

    const missing: number[] = [];
    const priceMismatch: string[] = [];
    const nameMismatch: string[] = [];

    for (const platform of orbit.platformRows) {
      for (const category of platform.categories) {
        const page = await serverApiSummary(category.name);
        for (const row of page.services) {
          const inCustomer = byId.get(row.localId);
          if (!inCustomer) {
            missing.push(row.id);
            continue;
          }
          if (Math.abs(inCustomer.ratePer1000 - row.ratePer1000) > 0.00001) {
            priceMismatch.push(`${row.id}: orbit ${row.ratePer1000} vs customer ${inCustomer.ratePer1000}`);
          }
          if (publicText(row.name) !== inCustomer.name) nameMismatch.push(`${row.id}: ${inCustomer.name}`);
        }
      }
    }

    console.log(
      JSON.stringify(
        {
          orbitServices: orbit.serviceCount,
          orbitCategories: orbit.categoryCount,
          platforms: orbit.platformRows.map((row) => `${row.label}: ${row.categories.length} categories / ${row.count} services`),
          customerServices: customer.services.length,
          missing: missing.length,
          priceMismatch: priceMismatch.length,
          nameMismatch: nameMismatch.length,
        },
        null,
        1,
      ),
    );

    expect(missing).toEqual([]);
    expect(priceMismatch).toEqual([]);
    expect(nameMismatch).toEqual([]);
    expect(customer.services.length).toBe(orbit.serviceCount);
  }, 120_000);

  it("groups every category under a platform", async () => {
    const orbit = await serverApiSummary();
    const grouped = orbit.platformRows.reduce((sum, row) => sum + row.categories.length, 0);
    expect(grouped).toBe(orbit.categoryCount);
    /* Every category must sit under a named platform, never an empty bucket. */
    for (const row of orbit.platformRows) expect(row.label.length).toBeGreaterThan(2);
  });

  it("keeps provider wording out of every customer service", () => {
    const customer = livePricingData();
    const leak = customer.services
      .filter((row) => /honest\s*smm|\bapi\b|\bproviders?\b|\bpanels?\b|wholesale|upstream/i.test(`${row.name} ${row.group} ${row.description}`))
      .map((row) => `${row.id} ${row.name}`);
    expect(leak).toEqual([]);
  });

  it("gives every customer service a code that is not the provider id", async () => {
    const orbit = await serverApiSummary();
    const page = await serverApiSummary(orbit.category);
    for (const row of page.services) {
      expect(row.localId).not.toBe(row.id);
      expect(row.localId).toBeGreaterThanOrEqual(10001);
    }
  });
});
