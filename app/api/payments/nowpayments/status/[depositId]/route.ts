import { NextResponse } from "next/server";
import { getBankerInvoiceStatus, syncNowPaymentsInvoice } from "@/lib/banker/handler";
import { ensureDepositReconciler } from "@/lib/nowpayments/reconciler";
import { requireCustomer } from "@/lib/customer/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ depositId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  ensureDepositReconciler();
  const { depositId } = await params;
  // Ownership is enforced inside by comparing the deposit's apiKey to this customer's key.
  const before = await getBankerInvoiceStatus(depositId, { apiKey: user.apiKey });
  if ("error" in before) {
    return NextResponse.json({ error: "Deposit not found." }, { status: 404 });
  }
  /*
   * Every poll verifies with the provider server-side, so a late or dropped webhook cannot
   * leave a finished payment uncredited. Only the verified finished status credits a wallet.
   */
  await syncNowPaymentsInvoice(depositId);
  const after = await getBankerInvoiceStatus(depositId, { apiKey: user.apiKey });
  return NextResponse.json("error" in after ? before : after);
}