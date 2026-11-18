import { NextResponse } from "next/server";
import { finishPasswordLogin } from "@/lib/customer/complete-login";
import { loginWithEmail } from "@/lib/customer/user-store";

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
  if (result.error || !result.user) return NextResponse.json({ error: result.error || "Invalid email or password." }, { status: 401 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return finishPasswordLogin(result.user, body.remember !== false, ip);
}