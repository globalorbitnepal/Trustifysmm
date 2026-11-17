import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer/guard";
import { listGroups, listPlatforms, searchServices, servicesByIds } from "@/lib/dashboard/catalog";
import { listFavorites } from "@/lib/customer/panel-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const platform = url.searchParams.get("platform") || undefined;
  const group = url.searchParams.get("group") || undefined;
  const q = url.searchParams.get("q") || undefined;
  const favoritesOnly = url.searchParams.get("favorites") === "1";
  const favoriteIds = await listFavorites(user.id);
  const services = favoritesOnly
    ? servicesByIds(favoriteIds).slice(0, 60)
    : searchServices({ platform, group, q, limit: Number(url.searchParams.get("limit") || 30) });
  return NextResponse.json({
    platforms: listPlatforms(),
    groups: listGroups(platform),
    services,
    favoriteIds,
  });
}
