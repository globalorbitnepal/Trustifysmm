import { constantTimeEquals } from "@/lib/banker/access";
import { isDenylistedKey } from "@/lib/smm-api/api-keys";

/**
 * API-key extraction for the public Banker reseller endpoints.
 * Accepts the `x-api-key` header or `Authorization: Bearer …`.
 *
 * Query-parameter keys are deliberately NOT accepted: a secret in a URL ends up in access
 * logs, proxy logs, Referer headers and browser history.
 */
export function bankerApiKeyFromRequest(request: Request): string {
  const header = request.headers.get("x-api-key")?.trim();
  if (header) return header;

  const auth = request.headers.get("authorization")?.trim() ?? "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return "";
}

/**
 * True when the presented reseller key belongs to the invoice. Constant-time.
 *
 * The denylist is checked on the *presented* key as well as the stored value, so a legacy
 * invoice whose `apiKey` field still holds a retired public default cannot be used to
 * authenticate — even if its foreign key was never migrated.
 */
export function resellerKeyMatchesInvoiceKey(presented: string, invoiceApiKey: string) {
  if (!presented || isDenylistedKey(presented)) return false;
  if (!invoiceApiKey || isDenylistedKey(invoiceApiKey)) return false;
  return constantTimeEquals(presented, invoiceApiKey);
}
