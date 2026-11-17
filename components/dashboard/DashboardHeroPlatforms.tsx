"use client";

import { useEffect, useRef, useState } from "react";
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
  const rail = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

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

  function syncArrows() {
    const el = rail.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < max - 4);
  }

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    syncArrows();
    const ro = new ResizeObserver(() => syncArrows());
    ro.observe(el);
    el.addEventListener("scroll", syncArrows, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", syncArrows);
    };
  }, [ids]);

  function scrollByStep(dir: -1 | 1) {
    const el = rail.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.65), behavior: "smooth" });
  }

  const platforms = [...ids, "other"];

  return (
    <div className="cp-hero-orbit-wrap">
      <button type="button" className="cp-orbit-nav cp-orbit-nav--prev" aria-label="Scroll platforms left" disabled={!canLeft} onClick={() => scrollByStep(-1)}>
        ‹
      </button>
      <button type="button" className="cp-orbit-nav cp-orbit-nav--next" aria-label="Scroll platforms right" disabled={!canRight} onClick={() => scrollByStep(1)}>
        ›
      </button>
      <span className="cp-orbit-fade cp-orbit-fade--left" aria-hidden />
      <span className="cp-orbit-fade cp-orbit-fade--right" aria-hidden />
      <div ref={rail} className="cp-hero-orbit-scroll" role="list" aria-label="Supported platforms">
        {platforms.map((id) => (
          <div key={id} className="cp-hero-orbit-item" role="listitem">
            <PlatformFilterIcon platform={id} variant="tile" className="cp-hero-orbit-icon" />
          </div>
        ))}
      </div>
    </div>
  );
}