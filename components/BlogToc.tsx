"use client";

import { useEffect, useState } from "react";
import type { BlogTocItem } from "@/data/blog-types";

export function BlogToc({ items, title }: { items: BlogTocItem[]; title: string }) {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActive(visible.target.id);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    for (const el of sections) observer.observe(el);
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav className="blog-toc" aria-label="Sections in this article">
      <p className="blog-toc-label">On this page</p>
      <p className="blog-toc-title">{title}</p>
      <ol className="blog-toc-list">
        {items.map((item) => (
          <li key={item.id} className={item.level === 3 ? "blog-toc-depth" : undefined}>
            <a href={`#${item.id}`} className={active === item.id ? "is-active" : undefined} onClick={() => setActive(item.id)}>
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}