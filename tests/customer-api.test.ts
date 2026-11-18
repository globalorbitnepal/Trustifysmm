import { describe, expect, it } from "vitest";
import { handleSmmApi } from "@/lib/smm-api/handler";
import { pricingToApiServices } from "@/lib/smm-api/catalog";
import { livePricingData } from "@/lib/orbit/live-catalog";

describe("customer API stays on the customer wallet", () => {
  it("rejects a call with no key", async () => {
    await expect(handleSmmApi({})).resolves.toEqual({ error: "API key is required" });
  });

  it("rejects an unknown key without naming a supplier", async () => {
    const result = await handleSmmApi({ key: "tsm_not_a_real_customer_key_000", action: "balance" });
    expect(result).toEqual({ error: "Invalid API key" });
    expect(JSON.stringify(result).toLowerCase()).not.toMatch(/honest|upstream|wholesale|demo api/);
  });

  it("publishes customer service codes, not a supplier name", () => {
    const rows = pricingToApiServices(livePricingData());
    expect(rows.length).toBeGreaterThan(100);
    expect(rows.every((row) => row.service >= 10001)).toBe(true);
    expect(JSON.stringify(rows).toLowerCase()).not.toMatch(/honestsmm|server api|upstream/);
  });
});
