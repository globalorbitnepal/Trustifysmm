import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer/guard";
import { listFavorites, toggleFavorite } from "@/lib/customer/panel-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ ids: await listFavorites(user.id) });
}

export async function POST(request: Request) {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { serviceId?: number };
  try {
    body = (await request.json()) as { serviceId?: number };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const serviceId = Number(body.serviceId);
  if (!Number.isInteger(serviceId)) return NextResponse.json({ error: "Service id is required." }, { status: 400 });
  const ids = await toggleFavorite(user.id, serviceId);
  return NextResponse.json({ ids });
}
