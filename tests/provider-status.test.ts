import { describe, expect, it } from "vitest";
import { answerValue, mapStatus, wasRefused } from "@/lib/smm-upstream/orders";

describe("Server API answers", () => {
  it("reads a value out of a list answer", () => {
    /* The provider answers a cancel with [{order, cancel}]. */
    expect(answerValue({ data: {}, list: [{ order: 15038575, cancel: 1341805 }] }, "cancel")).toBe(1341805);
    expect(wasRefused(1341805)).toBe(false);
  });

  it("reads a value out of a plain object answer", () => {
    expect(answerValue({ data: { order: 15038575 } }, "order")).toBe(15038575);
  });

  it("treats 0 and false as a refusal", () => {
    expect(wasRefused(0)).toBe(true);
    expect(wasRefused("0")).toBe(true);
    expect(wasRefused(false)).toBe(true);
    expect(wasRefused(undefined)).toBe(false);
    expect(wasRefused("Completed")).toBe(false);
  });

  it("maps every provider status", () => {
    expect(mapStatus("Pending")).toBe("Pending");
    expect(mapStatus("In progress")).toBe("In progress");
    expect(mapStatus("inprogress")).toBe("In progress");
    expect(mapStatus("Processing")).toBe("Processing");
    expect(mapStatus("Completed")).toBe("Completed");
    expect(mapStatus("Partial")).toBe("Partial");
    expect(mapStatus("Canceled")).toBe("Canceled");
    expect(mapStatus("Cancelled")).toBe("Canceled");
    expect(mapStatus("Refunded")).toBe("Refunded");
    /* An unknown word must not silently change the order. */
    expect(mapStatus("Queued somewhere")).toBeNull();
  });
});
