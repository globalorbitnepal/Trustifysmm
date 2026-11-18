import { cookies } from "next/headers";
import { CUSTOMER_COOKIE_NAME, parseCustomerSessionToken } from "@/lib/customer/session";
import type { CustomerUser } from "@/lib/customer/types";
import { getUserById } from "@/lib/customer/user-store";
import { ensureAccountForCustomer } from "@/lib/smm-api/demo-store";

export async function requireCustomer(): Promise<CustomerUser | null> {
  const token = (await cookies()).get(CUSTOMER_COOKIE_NAME)?.value;
  const parsed = parseCustomerSessionToken(token);
  if (!parsed) return null;
  const user = await getUserById(parsed.userId);
  if (!user || user.role !== "CUSTOMER") return null;
  if ((user.sessionVersion ?? 0) !== parsed.version) return null;
  if (user.suspended) return null;
  /*
   * The dashboard balance and the wallet must be the same money. If the wallet record is
   * missing, it is created here so every page shows one consistent figure.
   */
  const resolved = await ensureAccountForCustomer({ email: user.email, key: user.apiKey });
  user.balance = "account" in resolved && resolved.account ? resolved.account.balance : user.balance;
  return user;
}
