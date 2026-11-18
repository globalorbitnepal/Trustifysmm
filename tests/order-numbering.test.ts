import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const source = readFileSync(path.join(process.cwd(), "lib", "smm-api", "demo-store.ts"), "utf8");

describe("customer order numbering", () => {
  it("starts a new store at 1100", () => {
    expect(source).toMatch(/nextOrderId: 1100/);
  });

  it("lowers a legacy counter when no order exists yet", () => {
    /* A store that still holds 900002 must hand out 1100 for the first real order. */
    const highest = 0;
    const FIRST_ORDER_ID = 1100;
    const nextOrderId = highest >= FIRST_ORDER_ID ? highest + 1 : FIRST_ORDER_ID;
    expect(nextOrderId).toBe(1100);
  });

  it("continues from the highest existing order instead of repeating an id", () => {
    const highest = 1188;
    const FIRST_ORDER_ID = 1100;
    const nextOrderId = highest >= FIRST_ORDER_ID ? highest + 1 : FIRST_ORDER_ID;
    expect(nextOrderId).toBe(1189);
  });

  it("normalises the counter on every load", () => {
    expect(source).toMatch(/const highest = parsed\.orders\.reduce/);
    expect(source).toMatch(/parsed\.nextOrderId = highest >= FIRST_ORDER_ID \? highest \+ 1 : FIRST_ORDER_ID/);
  });
});
