import { NextResponse } from "next/server";
import { getBankerInvoiceStatus } from "@/lib/banker/handler";
import { requireCustomer } from "@/lib/customer/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ depositId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { depositId } = await params;
  // Ownership is enforced inside by comparing the deposit's apiKey to this customer's key.
  const status = await getBankerInvoiceStatus(depositId, { apiKey: user.apiKey });
  if ("error" in status) {
    return NextResponse.json({ error: "Deposit not found." }, { status: 404 });
  }
  return NextResponse.json(status);
}