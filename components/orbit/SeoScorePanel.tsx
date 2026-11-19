"use client";

import { seoChecks, seoGrade, seoScore, type SeoInput } from "@/components/orbit/seo-score";

/**
 * Live SEO checklist. Every row reflects a field the editor can change in this form,
 * so the score is a genuine readiness signal rather than decoration.
 */
export function SeoScorePanel({ input, onJump }: { input: SeoInput; onJump?: (field: string) => void }) {
  const checks = seoChecks(input);
  const score = seoScore(checks);
  const grade = seoGrade(score);

  return (
    <div className="ob-seo-panel">
      <div className={`ob-seo-gauge ob-seo-gauge--${grade.tone}`}>
        <div className="ob-seo-gauge-ring" style={{ ["--pct" as string]: `${score}%` }}>
          <strong>{score}</strong>
          <span>/100</span>
        </div>
        <div className="ob-seo-gauge-copy">
          <strong>{grade.label}</strong>
          <span>
            {checks.filter((c) => c.state === 2).length} of {checks.length} checks passing
          </span>
        </div>
      </div>

      <ul className="ob-seo-list">
        {checks.map((check) => (
          <li key={check.id} className={`ob-seo-row ob-seo-row--${check.state === 2 ? "pass" : check.state === 1 ? "warn" : "fail"}`}>
            <span className="ob-seo-dot" aria-hidden />
            <div>
              <strong>{check.label}</strong>
              <span>{check.hint}</span>
            </div>
            {check.state !== 2 && onJump ? (
              <button type="button" className="ob-seo-fix" onClick={() => onJump(check.id)}>
                Fix
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Approximate Google SERP preview so editors see truncation before publishing. */
export function SerpPreview({ url, title, description }: { url: string; title: string; description: string }) {
  const shownTitle = title.length > 60 ? `${title.slice(0, 57)}…` : title || "Page title";
  const shownDesc = description.length > 160 ? `${description.slice(0, 157)}…` : description || "Meta description";
  return (
    <div className="ob-serp">
      <p className="ob-serp-url">{url}</p>
      <p className="ob-serp-title">{shownTitle}</p>
      <p className="ob-serp-desc">{shownDesc}</p>
    </div>
  );
}
