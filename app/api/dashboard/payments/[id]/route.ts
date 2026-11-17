import { NextResponse } from "next/server";
import { getBankerInvoiceStatus, submitInvoiceHash } from "@/lib/banker/handler";
import { requireCustomer } from "@/lib/customer/guard";
import { getInvoice } from "@/lib/smm-api/demo-store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = (await ctx.params).id;
  const invoice = await getInvoice(id);
  if (!invoice || invoice.apiKey !== user.apiKey) return NextResponse.json({ error: "Deposit not found." }, { status: 404 });
  return NextResponse.json(await getBankerInvoiceStatus(id));
}

export async function POST(request: Request, ctx: Ctx) {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = (await ctx.params).id;
  let body: { txHash?: string };
  try {
    body = (await request.json()) as { txHash?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const result = await submitInvoiceHash(id, user.apiKey, (body.txHash || "").trim());
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
