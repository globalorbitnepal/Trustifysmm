import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ORBIT_COOKIE_NAME, verifyOrbitSessionToken } from "@/lib/orbit/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/orbit") && !pathname.startsWith("/api/orbit")) {
    return NextResponse.next();
  }

  const publicPaths = ["/orbit/login", "/api/orbit/auth/login"];
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/orbit/:path*", "/api/orbit/:path*"],
};