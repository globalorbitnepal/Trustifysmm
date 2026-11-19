"use client";

import { useState } from "react";
import type { CustomerReview } from "@/lib/orbit/types";

/**
 * Editor for the homepage review carousel. Each row maps to one card on the live site,
 * including the avatar, so replacing a photo is a single upload plus Publish.
 */
export function ReviewsEditor({
  reviews,
  onChange,
}: {
  reviews: CustomerReview[];
  onChange: (next: CustomerReview[]) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  function patch(index: number, next: Partial<CustomerReview>) {
    onChange(reviews.map((row, i) => (i === index ? { ...row, ...next } : row)));
  }

  async function upload(index: number, file: File) {
    setError("");
    setBusy(`avatar-${index}`);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("alt", reviews[index]?.name || "Customer review");
      const response = await fetch("/api/orbit/media", { method: "POST", body });
      const payload = (await response.json()) as { item?: { url: string }; error?: string };
      if (!response.ok || !payload.item) throw new Error(payload.error || "Upload failed.");
      patch(index, { avatar: payload.item.url });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <article className="ob-card ob-form">
      <div className="ob-panel-head">
        <div>
          <h3 style={{ margin: 0 }}>Customer reviews</h3>
          <p className="ob-muted" style={{ margin: "4px 0 0" }}>
            These cards appear in the homepage carousel. Replace a photo, edit the quote or
            change the country, then Publish. The live site updates immediately.
          </p>
        </div>
        <button
          className="ob-btn"
          type="button"
          onClick={() =>
            onChange([
              ...reviews,
              { name: "New customer", country: "Country", flag: "🌍", avatar: "", text: "", tone: "violet" },
            ])
          }
        >
          Add review
        </button>
      </div>

      {error ? <p className="ob-error">{error}</p> : null}

      <div className="ob-review-list">
        {reviews.map((review, index) => (
          <div key={`${review.name}-${index}`} className="ob-review-row">
            <div className="ob-review-media">
              <div className="ob-review-avatar">
                {review.avatar ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={review.avatar} alt="" width={72} height={72} />
                ) : (
                  <span aria-hidden>{(review.name || "?").charAt(0).toUpperCase()}</span>
                )}
              </div>
              <label className="ob-btn ghost ob-review-upload">
                {busy === `avatar-${index}` ? "Uploading…" : review.avatar ? "Replace photo" : "Upload photo"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void upload(index, file);
                    event.target.value = "";
                  }}
                />
              </label>
              {review.avatar ? (
                <button className="ob-btn ghost" type="button" onClick={() => patch(index, { avatar: "" })}>
                  Remove
                </button>
              ) : null}
            </div>

            <div className="ob-review-fields">
              <label>
                Name
                <input value={review.name} onChange={(event) => patch(index, { name: event.target.value })} />
              </label>
              <label>
                Country
                <input value={review.country} onChange={(event) => patch(index, { country: event.target.value })} />
              </label>
              <label>
                Flag emoji
                <input value={review.flag} onChange={(event) => patch(index, { flag: event.target.value })} maxLength={4} />
              </label>
              <label>
                Card tone
                <select value={review.tone} onChange={(event) => patch(index, { tone: event.target.value === "blue" ? "blue" : "violet" })}>
                  <option value="violet">Violet</option>
                  <option value="blue">Blue</option>
                </select>
              </label>
              <label className="ob-review-quote">
                Quote
                <textarea value={review.text} onChange={(event) => patch(index, { text: event.target.value })} rows={3} />
              </label>
            </div>

            <div className="ob-review-actions">
              <button
                className="ob-btn"
                type="button"
                disabled={index === 0}
                onClick={() => {
                  if (index === 0) return;
                  const next = [...reviews];
                  [next[index - 1], next[index]] = [next[index], next[index - 1]];
                  onChange(next);
                }}
              >
                ↑
              </button>
              <button
                className="ob-btn"
                type="button"
                disabled={index === reviews.length - 1}
                onClick={() => {
                  if (index === reviews.length - 1) return;
                  const next = [...reviews];
                  [next[index + 1], next[index]] = [next[index], next[index + 1]];
                  onChange(next);
                }}
              >
                ↓
              </button>
              <button
                className="ob-btn warn"
                type="button"
                onClick={() => onChange(reviews.filter((_, i) => i !== index))}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {!reviews.length ? <p className="ob-muted">No reviews yet. Add one to fill the homepage carousel.</p> : null}
      </div>
    </article>
  );
}
