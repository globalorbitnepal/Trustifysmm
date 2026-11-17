import { NextResponse } from "next/server";
import { loginWithEmail } from "@/lib/customer/user-store";
import { jsonWithSession } from "@/lib/customer/auth-response";

export async function POST(request: Request) {
  let body: { email?: string; password?: string; remember?: boolean };
  try {
    body = (await request.json()) as { email?: string; password?: string; remember?: boolean };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";
  if (!email.includes("@") || !password) {
    return NextResponse.json({ error: "Enter email and password." }, { status: 400 });
  }

  const result = await loginWithEmail(email, password);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 401 });
  return jsonWithSession(result.user!, body.remember !== false);
}