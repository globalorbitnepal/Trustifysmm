import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CUSTOMER_COOKIE_NAME, verifyCustomerSessionToken } from "@/lib/customer/session";
import { getUserById, toPublicUser } from "@/lib/customer/user-store";
import { getAccountByKey } from "@/lib/smm-api/demo-store";

export async function GET() {
  const token = (await cookies()).get(CUSTOMER_COOKIE_NAME)?.value;
  const userId = verifyCustomerSessionToken(token);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await getUserById(userId);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const wallet = await getAccountByKey(user.apiKey);
  if (wallet) user.balance = wallet.balance;
  return NextResponse.json({ user: toPublicUser(user) });
}