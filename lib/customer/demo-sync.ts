import { ensureDemoAccount as syncAccount } from "@/lib/smm-api/demo-store";

/** Keep JSON demo API wallet in sync with panel customer apiKey (preserves balance if exists). */
export async function ensureDemoAccount(email: string, apiKey: string, balance: number) {
  await syncAccount({ email, key: apiKey, balance });
}