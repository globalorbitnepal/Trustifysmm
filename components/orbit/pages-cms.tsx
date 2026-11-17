"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { OrbitSiteConfig, PageExtras, PageHeroContent, SitePageMeta } from "@/lib/orbit/types";
import { ORBIT_PAGES, pageBySlug } from "@/lib/orbit/page-registry";
import { defaultPageExtras } from "@/lib/orbit/page-defaults";
import { useOrbit } from "@/components/orbit/use-orbit";
import { CmsSectionHead, ImageUrlField } from "@/components/orbit/cms-fields";
import { ServicesScreen } from "@/components/orbit/services-screen";
import type { ComponentProps } from "react";
import { OrbitIcon } from "@/components/orbit/orbit-icons";

type OrbitIconName = ComponentProps<typeof OrbitIcon>["name"];

const sectionIds = ["hero", "why", "platforms", "how", "services", "payments", "reviews"] as const;
const sectionKeys = ["why", "platforms", "how", "services", "payments", "reviews"] as const;

const sectionIcons: Record<(typeof sectionKeys)[number], OrbitIconName> = {
  why: "bolt",
  platforms: "providers",
  how: "activity",
  services: "services",
  payments: "wallet",
  reviews: "customers",
};

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
          <h2>Every public page, full edit</h2>
          <p>Homepage, services catalog, pricing, API, blogs, support articles, terms, privacy, sign in and sign up. Change the words and images here, then Publish now — the live site updates immediately.</p>
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

const pageTabLabels: Record<string, string> = {
  services: "Catalog & FAQ",
  pricing: "Rate deck & FAQ",
  support: "Help center",
  terms: "Legal sections",
  privacy: "Policy sections",
  signin: "Sign-in copy",
  signup: "Sign-up copy",
  blogs: "Blog FAQ",
  api: "API page",
};

function pageTabLabel(slug: string) {
  return pageTabLabels[slug] ?? "Page sections";
}

function renderExtrasTab(path: string, extras: PageExtras, patch: (next: PageExtras) => void) {
  const faq = extras.faq;
  const stats = extras.stats ?? [];
  const body = extras.body ?? [];
  const auth = extras.auth;
  const topics = extras.supportCategories ?? [];
  const channels = extras.supportChannels ?? [];
  const quickLinks = extras.supportQuickLinks ?? [];

  if (!faq && !stats.length && !body.length && !auth && !topics.length) return null;

  return (
    <>
      {faq ? (
        <article className="ob-card ob-form">
          <CmsSectionHead icon="seo" title="FAQ section" hint="Heading block and every question/answer on the live page." />
          <label>Badge<input value={faq.badge} onChange={(event) => patch({ faq: { ...faq, badge: event.target.value } })} /></label>
          <label>Title<input value={faq.title} onChange={(event) => patch({ faq: { ...faq, title: event.target.value } })} /></label>
          <label>Accent<input value={faq.titleAccent} onChange={(event) => patch({ faq: { ...faq, titleAccent: event.target.value } })} /></label>
          <label>Description<textarea value={faq.lede} onChange={(event) => patch({ faq: { ...faq, lede: event.target.value } })} /></label>
          {faq.items.map((item, index) => (
            <div key={`faq-${index}`} className="ob-form ob-cms-block">
              <label>Question<input value={item.q} onChange={(event) => {
                const items = faq.items.map((row, i) => (i === index ? { ...row, q: event.target.value } : row));
                patch({ faq: { ...faq, items } });
              }} /></label>
              <label>Answer<textarea value={item.a} onChange={(event) => {
                const items = faq.items.map((row, i) => (i === index ? { ...row, a: event.target.value } : row));
                patch({ faq: { ...faq, items } });
              }} /></label>
              <button className="ob-btn ghost" type="button" onClick={() => patch({ faq: { ...faq, items: faq.items.filter((_, i) => i !== index) } })}>Remove question</button>
            </div>
          ))}
          <button className="ob-btn ghost" type="button" onClick={() => patch({ faq: { ...faq, items: [...faq.items, { q: "New question", a: "" }] } })}>Add question</button>
        </article>
      ) : null}

      {stats.length ? (
        <article className="ob-card ob-form">
          <CmsSectionHead icon="activity" title="Highlight stat cards" hint="Value + caption pairs shown under the page hero." />
          {stats.map((row, index) => (
            <div key={`stat-${index}`} className="ob-toolbar">
              <input value={row.value} placeholder="Value" onChange={(event) => {
                const next = stats.map((item, i) => (i === index ? { ...item, value: event.target.value } : item));
                patch({ stats: next });
              }} />
              <input value={row.label} placeholder="Label" onChange={(event) => {
                const next = stats.map((item, i) => (i === index ? { ...item, label: event.target.value } : item));
                patch({ stats: next });
              }} />
            </div>
          ))}
        </article>
      ) : null}

      {body.length ? (
        <article className="ob-card ob-form">
          <CmsSectionHead icon="pages" title="Page body sections" hint="Legal / policy content blocks in order." />
          {body.map((block, index) => (
            <div key={`body-${index}`} className="ob-form ob-cms-block">
              <label>Heading<input value={block.heading} onChange={(event) => {
                const next = body.map((item, i) => (i === index ? { ...item, heading: event.target.value } : item));
                patch({ body: next });
              }} /></label>
              <label>Text<textarea value={block.text} onChange={(event) => {
                const next = body.map((item, i) => (i === index ? { ...item, text: event.target.value } : item));
                patch({ body: next });
              }} /></label>
              <button className="ob-btn ghost" type="button" onClick={() => patch({ body: body.filter((_, i) => i !== index) })}>Remove section</button>
            </div>
          ))}
          <button className="ob-btn ghost" type="button" onClick={() => patch({ body: [...body, { heading: "New section", text: "" }] })}>Add section</button>
        </article>
      ) : null}

      {auth ? (
        <article className="ob-card ob-form">
          <CmsSectionHead icon="customers" title="Auth page copy" hint="Left column headline, perks, trust chips, and card heading." />
          <label>Badge<input value={auth.badge} onChange={(event) => patch({ auth: { ...auth, badge: event.target.value } })} /></label>
          <label>Title prefix<input value={auth.titlePrefix} onChange={(event) => patch({ auth: { ...auth, titlePrefix: event.target.value } })} /></label>
          <label>Title accent<input value={auth.titleAccent} onChange={(event) => patch({ auth: { ...auth, titleAccent: event.target.value } })} /></label>
          <label>Lede<textarea value={auth.lede} onChange={(event) => patch({ auth: { ...auth, lede: event.target.value } })} /></label>
          {auth.perks.map((perk, index) => (
            <div key={`perk-${index}`} className="ob-form ob-cms-block">
              <label>Perk title<input value={perk.title} onChange={(event) => {
                const perks = auth.perks.map((row, i) => (i === index ? { ...row, title: event.target.value } : row));
                patch({ auth: { ...auth, perks } });
              }} /></label>
              <label>Perk text<textarea value={perk.text} onChange={(event) => {
                const perks = auth.perks.map((row, i) => (i === index ? { ...row, text: event.target.value } : row));
                patch({ auth: { ...auth, perks } });
              }} /></label>
            </div>
          ))}
          <h4 style={{ marginTop: 14 }}>Trust chips</h4>
          {auth.trust.map((row, index) => (
            <div key={`trust-${index}`} className="ob-toolbar">
              <input value={row.value} onChange={(event) => {
                const trust = auth.trust.map((item, i) => (i === index ? { ...item, value: event.target.value } : item));
                patch({ auth: { ...auth, trust } });
              }} />
              <input value={row.label} onChange={(event) => {
                const trust = auth.trust.map((item, i) => (i === index ? { ...item, label: event.target.value } : item));
                patch({ auth: { ...auth, trust } });
              }} />
            </div>
          ))}
          <h4 style={{ marginTop: 14 }}>Form card heading</h4>
          <label>Card title<input value={auth.cardTitle} onChange={(event) => patch({ auth: { ...auth, cardTitle: event.target.value } })} /></label>
          <label>Card accent<input value={auth.cardTitleAccent} onChange={(event) => patch({ auth: { ...auth, cardTitleAccent: event.target.value } })} /></label>
          <label>Card subtext<textarea value={auth.cardLede} onChange={(event) => patch({ auth: { ...auth, cardLede: event.target.value } })} /></label>
          <p className="ob-muted">{path} · changes publish instantly with the main Publish now button.</p>
        </article>
      ) : null}

      {topics.length ? (
        <article className="ob-card ob-form">
          <CmsSectionHead icon="support" title="Help topics and answers" hint="Every category and question on the live support page." />
          {topics.map((topic, topicIndex) => (
            <div key={topic.id} className="ob-form ob-cms-block">
              <label>Topic title<input value={topic.title} onChange={(event) => {
                const supportCategories = topics.map((row, i) => (i === topicIndex ? { ...row, title: event.target.value } : row));
                patch({ supportCategories });
              }} /></label>
              <label>Topic description<textarea value={topic.description} onChange={(event) => {
                const supportCategories = topics.map((row, i) => (i === topicIndex ? { ...row, description: event.target.value } : row));
                patch({ supportCategories });
              }} /></label>
              {topic.items.map((item, itemIndex) => (
                <div key={`${topic.id}-${itemIndex}`} className="ob-form">
                  <label>Question<input value={item.q} onChange={(event) => {
                    const items = topic.items.map((row, i) => (i === itemIndex ? { ...row, q: event.target.value } : row));
                    const supportCategories = topics.map((row, i) => (i === topicIndex ? { ...row, items } : row));
                    patch({ supportCategories });
                  }} /></label>
                  <label>Answer<textarea value={item.a} onChange={(event) => {
                    const items = topic.items.map((row, i) => (i === itemIndex ? { ...row, a: event.target.value } : row));
                    const supportCategories = topics.map((row, i) => (i === topicIndex ? { ...row, items } : row));
                    patch({ supportCategories });
                  }} /></label>
                  <button className="ob-btn ghost" type="button" onClick={() => {
                    const items = topic.items.filter((_, i) => i !== itemIndex);
                    patch({ supportCategories: topics.map((row, i) => (i === topicIndex ? { ...row, items } : row)) });
                  }}>Remove question</button>
                </div>
              ))}
              <button className="ob-btn ghost" type="button" onClick={() => {
                const items = [...topic.items, { q: "New question", a: "" }];
                patch({ supportCategories: topics.map((row, i) => (i === topicIndex ? { ...row, items } : row)) });
              }}>Add question</button>
              <button className="ob-btn warn" type="button" onClick={() => patch({ supportCategories: topics.filter((_, i) => i !== topicIndex) })}>Remove topic</button>
            </div>
          ))}
          <button className="ob-btn ghost" type="button" onClick={() => patch({ supportCategories: [...topics, { id: `topic-${Date.now()}`, title: "New topic", description: "", items: [{ q: "New question", a: "" }] }] })}>Add topic</button>
        </article>
      ) : null}

      {channels.length ? (
        <article className="ob-card ob-form">
          <CmsSectionHead icon="support" title="Contact cards" />
          {channels.map((channel, index) => (
            <div key={channel.id} className="ob-form ob-cms-block">
              <label>Title<input value={channel.title} onChange={(event) => patch({ supportChannels: channels.map((row, i) => (i === index ? { ...row, title: event.target.value } : row)) })} /></label>
              <label>Detail<textarea value={channel.detail} onChange={(event) => patch({ supportChannels: channels.map((row, i) => (i === index ? { ...row, detail: event.target.value } : row)) })} /></label>
              <label>Reply note<input value={channel.sla} onChange={(event) => patch({ supportChannels: channels.map((row, i) => (i === index ? { ...row, sla: event.target.value } : row)) })} /></label>
              <label>Button text<input value={channel.action} onChange={(event) => patch({ supportChannels: channels.map((row, i) => (i === index ? { ...row, action: event.target.value } : row)) })} /></label>
              <label>Link<input value={channel.href} onChange={(event) => patch({ supportChannels: channels.map((row, i) => (i === index ? { ...row, href: event.target.value } : row)) })} /></label>
            </div>
          ))}
        </article>
      ) : null}

      {quickLinks.length ? (
        <article className="ob-card ob-form">
          <CmsSectionHead icon="pages" title="Quick links" />
          {quickLinks.map((link, index) => (
            <div key={`${link.href}-${index}`} className="ob-toolbar">
              <input value={link.label} onChange={(event) => patch({ supportQuickLinks: quickLinks.map((row, i) => (i === index ? { ...row, label: event.target.value } : row)) })} />
              <input value={link.desc} onChange={(event) => patch({ supportQuickLinks: quickLinks.map((row, i) => (i === index ? { ...row, desc: event.target.value } : row)) })} />
              <input value={link.href} onChange={(event) => patch({ supportQuickLinks: quickLinks.map((row, i) => (i === index ? { ...row, href: event.target.value } : row)) })} />
            </div>
          ))}
          <button className="ob-btn ghost" type="button" onClick={() => patch({ supportQuickLinks: [...quickLinks, { href: "/", label: "New link", desc: "" }] })}>Add link</button>
        </article>
      ) : null}
    </>
  );
}

export function PageEditorScreen({ slug }: { slug: string }) {
  const def = pageBySlug(slug);
  const { data, error, reload } = useOrbit<OrbitSiteConfig>("/api/orbit/config");
  const [config, setConfig] = useState<OrbitSiteConfig | null>(null);
  const [tab, setTab] = useState<"content" | "seo" | "sections" | "page" | "catalog" | "global">(slug === "services" ? "catalog" : "content");
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
  const extras: PageExtras = config?.pageExtras?.[path] ?? defaultPageExtras[path] ?? {};

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

  function patchExtras(next: PageExtras) {
    setConfig({
      ...config!,
      pageExtras: { ...(config!.pageExtras ?? {}), [path]: { ...extras, ...next } },
    });
  }

  const extrasTab = renderExtrasTab(path, extras, patchExtras);

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
        {slug === "services" ? <button type="button" className={tab === "catalog" ? "is-on" : ""} onClick={() => setTab("catalog")}>All services & categories</button> : null}
        <button type="button" className={tab === "content" ? "is-on" : ""} onClick={() => setTab("content")}>Page content</button>
        <button type="button" className={tab === "seo" ? "is-on" : ""} onClick={() => setTab("seo")}>SEO &amp; social</button>
        {extrasTab ? <button type="button" className={tab === "page" ? "is-on" : ""} onClick={() => setTab("page")}>{pageTabLabel(slug)}</button> : null}
        {slug === "home" ? <button type="button" className={tab === "sections" ? "is-on" : ""} onClick={() => setTab("sections")}>Home sections</button> : null}
        <button type="button" className={tab === "global" ? "is-on" : ""} onClick={() => setTab("global")}>
          {slug === "support" ? "Contact & header" : slug === "pricing" ? "Header / pricing" : "Header / footer"}
        </button>
      </div>

      {tab === "catalog" && slug === "services" ? (
        <>
          <p className="ob-muted">This is the live /services catalog. Search, filter, edit every service, or create a new category and service. Publish is instant — no separate save.</p>
          <ServicesScreen />
        </>
      ) : null}

      {tab === "content" ? (
        <article className="ob-card ob-form">
          <CmsSectionHead icon="pages" title="Hero / top section" hint="Matches the live page hero — text, CTAs, and banner image." />
          <label>Badge / kicker<input value={hero.badge || ""} onChange={(event) => patchHero({ badge: event.target.value })} /></label>
          {slug === "home" ? homeHeadlineFields : (
            <>
              <label>Title<input value={hero.title || ""} onChange={(event) => patchHero({ title: event.target.value })} /></label>
              <label>Accent title (gradient part)<input value={hero.titleAccent || ""} onChange={(event) => patchHero({ titleAccent: event.target.value })} /></label>
            </>
          )}
          <label>Description<textarea value={hero.lede || ""} onChange={(event) => patchHero({ lede: event.target.value })} /></label>
          <ImageUrlField
            label="Hero / banner image"
            value={hero.heroImage || ""}
            onChange={(url) => patchHero({ heroImage: url })}
            onClear={() => patchHero({ heroImage: "" })}
            hint="Leave empty on homepage to use the animated Social Orbit cluster."
          />
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
          <CmsSectionHead icon="seo" title="SEO" hint="Meta title, description, focus keywords, and social cards." />
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
          <ImageUrlField
            label="OG image"
            value={meta.ogImage || ""}
            onChange={(url) => patchMeta({ ogImage: url })}
            onClear={() => patchMeta({ ogImage: "" })}
          />
          <p className="ob-muted">Title {meta.title.length}/60 · Description {meta.description.length}/160</p>
        </article>
      ) : null}

      {tab === "page" ? extrasTab : null}

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
              <CmsSectionHead icon={sectionIcons[key]} title={`${key.charAt(0).toUpperCase()}${key.slice(1)} section`} hint="Section badge, heading, accent line, and description on the live homepage." />
              <label>Badge<input value={config.sectionCopy[key].badge} onChange={(event) => setConfig({ ...config, sectionCopy: { ...config.sectionCopy, [key]: { ...config.sectionCopy[key], badge: event.target.value } } })} /></label>
              <label>Title<input value={config.sectionCopy[key].title} onChange={(event) => setConfig({ ...config, sectionCopy: { ...config.sectionCopy, [key]: { ...config.sectionCopy[key], title: event.target.value } } })} /></label>
              <label>Accent<input value={config.sectionCopy[key].titleAccent || ""} onChange={(event) => setConfig({ ...config, sectionCopy: { ...config.sectionCopy, [key]: { ...config.sectionCopy[key], titleAccent: event.target.value } } })} /></label>
              <label>Description<textarea value={config.sectionCopy[key].lede} onChange={(event) => setConfig({ ...config, sectionCopy: { ...config.sectionCopy, [key]: { ...config.sectionCopy[key], lede: event.target.value } } })} /></label>
            </article>
          ))}
          <article className="ob-card ob-form">
            <CmsSectionHead icon="grid" title="Why choose — feature cards" hint="Four cards under the Why section (title, body, color tone)." />
            {config.whyFeatures.map((item, index) => (
              <div key={`${item.title}-${index}`} className="ob-form ob-cms-block">
                <label>
                  Title
                  <input
                    value={item.title}
                    onChange={(event) => {
                      const whyFeatures = config.whyFeatures.map((row, i) => (i === index ? { ...row, title: event.target.value } : row));
                      setConfig({ ...config, whyFeatures });
                    }}
                  />
                </label>
                <label>
                  Text
                  <textarea
                    value={item.text}
                    onChange={(event) => {
                      const whyFeatures = config.whyFeatures.map((row, i) => (i === index ? { ...row, text: event.target.value } : row));
                      setConfig({ ...config, whyFeatures });
                    }}
                  />
                </label>
                <label>
                  Card tone
                  <select
                    value={item.tone}
                    onChange={(event) => {
                      const tone = (event.target.value === "blue" ? "blue" : "violet") as "violet" | "blue";
                      const whyFeatures = config.whyFeatures.map((row, i) => (i === index ? { ...row, tone } : row));
                      setConfig({ ...config, whyFeatures });
                    }}
                  >
                    <option value="violet">Violet</option>
                    <option value="blue">Blue</option>
                  </select>
                </label>
              </div>
            ))}
          </article>
          <article className="ob-card ob-form">
            <CmsSectionHead icon="providers" title="Supported platforms grid" hint="Each card: name, services line, optional custom icon URL." />
            {config.platformCards.map((item, index) => (
              <div key={`${item.id}-${index}`} className="ob-form ob-cms-block">
                <label>Platform id<input value={item.id} onChange={(event) => {
                  const platformCards = config.platformCards.map((row, i) => (i === index ? { ...row, id: event.target.value } : row));
                  setConfig({ ...config, platformCards });
                }} /></label>
                <label>Name<input value={item.name} onChange={(event) => {
                  const platformCards = config.platformCards.map((row, i) => (i === index ? { ...row, name: event.target.value } : row));
                  setConfig({ ...config, platformCards });
                }} /></label>
                <label>Services line<input value={item.services} onChange={(event) => {
                  const platformCards = config.platformCards.map((row, i) => (i === index ? { ...row, services: event.target.value } : row));
                  setConfig({ ...config, platformCards });
                }} /></label>
                <ImageUrlField
                  label="Custom icon (optional)"
                  value={item.iconUrl || ""}
                  onChange={(url) => {
                    const platformCards = config.platformCards.map((row, i) => (i === index ? { ...row, iconUrl: url } : row));
                    setConfig({ ...config, platformCards });
                  }}
                  onClear={() => {
                    const platformCards = config.platformCards.map((row, i) => (i === index ? { ...row, iconUrl: "" } : row));
                    setConfig({ ...config, platformCards });
                  }}
                />
              </div>
            ))}
            <button className="ob-btn ghost" type="button" onClick={() => setConfig({ ...config, platformCards: [...config.platformCards, { id: "new", name: "New Platform", services: "" }] })}>Add platform card</button>
          </article>
          <article className="ob-card ob-form">
            <CmsSectionHead icon="activity" title="How it works — steps" />
            {config.howSteps.map((item, index) => (
              <div key={`step-${index}`} className="ob-form ob-cms-block">
                <label>Step #<input value={item.num} onChange={(event) => {
                  const howSteps = config.howSteps.map((row, i) => (i === index ? { ...row, num: event.target.value } : row));
                  setConfig({ ...config, howSteps });
                }} /></label>
                <label>Title<input value={item.title} onChange={(event) => {
                  const howSteps = config.howSteps.map((row, i) => (i === index ? { ...row, title: event.target.value } : row));
                  setConfig({ ...config, howSteps });
                }} /></label>
                <label>Text<textarea value={item.text} onChange={(event) => {
                  const howSteps = config.howSteps.map((row, i) => (i === index ? { ...row, text: event.target.value } : row));
                  setConfig({ ...config, howSteps });
                }} /></label>
                <label>Tone<select value={item.tone} onChange={(event) => {
                  const tone = (event.target.value === "blue" ? "blue" : "violet") as "violet" | "blue";
                  const howSteps = config.howSteps.map((row, i) => (i === index ? { ...row, tone } : row));
                  setConfig({ ...config, howSteps });
                }}><option value="violet">Violet</option><option value="blue">Blue</option></select></label>
              </div>
            ))}
            <h4 style={{ marginTop: 16 }}>Perk chips</h4>
            {config.howPerks.map((item, index) => (
              <label key={`perk-${index}`}>Label<input value={item.label} onChange={(event) => {
                const howPerks = config.howPerks.map((row, i) => (i === index ? { ...row, label: event.target.value } : row));
                setConfig({ ...config, howPerks });
              }} /></label>
            ))}
          </article>
          <article className="ob-card ob-form">
            <CmsSectionHead icon="wallet" title="Payment methods" />
            {config.paymentCoins.map((item, index) => (
              <div key={`coin-${index}`} className="ob-form ob-cms-block">
                <label>Coin id<input value={item.id} onChange={(event) => {
                  const paymentCoins = config.paymentCoins.map((row, i) => (i === index ? { ...row, id: event.target.value } : row));
                  setConfig({ ...config, paymentCoins });
                }} /></label>
                <label>Name<input value={item.name} onChange={(event) => {
                  const paymentCoins = config.paymentCoins.map((row, i) => (i === index ? { ...row, name: event.target.value } : row));
                  setConfig({ ...config, paymentCoins });
                }} /></label>
                <label>Ticker<input value={item.ticker} onChange={(event) => {
                  const paymentCoins = config.paymentCoins.map((row, i) => (i === index ? { ...row, ticker: event.target.value } : row));
                  setConfig({ ...config, paymentCoins });
                }} /></label>
              </div>
            ))}
            <h4 style={{ marginTop: 16 }}>Payment perks</h4>
            {config.paymentPerks.map((item, index) => (
              <label key={`pay-perk-${index}`}>Label<input value={item.label} onChange={(event) => {
                const paymentPerks = config.paymentPerks.map((row, i) => (i === index ? { ...row, label: event.target.value } : row));
                setConfig({ ...config, paymentPerks });
              }} /></label>
            ))}
          </article>
          <article className="ob-card ob-form">
            <CmsSectionHead icon="customers" title="Customer reviews carousel" />
            {config.customerReviews.map((item, index) => (
              <div key={`rev-${index}`} className="ob-form ob-cms-block">
                <label>Name<input value={item.name} onChange={(event) => {
                  const customerReviews = config.customerReviews.map((row, i) => (i === index ? { ...row, name: event.target.value } : row));
                  setConfig({ ...config, customerReviews });
                }} /></label>
                <label>Country<input value={item.country} onChange={(event) => {
                  const customerReviews = config.customerReviews.map((row, i) => (i === index ? { ...row, country: event.target.value } : row));
                  setConfig({ ...config, customerReviews });
                }} /></label>
                <label>Flag emoji<input value={item.flag} onChange={(event) => {
                  const customerReviews = config.customerReviews.map((row, i) => (i === index ? { ...row, flag: event.target.value } : row));
                  setConfig({ ...config, customerReviews });
                }} /></label>
                <ImageUrlField label="Avatar photo" value={item.avatar} onChange={(url) => {
                  const customerReviews = config.customerReviews.map((row, i) => (i === index ? { ...row, avatar: url } : row));
                  setConfig({ ...config, customerReviews });
                }} onClear={() => {
                  const customerReviews = config.customerReviews.map((row, i) => (i === index ? { ...row, avatar: "" } : row));
                  setConfig({ ...config, customerReviews });
                }} />
                <label>Review text<textarea value={item.text} onChange={(event) => {
                  const customerReviews = config.customerReviews.map((row, i) => (i === index ? { ...row, text: event.target.value } : row));
                  setConfig({ ...config, customerReviews });
                }} /></label>
                <label>Tone<select value={item.tone} onChange={(event) => {
                  const tone = (event.target.value === "blue" ? "blue" : "violet") as "violet" | "blue";
                  const customerReviews = config.customerReviews.map((row, i) => (i === index ? { ...row, tone } : row));
                  setConfig({ ...config, customerReviews });
                }}><option value="violet">Violet</option><option value="blue">Blue</option></select></label>
                <button className="ob-btn ghost" type="button" onClick={() => setConfig({ ...config, customerReviews: config.customerReviews.filter((_, i) => i !== index) })}>Remove review</button>
              </div>
            ))}
            <button className="ob-btn ghost" type="button" onClick={() => setConfig({ ...config, customerReviews: [...config.customerReviews, { name: "New Customer", country: "", flag: "🌍", avatar: "", text: "", tone: "violet" as const }] })}>Add review</button>
          </article>
          <article className="ob-card ob-form">
            <CmsSectionHead icon="dashboard" title="Footer stats strip" />
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
            <CmsSectionHead icon="blog" title="Custom homepage blocks" />
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
          <CmsSectionHead icon="settings" title="Site header navigation" hint="Public website header links and auth button labels." />
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
          <CmsSectionHead icon="pages" title="Footer copy" />
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
          {slug === "home" ? (
            <>
              <CmsSectionHead icon="dashboard" title="Orbit dashboard welcome banner" hint="/orbit home hero — text and 3D art image." />
              <label>Welcome prefix<input value={config.orbitDashboard.welcomePrefix} onChange={(event) => setConfig({ ...config, orbitDashboard: { ...config.orbitDashboard, welcomePrefix: event.target.value } })} /></label>
              <label>Highlighted name<input value={config.orbitDashboard.welcomeName} onChange={(event) => setConfig({ ...config, orbitDashboard: { ...config.orbitDashboard, welcomeName: event.target.value } })} /></label>
              <label>Subtext<textarea value={config.orbitDashboard.welcomeLede} onChange={(event) => setConfig({ ...config, orbitDashboard: { ...config.orbitDashboard, welcomeLede: event.target.value } })} /></label>
              <ImageUrlField
                label="Dashboard 3D hero art"
                value={config.orbitDashboard.heroArt}
                onChange={(url) => setConfig({ ...config, orbitDashboard: { ...config.orbitDashboard, heroArt: url } })}
                onClear={() => setConfig({ ...config, orbitDashboard: { ...config.orbitDashboard, heroArt: "" } })}
              />
              <p className="ob-muted">Leave empty to use the built-in vector 3D art (stays crisp at any resolution). Paste a URL to override.</p>
              <CmsSectionHead icon="media" title="Brand logos" hint="Public site header logo URLs (upload in Media library)." />
              <ImageUrlField label="Public header logo" value={config.brand.publicLogo} onChange={(url) => setConfig({ ...config, brand: { ...config.brand, publicLogo: url } })} />
              <ImageUrlField label="Orbit sidebar — light" value={config.brand.orbitLogoLight} onChange={(url) => setConfig({ ...config, brand: { ...config.brand, orbitLogoLight: url } })} />
              <ImageUrlField label="Orbit sidebar — dark" value={config.brand.orbitLogoDark} onChange={(url) => setConfig({ ...config, brand: { ...config.brand, orbitLogoDark: url } })} />
              <p className="ob-muted">Orbit uses the crisp vector logo by default; PNG overrides apply when you replace these URLs.</p>
            </>
          ) : null}
          {slug === "support" ? (
            <>
              <CmsSectionHead icon="support" title="Support contact" hint="Live support page contact channels." />
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