"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { PlatformFilterIcon } from "@/components/PlatformFilterIcon";
import { Empty, Skeleton } from "@/components/dashboard/OverviewView";

export type CatalogService = {
  id: number;
  name: string;
  platform: string;
  platformLabel: string;
  group: string;
  description: string;
  ratePer1000: number;
  min: number;
  max: number;
  avgTime: string;
  status: string;
};

export type CatalogPayload = {
  platforms: { id: string; label: string }[];
  groups: string[];
  services: CatalogService[];
  favoriteIds: number[];
};

type Props = {
  catalog: CatalogPayload | null;
  platform: string;
  group: string;
  query: string;
  onPlatform: (id: string) => void;
  onGroup: (id: string) => void;
  onQuery: (q: string) => void;
  favoritesOnly?: boolean;
  onFavorite?: (serviceId: number) => void;
  showPlatforms?: boolean;
};

export function ServiceCatalogUI({
  catalog,
  platform,
  group,
  query,
  onPlatform,
  onGroup,
  onQuery,
  favoritesOnly = false,
  onFavorite,
  showPlatforms = true,
}: Props) {
  const [draft, setDraft] = useState(query);
  const deferred = useDeferredValue(query);

  const filtered = useMemo(() => {
    if (!catalog) return [];
    const q = deferred.trim().toLowerCase();
    return catalog.services.filter((service) => {
      if (group && service.group !== group) return false;
      if (!q) return true;
      return `${service.id} ${service.name} ${service.group} ${service.platformLabel}`.toLowerCase().includes(q);
    });
  }, [catalog, deferred, group]);

  if (!catalog) return <Skeleton />;

  return (
    <div className="cp-catalog">
      {!favoritesOnly && showPlatforms ? (
        <>
          <div className="cp-plat-rail" role="tablist" aria-label="Filter by platform">
            <button type="button" className={`cp-plat-tile ${platform === "" ? "is-on" : ""}`} onClick={() => onPlatform("")}>
              <PlatformFilterIcon platform="all" className="cp-plat-icon" />
              <span>All</span>
            </button>
            {catalog.platforms.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`cp-plat-tile ${platform === item.id ? "is-on" : ""}`}
                onClick={() => onPlatform(item.id)}
              >
                <PlatformFilterIcon platform={item.id} className="cp-plat-icon" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          <div className="cp-catalog-toolbar">
            <label className="cp-search-bar">
              <SearchIcon />
              <input
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  onQuery(event.target.value);
                }}
                placeholder="Search by name, category, or service ID…"
                autoComplete="off"
              />
              {draft ? (
                <button type="button" className="cp-search-clear" aria-label="Clear search" onClick={() => { setDraft(""); onQuery(""); }}>
                  ×
                </button>
              ) : null}
            </label>
            <label className="cp-filter-select">
              <span className="cp-sr-only">Category</span>
              <select value={group} onChange={(event) => onGroup(event.target.value)} aria-label="Category">
                <option value="">All categories</option>
                {catalog.groups.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="cp-catalog-count">
            Showing <strong>{filtered.length}</strong> of {catalog.services.length} services
            {platform ? ` · ${catalog.platforms.find((p) => p.id === platform)?.label ?? platform}` : ""}
          </p>
        </>
      ) : favoritesOnly ? (
        <div className="cp-catalog-toolbar cp-catalog-toolbar--solo">
          <label className="cp-search-bar">
            <SearchIcon />
            <input
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                onQuery(event.target.value);
              }}
              placeholder="Search favorites…"
              autoComplete="off"
            />
            {draft ? (
              <button type="button" className="cp-search-clear" aria-label="Clear search" onClick={() => { setDraft(""); onQuery(""); }}>
                ×
              </button>
            ) : null}
          </label>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <Empty
          title={favoritesOnly ? "No favorites" : "No services match"}
          copy={favoritesOnly ? "Save services from the catalog with the star button." : "Try another platform, category, or search term."}
          href="/dashboard/services"
          cta="Browse services"
        />
      ) : (
        <div className="cp-service-grid">
          {filtered.map((service) => (
            <article key={service.id} className="cp-service-card">
              <div className="cp-service-card-mark">
                <PlatformFilterIcon platform={service.platform} className="cp-plat-icon cp-plat-icon--card" />
              </div>
              <div className="cp-service-card-body">
                <h3>{service.name}</h3>
                <p className="cp-meta">
                  #{service.id} · {service.group} · {service.min.toLocaleString()}–{service.max.toLocaleString()}
                </p>
                {service.description ? <p className="cp-service-desc">{service.description}</p> : null}
                <div className="cp-service-card-foot">
                  <span className="cp-price-pill">${service.ratePer1000} / 1k</span>
                  <span className="cp-status-pill">{service.status}</span>
                </div>
              </div>
              <div className="cp-service-card-actions">
                <Link className="cp-btn cp-btn-sm" href={`/dashboard/new-order?service=${service.id}`}>
                  Order
                </Link>
                {onFavorite ? (
                  <button
                    type="button"
                    className={`cp-fav-btn${catalog.favoriteIds.includes(service.id) ? " is-on" : ""}`}
                    aria-label={catalog.favoriteIds.includes(service.id) ? "Remove favorite" : "Add favorite"}
                    onClick={() => onFavorite(service.id)}
                  >
                    <StarIcon filled={catalog.favoriteIds.includes(service.id)} />
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} aria-hidden>
      <path
        d="m12 4.2 1.8 4.2 4.5.4-3.4 2.9 1 4.3L12 13.8l-4 2.2 1-4.3-3.4-2.9 4.5-.4L12 4.2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}