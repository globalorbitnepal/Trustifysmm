import { NextResponse } from "next/server";
import { ORBIT_COOKIE_NAME } from "@/lib/orbit/auth";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ORBIT_COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}