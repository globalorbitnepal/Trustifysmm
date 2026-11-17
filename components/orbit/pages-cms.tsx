"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { OrbitSiteConfig, PageHeroContent, SitePageMeta } from "@/lib/orbit/types";
import { ORBIT_PAGES, pageBySlug } from "@/lib/orbit/page-registry";
import { useOrbit } from "@/components/orbit/use-orbit";

const sectionIds = ["hero", "why", "platforms", "how", "services", "payments", "reviews"] as const;
const sectionKeys = ["why", "platforms", "how", "services", "payments", "reviews"] as const;

function emptyMeta(): SitePageMeta {
  return { title: "", description: "", keywords: "", focusKeywords: "", tags: "", slug: "", ogTitle: "", ogDescription: "", ogImage: "", canonical: "", noindex: false };
}

export function PagesHubScreen() {
  const { data } = useOrbit<OrbitSiteConfig>("/api/orbit/config");
  return (
    <>
      <article className="ob-page-intro">
        <div>
          <p className="ob-crumb" style={{ marginBottom: 8 }}>
            <span>CMS</span>
            <span className="ob-crumb-sep">/</span>
            <span>Publish</span>
          </p>
          <h2>Section-by-section website editor</h2>
          <p>Match the live site: hero, copy, images, CTAs, and SEO per page. Use Media library URLs, then Publish now on each editor.</p>
        </div>
        <aside className="ob-page-intro-side" aria-label="Publish status">
          <span>Live sync</span>
          <strong>Instant publish</strong>
          <span>Last save {data?.updatedAt ? new Date(data.updatedAt).toLocaleString() : "—"}</span>
        </aside>
      </article>
      <div className="ob-table-wrap ob-card" style={{ padding: 0 }}>
        <table className="ob-table">
          <thead>
            <tr>
              <th>Page</th>
              <th>URL</th>
              <th>Meta title</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ORBIT_PAGES.map((page) => (
              <tr key={page.path}>
                <td><strong>{page.label}</strong><div className="ob-muted">{page.group}</div></td>
                <td><code className="ob-url">{page.path}</code></td>
                <td>{data?.pages?.[page.path]?.title || "—"}</td>
                <td>
                  <div className="ob-toolbar">
                    <Link className="ob-btn primary" href={`/orbit/pages/${page.slug}`}>Full edit</Link>
                    <a className="ob-btn ghost" href={page.path} target="_blank" rel="noreferrer">Preview</a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function PageEditorScreen({ slug }: { slug: string }) {
  const def = pageBySlug(slug);
  const { data, error, reload } = useOrbit<OrbitSiteConfig>("/api/orbit/config");
  const [config, setConfig] = useState<OrbitSiteConfig | null>(null);
  const [tab, setTab] = useState<"content" | "seo" | "sections" | "global">("content");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const path = def?.path ?? "/";

  useEffect(() => {
    if (data) setConfig(data);
  }, [data]);

  const hero = useMemo(() => {
    if (!config) return {} as PageHeroContent;
    if (slug === "home") {
      return {
        badge: config.home.badge,
        title: `${config.home.headlineLine1} ${config.home.headlineLine2}`.trim(),
        titleAccent: config.home.headlineBrand,
        lede: config.home.lede,
        ctaPrimary: config.home.primaryCta,
        ctaSecondary: config.home.secondaryCta,
        ctaPrimaryHref: config.home.primaryCtaHref,
        ctaSecondaryHref: config.home.secondaryCtaHref,
        heroImage: config.home.heroImage,
        heroImageAlt: config.home.heroImageAlt,
      };
    }
    return config.pageContent[path] ?? {};
  }, [config, path, slug]);

  const meta = config?.pages[path] ?? emptyMeta();

  if (!def) return <p className="ob-error">Unknown page.</p>;
  if (error) return <p className="ob-error">{error}</p>;
  if (!config) return <p className="ob-muted">Loading page editor…</p>;

  async function publish() {
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/orbit/config", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(config) });
    const payload = await response.json();
    setSaving(false);
    if (!response.ok) {
      setMessage(payload.error || "Publish failed.");
      return;
    }
    setConfig(payload);
    setMessage("Published — the live site is updating now.");
    reload();
  }

  function patchHero(patch: Partial<PageHeroContent>) {
    if (slug === "home") {
      setConfig({
        ...config!,
        home: {
          ...config!.home,
          ...(patch.badge !== undefined ? { badge: patch.badge } : {}),
          ...(patch.lede !== undefined ? { lede: patch.lede } : {}),
          ...(patch.ctaPrimary !== undefined ? { primaryCta: patch.ctaPrimary } : {}),
          ...(patch.ctaSecondary !== undefined ? { secondaryCta: patch.ctaSecondary } : {}),
          ...(patch.ctaPrimaryHref !== undefined ? { primaryCtaHref: patch.ctaPrimaryHref } : {}),
          ...(patch.ctaSecondaryHref !== undefined ? { secondaryCtaHref: patch.ctaSecondaryHref } : {}),
          ...(patch.heroImage !== undefined ? { heroImage: patch.heroImage } : {}),
          ...(patch.heroImageAlt !== undefined ? { heroImageAlt: patch.heroImageAlt } : {}),
        },
      });
      return;
    }
    setConfig({
      ...config!,
      pageContent: {
        ...config!.pageContent,
        [path]: { ...(config!.pageContent[path] ?? {}), ...patch },
      },
    });
  }

  function patchMeta(patch: Partial<SitePageMeta>) {
    if (!def) return;
    setConfig({
      ...config!,
      pages: { ...config!.pages, [path]: { ...meta, ...patch, slug: patch.slug ?? meta.slug ?? def.slug } },
    });
  }

  const homeHeadlineFields =
    slug === "home" ? (
      <div className="ob-form">
        {(["headlineLine1", "headlineLine2", "headlineLine3", "headlineBrand"] as const).map((key) => (
          <label key={key}>
            {key}
            <input
              value={config.home[key]}
              onChange={(event) => setConfig({ ...config, home: { ...config.home, [key]: event.target.value } })}
            />
          </label>
        ))}
      </div>
    ) : null;

  return (
    <>
      <div className="ob-panel-head">
        <div>
          <h2 style={{ margin: 0 }}>{def.label}</h2>
          <p className="ob-muted">{path} · Edit matches the live page structure.</p>
        </div>
        <div className="ob-toolbar">
          <a className="ob-btn ghost" href={path} target="_blank" rel="noreferrer">Preview live</a>
          <button className="ob-btn primary" type="button" disabled={saving} onClick={publish}>{saving ? "Publishing…" : "Publish now"}</button>
        </div>
      </div>

      <div className="ob-chart-tabs">
        <button type="button" className={tab === "content" ? "is-on" : ""} onClick={() => setTab("content")}>Page content</button>
        <button type="button" className={tab === "seo" ? "is-on" : ""} onClick={() => setTab("seo")}>SEO &amp; social</button>
        {slug === "home" ? <button type="button" className={tab === "sections" ? "is-on" : ""} onClick={() => setTab("sections")}>Home sections</button> : null}
        {slug === "home" || slug === "pricing" || slug === "support" ? (
          <button type="button" className={tab === "global" ? "is-on" : ""} onClick={() => setTab("global")}>
            {slug === "support" ? "Contact & header" : slug === "pricing" ? "Header / pricing" : "Header / footer"}
          </button>
        ) : null}
      </div>

      {tab === "content" ? (
        <article className="ob-card ob-form">
          <h3>Hero / top section</h3>
          <label>Badge / kicker<input value={hero.badge || ""} onChange={(event) => patchHero({ badge: event.target.value })} /></label>
          {slug === "home" ? homeHeadlineFields : (
            <>
              <label>Title<input value={hero.title || ""} onChange={(event) => patchHero({ title: event.target.value })} /></label>
              <label>Accent title (gradient part)<input value={hero.titleAccent || ""} onChange={(event) => patchHero({ titleAccent: event.target.value })} /></label>
            </>
          )}
          <label>Description<textarea value={hero.lede || ""} onChange={(event) => patchHero({ lede: event.target.value })} /></label>
          <label>Hero image URL<input value={hero.heroImage || ""} onChange={(event) => patchHero({ heroImage: event.target.value })} placeholder="/media/orbit/....jpg" /></label>
          <label>Hero image alt<input value={hero.heroImageAlt || ""} onChange={(event) => patchHero({ heroImageAlt: event.target.value })} /></label>
          <label>Primary CTA text<input value={hero.ctaPrimary || ""} onChange={(event) => patchHero({ ctaPrimary: event.target.value })} /></label>
          <label>Primary CTA link<input value={hero.ctaPrimaryHref || ""} onChange={(event) => patchHero({ ctaPrimaryHref: event.target.value })} /></label>
          <label>Secondary CTA text<input value={hero.ctaSecondary || ""} onChange={(event) => patchHero({ ctaSecondary: event.target.value })} /></label>
          <label>Secondary CTA link<input value={hero.ctaSecondaryHref || ""} onChange={(event) => patchHero({ ctaSecondaryHref: event.target.value })} /></label>
          <p className="ob-muted">Upload images in Media library, then paste the URL here for instant replacement.</p>
        </article>
      ) : null}

      {tab === "seo" ? (
        <article className="ob-card ob-form">
          <h3>SEO</h3>
          <label>URL slug<input value={meta.slug || def.slug} onChange={(event) => patchMeta({ slug: event.target.value })} /></label>
          <label>Meta title<input value={meta.title} onChange={(event) => patchMeta({ title: event.target.value })} /></label>
          <label>Meta description<textarea value={meta.description} onChange={(event) => patchMeta({ description: event.target.value })} /></label>
          <label>Focus keywords<input value={meta.focusKeywords || meta.keywords} onChange={(event) => patchMeta({ focusKeywords: event.target.value, keywords: event.target.value })} /></label>
          <label>Tags<input value={meta.tags || ""} onChange={(event) => patchMeta({ tags: event.target.value })} placeholder="comma separated" /></label>
          <label>Canonical URL<input value={meta.canonical || ""} onChange={(event) => patchMeta({ canonical: event.target.value })} /></label>
          <label><input type="checkbox" checked={Boolean(meta.noindex)} onChange={(event) => patchMeta({ noindex: event.target.checked })} /> Noindex this page</label>
          <h3>Open Graph &amp; Twitter</h3>
          <label>OG title<input value={meta.ogTitle || ""} onChange={(event) => patchMeta({ ogTitle: event.target.value })} /></label>
          <label>OG description<input value={meta.ogDescription || ""} onChange={(event) => patchMeta({ ogDescription: event.target.value })} /></label>
          <label>OG image URL<input value={meta.ogImage || ""} onChange={(event) => patchMeta({ ogImage: event.target.value })} /></label>
          <p className="ob-muted">Title {meta.title.length}/60 · Description {meta.description.length}/160</p>
        </article>
      ) : null}

      {tab === "sections" && slug === "home" ? (
        <>
          <article className="ob-card">
            <h3>Visible sections</h3>
            <div className="ob-toolbar">
              {sectionIds.map((id) => (
                <label key={id}>
                  {id}
                  <input type="checkbox" checked={config.sections?.[id] !== false} onChange={(event) => setConfig({ ...config, sections: { ...config.sections, [id]: event.target.checked } })} />
                </label>
              ))}
            </div>
          </article>
          {sectionKeys.map((key) => (
            <article key={key} className="ob-card ob-form">
              <h3>{key} section</h3>
              <label>Badge<input value={config.sectionCopy[key].badge} onChange={(event) => setConfig({ ...config, sectionCopy: { ...config.sectionCopy, [key]: { ...config.sectionCopy[key], badge: event.target.value } } })} /></label>
              <label>Title<input value={config.sectionCopy[key].title} onChange={(event) => setConfig({ ...config, sectionCopy: { ...config.sectionCopy, [key]: { ...config.sectionCopy[key], title: event.target.value } } })} /></label>
              <label>Accent<input value={config.sectionCopy[key].titleAccent || ""} onChange={(event) => setConfig({ ...config, sectionCopy: { ...config.sectionCopy, [key]: { ...config.sectionCopy[key], titleAccent: event.target.value } } })} /></label>
              <label>Description<textarea value={config.sectionCopy[key].lede} onChange={(event) => setConfig({ ...config, sectionCopy: { ...config.sectionCopy, [key]: { ...config.sectionCopy[key], lede: event.target.value } } })} /></label>
            </article>
          ))}
          <article className="ob-card ob-form">
            <h3>Why cards</h3>
            {config.whyFeatures.map((item, index) => (
              <div key={`${item.title}-${index}`} className="ob-form">
                <label>Title<input value={item.title} onChange={(event) => {
                  const whyFeatures = config.whyFeatures.map((row, i) => (i === index ? { ...row, title: event.target.value } : row));
                  setConfig({ ...config, whyFeatures });
                }} /></label>
                <label>Text<textarea value={item.text} onChange={(event) => {
                  const whyFeatures = config.whyFeatures.map((row, i) => (i === index ? { ...row, text: event.target.value } : row));
                  setConfig({ ...config, whyFeatures });
                }} /></label>
              </div>
            ))}
          </article>
          <article className="ob-card ob-form">
            <h3>Footer stats strip</h3>
            {config.footerStats.map((item, index) => (
              <div key={`${item.label}-${index}`} className="ob-toolbar">
                <input value={item.value} placeholder="Value" onChange={(event) => {
                  const footerStats = config.footerStats.map((row, i) => (i === index ? { ...row, value: event.target.value } : row));
                  setConfig({ ...config, footerStats });
                }} />
                <input value={item.label} placeholder="Label" onChange={(event) => {
                  const footerStats = config.footerStats.map((row, i) => (i === index ? { ...row, label: event.target.value } : row));
                  setConfig({ ...config, footerStats });
                }} />
              </div>
            ))}
          </article>
          <article className="ob-card ob-form">
            <h3>Custom homepage blocks</h3>
            <button className="ob-btn" type="button" onClick={() => setConfig({ ...config, customBlocks: [...config.customBlocks, { id: `block-${Date.now()}`, heading: "New section", text: "", enabled: true }] })}>Add block</button>
            {config.customBlocks.map((block, index) => (
              <div key={block.id} className="ob-form">
                <label>Heading<input value={block.heading} onChange={(event) => {
                  const customBlocks = config.customBlocks.map((row, i) => (i === index ? { ...row, heading: event.target.value } : row));
                  setConfig({ ...config, customBlocks });
                }} /></label>
                <label>Text<textarea value={block.text} onChange={(event) => {
                  const customBlocks = config.customBlocks.map((row, i) => (i === index ? { ...row, text: event.target.value } : row));
                  setConfig({ ...config, customBlocks });
                }} /></label>
                <label><input type="checkbox" checked={block.enabled} onChange={(event) => {
                  const customBlocks = config.customBlocks.map((row, i) => (i === index ? { ...row, enabled: event.target.checked } : row));
                  setConfig({ ...config, customBlocks });
                }} /> Visible</label>
              </div>
            ))}
          </article>
        </>
      ) : null}

      {tab === "global" ? (
        <article className="ob-card ob-form">
          <h3>Site header navigation</h3>
          {config.header.links.map((link, index) => (
            <div key={`${link.href}-${index}`} className="ob-toolbar">
              <input value={link.label} onChange={(event) => {
                const links = config.header.links.map((row, i) => (i === index ? { ...row, label: event.target.value } : row));
                setConfig({ ...config, header: { ...config.header, links } });
              }} />
              <input value={link.href} onChange={(event) => {
                const links = config.header.links.map((row, i) => (i === index ? { ...row, href: event.target.value } : row));
                setConfig({ ...config, header: { ...config.header, links } });
              }} />
            </div>
          ))}
          <label>Sign in label<input value={config.header.signInLabel} onChange={(event) => setConfig({ ...config, header: { ...config.header, signInLabel: event.target.value } })} /></label>
          <label>Sign up label<input value={config.header.signUpLabel} onChange={(event) => setConfig({ ...config, header: { ...config.header, signUpLabel: event.target.value } })} /></label>
          <h3>Footer</h3>
          <label>Footer headline<input value={config.footerCopy.blurb} onChange={(event) => setConfig({ ...config, footerCopy: { ...config.footerCopy, blurb: event.target.value } })} /></label>
          <label>Copyright<input value={config.footerCopy.copyright} onChange={(event) => setConfig({ ...config, footerCopy: { ...config.footerCopy, copyright: event.target.value } })} /></label>
          {slug === "pricing" ? (
            <>
              <h3>Pricing banner note</h3>
              <label>Note under hero<textarea value={config.pricing.bannerNote} onChange={(event) => setConfig({ ...config, pricing: { ...config.pricing, bannerNote: event.target.value } })} /></label>
              <label>Global markup %<input value={String(config.pricing.globalMarkupPercent)} onChange={(event) => setConfig({ ...config, pricing: { ...config.pricing, globalMarkupPercent: Number(event.target.value) || 0 } })} /></label>
              <p className="ob-muted">Service prices are edited in Services &amp; pricing. Markup applies on publish to the public catalog.</p>
            </>
          ) : null}
          {slug === "support" ? (
            <>
              <h3>Support contact (live support page)</h3>
              <label>Email<input value={config.contact.email} onChange={(event) => setConfig({ ...config, contact: { ...config.contact, email: event.target.value } })} /></label>
              <label>Phone<input value={config.contact.phone} onChange={(event) => setConfig({ ...config, contact: { ...config.contact, phone: event.target.value } })} /></label>
              <label>WhatsApp<input value={config.contact.whatsapp} onChange={(event) => setConfig({ ...config, contact: { ...config.contact, whatsapp: event.target.value } })} /></label>
              <label>Telegram<input value={config.contact.telegram} onChange={(event) => setConfig({ ...config, contact: { ...config.contact, telegram: event.target.value } })} /></label>
            </>
          ) : null}
        </article>
      ) : null}

      {message ? <p>{message}</p> : null}
    </>
  );
}