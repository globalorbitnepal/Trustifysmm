"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { OrbitSiteConfig } from "@/lib/orbit/types";

type OrbitSection =
  | "overview"
  | "homepage"
  | "sections"
  | "pages"
  | "pricing"
  | "banker";

const NAV: { id: OrbitSection; label: string; hint: string }[] = [
  { id: "overview", label: "Overview", hint: "Status & quick links" },
  { id: "homepage", label: "Homepage", hint: "Hero & CTAs" },
  { id: "sections", label: "Sections", hint: "Why choose + footer stats" },
  { id: "pages", label: "All pages", hint: "SEO meta every route" },
  { id: "pricing", label: "Pricing", hint: "All services & markup" },
  { id: "banker", label: "Banker", hint: "Crypto & API upstream" },
];

type PricingRow = {
  id: number;
  name: string;
  platform: string;
  group: string;
  baseRate: number;
  rate: number;
  overridden: boolean;
};

export function OrbitDashboard() {
  const router = useRouter();
  const [section, setSection] = useState<OrbitSection>("overview");
  const [config, setConfig] = useState<OrbitSiteConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const [priceQuery, setPriceQuery] = useState("");
  const [pricePage, setPricePage] = useState(1);
  const [priceRows, setPriceRows] = useState<PricingRow[]>([]);
  const [priceTotal, setPriceTotal] = useState(0);
  const [overrideCount, setOverrideCount] = useState(0);

  const loadConfig = useCallback(async () => {
    const res = await fetch("/api/orbit/config");
    if (!res.ok) return;
    setConfig((await res.json()) as OrbitSiteConfig);
  }, []);

  const loadPricing = useCallback(async () => {
    const params = new URLSearchParams({
      q: priceQuery,
      page: String(pricePage),
      pageSize: "50",
    });
    const res = await fetch(`/api/orbit/pricing?${params}`);
    if (!res.ok) return;
    const data = (await res.json()) as {
      items: PricingRow[];
      total: number;
      overrideCount: number;
      globalMarkupPercent: number;
    };
    setPriceRows(data.items);
    setPriceTotal(data.total);
    setOverrideCount(data.overrideCount);
    setConfig((prev) =>
      prev ? { ...prev, pricing: { ...prev.pricing, globalMarkupPercent: data.globalMarkupPercent } } : prev,
    );
  }, [priceQuery, pricePage]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (section === "pricing" || section === "overview") void loadPricing();
  }, [section, loadPricing]);

  async function saveConfig(next: OrbitSiteConfig) {
    setSaving(true);
    setToast("");
    try {
      const res = await fetch("/api/orbit/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error("Save failed");
      const saved = (await res.json()) as OrbitSiteConfig;
      setConfig(saved);
      setToast("Saved — public site revalidated.");
      router.refresh();
    } catch {
      setToast("Error saving config.");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/orbit/auth/logout", { method: "POST" });
    router.replace("/orbit/login");
  }

  async function patchPricing(body: Record<string, unknown>) {
    await fetch("/api/orbit/pricing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    void loadPricing();
    setToast("Pricing updated.");
    router.refresh();
  }

  if (!config) {
    return (
      <div className="orbit-shell orbit-shell--loading">
        <p>Loading Orbit…</p>
      </div>
    );
  }

  return (
    <div className="orbit-shell">
      <aside className="orbit-sidebar">
        <div className="orbit-brand">
          <span className="orbit-brand-mark" />
          <div>
            <strong>Orbit</strong>
            <span>Site command</span>
          </div>
        </div>
        <nav className="orbit-nav">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={section === item.id ? "is-active" : undefined}
              onClick={() => setSection(item.id)}
            >
              <span>{item.label}</span>
              <small>{item.hint}</small>
            </button>
          ))}
        </nav>
        <div className="orbit-sidebar-foot">
          <Link href="/" target="_blank" className="btn btn-ghost btn-sm">
            View site
          </Link>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void logout()}>
            Log out
          </button>
        </div>
      </aside>

      <div className="orbit-main">
        <header className="orbit-topbar">
          <h1>{NAV.find((n) => n.id === section)?.label}</h1>
          <p>Last save: {new Date(config.updatedAt).toLocaleString()}</p>
          {toast ? <p className="orbit-toast">{toast}</p> : null}
        </header>

        {section === "overview" && (
          <div className="orbit-panel">
            <p className="orbit-panel-lede">
              Edit homepage, section copy, every page meta title, all service prices (per ID or global markup), and
              Banker settings. Changes write to <code>data/orbit/</code> and apply across /services, /pricing and API
              rate lists.
            </p>
            <div className="orbit-stat-grid">
              <div className="orbit-stat-card">
                <strong>{Object.keys(config.pages).length}</strong>
                <span>Pages with SEO fields</span>
              </div>
              <div className="orbit-stat-card">
                <strong>{config.pricing.globalMarkupPercent}%</strong>
                <span>Global price markup</span>
              </div>
              <div className="orbit-stat-card">
                <strong>{overrideCount || "—"}</strong>
                <span>Price overrides</span>
              </div>
              <div className="orbit-stat-card">
                <strong>{config.banker.demoAutoPay ? "On" : "Off"}</strong>
                <span>Demo Banker auto-pay</span>
              </div>
            </div>
          </div>
        )}

        {section === "homepage" && (
          <div className="orbit-panel">
            <Field label="Badge" value={config.home.badge} onChange={(v) => setConfig({ ...config, home: { ...config.home, badge: v } })} />
            <Field label="Headline line 1" value={config.home.headlineLine1} onChange={(v) => setConfig({ ...config, home: { ...config.home, headlineLine1: v } })} />
            <Field label="Headline line 2" value={config.home.headlineLine2} onChange={(v) => setConfig({ ...config, home: { ...config.home, headlineLine2: v } })} />
            <Field label="Headline line 3" value={config.home.headlineLine3} onChange={(v) => setConfig({ ...config, home: { ...config.home, headlineLine3: v } })} />
            <Field label="Brand gradient word" value={config.home.headlineBrand} onChange={(v) => setConfig({ ...config, home: { ...config.home, headlineBrand: v } })} />
            <Field label="Lede" value={config.home.lede} multiline onChange={(v) => setConfig({ ...config, home: { ...config.home, lede: v } })} />
            <Field label="Primary CTA" value={config.home.primaryCta} onChange={(v) => setConfig({ ...config, home: { ...config.home, primaryCta: v } })} />
            <Field label="Secondary CTA" value={config.home.secondaryCta} onChange={(v) => setConfig({ ...config, home: { ...config.home, secondaryCta: v } })} />
            <SaveBar saving={saving} onSave={() => void saveConfig(config)} />
          </div>
        )}

        {section === "sections" && (
          <div className="orbit-panel">
            <h2>Why choose features</h2>
            {config.whyFeatures.map((f, i) => (
              <div key={i} className="orbit-block">
                <Field label="Title" value={f.title} onChange={(v) => {
                  const whyFeatures = [...config.whyFeatures];
                  whyFeatures[i] = { ...f, title: v };
                  setConfig({ ...config, whyFeatures });
                }} />
                <Field label="Text" value={f.text} multiline onChange={(v) => {
                  const whyFeatures = [...config.whyFeatures];
                  whyFeatures[i] = { ...f, text: v };
                  setConfig({ ...config, whyFeatures });
                }} />
              </div>
            ))}
            <h2>Footer stats</h2>
            {config.footerStats.map((s, i) => (
              <div key={i} className="orbit-row-2">
                <Field label="Value" value={s.value} onChange={(v) => {
                  const footerStats = [...config.footerStats];
                  footerStats[i] = { ...s, value: v };
                  setConfig({ ...config, footerStats });
                }} />
                <Field label="Label" value={s.label} onChange={(v) => {
                  const footerStats = [...config.footerStats];
                  footerStats[i] = { ...s, label: v };
                  setConfig({ ...config, footerStats });
                }} />
              </div>
            ))}
            <SaveBar saving={saving} onSave={() => void saveConfig(config)} />
          </div>
        )}

        {section === "pages" && (
          <div className="orbit-panel orbit-panel--wide">
            {Object.entries(config.pages).map(([path, meta]) => (
              <div key={path} className="orbit-page-block">
                <h3>{path}</h3>
                <Field label="Meta title" value={meta.title} onChange={(v) => setConfig({
                  ...config,
                  pages: { ...config.pages, [path]: { ...meta, title: v } },
                })} />
                <Field label="Meta description" value={meta.description} multiline onChange={(v) => setConfig({
                  ...config,
                  pages: { ...config.pages, [path]: { ...meta, description: v } },
                })} />
                <Field label="Keywords" value={meta.keywords} onChange={(v) => setConfig({
                  ...config,
                  pages: { ...config.pages, [path]: { ...meta, keywords: v } },
                })} />
              </div>
            ))}
            <SaveBar saving={saving} onSave={() => void saveConfig(config)} />
          </div>
        )}

        {section === "pricing" && (
          <div className="orbit-panel orbit-panel--wide">
            <div className="orbit-row-2">
              <Field
                label="Global markup % (all services)"
                value={String(config.pricing.globalMarkupPercent)}
                onChange={(v) => setConfig({
                  ...config,
                  pricing: { ...config.pricing, globalMarkupPercent: Number(v) || 0 },
                })}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void patchPricing({ globalMarkupPercent: config.pricing.globalMarkupPercent })}
              >
                Apply markup
              </button>
            </div>
            <Field
              label="Pricing banner note (optional)"
              value={config.pricing.bannerNote}
              multiline
              onChange={(v) => setConfig({ ...config, pricing: { ...config.pricing, bannerNote: v } })}
            />
            <SaveBar saving={saving} onSave={() => void saveConfig(config)} />
            <div className="orbit-price-toolbar">
              <input
                type="search"
                placeholder="Search ID, name, platform…"
                value={priceQuery}
                onChange={(e) => {
                  setPriceQuery(e.target.value);
                  setPricePage(1);
                }}
              />
              <span>
                {priceTotal.toLocaleString()} services · {overrideCount} overrides
              </span>
            </div>
            <div className="orbit-table-wrap">
              <table className="orbit-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Service</th>
                    <th>Base $/1K</th>
                    <th>Live $/1K</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {priceRows.map((row) => (
                    <PriceRowEditor key={row.id} row={row} onSave={(rate) => void patchPricing({ serviceId: row.id, rate })} onReset={() => void patchPricing({ resetId: row.id })} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="orbit-pagination">
              <button type="button" disabled={pricePage <= 1} onClick={() => setPricePage((p) => p - 1)}>
                Prev
              </button>
              <span>
                Page {pricePage} / {Math.max(1, Math.ceil(priceTotal / 50))}
              </span>
              <button
                type="button"
                disabled={pricePage >= Math.ceil(priceTotal / 50)}
                onClick={() => setPricePage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {section === "banker" && (
          <div className="orbit-panel">
            <Field label="Pay currency (e.g. usdttrc20)" value={config.banker.payCurrency} onChange={(v) => setConfig({ ...config, banker: { ...config.banker, payCurrency: v } })} />
            <label className="orbit-check">
              <input
                type="checkbox"
                checked={config.banker.demoAutoPay}
                onChange={(e) => setConfig({ ...config, banker: { ...config.banker, demoAutoPay: e.target.checked } })}
              />
              Demo Banker auto-pay (orbit + /api/banker/pay?confirm=1)
            </label>
            <Field label="Upstream API URL (reference)" value={config.banker.upstreamApiUrl} onChange={(v) => setConfig({ ...config, banker: { ...config.banker, upstreamApiUrl: v } })} />
            <Field label="Admin notes" value={config.banker.notes} multiline onChange={(v) => setConfig({ ...config, banker: { ...config.banker, notes: v } })} />
            <p className="orbit-hint">
              Secrets (NOWPAYMENTS_API_KEY, SMM_UPSTREAM_API_URL) still live in server <code>.env</code>. Orbit stores
              display preferences and demo flags.
            </p>
            <div className="orbit-banker-links">
              <Link href="/api" target="_blank" className="btn btn-ghost">
                API docs
              </Link>
              <a href="/api/banker/invoice" target="_blank" rel="noreferrer" className="btn btn-ghost">
                Banker invoice endpoint
              </a>
            </div>
            <SaveBar saving={saving} onSave={() => void saveConfig(config)} />
          </div>
        )}
      </div>
    </div>
  );
}

function PriceRowEditor({
  row,
  onSave,
  onReset,
}: {
  row: PricingRow;
  onSave: (rate: number) => void;
  onReset: () => void;
}) {
  const [edit, setEdit] = useState(String(row.rate));
  return (
    <tr className={row.overridden ? "is-override" : undefined}>
      <td>{row.id}</td>
      <td>
        <span className="orbit-cell-name">{row.name}</span>
        <small>{row.platform} · {row.group}</small>
      </td>
      <td>${row.baseRate.toFixed(4)}</td>
      <td>${row.rate.toFixed(4)}</td>
      <td>
        <input className="orbit-rate-input" value={edit} onChange={(e) => setEdit(e.target.value)} />
        <button type="button" className="orbit-mini-btn" onClick={() => onSave(Number(edit))}>
          Save
        </button>
        {row.overridden ? (
          <button type="button" className="orbit-mini-btn" onClick={onReset}>
            Reset
          </button>
        ) : null}
      </td>
    </tr>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="orbit-field">
      <span>{label}</span>
      {multiline ? (
        <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

function SaveBar({ saving, onSave }: { saving: boolean; onSave: () => void }) {
  return (
    <div className="orbit-savebar">
      <button type="button" className="btn btn-primary" disabled={saving} onClick={onSave}>
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}
