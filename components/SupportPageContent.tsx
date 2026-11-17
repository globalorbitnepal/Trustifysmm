"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  supportChannels,
  supportFaqCategories,
  supportQuickLinks,
} from "@/data/support-faq";

export function SupportPageContent({
  email = "support@trustifysmm.com",
  phone = "",
  whatsapp = "",
}: {
  email?: string;
  phone?: string;
  whatsapp?: string;
}) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const q = query.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    return supportFaqCategories
      .map((cat) => {
        if (activeCategory !== "all" && cat.id !== activeCategory) return null;
        const items = cat.items.filter(
          (item) =>
            !q ||
            item.q.toLowerCase().includes(q) ||
            item.a.toLowerCase().includes(q),
        );
        if (items.length === 0) return null;
        return { ...cat, items };
      })
      .filter(Boolean) as typeof supportFaqCategories;
  }, [q, activeCategory]);

  const totalFaqs = supportFaqCategories.reduce((n, c) => n + c.items.length, 0);

  return (
    <div className="support-layout">
      <aside className="support-rail" aria-label="Help topics">
        <p className="support-rail-title">Topics</p>
        <button
          type="button"
          className={activeCategory === "all" ? "is-active" : undefined}
          onClick={() => setActiveCategory("all")}
        >
          All FAQs
          <span>{totalFaqs}</span>
        </button>
        {supportFaqCategories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={activeCategory === cat.id ? "is-active" : undefined}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.title}
            <span>{cat.items.length}</span>
          </button>
        ))}
        <a href="#contact" className="support-rail-cta">
          Contact options
        </a>
      </aside>

      <div className="support-main">
        <div className="support-search">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders, payments, API, refills…"
            aria-label="Search help articles"
          />
        </div>

        <div className="support-channels" id="contact">
          <article className="support-channel-card">
            <h2>Email support</h2>
            <p>Billing, API issues, refill disputes, account access</p>
            <p className="support-channel-sla">Typical reply within 4–12 hours</p>
            <a className="btn btn-primary support-channel-btn" href={`mailto:${email}`}>{email}</a>
          </article>
          {phone ? (
            <article className="support-channel-card">
              <h2>Phone</h2>
              <p>Call the number published by TrustifySMM.</p>
              <a className="btn btn-primary support-channel-btn" href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a>
            </article>
          ) : null}
          {whatsapp ? (
            <article className="support-channel-card">
              <h2>WhatsApp</h2>
              <p>Message the official WhatsApp contact.</p>
              <a className="btn btn-primary support-channel-btn" href={whatsapp.startsWith("http") ? whatsapp : `https://wa.me/${whatsapp.replace(/[^\d]/g, "")}`}>Open WhatsApp</a>
            </article>
          ) : null}
          {supportChannels.filter((ch) => ch.id !== "email").map((ch) => (
            <article key={ch.id} className="support-channel-card">
              <h2>{ch.title}</h2>
              <p>{ch.detail}</p>
              <p className="support-channel-sla">{ch.sla}</p>
              <a className="btn btn-primary support-channel-btn" href={ch.href}>
                {ch.action}
              </a>
            </article>
          ))}
        </div>

        <div className="support-quicklinks">
          <h2 className="support-section-title">Quick links</h2>
          <div className="support-quicklinks-grid">
            {supportQuickLinks.map((link) => (
              <Link key={link.href} href={link.href} className="support-quicklink">
                <strong>{link.label}</strong>
                <span>{link.desc}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="support-faq" id="support-faq">
          <h2 className="support-section-title">
            Frequently asked <span className="grad">questions</span>
          </h2>
          <p className="support-faq-lede">
            Professional answers for buyers, agencies and API resellers. Expand any question for step-by-step
            guidance.
          </p>

          {filteredCategories.length === 0 ? (
            <p className="support-empty">No matches — try another keyword or pick a topic on the left.</p>
          ) : (
            filteredCategories.map((cat) => (
              <section key={cat.id} id={cat.id} className="support-faq-category">
                <header>
                  <h3>{cat.title}</h3>
                  <p>{cat.description}</p>
                </header>
                <div className="blog-post-faq-list">
                  {cat.items.map((item) => (
                    <details key={item.q} className="blog-post-faq-item">
                      <summary>{item.q}</summary>
                      <p>{item.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}