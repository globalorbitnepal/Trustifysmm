"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import type { ServicePricingData } from "@/data/service-pricing-types";
import { filterPricingServices, formatRatePer1000, groupPricingServices, groupsForPlatform } from "@/data/pricing-utils";
import pricingData from "@/data/service-pricing.json";
import { applyOrbitPricing } from "@/lib/orbit/pricing-display";
import { PlatformFilterIcon } from "@/components/PlatformFilterIcon";

export function ServicesPricingCatalog({ data: initial }: { data?: ServicePricingData }) {
  const data = useMemo(
    () => initial ?? applyOrbitPricing(pricingData as ServicePricingData),
    [initial],
  );
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<string>("all");
  const [group, setGroup] = useState("all");
  const deferredQuery = useDeferredValue(query);

  const platformGroups = useMemo(() => groupsForPlatform(data, platform), [platform]);

  const filtered = useMemo(
    () => filterPricingServices(data, { query: deferredQuery, platform, group }),
    [deferredQuery, platform, group],
  );

  const sections = useMemo(() => groupPricingServices(filtered), [filtered]);

  const platformTabs = useMemo(
    () => ["all", ...data.platforms].map((id) => ({ id, label: id === "all" ? "All" : (data.platformLabel[id] ?? id) })),
    [data],
  );

  return (
    <div className="services-pricing">
      <div className="services-pricing-toolbar">
        <label className="services-pricing-search">
          <SearchIcon />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by service name, ID or category…"
            autoComplete="off"
          />
        </label>

        <div className="services-pricing-filters">
          <select
            className="services-pricing-select"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            aria-label="Filter by category"
          >
            {platformGroups.map((g) => (
              <option key={g} value={g}>
                {g === "all" ? "All categories" : g}
              </option>
            ))}
          </select>
          <p className="services-pricing-count">
            Showing <strong>{filtered.length}</strong> of {data.serviceCount} services
          </p>
        </div>

        <div className="services-pricing-platforms" role="tablist" aria-label="Platforms">
          {platformTabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={platform === id}
              className={`services-pricing-platform${platform === id ? " is-active" : ""}`}
              onClick={() => {
                setPlatform(id);
                setGroup("all");
              }}
            >
              <PlatformFilterIcon platform={id} variant="tile" />
              <span className="services-pricing-platform-label">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="services-pricing-sections">
        {sections.length === 0 ? (
          <p className="services-pricing-empty">No services match your search. Try another keyword or platform.</p>
        ) : (
          sections.map(([title, rows]) => (
            <section key={title} className="services-pricing-group" id={slug(title)}>
              <h2 className="services-pricing-group-title">{title}</h2>
              <div className="services-pricing-table-wrap">
                <table className="services-pricing-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Service</th>
                      <th>Rate / 1K</th>
                      <th>Min</th>
                      <th>Max</th>
                      <th>Avg time</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td data-label="ID">{row.id}</td>
                        <td data-label="Service">
                          <span className="services-pricing-name">{row.name}</span>
                          {row.description ? (
                            <span className="services-pricing-desc">{row.description}</span>
                          ) : null}
                        </td>
                        <td data-label="Rate / 1K">
                          <span className="services-pricing-rate">{formatRatePer1000(row.ratePer1000)}</span>
                        </td>
                        <td data-label="Min">{row.minOrder || "—"}</td>
                        <td data-label="Max">{row.maxOrder || "—"}</td>
                        <td data-label="Avg time">{row.avgTime || "—"}</td>
                        <td data-label="Order">
                          <Link className="services-pricing-order" href="/signup">
                            Order
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function slug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13.5 13.5 17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}