import { clearSessionCookie } from "@/lib/customer/auth-response";

export async function POST() {
  return clearSessionCookie();
}