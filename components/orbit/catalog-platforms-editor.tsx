"use client";

import type { OrbitSiteConfig } from "@/lib/orbit/types";
import { PRICING_PLATFORM_ORDER } from "@/data/service-pricing-types";

const SEED = PRICING_PLATFORM_ORDER.filter((id) => id !== "all");

type Props = {
  config: OrbitSiteConfig;
  setConfig: (next: OrbitSiteConfig) => void;
};

export function CatalogPlatformsEditor({ config, setConfig }: Props) {
  const order = config.pricing.platformOrder?.length ? config.pricing.platformOrder.filter((id) => id !== "all") : [...SEED];
  const labels = { ...(config.pricing.platformLabels ?? {}) };

  function patchOrder(next: string[]) {
    const cleaned = [...next.filter((id) => id !== "other"), ...(next.includes("other") ? ["other"] : [])];
    setConfig({
      ...config,
      pricing: { ...config.pricing, platformOrder: cleaned },
    });
  }

  function move(id: string, dir: -1 | 1) {
    if (id === "other") return;
    const list = [...order];
    const i = list.indexOf(id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    if (list[j] === "other") return;
    [list[i], list[j]] = [list[j], list[i]];
    const pinned = [...list.filter((row) => row !== "other"), ...(list.includes("other") ? ["other"] : [])];
    patchOrder(pinned);
  }

  function setLabel(id: string, label: string) {
    setConfig({
      ...config,
      pricing: {
        ...config.pricing,
        platformLabels: { ...labels, [id]: label },
      },
    });
  }

  return (
    <article className="ob-card ob-form">
      <h3>Catalog platforms &amp; labels</h3>
      <p className="ob-muted">
        Controls /dashboard, /services, and /pricing filter order. <strong>Other Services</strong> always stays last on the live site. Publish
        to apply.
      </p>
      <ul className="ob-platform-editor">
        {order.map((id) => (
          <li key={id}>
            <code>{id}</code>
            <label>
              Label
              <input value={labels[id] ?? defaultLabel(id)} onChange={(event) => setLabel(id, event.target.value)} />
            </label>
            {id === "other" ? (
              <span className="ob-muted">Pinned last</span>
            ) : (
              <span className="ob-toolbar">
                <button type="button" className="ob-btn ghost" onClick={() => move(id, -1)} aria-label="Move up">
                  ↑
                </button>
                <button type="button" className="ob-btn ghost" onClick={() => move(id, 1)} aria-label="Move down">
                  ↓
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="ob-btn ghost"
        onClick={() =>
          setConfig({
            ...config,
            pricing: { ...config.pricing, platformOrder: [...SEED], platformLabels: {} },
          })
        }
      >
        Reset to default order
      </button>
    </article>
  );
}

function defaultLabel(id: string) {
  const map: Record<string, string> = {
    other: "Other Services",
    x: "X (Twitter)",
  };
  return map[id] ?? id.charAt(0).toUpperCase() + id.slice(1);
}