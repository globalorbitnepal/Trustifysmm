"use client";

import { Fragment, useEffect, useState } from "react";
import { send, usd, useOrbit } from "@/components/orbit/use-orbit";

type ServiceRow = {
  id: number;
  name: string;
  platform: string;
  group: string;
  rate: number;
  editRate: number;
  cost: number | null;
  margin: number | null;
  min?: string;
  max?: string;
  avgTime?: string;
  description?: string;
  refill?: boolean;
  featured?: boolean;
  custom: boolean;
  overridden?: boolean;
};
type ServicesPayload = {
  items: ServiceRow[];
  total: number;
  page: number;
  pages: number;
  globalMarkupPercent: number;
  categories: { id: string; name: string; platform: string; description: string; active: boolean; services: number }[];
  platforms: { id: string; label: string }[];
};

const EMPTY = {
  name: "",
  platform: "instagram",
  group: "",
  ratePer1000: "",
  costPer1000: "",
  minOrder: "10",
  maxOrder: "100000",
  description: "",
  avgTime: "",
};

export function ServicesScreen() {
  const [q, setQ] = useState("");
  const [platform, setPlatform] = useState("");
  const [group, setGroup] = useState("");
  const [page, setPage] = useState(1);
  const { data, error, reload } = useOrbit<ServicesPayload>(
    `/api/orbit/services?q=${encodeURIComponent(q)}&platform=${encodeURIComponent(platform)}&group=${encodeURIComponent(group)}&page=${page}`,
  );
  const [openId, setOpenId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [markup, setMarkup] = useState("");
  const [bulk, setBulk] = useState({ percent: "", platform: "", group: "" });
  const [created, setCreated] = useState({ ...EMPTY });
  const [showCreate, setShowCreate] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", platform: "instagram", description: "" });
  const [categoryDraft, setCategoryDraft] = useState<Record<string, { name: string; platform: string; description: string }>>({});

  useEffect(() => {
    if (data && !markup) setMarkup(String(data.globalMarkupPercent ?? 0));
  }, [data, markup]);

  async function act(body: Record<string, unknown>, note?: string) {
    setMessage("");
    try {
      const result = await send("/api/orbit/services", body);
      if (result.count !== undefined) setMessage(`Updated ${result.count} services.`);
      else if (note) setMessage(note);
      reload();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Save failed");
    }
  }

  function startEdit(row: ServiceRow) {
    setOpenId(row.id);
    setDraft({
      name: row.name,
      group: row.group,
      platform: row.platform,
      ratePer1000: String(row.editRate),
      costPer1000: row.cost === null ? "" : String(row.cost),
      minOrder: row.min ?? "",
      maxOrder: row.max ?? "",
      avgTime: row.avgTime ?? "",
      description: row.description ?? "",
      refill: row.refill ? "1" : "",
      featured: row.featured ? "1" : "",
    });
  }

  async function saveEdit(row: ServiceRow) {
    await act({
      action: "update",
      id: row.id,
      name: draft.name,
      group: draft.group,
      platform: draft.platform,
      ratePer1000: Number(draft.ratePer1000),
      costPer1000: draft.costPer1000 === "" ? undefined : Number(draft.costPer1000),
      minOrder: draft.minOrder,
      maxOrder: draft.maxOrder,
      avgTime: draft.avgTime,
      description: draft.description,
      refill: draft.refill === "1",
      featured: draft.featured === "1",
    }, `Service #${row.id} saved.`);
    setOpenId(null);
  }

  return (
    <>
      <div className="ob-toolbar ob-toolbar--sticky">
        <input placeholder="Search ID, name, category, platform" value={q} onChange={(event) => { setQ(event.target.value); setPage(1); }} />
        <select value={platform} onChange={(event) => { setPlatform(event.target.value); setGroup(""); setPage(1); }} aria-label="Platform">
          <option value="">All platforms</option>
          {(data?.platforms ?? []).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        <select value={group} onChange={(event) => { setGroup(event.target.value); setPage(1); }} aria-label="Category">
          <option value="">All categories</option>
          {(data?.categories ?? []).filter((category) => !platform || category.platform === platform || category.platform === "other").map((category) => (
            <option key={category.id} value={category.name}>{category.name} ({category.services})</option>
          ))}
        </select>
        <input placeholder="Global markup %" value={markup} onChange={(event) => setMarkup(event.target.value)} />
        <button className="ob-btn" type="button" onClick={() => act({ action: "markup", percent: Number(markup) }, "Global markup saved.")}>Save markup</button>
        <button className="ob-btn primary" type="button" onClick={() => setShowCreate((value) => !value)}>{showCreate ? "Close" : "+ New service"}</button>
      </div>

      <p className="ob-muted">
        {data ? `${data.total} live services · page ${data.page} of ${data.pages}` : "Loading services…"} · Changes publish to the customer catalog immediately. Global markup {data?.globalMarkupPercent ?? 0}% is applied on top.
      </p>
      {error ? <p className="ob-error">{error}</p> : null}
      {message ? <p className="ob-note">{message}</p> : null}

      {showCreate ? (
        <article className="ob-card ob-form">
          <h3>Create a service</h3>
          <label>Name<input value={created.name} onChange={(event) => setCreated({ ...created, name: event.target.value })} /></label>
          <label>Platform
            <select value={created.platform} onChange={(event) => setCreated({ ...created, platform: event.target.value })}>
              {(data?.platforms ?? []).map((platform) => <option key={platform.id} value={platform.id}>{platform.label}</option>)}
            </select>
          </label>
          <label>Category<input value={created.group} onChange={(event) => setCreated({ ...created, group: event.target.value })} /></label>
          <label>Sell / 1K<input value={created.ratePer1000} onChange={(event) => setCreated({ ...created, ratePer1000: event.target.value })} /></label>
          <label>Cost / 1K<input value={created.costPer1000} onChange={(event) => setCreated({ ...created, costPer1000: event.target.value })} /></label>
          <label>Min<input value={created.minOrder} onChange={(event) => setCreated({ ...created, minOrder: event.target.value })} /></label>
          <label>Max<input value={created.maxOrder} onChange={(event) => setCreated({ ...created, maxOrder: event.target.value })} /></label>
          <label>Average time<input value={created.avgTime} onChange={(event) => setCreated({ ...created, avgTime: event.target.value })} placeholder="0-1 hour" /></label>
          <label>Description<textarea value={created.description} onChange={(event) => setCreated({ ...created, description: event.target.value })} /></label>
          <button
            className="ob-btn primary"
            type="button"
            onClick={async () => {
              await act({
                action: "create",
                ...created,
                ratePer1000: Number(created.ratePer1000),
                costPer1000: created.costPer1000 ? Number(created.costPer1000) : undefined,
              }, "Service created.");
              setCreated({ ...EMPTY });
              setShowCreate(false);
            }}
          >
            Create service
          </button>
        </article>
      ) : null}

      <article className="ob-card ob-form">
        <h3>Bulk adjust</h3>
        <div className="ob-toolbar">
          <input placeholder="Percent (+/-)" value={bulk.percent} onChange={(event) => setBulk({ ...bulk, percent: event.target.value })} />
          <select value={bulk.platform} onChange={(event) => setBulk({ ...bulk, platform: event.target.value })}>
            <option value="">All platforms</option>
            {(data?.platforms ?? []).map((platform) => <option key={platform.id} value={platform.id}>{platform.label}</option>)}
          </select>
          <input placeholder="Category (optional)" value={bulk.group} onChange={(event) => setBulk({ ...bulk, group: event.target.value })} />
          <button className="ob-btn" type="button" onClick={() => act({ action: "bulk", percent: Number(bulk.percent), platform: bulk.platform, group: bulk.group })}>Apply</button>
        </div>
      </article>

      <div className="ob-table-wrap">
        <table className="ob-table">
          <thead>
            <tr><th>ID</th><th>Service</th><th>Customer /1K</th><th>Cost</th><th>Margin</th><th>Min / Max</th><th></th></tr>
          </thead>
          <tbody>
            {data?.items.map((row) => (
              <Fragment key={row.id}>
                <tr>
                  <td>{row.id}</td>
                  <td>
                    <strong>{row.name}</strong>
                    <div className="ob-muted">{row.platform} · {row.group}</div>
                  </td>
                  <td>{usd(row.rate)}</td>
                  <td>{row.cost === null ? "—" : usd(row.cost)}</td>
                  <td>{row.margin === null ? "—" : usd(row.margin)}</td>
                  <td>{row.min ?? "—"} / {row.max ?? "—"}</td>
                  <td>
                    <div className="ob-toolbar">
                      <button className="ob-btn" type="button" onClick={() => (openId === row.id ? setOpenId(null) : startEdit(row))}>{openId === row.id ? "Close" : "Full edit"}</button>
                      <button className="ob-btn" type="button" onClick={() => act({ action: "duplicate", id: row.id }, "Service duplicated.")}>Copy</button>
                      <button className="ob-btn warn" type="button" onClick={() => act({ action: "hide", id: row.id }, row.custom ? "Custom service deleted." : "Service hidden.")}>{row.custom ? "Delete" : "Hide"}</button>
                    </div>
                  </td>
                </tr>
                {openId === row.id ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="ob-form ob-edit-grid">
                        <label>Name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
                        <label>Platform
                          <select value={draft.platform} onChange={(event) => setDraft({ ...draft, platform: event.target.value })}>
                            {(data?.platforms ?? []).map((platform) => <option key={platform.id} value={platform.id}>{platform.label}</option>)}
                          </select>
                        </label>
                        <label>Category<input value={draft.group} onChange={(event) => setDraft({ ...draft, group: event.target.value })} /></label>
                        <label>Sell / 1K<input value={draft.ratePer1000} onChange={(event) => setDraft({ ...draft, ratePer1000: event.target.value })} /></label>
                        <label>Cost / 1K<input value={draft.costPer1000} onChange={(event) => setDraft({ ...draft, costPer1000: event.target.value })} /></label>
                        <label>Min order<input value={draft.minOrder} onChange={(event) => setDraft({ ...draft, minOrder: event.target.value })} /></label>
                        <label>Max order<input value={draft.maxOrder} onChange={(event) => setDraft({ ...draft, maxOrder: event.target.value })} /></label>
                        <label>Average time<input value={draft.avgTime} onChange={(event) => setDraft({ ...draft, avgTime: event.target.value })} /></label>
                        <label>Description<textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
                        <label><input type="checkbox" checked={draft.refill === "1"} onChange={(event) => setDraft({ ...draft, refill: event.target.checked ? "1" : "" })} /> Refill</label>
                        <label><input type="checkbox" checked={draft.featured === "1"} onChange={(event) => setDraft({ ...draft, featured: event.target.checked ? "1" : "" })} /> Featured</label>
                        <div className="ob-toolbar">
                          <button className="ob-btn primary" type="button" onClick={() => saveEdit(row)}>Save service</button>
                          <button className="ob-btn" type="button" onClick={() => setOpenId(null)}>Cancel</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
            {!data?.items.length ? <tr><td colSpan={7}>No services match this search.</td></tr> : null}
          </tbody>
        </table>
      </div>

      <div className="ob-toolbar">
        <button className="ob-btn" type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
        <span>Page {page} / {data?.pages || 1}</span>
        <button className="ob-btn" type="button" disabled={!data || page >= data.pages} onClick={() => setPage((value) => value + 1)}>Next</button>
      </div>

      <article className="ob-card" id="categories">
        <h3 style={{ marginTop: 0 }}>All categories</h3>
        <p className="ob-muted">Same groups the public Services page uses. Rename, hide, or add a new category — it publishes with the catalog.</p>
        <div className="ob-form">
          <label>New category<input value={newCategory.name} onChange={(event) => setNewCategory({ ...newCategory, name: event.target.value })} placeholder="Instagram Followers" /></label>
          <label>Platform
            <select value={newCategory.platform} onChange={(event) => setNewCategory({ ...newCategory, platform: event.target.value })}>
              {(data?.platforms ?? []).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label>Description<input value={newCategory.description} onChange={(event) => setNewCategory({ ...newCategory, description: event.target.value })} /></label>
          <button
            className="ob-btn primary"
            type="button"
            onClick={async () => {
              await act({ action: "category", name: newCategory.name, platform: newCategory.platform, description: newCategory.description, active: true }, "Category created.");
              setNewCategory({ name: "", platform: newCategory.platform, description: "" });
            }}
          >
            Add category
          </button>
        </div>
        <div className="ob-table-wrap">
          <table className="ob-table">
            <thead><tr><th>Category</th><th>Platform</th><th>Services</th><th></th></tr></thead>
            <tbody>
              {data?.categories.map((category) => {
                const draftRow = categoryDraft[category.id] ?? { name: category.name, platform: category.platform, description: category.description || "" };
                return (
                  <tr key={category.id}>
                    <td>
                      <input value={draftRow.name} onChange={(event) => setCategoryDraft({ ...categoryDraft, [category.id]: { ...draftRow, name: event.target.value } })} />
                    </td>
                    <td>
                      <select value={draftRow.platform} onChange={(event) => setCategoryDraft({ ...categoryDraft, [category.id]: { ...draftRow, platform: event.target.value } })}>
                        {(data?.platforms ?? []).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                      </select>
                    </td>
                    <td>{category.services}</td>
                    <td>
                      <div className="ob-toolbar">
                        <button
                          className="ob-btn primary"
                          type="button"
                          onClick={() => act({
                            action: "category",
                            id: category.id,
                            name: draftRow.name,
                            previousName: category.name,
                            platform: draftRow.platform,
                            description: draftRow.description,
                            active: category.active,
                          }, "Category saved.")}
                        >
                          Save
                        </button>
                        <button
                          className="ob-btn"
                          type="button"
                          onClick={() => act({ action: "category", id: category.id, name: draftRow.name, previousName: category.name, platform: draftRow.platform, active: !category.active }, category.active ? "Category hidden on the site." : "Category visible.")}
                        >
                          {category.active ? "Hide" : "Show"}
                        </button>
                        {!category.id.startsWith("group:") ? (
                          <button className="ob-btn warn" type="button" onClick={() => act({ action: "delete-category", id: category.id }, "Category deleted.")}>Delete</button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>
    </>
  );
}
