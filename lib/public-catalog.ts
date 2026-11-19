"use client";

import { useEffect, useState } from "react";
import type { ServicePricingData } from "@/data/service-pricing-types";

export function usePublicCatalog(initial?: ServicePricingData | null) {
  const [data, setData] = useState<ServicePricingData | null>(initial ?? null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) return;
    let live = true;
    fetch("/api/public/catalog")
      .then((res) => {
        if (!res.ok) throw new Error("catalog");
        return res.json() as Promise<ServicePricingData>;
      })
      .then((next) => {
        if (live) setData(next);
      })
      .catch(() => {
        if (live) setError("The catalog could not be loaded. Refresh and try again.");
      });
    return () => {
      live = false;
    };
  }, [initial]);

  return { data, error };
}
