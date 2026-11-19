/**
 * Shared SEO scoring used by the Orbit editors. It measures only what an editor can
 * actually control in the form, so the checklist stays honest rather than decorative.
 */

export type SeoCheck = {
  id: string;
  label: string;
  hint: string;
  /** 0 = fail, 1 = warning, 2 = pass */
  state: 0 | 1 | 2;
};

export type SeoInput = {
  title: string;
  description: string;
  focusKeyword: string;
  slug: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
};

function includesKeyword(haystack: string, keyword: string) {
  if (!keyword.trim()) return false;
  return haystack.toLowerCase().includes(keyword.trim().toLowerCase());
}

export function seoChecks(input: SeoInput): SeoCheck[] {
  const title = input.title.trim();
  const description = input.description.trim();
  const keyword = input.focusKeyword.trim();

  const titleLength: SeoCheck["state"] =
    title.length === 0 ? 0 : title.length < 30 ? 1 : title.length <= 60 ? 2 : title.length <= 70 ? 1 : 0;
  const descLength: SeoCheck["state"] =
    description.length === 0 ? 0 : description.length < 120 ? 1 : description.length <= 160 ? 2 : description.length <= 180 ? 1 : 0;

  return [
    {
      id: "title-length",
      label: "SEO title is 30–60 characters",
      hint: title ? `${title.length} characters` : "Add a meta title",
      state: titleLength,
    },
    {
      id: "desc-length",
      label: "Meta description is 120–160 characters",
      hint: description ? `${description.length} characters` : "Add a meta description",
      state: descLength,
    },
    {
      id: "focus-keyword",
      label: "Focus keyword is set",
      hint: keyword ? `“${keyword}”` : "Pick the one phrase this page should rank for",
      state: keyword ? 2 : 0,
    },
    {
      id: "keyword-in-title",
      label: "Focus keyword appears in the title",
      hint: keyword && title ? (includesKeyword(title, keyword) ? "Found" : "Not present") : "Needs title and keyword",
      state: !keyword || !title ? 0 : includesKeyword(title, keyword) ? 2 : 0,
    },
    {
      id: "keyword-in-slug",
      label: "Focus keyword appears in the URL",
      hint: keyword && input.slug ? (includesKeyword(input.slug.replace(/-/g, " "), keyword) ? "Found" : "Not present") : "Needs URL and keyword",
      state: !keyword || !input.slug ? 0 : includesKeyword(input.slug.replace(/-/g, " "), keyword) ? 2 : 1,
    },
    {
      id: "keyword-in-desc",
      label: "Focus keyword appears in the description",
      hint: keyword && description ? (includesKeyword(description, keyword) ? "Found" : "Not present") : "Needs description and keyword",
      state: !keyword || !description ? 0 : includesKeyword(description, keyword) ? 2 : 0,
    },
    {
      id: "og-title",
      label: "Social (OG) title is set",
      hint: input.ogTitle?.trim() ? "Set" : "Falls back to the SEO title",
      state: input.ogTitle?.trim() ? 2 : 1,
    },
    {
      id: "og-description",
      label: "Social (OG) description is set",
      hint: input.ogDescription?.trim() ? "Set" : "Falls back to the meta description",
      state: input.ogDescription?.trim() ? 2 : 1,
    },
    {
      id: "og-image",
      label: "Social share image is set",
      hint: input.ogImage?.trim() ? "Set" : "Falls back to the default brand card",
      state: input.ogImage?.trim() ? 2 : 1,
    },
  ];
}

export function seoScore(checks: SeoCheck[]) {
  const max = checks.length * 2;
  const earned = checks.reduce((sum, check) => sum + check.state, 0);
  return Math.round((earned / max) * 100);
}

export function seoGrade(score: number): { label: string; tone: "bad" | "warn" | "good" } {
  if (score >= 85) return { label: "Excellent", tone: "good" };
  if (score >= 60) return { label: "Needs work", tone: "warn" };
  return { label: "Poor", tone: "bad" };
}
