import { NextRequest, NextResponse } from "next/server";
import { createOrbitSessionToken, ORBIT_COOKIE_NAME, verifyPasskey } from "@/lib/orbit/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { passkey?: string };
  try {
    body = (await request.json()) as { passkey?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!verifyPasskey(body.passkey ?? "")) {
    return NextResponse.json({ error: "Invalid passkey" }, { status: 401 });
  }

  const token = await createOrbitSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ORBIT_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return res;
}