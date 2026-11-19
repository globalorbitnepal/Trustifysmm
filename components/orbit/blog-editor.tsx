"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ImageUrlField } from "@/components/orbit/cms-fields";
import { SeoScorePanel, SerpPreview } from "@/components/orbit/SeoScorePanel";
import { OrbitIcon } from "@/components/orbit/orbit-icons";
import { useOrbit } from "@/components/orbit/use-orbit";

type PostRow = {
  slug: string;
  title: string;
  status: string;
  source: string;
  category: string;
  publishedAt?: string;
};

type BlogForm = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  status: string;
  metaTitle: string;
  metaDescription: string;
  focusKeywords: string;
  secondaryKeywords: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  noindex: boolean;
  image: string;
};

const EMPTY_FORM: BlogForm = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  category: "Guides",
  status: "draft",
  metaTitle: "",
  metaDescription: "",
  focusKeywords: "",
  secondaryKeywords: "",
  canonical: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  noindex: false,
  image: "",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function wordCount(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

function readingMinutes(text: string) {
  return Math.max(1, Math.round(wordCount(text) / 220));
}

/**
 * Article editor. Two columns mirror a publishing workflow: write on the left,
 * publish and SEO on the right, with a live checklist that measures the fields in
 * this form rather than a fixed template.
 */
export function BlogScreen() {
  const { data, reload, loading } = useOrbit<{ posts: PostRow[] }>("/api/orbit/blog");
  const [form, setForm] = useState<BlogForm>(EMPTY_FORM);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft" | "scheduled">("all");
  const titleRef = useRef<HTMLInputElement>(null);
  const metaTitleRef = useRef<HTMLInputElement>(null);
  const metaDescRef = useRef<HTMLTextAreaElement>(null);
  const keywordRef = useRef<HTMLInputElement>(null);
  const ogTitleRef = useRef<HTMLInputElement>(null);
  const ogDescRef = useRef<HTMLInputElement>(null);
  const ogImageRef = useRef<HTMLInputElement>(null);

  const slug = form.slug || slugify(form.title);
  const posts = data?.posts ?? [];
  const visible = useMemo(
    () => (filter === "all" ? posts : posts.filter((post) => post.status === filter)),
    [posts, filter],
  );

  function patch(next: Partial<BlogForm>) {
    setForm((current) => ({ ...current, ...next }));
  }

  /** When the title changes and the slug was never hand-edited, keep the slug in sync. */
  function onTitleChange(value: string) {
    setForm((current) => ({
      ...current,
      title: value,
      slug: current.slug && current.slug !== slugify(current.title) ? current.slug : slugify(value),
    }));
  }

  async function save(status?: string) {
    setMessage("");
    setError("");
    const payload = status ? { ...form, status } : form;
    setSaving(status || "save");
    try {
      const response = await fetch("/api/orbit/blog", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error || "Could not save the article.");
      setForm((current) => ({ ...current, status: payload.status }));
      setMessage(payload.status === "published" ? "Published — live on /blogs now." : "Saved.");
      reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save the article.");
    } finally {
      setSaving("");
    }
  }

  function jumpTo(fieldId: string) {
    const map: Record<string, React.RefObject<HTMLElement | null>> = {
      "title-length": metaTitleRef,
      "desc-length": metaDescRef,
      "focus-keyword": keywordRef,
      "keyword-in-title": metaTitleRef,
      "keyword-in-slug": titleRef,
      "keyword-in-desc": metaDescRef,
      "og-title": ogTitleRef,
      "og-description": ogDescRef,
      "og-image": ogImageRef,
    };
    map[fieldId]?.current?.focus();
  }

  async function uploadCover(file: File) {
    setError("");
    const body = new FormData();
    body.append("file", file);
    body.append("alt", form.title || "Article cover");
    const response = await fetch("/api/orbit/media", { method: "POST", body });
    const payload = (await response.json()) as { item?: { url: string }; error?: string };
    if (!response.ok || !payload.item) {
      setError(payload.error || "Upload failed.");
      return;
    }
    patch({ image: payload.item.url });
  }

  async function editPost(post: PostRow) {
    if (post.source !== "orbit") {
      setMessage("Built-in articles are edited in source. Create a new article to override it.");
      return;
    }
    const response = await fetch(`/api/orbit/blog?slug=${encodeURIComponent(post.slug)}`);
    if (response.ok) {
      const body = (await response.json()) as { post?: Record<string, unknown> };
      const row = body.post;
      if (row) {
        setForm({
          title: String(row.title || ""),
          slug: String(row.slug || ""),
          excerpt: String(row.excerpt || ""),
          body: Array.isArray(row.blocks)
            ? (row.blocks as { type: string; text?: string; items?: string[] }[])
                .map((block) =>
                  block.type === "h2" ? `## ${block.text || ""}` : block.type === "ul" ? (block.items || []).map((i) => `- ${i}`).join("\n") : block.text || "",
                )
                .join("\n\n")
            : "",
          category: String(row.category || "Guides"),
          status: String(row.status || "draft"),
          metaTitle: String(row.metaTitle || ""),
          metaDescription: String(row.metaDescription || ""),
          focusKeywords: Array.isArray(row.focusKeywords) ? (row.focusKeywords as string[]).join(", ") : "",
          secondaryKeywords: Array.isArray(row.secondaryKeywords) ? (row.secondaryKeywords as string[]).join(", ") : "",
          canonical: String(row.canonical || ""),
          ogTitle: String(row.ogTitle || ""),
          ogDescription: String(row.ogDescription || ""),
          ogImage: String(row.ogImage || ""),
          noindex: Boolean(row.noindex),
          image: (row.image as { src?: string } | undefined)?.src || "",
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }

  const previewUrl = typeof window !== "undefined" ? `${window.location.origin}/blogs/${slug}` : `/blogs/${slug}`;

  return (
    <div className="ob-wp">
      <div className="ob-wp-head">
        <div>
          <h2 style={{ margin: 0 }}>{form.title ? "Edit article" : "Add new article"}</h2>
          <p className="ob-muted" style={{ margin: "4px 0 0" }}>
            {wordCount(form.body)} words · {readingMinutes(form.body)} min read
          </p>
        </div>
        <div className="ob-toolbar">
          <Link className="ob-btn ghost" href="/blogs" target="_blank">View blog ↗</Link>
          {form.status === "published" ? (
            <a className="ob-btn ghost" href={previewUrl} target="_blank" rel="noreferrer">Open live article ↗</a>
          ) : null}
        </div>
      </div>

      {message ? <p className="ob-reconcile-note ob-reconcile-note--ok">{message}</p> : null}
      {error ? <p className="ob-error">{error}</p> : null}

      <div className="ob-wp-grid">
        <div className="ob-wp-main">
          <article className="ob-card ob-wp-editor">
            <input
              ref={titleRef}
              className="ob-wp-title"
              value={form.title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Add title"
              aria-label="Article title"
            />
            <p className="ob-wp-permalink">
              trustifysmm.com/blogs/<strong>{slug || "your-slug"}</strong>
            </p>

            <div className="ob-wp-cover">
              {form.image ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.image} alt="" className="ob-wp-cover-img" />
                  <div className="ob-toolbar">
                    <label className="ob-btn ghost ob-wp-upload">
                      Replace cover
                      <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadCover(f); }} />
                    </label>
                    <button className="ob-btn ghost" type="button" onClick={() => patch({ image: "" })}>Remove</button>
                  </div>
                </>
              ) : (
                <label className="ob-wp-cover-empty">
                  <OrbitIcon name="media" />
                  <strong>Set cover image</strong>
                  <span>1200×630 recommended · PNG, JPG or WEBP</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadCover(f); }} />
                </label>
              )}
            </div>

            <label className="ob-wp-body-label">
              Article body
              <textarea
                className="ob-wp-body"
                value={form.body}
                onChange={(event) => patch({ body: event.target.value })}
                placeholder={"Start writing…\n\nUse ## Heading for a section break, - item for a list, and a blank line between paragraphs."}
              />
            </label>

            <label>
              Excerpt (shown on the blog index and in search results)
              <textarea value={form.excerpt} onChange={(event) => patch({ excerpt: event.target.value })} rows={3} />
            </label>
            <p className="ob-muted">Excerpt {form.excerpt.length} characters · aim for 100–180</p>
          </article>

          <article className="ob-card ob-form">
            <h3 style={{ marginTop: 0 }}>Search appearance</h3>
            <SerpPreview url={`trustifysmm.com/blogs/${slug || "your-slug"}`} title={form.ogTitle || form.metaTitle || form.title} description={form.ogDescription || form.metaDescription || form.excerpt} />
            <label>
              Meta title
              <input ref={metaTitleRef} value={form.metaTitle} onChange={(event) => patch({ metaTitle: event.target.value })} placeholder={form.title || "Search title"} />
            </label>
            <p className="ob-muted">Title {form.metaTitle.length}/60</p>
            <label>
              Meta description
              <textarea ref={metaDescRef} value={form.metaDescription} onChange={(event) => patch({ metaDescription: event.target.value })} rows={3} />
            </label>
            <p className="ob-muted">Description {form.metaDescription.length}/160</p>
            <label>
              Focus keyword
              <input ref={keywordRef} value={form.focusKeywords} onChange={(event) => patch({ focusKeywords: event.target.value })} placeholder="one phrase this article should rank for" />
            </label>
            <label>
              Secondary keywords
              <input value={form.secondaryKeywords} onChange={(event) => patch({ secondaryKeywords: event.target.value })} placeholder="comma separated" />
            </label>
            <label>
              Canonical URL
              <input value={form.canonical} onChange={(event) => patch({ canonical: event.target.value })} placeholder={`https://trustifysmm.com/blogs/${slug || "your-slug"}`} />
            </label>
            <label className="ob-wp-check">
              <input type="checkbox" checked={form.noindex} onChange={(event) => patch({ noindex: event.target.checked })} />
              Noindex — exclude this article from Google and the sitemap
            </label>
            <h3>Social sharing</h3>
            <label>
              OG title
              <input ref={ogTitleRef} value={form.ogTitle} onChange={(event) => patch({ ogTitle: event.target.value })} />
            </label>
            <label>
              OG description
              <input ref={ogDescRef} value={form.ogDescription} onChange={(event) => patch({ ogDescription: event.target.value })} />
            </label>
            <div ref={ogImageRef as unknown as React.RefObject<HTMLDivElement>}>
              <ImageUrlField
                label="OG image"
                value={form.ogImage}
                onChange={(url) => patch({ ogImage: url })}
                onClear={() => patch({ ogImage: "" })}
                hint="Falls back to the article cover image when empty."
              />
            </div>
          </article>
        </div>

        <aside className="ob-wp-side">
          <article className="ob-card ob-wp-publish">
            <h3 style={{ marginTop: 0 }}>Publish</h3>
            <label>
              Status
              <select value={form.status} onChange={(event) => patch({ status: event.target.value })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </label>
            <label>
              Category
              <input value={form.category} onChange={(event) => patch({ category: event.target.value })} />
            </label>
            <label>
              Slug
              <input value={form.slug} onChange={(event) => patch({ slug: slugify(event.target.value) })} placeholder={slugify(form.title)} />
            </label>
            <div className="ob-wp-publish-actions">
              <button className="ob-btn" type="button" disabled={saving !== ""} onClick={() => void save("draft")}>
                {saving === "draft" ? "Saving…" : "Save draft"}
              </button>
              <button className="ob-btn primary" type="button" disabled={saving !== ""} onClick={() => void save("published")}>
                {saving === "published" ? "Publishing…" : "Publish"}
              </button>
            </div>
            <button
              className="ob-btn ghost ob-wp-copy"
              type="button"
              onClick={() => { void navigator.clipboard.writeText(previewUrl); setMessage("Preview link copied."); }}
            >
              Copy preview link
            </button>
          </article>

          <article className="ob-card">
            <h3 style={{ marginTop: 0 }}>SEO score</h3>
            <SeoScorePanel
              input={{
                title: form.metaTitle || form.title,
                description: form.metaDescription || form.excerpt,
                focusKeyword: form.focusKeywords.split(",")[0] || "",
                slug,
                ogTitle: form.ogTitle,
                ogDescription: form.ogDescription,
                ogImage: form.ogImage || form.image,
              }}
              onJump={jumpTo}
            />
          </article>

          <article className="ob-card">
            <h3 style={{ marginTop: 0 }}>Cover image</h3>
            <ImageUrlField
              label="Cover URL"
              value={form.image}
              onChange={(url) => patch({ image: url })}
              onClear={() => patch({ image: "" })}
              hint="Upload in Media Library, then paste the URL here."
            />
          </article>
        </aside>
      </div>

      <article className="ob-card">
        <div className="ob-panel-head">
          <h3 style={{ margin: 0 }}>All articles</h3>
          <div className="ob-filter-row">
            {(["all", "published", "draft", "scheduled"] as const).map((key) => (
              <button key={key} type="button" className={filter === key ? "is-on" : ""} onClick={() => setFilter(key)}>
                {key === "all" ? "All" : key.charAt(0).toUpperCase() + key.slice(1)}
                {key !== "all" ? ` (${posts.filter((p) => p.status === key).length})` : ` (${posts.length})`}
              </button>
            ))}
          </div>
        </div>
        {loading ? <p className="ob-muted">Loading articles…</p> : null}
        <div className="ob-table-wrap" style={{ boxShadow: "none", border: 0 }}>
          <table className="ob-table">
            <thead>
              <tr><th>Article</th><th>Category</th><th>Status</th><th>Published</th><th></th></tr>
            </thead>
            <tbody>
              {visible.map((post) => (
                <tr key={post.slug}>
                  <td data-label="Article"><strong>{post.title}</strong><br /><code className="ob-url">/blogs/{post.slug}</code></td>
                  <td data-label="Category">{post.category}</td>
                  <td data-label="Status">{post.status}</td>
                  <td data-label="Published">{post.publishedAt ? post.publishedAt.slice(0, 10) : "—"}</td>
                  <td data-label="Actions">
                    <div className="ob-toolbar">
                      {post.source === "orbit" ? (
                        <>
                          <button className="ob-btn" type="button" onClick={() => void editPost(post)}>Edit</button>
                          <button
                            className="ob-btn warn"
                            type="button"
                            onClick={async () => {
                              if (!window.confirm(`Delete “${post.title}”?`)) return;
                              await fetch("/api/orbit/blog", {
                                method: "POST",
                                headers: { "content-type": "application/json" },
                                body: JSON.stringify({ action: "delete", slug: post.slug }),
                              });
                              reload();
                            }}
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <span className="ob-muted">Built-in</span>
                      )}
                      <a className="ob-btn ghost" href={`/blogs/${post.slug}`} target="_blank" rel="noreferrer">View</a>
                    </div>
                  </td>
                </tr>
              ))}
              {!visible.length && !loading ? (
                <tr><td colSpan={5} className="ob-muted">No articles in this filter yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
