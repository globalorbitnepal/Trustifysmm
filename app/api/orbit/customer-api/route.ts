import { NextResponse } from "next/server";
import { listCustomers } from "@/lib/customer/user-store";
import { listApiActivity } from "@/lib/smm-api/activity";

export const dynamic = "force-dynamic";

export async function GET() {
  const [events, customers] = await Promise.all([listApiActivity(300), listCustomers()]);
  const byId = new Map(customers.map((user) => [user.id, user.email]));
  return NextResponse.json({
    events: events.map((event) => ({
      ...event,
      email: event.email || (event.userId ? byId.get(event.userId) || null : null),
    })),
  });
}
