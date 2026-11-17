"use client";

import { useEffect, useState } from "react";
import { PlatformFilterIcon } from "@/components/PlatformFilterIcon";

const FALLBACK = [
  "instagram",
  "facebook",
  "youtube",
  "tiktok",
  "telegram",
  "x",
  "threads",
  "whatsapp",
  "snapchat",
  "linkedin",
  "spotify",
  "pinterest",
] as const;

export function DashboardHeroPlatforms() {
  const [ids, setIds] = useState<string[]>([...FALLBACK]);

  useEffect(() => {
    void fetch("/api/dashboard/catalog")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { platforms?: { id: string }[] } | null) => {
        if (!data?.platforms?.length) return;
        const next = data.platforms.map((p) => p.id).filter((id) => id !== "other");
        if (next.length) setIds(next);
      })
      .catch(() => undefined);
  }, []);

  const platforms = [...ids, "other"];

  return (
    <div className="cp-hero-orbit-wrap">
      <p className="cp-hero-orbit-label">Top platforms</p>
      <div className="cp-hero-orbit-grid" role="list" aria-label="Supported platforms">
        {platforms.map((id) => (
          <div key={id} className="cp-hero-orbit-item" role="listitem">
            <PlatformFilterIcon platform={id} variant="tile" className="cp-hero-orbit-icon" />
          </div>
        ))}
      </div>
    </div>
  );
}