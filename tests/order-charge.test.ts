import { describe, expect, it } from "vitest";
import { chargeFor } from "@/lib/dashboard/catalog";
import { panelChargeFor } from "@/lib/smm-api/catalog";

const service = (ratePer1000: number) =>
  ({ id: 1, name: "x", category: "c", platform: "instagram", group: "c", ratePer1000, minOrder: "1", maxOrder: "1000000", avgTime: "", description: "" });

describe("order charge", () => {
  it("charges the exact amount for a normal order", () => {
    expect(chargeFor(service(0.1947), 1000)).toBe(0.1947);
    expect(chargeFor(service(0.1947), 5000)).toBe(0.9735);
    expect(chargeFor(service(2), 100)).toBe(0.2);
  });

  it("never rounds a real order down to nothing", () => {
    /* A $0.0012/1k service at its 10 minimum would otherwise cost $0.000012 → $0.0000. */
    const cheap = chargeFor(service(0.0012), 10);
    expect(cheap).toBeGreaterThan(0);
    expect(cheap).toBe(0.0001);
  });

  it("rounds up, never down, so the charge covers the cost", () => {
    expect(chargeFor(service(0.0009), 100)).toBe(0.0001);
    expect(chargeFor(service(0.33333), 1000)).toBeGreaterThanOrEqual(0.33333);
  });

  it("returns zero when nothing is ordered", () => {
    expect(chargeFor(service(1), 0)).toBe(0);
    expect(chargeFor(service(0), 1000)).toBe(0);
  });

  it("uses the same rule for the reseller API", () => {
    expect(panelChargeFor(0.0012, 10)).toBe(0.0001);
    expect(panelChargeFor(0.1947, 1000)).toBe(0.1947);
    expect(panelChargeFor(1, 0)).toBe(0);
  });
});
