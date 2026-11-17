import { NextResponse } from "next/server";
import { registerWithEmail } from "@/lib/customer/user-store";
import { jsonWithSession } from "@/lib/customer/auth-response";

export async function POST(request: Request) {
  let body: { name?: string; email?: string; password?: string };
  try {
    body = (await request.json()) as { name?: string; email?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";

  if (name.length < 2) return NextResponse.json({ error: "Enter your full name." }, { status: 400 });
  if (!email.includes("@")) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Use at least 8 characters." }, { status: 400 });

  const result = await registerWithEmail({ name, email, password });
  if (result.error) return NextResponse.json({ error: result.error }, { status: 409 });
  return jsonWithSession(result.user!);
}