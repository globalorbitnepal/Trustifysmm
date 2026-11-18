import { describe, expect, it } from "vitest";
import { bankerApiKeyFromRequest, resellerKeyMatchesInvoiceKey } from "@/lib/banker/api-key";

describe("banker API key extraction", () => {
  it("reads the x-api-key header", () => {
    const request = new Request("https://trustifysmm.com/api/banker/status?id=TSM-1", {
      headers: { "x-api-key": "  abc123  " },
    });
    expect(bankerApiKeyFromRequest(request)).toBe("abc123");
  });

  it("reads a bearer token", () => {
    const request = new Request("https://trustifysmm.com/api/banker/status?id=TSM-1", {
      headers: { authorization: "Bearer key-from-header" },
    });
    expect(bankerApiKeyFromRequest(request)).toBe("key-from-header");
  });

  it("ignores a key supplied in the query string", () => {
    const request = new Request("https://trustifysmm.com/api/banker/status?id=TSM-1&key=query-key");
    expect(bankerApiKeyFromRequest(request)).toBe("");
  });

  it("returns an empty string when no key is supplied", () => {
    const request = new Request("https://trustifysmm.com/api/banker/status?id=TSM-1");
    expect(bankerApiKeyFromRequest(request)).toBe("");
  });

  it("prefers the x-api-key header over a bearer token", () => {
    const request = new Request("https://trustifysmm.com/api/banker/status?id=TSM-1", {
      headers: { "x-api-key": "header-key", authorization: "Bearer bearer-key" },
    });
    expect(bankerApiKeyFromRequest(request)).toBe("header-key");
  });

  it("ignores a non-bearer authorization scheme", () => {
    const request = new Request("https://trustifysmm.com/api/banker/status?id=TSM-1", {
      headers: { authorization: "Basic dXNlcjpwYXNz" },
    });
    expect(bankerApiKeyFromRequest(request)).toBe("");
  });

  it("matches only the owning invoice key", () => {
    expect(resellerKeyMatchesInvoiceKey("owner-key", "owner-key")).toBe(true);
    expect(resellerKeyMatchesInvoiceKey("other-key", "owner-key")).toBe(false);
    expect(resellerKeyMatchesInvoiceKey("", "owner-key")).toBe(false);
    expect(resellerKeyMatchesInvoiceKey("owner-key", "")).toBe(false);
  });

  it("refuses a retired public default even when a legacy invoice still stores it", () => {
    const retired = "trustify-demo-key-change-me";
    // Legacy invoice row that was never migrated.
    expect(resellerKeyMatchesInvoiceKey(retired, retired)).toBe(false);
    // Denylisted value presented against a legitimate invoice key.
    expect(resellerKeyMatchesInvoiceKey(retired, "tsm_legitimate")).toBe(false);
  });
});
