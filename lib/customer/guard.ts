import { cookies } from "next/headers";
import { CUSTOMER_COOKIE_NAME, parseCustomerSessionToken } from "@/lib/customer/session";
import type { CustomerUser } from "@/lib/customer/types";
import { getUserById } from "@/lib/customer/user-store";
import { getAccountByKey } from "@/lib/smm-api/demo-store";

export async function requireCustomer(): Promise<CustomerUser | null> {
  const token = (await cookies()).get(CUSTOMER_COOKIE_NAME)?.value;
  const parsed = parseCustomerSessionToken(token);
  if (!parsed) return null;
  const user = await getUserById(parsed.userId);
  if (!user || user.role !== "CUSTOMER") return null;
  if ((user.sessionVersion ?? 0) !== parsed.version) return null;
  const wallet = await getAccountByKey(user.apiKey);
  if (wallet) user.balance = wallet.balance;
  return user;
}
