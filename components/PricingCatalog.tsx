"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { PlatformFilterIcon } from "@/components/PlatformFilterIcon";
import type { PricingService, ServicePricingData } from "@/data/service-pricing-types";
import { PRICING_PLATFORM_ORDER } from "@/data/service-pricing-types";
import {
  filterPricingServices,
  formatRatePer1000,
  minRate,
  organizePlatformChapters,
} from "@/data/pricing-utils";
import pricingData from "@/data/service-pricing.json";
import { applyOrbitPricing } from "@/lib/orbit/pricing-display";

export function PricingCatalog({ data: initial }: { data?: ServicePricingData }) {
  const data = useMemo(
    () => initial ?? applyOrbitPricing(pricingData as ServicePricingData),
    [initial],
  );
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("all");
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(
    () => filterPricingServices(data, { query: deferredQuery, platform, group: "all" }),
    [deferredQuery, platform],
  );

  const chapters = useMemo(
    () => organizePlatformChapters(filtered, data.platformLabel, platform),
    [filtered, platform],
  );

  return (
    <div className="price-deck">
      <aside className="price-deck-rail" aria-label="Platforms">
        <p className="price-deck-rail-label">Platforms</p>
        <button
          type="button"
          className={`price-deck-rail-btn${platform === "all" ? " is-active" : ""}`}
          onClick={() => setPlatform("all")}
        >
          <PlatformFilterIcon platform="all" className="price-deck-rail-icon" />
          All rates
        </button>
        {PRICING_PLATFORM_ORDER.filter((id) => id !== "all").map((id) => (
          <button
            key={id}
            type="button"
            className={`price-deck-rail-btn${platform === id ? " is-active" : ""}`}
            onClick={() => setPlatform(id)}
          >
            <PlatformFilterIcon platform={id} className="price-deck-rail-icon" />
            {data.platformLabel[id] ?? id}
          </button>
        ))}
      </aside>

      <div className="price-deck-main">
        <div className="price-deck-search-wrap">
          <label className="price-deck-search">
            <SearchIcon />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ID or keyword…"
              autoComplete="off"
            />
          </label>
          <p className="price-deck-stat">
            <strong>{filtered.length}</strong> live rates · sorted by category
          </p>
        </div>

        {chapters.length === 0 ? (
          <p className="price-deck-empty">No rates match your search. Try another keyword or platform.</p>
        ) : (
          chapters.map((chapter) => (
            <section key={chapter.platform} className="price-deck-chapter" id={`price-${chapter.platform}`}>
              <header className="price-deck-chapter-head">
                <div className="price-deck-chapter-visual">
                  <PlatformFilterIcon platform={chapter.platform} className="price-deck-chapter-icon" />
                </div>
                <div className="price-deck-chapter-copy">
                  <h2>{chapter.label}</h2>
                  <p>
                    From <strong>{formatRatePer1000(chapter.from)}</strong> per 1,000 · {chapter.count}{" "}
                    services
                  </p>
                </div>
              </header>

              {chapter.groups.map(([title, rows]) => (
                <details key={title} className="price-deck-panel" open={rows.length <= 8}>
                  <summary className="price-deck-panel-summary">
                    <span className="price-deck-panel-title">{title}</span>
                    <span className="price-deck-panel-from">from {formatRatePer1000(minRate(rows))}</span>
                    <span className="price-deck-panel-count">{rows.length}</span>
                  </summary>
                  <div className="price-deck-strip-list">
                    {rows.map((row) => (
                      <PriceStrip key={row.id} row={row} />
                    ))}
                  </div>
                </details>
              ))}
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function PriceStrip({ row }: { row: PricingService }) {
  return (
    <article className="price-deck-strip">
      <div className="price-deck-strip-rate" aria-label="Rate per 1000">
        <span>{formatRatePer1000(row.ratePer1000)}</span>
        <small>per 1K</small>
      </div>

      <div className="price-deck-strip-body">
        <div className="price-deck-strip-meta-top">
          <span className="price-deck-strip-id">ID {row.id}</span>
          {row.avgTime ? <span className="price-deck-strip-time">{row.avgTime}</span> : null}
        </div>
        <h3 className="price-deck-strip-name">{row.name}</h3>
        {row.description ? <p className="price-deck-strip-desc">{row.description}</p> : null}
        <p className="price-deck-strip-limits">
          Min <strong>{row.minOrder || "—"}</strong>
          <span aria-hidden> · </span>
          Max <strong>{row.maxOrder || "—"}</strong>
        </p>
      </div>

      <Link className="price-deck-strip-cta" href="/signup">
        Order
        <Arrow />
      </Link>
    </article>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13.5 13.5 17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}