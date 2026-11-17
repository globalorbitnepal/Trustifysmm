"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function isInternalNav(href: string, origin: string) {
  try {
    const url = new URL(href, origin);
    return url.origin === origin && url.pathname !== window.location.pathname;
  } catch {
    return false;
  }
}

export function SiteNavProgress() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"idle" | "loading" | "done">("idle");
  const prevPath = useRef(pathname);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;
    setPhase("done");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setPhase("idle"), 320);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]");
      if (!anchor || anchor.getAttribute("target") === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (!isInternalNav(href, window.location.origin)) return;
      setPhase("loading");
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (phase === "idle") return null;

  return (
    <div
      className={`site-nav-progress${phase === "loading" ? " is-loading" : " is-done"}`}
      role="progressbar"
      aria-hidden={phase === "done"}
      aria-busy={phase === "loading"}
    />
  );
}