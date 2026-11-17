"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function TrafficBeacon() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || pathname.startsWith("/orbit") || pathname.startsWith("/api")) return;
    const utm = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("utm_source") || "" : "";
    const payload = JSON.stringify({
      path: pathname,
      referrer: document.referrer || "",
      utm,
    });
    fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);
  return null;
}
