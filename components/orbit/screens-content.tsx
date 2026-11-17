"use client";

import { useEffect, useState } from "react";
import { send, useOrbit } from "@/components/orbit/use-orbit";
import type { OrbitSiteConfig } from "@/lib/orbit/types";

const sectionIds = ["hero", "why", "platforms", "how", "services", "payments", "reviews"] as const;

export function PagesScreen() {
  const { data, error, reload } = useOrbit<OrbitSiteConfig>("/api/orbit/config");
  const [config, setConfig] = useState<OrbitSiteConfig | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => { if (data) setConfig(data); }, [data]);
  if (error) return <p className="ob-error">{error}</p>;
  if (!config) return <p className="ob-muted">Loading website settings…</p>;
  async function save() {
    const response = await fetch("/api/orbit/config", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(config) });
    const payload = await response.json();
    if (!response.ok) { setMessage(payload.error || "Save failed"); return; }
    setMessage("Published to the live website.");
    reload();
  }
  return (
    <>
      <article className="ob-card">
        <h2 style={{ marginTop: 0 }}>Homepage</h2>
        <div className="ob-form">
          {(["badge", "headlineLine1", "headlineLine2", "headlineLine3", "headlineBrand", "lede", "primaryCta", "secondaryCta"] as const).map((key) => (
            <label key={key}>{key}<input value={config.home[key]} onChange={(event) => setConfig({ ...config, home: { ...config.home, [key]: event.target.value } })} /></label>
          ))}
        </div>
        <div className="ob-toolbar">
          {sectionIds.map((id) => (
            <label key={id}>{id}
              <input type="checkbox" checked={config.sections?.[id] !== false} onChange={(event) => setConfig({ ...config, sections: { ...config.sections, [id]: event.target.checked } })} />
            </label>
          ))}
        </div>
      </article>
      <article className="ob-card">
        <h2>Header and footer</h2>
        {config.header.links.map((link, index) => (
          <div className="ob-toolbar" key={`${link.href}-${index}`}>
            <input value={link.label} onChange={(event) => {
              const links = config.header.links.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item);
              setConfig({ ...config, header: { ...config.header, links } });
            }} />
            <input value={link.href} onChange={(event) => {
              const links = config.header.links.map((item, itemIndex) => itemIndex === index ? { ...item, href: event.target.value } : item);
              setConfig({ ...config, header: { ...config.header, links } });
            }} />
          </div>
        ))}
        <div className="ob-form">
          <label>Sign in<input value={config.header.signInLabel} onChange={(event) => setConfig({ ...config, header: { ...config.header, signInLabel: event.target.value } })} /></label>
          <label>Sign up<input value={config.header.signUpLabel} onChange={(event) => setConfig({ ...config, header: { ...config.header, signUpLabel: event.target.value } })} /></label>
          <label>Footer line<input value={config.footerCopy.blurb} onChange={(event) => setConfig({ ...config, footerCopy: { ...config.footerCopy, blurb: event.target.value } })} /></label>
          <label>Copyright<input value={config.footerCopy.copyright} onChange={(event) => setConfig({ ...config, footerCopy: { ...config.footerCopy, copyright: event.target.value } })} /></label>
        </div>
      </article>
      <article className="ob-card">
        <h2>Custom section</h2>
        <button className="ob-btn" type="button" onClick={() => setConfig({ ...config, customBlocks: [...config.customBlocks, { id: `block-${Date.now()}`, heading: "New section", text: "", enabled: true }] })}>Add section</button>
        {config.customBlocks.map((block, index) => (
          <div key={block.id} className="ob-form">
            <label>Heading<input value={block.heading} onChange={(event) => {
              const customBlocks = config.customBlocks.map((item, itemIndex) => itemIndex === index ? { ...item, heading: event.target.value } : item);
              setConfig({ ...config, customBlocks });
            }} /></label>
            <label>Text<textarea value={block.text} onChange={(event) => {
              const customBlocks = config.customBlocks.map((item, itemIndex) => itemIndex === index ? { ...item, text: event.target.value } : item);
              setConfig({ ...config, customBlocks });
            }} /></label>
            <button className="ob-btn warn" type="button" onClick={() => setConfig({ ...config, customBlocks: config.customBlocks.filter((item) => item.id !== block.id) })}>Remove</button>
          </div>
        ))}
      </article>
      <button className="ob-btn primary" type="button" onClick={save}>Publish website</button>
      {message ? <p>{message}</p> : null}
    </>
  );
}

export function BlogScreen() {
  const { data, reload } = useOrbit<{ posts: { slug: string; title: string; status: string; source: string; category: string }[] }>("/api/orbit/blog");
  const [form, setForm] = useState({ title: "", slug: "", excerpt: "", body: "", category: "Guides", status: "draft", metaTitle: "", metaDescription: "", focusKeywords: "", image: "" });
  const [message, setMessage] = useState("");
  return (
    <>
      <form className="ob-form" onSubmit={async (event) => {
        event.preventDefault();
        try {
          await send("/api/orbit/blog", form);
          setMessage(form.status === "published" ? "Published." : "Saved.");
          reload();
        } catch (reason) {
          setMessage(reason instanceof Error ? reason.message : "Save failed");
        }
      }}>
        <label>Title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></label>
        <label>Slug<input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></label>
        <label>Category<input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label>
        <label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="draft">Draft</option><option value="published">Published</option><option value="scheduled">Scheduled</option></select></label>
        <label>Excerpt<textarea value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} /></label>
        <label>Body<textarea value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} placeholder="Paragraphs separated by a blank line. Start a line with ## for a heading." /></label>
        <label>Meta title<input value={form.metaTitle} onChange={(event) => setForm({ ...form, metaTitle: event.target.value })} /></label>
        <label>Meta description<input value={form.metaDescription} onChange={(event) => setForm({ ...form, metaDescription: event.target.value })} /></label>
        <label>Keywords<input value={form.focusKeywords} onChange={(event) => setForm({ ...form, focusKeywords: event.target.value })} /></label>
        <label>Image URL<input value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} /></label>
        <button className="ob-btn primary" type="submit">Save post</button>
      </form>
      {message ? <p>{message}</p> : null}
      <div className="ob-table-wrap">
        <table className="ob-table">
          <thead><tr><th>Title</th><th>Status</th><th>Source</th><th></th></tr></thead>
          <tbody>
            {data?.posts.map((post) => (
              <tr key={post.slug}>
                <td>{post.title}</td>
                <td>{post.status}</td>
                <td>{post.source}</td>
                <td>{post.source === "orbit" ? <button className="ob-btn warn" type="button" onClick={async () => { await send("/api/orbit/blog", { action: "delete", slug: post.slug }); reload(); }}>Delete</button> : "Built-in"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

const seoPaths = ["/", "/services", "/pricing", "/api", "/blogs", "/support", "/terms", "/privacy"];

export function SeoScreen() {
  const configState = useOrbit<OrbitSiteConfig>("/api/orbit/config");
  const siteState = useOrbit<{ urls: string[]; redirects: { id: string; from: string; to: string; enabled: boolean }[] }>("/api/orbit/site");
  const [config, setConfig] = useState<OrbitSiteConfig | null>(null);
  const [path, setPath] = useState("/");
  const [redirect, setRedirect] = useState({ from: "", to: "" });
  const [message, setMessage] = useState("");
  useEffect(() => { if (configState.data) setConfig(configState.data); }, [configState.data]);
  if (!config) return <p className="ob-muted">Loading SEO…</p>;
  const row = config.pages[path] || { title: "", description: "", keywords: "", ogTitle: "", ogDescription: "", ogImage: "", canonical: "", noindex: false };
  return (
    <>
      <article className="ob-card">
        <label>Page
          <select value={path} onChange={(event) => setPath(event.target.value)}>{seoPaths.map((item) => <option key={item}>{item}</option>)}</select>
        </label>
        <div className="ob-form">
          <label>Meta title<input value={row.title} onChange={(event) => setConfig({ ...config, pages: { ...config.pages, [path]: { ...row, title: event.target.value } } })} /></label>
          <label>Meta description<textarea value={row.description} onChange={(event) => setConfig({ ...config, pages: { ...config.pages, [path]: { ...row, description: event.target.value } } })} /></label>
          <label>Keywords<input value={row.keywords} onChange={(event) => setConfig({ ...config, pages: { ...config.pages, [path]: { ...row, keywords: event.target.value } } })} /></label>
          <label>OG title<input value={row.ogTitle || ""} onChange={(event) => setConfig({ ...config, pages: { ...config.pages, [path]: { ...row, ogTitle: event.target.value } } })} /></label>
          <label>OG description<input value={row.ogDescription || ""} onChange={(event) => setConfig({ ...config, pages: { ...config.pages, [path]: { ...row, ogDescription: event.target.value } } })} /></label>
          <label>OG image<input value={row.ogImage || ""} onChange={(event) => setConfig({ ...config, pages: { ...config.pages, [path]: { ...row, ogImage: event.target.value } } })} /></label>
          <label>Canonical<input value={row.canonical || ""} onChange={(event) => setConfig({ ...config, pages: { ...config.pages, [path]: { ...row, canonical: event.target.value } } })} /></label>
          <p className="ob-muted">Title {row.title.length}/60 · Description {row.description.length}/160</p>
          {!row.title || !row.description ? <p className="ob-note">This page is missing a title or description.</p> : null}
        </div>
        <div className="ob-form">
          <label>Title template<input value={config.seo.titleTemplate} onChange={(event) => setConfig({ ...config, seo: { ...config.seo, titleTemplate: event.target.value } })} /></label>
          <label>Robots disallow<input value={config.seo.disallow.join(", ")} onChange={(event) => setConfig({ ...config, seo: { ...config.seo, disallow: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) } })} /></label>
        </div>
        <button className="ob-btn primary" type="button" onClick={async () => {
          if (row.noindex && ["/", "/services", "/pricing", "/signup"].includes(path)) {
            setMessage("Noindex is blocked for this core page.");
            return;
          }
          const response = await fetch("/api/orbit/config", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(config) });
          setMessage(response.ok ? "SEO published." : "Save failed");
        }}>Publish SEO</button>
        <p className="ob-muted">Search preview: {row.title || "Page title"} — {row.description || "Description"}</p>
      </article>
      <article className="ob-card">
        <h2>Sitemap URLs</h2>
        {siteState.data?.urls.map((url) => <p key={url}>{url}</p>)}
        <h2>Redirect</h2>
        <form className="ob-form" onSubmit={async (event) => {
          event.preventDefault();
          try {
            await send("/api/orbit/site", redirect);
            setRedirect({ from: "", to: "" });
            siteState.reload();
          } catch (reason) {
            setMessage(reason instanceof Error ? reason.message : "Redirect failed");
          }
        }}>
          <label>From<input value={redirect.from} onChange={(event) => setRedirect({ ...redirect, from: event.target.value })} required /></label>
          <label>To<input value={redirect.to} onChange={(event) => setRedirect({ ...redirect, to: event.target.value })} required /></label>
          <button className="ob-btn" type="submit">Add redirect</button>
        </form>
        {siteState.data?.redirects.map((item) => <p key={item.id}>{item.from} → {item.to} <button className="ob-btn warn" type="button" onClick={async () => { await send("/api/orbit/site", { action: "delete", id: item.id }); siteState.reload(); }}>Delete</button></p>)}
      </article>
      {message ? <p>{message}</p> : null}
    </>
  );
}

export function MediaScreen() {
  const { data, reload } = useOrbit<{ items: { id: string; url: string; alt: string; name: string }[] }>("/api/orbit/media");
  const [alt, setAlt] = useState("");
  const [message, setMessage] = useState("");
  return (
    <>
      <form className="ob-form" onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const response = await fetch("/api/orbit/media", { method: "POST", body: form });
        const payload = await response.json();
        setMessage(response.ok ? payload.item.url : payload.error || "Upload failed");
        reload();
      }}>
        <label>Image<input name="file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" required /></label>
        <label>Alt text<input name="alt" value={alt} onChange={(event) => setAlt(event.target.value)} /></label>
        <button className="ob-btn primary" type="submit">Upload</button>
      </form>
      {message ? <p>{message}</p> : null}
      <div className="ob-grid">
        {data?.items.map((item) => (
          <article key={item.id} className="ob-card">
            <img src={item.url} alt={item.alt} style={{ width: "100%", borderRadius: 12 }} />
            <p>{item.alt}</p>
            <button className="ob-btn" type="button" onClick={() => navigator.clipboard.writeText(item.url)}>Copy URL</button>
            <button className="ob-btn warn" type="button" onClick={async () => { await fetch("/api/orbit/media", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: item.id }) }); reload(); }}>Delete</button>
          </article>
        ))}
      </div>
    </>
  );
}

export function SupportScreen() {
  const { data, error, reload } = useOrbit<{ tickets: { id: string; subject: string; status: string; priority: string; customer: string; messages: { author: string; body: string; createdAt: string }[] }[] }>("/api/orbit/support");
  const [open, setOpen] = useState("");
  const [reply, setReply] = useState("");
  const [message, setMessage] = useState("");
  const ticket = data?.tickets.find((item) => item.id === open);
  return (
    <>
      {error ? <p className="ob-error">{error}</p> : null}
      <div className="ob-table-wrap">
        <table className="ob-table">
          <thead><tr><th>Customer</th><th>Subject</th><th>Priority</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {data?.tickets.map((item) => <tr key={item.id}><td>{item.customer}</td><td>{item.subject}</td><td>{item.priority}</td><td>{item.status}</td><td><button className="ob-btn" type="button" onClick={() => setOpen(item.id)}>Open</button></td></tr>)}
          </tbody>
        </table>
      </div>
      {ticket ? (
        <article className="ob-card">
          <h2>{ticket.subject}</h2>
          {ticket.messages.map((item) => <p key={item.createdAt}>{item.author}: {item.body}</p>)}
          <textarea value={reply} onChange={(event) => setReply(event.target.value)} />
          <div className="ob-toolbar">
            <button className="ob-btn primary" type="button" onClick={async () => {
              try {
                await send("/api/orbit/support", { ticketId: ticket.id, body: reply, status: "answered" });
                setReply("");
                setMessage("Reply sent to the customer.");
                reload();
              } catch (reason) {
                setMessage(reason instanceof Error ? reason.message : "Reply failed");
              }
            }}>Send reply</button>
            <button className="ob-btn" type="button" onClick={async () => { await send("/api/orbit/support", { ticketId: ticket.id, body: "", status: "closed" }); reload(); }}>Close</button>
          </div>
        </article>
      ) : null}
      {message ? <p>{message}</p> : null}
    </>
  );
}

export function SettingsScreen() {
  const { data, reload } = useOrbit<OrbitSiteConfig>("/api/orbit/config");
  const [config, setConfig] = useState<OrbitSiteConfig | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => { if (data) setConfig(data); }, [data]);
  if (!config) return <p className="ob-muted">Loading settings…</p>;
  return (
    <>
      <article className="ob-card">
        <h2 style={{ marginTop: 0 }}>Contact</h2>
        <div className="ob-form">
          {(["email", "phone", "whatsapp", "telegram"] as const).map((key) => (
            <label key={key}>{key}<input value={config.contact[key]} onChange={(event) => setConfig({ ...config, contact: { ...config.contact, [key]: event.target.value } })} /></label>
          ))}
        </div>
        <button className="ob-btn primary" type="button" onClick={async () => {
          const response = await fetch("/api/orbit/config", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(config) });
          setMessage(response.ok ? "Contact published on the website." : "Save failed");
          reload();
        }}>Save contact</button>
      </article>
      <article className="ob-card">
        <h2>Access</h2>
        <p>This login is the Super Admin. Staff roles are not enabled, and every Orbit route checks the admin session on the server.</p>
        <p>Two-factor authentication is not enabled on this server.</p>
        <p>Email delivery is not configured, so Orbit will not pretend to send a test message.</p>
        <p>Payment gateway credentials stay in the server environment. The payments desk shows whether that gateway is live.</p>
      </article>
      {message ? <p>{message}</p> : null}
    </>
  );
}

export function ActivityScreen() {
  const { data, error } = useOrbit<{ activity: { id: string; actor: string; action: string; detail: string; createdAt: string }[] }>("/api/orbit/site");
  if (error) return <p className="ob-error">{error}</p>;
  return (
    <div className="ob-table-wrap">
      <table className="ob-table">
        <thead><tr><th>When</th><th>Admin</th><th>Action</th><th>Detail</th></tr></thead>
        <tbody>
          {data?.activity.length ? data.activity.map((row) => <tr key={row.id}><td>{row.createdAt.slice(0, 16).replace("T", " ")}</td><td>{row.actor}</td><td>{row.action}</td><td>{row.detail}</td></tr>) : <tr><td colSpan={4}>No admin actions recorded yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
