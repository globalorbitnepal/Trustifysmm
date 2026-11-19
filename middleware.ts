import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ORBIT_COOKIE_NAME, verifyOrbitSessionToken } from "@/lib/orbit/auth";
import { CUSTOMER_COOKIE_NAME, verifyCustomerSessionTokenEdge } from "@/lib/customer/session-edge";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  const pass = () => NextResponse.next({ request: { headers: requestHeaders } });

  /*
   * The session cookie is scoped to one host. Serving the same app on both trustifysmm.com
   * and www.trustifysmm.com makes a signed-in customer look signed out on the other host,
   * so every www request is permanently redirected to the canonical apex host.
   */
  const host = (request.headers.get("host") || "").toLowerCase();
  if (host === "www.trustifysmm.com") {
    const canonical = request.nextUrl.clone();
    canonical.host = "trustifysmm.com";
    canonical.port = "";
    canonical.protocol = "https:";
    return NextResponse.redirect(canonical, 308);
  }

  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
    const userId = await verifyCustomerSessionTokenEdge(token);
    if (!userId) {
      const signin = new URL("/signin", request.url);
      signin.searchParams.set("next", pathname);
      return NextResponse.redirect(signin);
    }
    return pass();
  }

  if (!pathname.startsWith("/orbit") && !pathname.startsWith("/api/orbit")) {
    /* The internal refresh authenticates with its own token inside the route. */
    return pass();
  }

  const publicPaths = ["/orbit/login", "/api/orbit/auth/login"];
  if (publicPaths.includes(pathname)) {
    return pass();
  }

  const token = request.cookies.get(ORBIT_COOKIE_NAME)?.value;
  const ok = await verifyOrbitSessionToken(token);
  if (!ok) {
    if (pathname.startsWith("/api/orbit")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const login = new URL("/orbit/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return pass();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|media/).*)"],
};
