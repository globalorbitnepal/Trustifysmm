import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { ORBIT_COOKIE_NAME, orbitPasskey, verifyPasskey } from "@/lib/orbit/auth";

export const runtime = "nodejs";

function cookieClear(response: NextResponse) {
  response.cookies.set(ORBIT_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function POST(request: NextRequest) {
  let body: { current?: string; next?: string };
  try {
    body = (await request.json()) as { current?: string; next?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const current = body.current ?? "";
  const next = (body.next ?? "").trim();
  if (!verifyPasskey(current)) {
    return NextResponse.json({ error: "Current Orbit password is wrong." }, { status: 401 });
  }
  if (next.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  }
  if (next === orbitPasskey()) {
    return NextResponse.json({ error: "Choose a different password." }, { status: 400 });
  }

  const file = path.join(process.cwd(), ".env");
  let text = "";
  try {
    text = await readFile(file, "utf8");
  } catch {
    text = "";
  }
  const safe = /^[A-Za-z0-9!@#%^*+=._-]+$/.test(next) ? next : JSON.stringify(next);
  const line = `ORBIT_PASSKEY=${safe}`;
  text = /^ORBIT_PASSKEY=/m.test(text) ? text.replace(/^ORBIT_PASSKEY=.*$/m, line) : `${text.trimEnd()}\n${line}\n`;
  await writeFile(file, text.endsWith("\n") ? text : `${text}\n`, "utf8");
  process.env.ORBIT_PASSKEY = next;

  return cookieClear(NextResponse.json({ ok: true }));
}
