import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { ORBIT_COOKIE_NAME, createOrbitSessionToken } from "@/lib/orbit/auth";

const originalPasskey = process.env.ORBIT_PASSKEY;

beforeEach(() => {
  process.env.ORBIT_PASSKEY = "test-passkey-for-unit-tests-only";
  vi.resetModules();
});

afterEach(() => {
  process.env.ORBIT_PASSKEY = originalPasskey;
  vi.resetModules();
});

async function loadMiddleware() {
  return import("@/middleware");
}

function req(url: string, cookie?: string) {
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  return new NextRequest(url, { headers });
}

describe("Orbit reconciliation authorisation", () => {
  it("rejects an unauthenticated reconcile call with 401", async () => {
    const { middleware } = await loadMiddleware();
    const response = await middleware(req("https://trustifysmm.com/api/orbit/banker"));
    expect(response.status).toBe(401);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("Unauthorized");
  });

  it("rejects a forged/expired session cookie with 401", async () => {
    const { middleware } = await loadMiddleware();
    const response = await middleware(
      req("https://trustifysmm.com/api/orbit/banker", `${ORBIT_COOKIE_NAME}=forged-token-value`),
    );
    expect(response.status).toBe(401);
  });

  it("rejects any customer session cookie on an Orbit API route", async () => {
    const { middleware } = await loadMiddleware();
    const response = await middleware(
      req("https://trustifysmm.com/api/orbit/banker", `trustify_session=some-customer-token`),
    );
    expect(response.status).toBe(401);
  });

  it("allows a valid Orbit session to reach the route", async () => {
    const { middleware } = await loadMiddleware();
    const token = await createOrbitSessionToken();
    expect(token).toBeTruthy();
    const response = await middleware(
      req("https://trustifysmm.com/api/orbit/banker", `${ORBIT_COOKIE_NAME}=${token}`),
    );
    // A pass-through response is not a 401.
    expect(response.status).not.toBe(401);
  });
});
