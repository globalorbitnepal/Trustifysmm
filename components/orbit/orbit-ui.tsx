"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export function usd(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function greet() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function StatusPill({ status }: { status: string }) {
  const key = status.toLowerCase();
  const tone =
    key.includes("complete") || key === "paid" || key === "active" || key === "answered"
      ? "good"
      : key.includes("process") || key === "in progress"
        ? "info"
        : key.includes("pending") || key === "confirming" || key === "open"
          ? "warn"
          : key.includes("fail") || key.includes("cancel") || key === "suspended" || key === "expired"
            ? "bad"
            : "muted";
  return <span className={`ob-pill-tone ob-pill-tone--${tone}`}>{status}</span>;
}

export function Sparkline({ values }: { values: number[] }) {
  if (!values.length) return <svg className="ob-spark" viewBox="0 0 80 28" aria-hidden />;
  const max = Math.max(1, ...values);
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 78 + 1;
      const y = 26 - (value / max) * 22;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg className="ob-spark" viewBox="0 0 80 28" aria-hidden>
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={points} />
    </svg>
  );
}

export function Donut({
  slices,
  centerValue,
  centerLabel = "Total Orders",
}: {
  slices: { label: string; value: number; color: string }[];
  centerValue?: string;
  centerLabel?: string;
}) {
  const total = slices.reduce((sum, row) => sum + row.value, 0);
  const safe = total || 1;
  let offset = 0;
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="ob-donut-wrap">
      <div className="ob-donut-box">
        <svg className="ob-donut" viewBox="0 0 120 120" role="img" aria-label="Distribution chart">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(99, 102, 241, 0.1)" strokeWidth="15" />
          <g transform="translate(60 60)">
            {slices.map((slice) => {
              const dash = (slice.value / safe) * circumference;
              const circle = (
                <circle
                  key={slice.label}
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth="15"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90)"
                />
              );
              offset += dash;
              return circle;
            })}
          </g>
        </svg>
        <div className="ob-donut-center">
          <strong>{centerValue ?? total.toLocaleString()}</strong>
          <span>{centerLabel}</span>
        </div>
      </div>
      <ul className="ob-donut-legend">
        {slices.map((slice) => (
          <li key={slice.label}>
            <i style={{ background: slice.color }} />
            <span>{slice.label}</span>
            <b>{total ? `${((slice.value / total) * 100).toFixed(1)}%` : "0%"}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AreaChart({
  series,
  keys,
}: {
  series: { date: string; orders: number; revenue: number; customers: number; deposits?: number }[];
  keys: ("orders" | "revenue" | "customers" | "deposits")[];
}) {
  const rows = series.slice(-14);
  if (!rows.length) return <p className="ob-muted">No activity in this date range yet.</p>;
  const primary = keys[0];
  const max = Math.max(1, ...rows.flatMap((row) => keys.map((key) => row[key] ?? 0)));
  const width = 620;
  const height = 196;
  const padL = 44;
  const padR = 18;
  const padT = 22;
  const padB = 28;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const coords = rows.map((row, index) => {
    const x = padL + (index / Math.max(rows.length - 1, 1)) * plotW;
    const y = padT + plotH - ((row[primary] ?? 0) / max) * plotH;
    return { x, y, date: row.date, val: row[primary] ?? 0 };
  });
  const line = coords.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${coords[coords.length - 1].x.toFixed(1)},${padT + plotH} L${coords[0].x.toFixed(1)},${padT + plotH} Z`;
  const last = coords[coords.length - 1];
  const ticks = [1, 0.66, 0.33, 0];
  const labelIdx = [0, Math.floor(rows.length * 0.33), Math.floor(rows.length * 0.66), rows.length - 1];

  return (
    <svg className="ob-area-chart" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="obRevFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.28" />
          <stop offset="55%" stopColor="#3b82f6" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="obRevStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      {ticks.map((t) => {
        const y = padT + plotH * (1 - t);
        const v = max * t;
        const txt = v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v));
        return (
          <g key={t}>
            <line x1={padL} x2={width - padR} y1={y} y2={y} stroke="rgba(99,102,241,0.09)" strokeDasharray="3 4" />
            <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#8b93b3">{txt}</text>
          </g>
        );
      })}
      <path d={area} fill="url(#obRevFill)" />
      <path d={line} fill="none" stroke="url(#obRevStroke)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((p) => (
        <circle key={p.date} cx={p.x} cy={p.y} r="3.6" fill="#fff" stroke="#6d3df0" strokeWidth="2.2" />
      ))}
      {last ? (
        <g transform={`translate(${Math.min(width - 112, Math.max(padL, last.x - 48))}, ${Math.max(2, last.y - 38)})`}>
          <rect width="96" height="30" rx="8" fill="#2b2f55" />
          <text x="48" y="14" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#fff">
            {primary === "revenue" ? usd(last.val) : last.val.toLocaleString()}
          </text>
          <text x="48" y="25" textAnchor="middle" fontSize="8.5" fill="#cbd5f5">{last.date.slice(5)}</text>
        </g>
      ) : null}
      {[...new Set(labelIdx)].map((idx) => {
        const p = coords[idx];
        if (!p) return null;
        const dt = new Date(`${p.date}T00:00:00`);
        const label = Number.isNaN(dt.getTime()) ? p.date.slice(5) : dt.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
        return (
          <text key={idx} x={p.x} y={height - 7} textAnchor="middle" fontSize="10" fill="#8b93b3">{label}</text>
        );
      })}
    </svg>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "purple",
}: {
  label: string;
  value: string;
  hint?: string;
  spark?: number[];
  icon?: ReactNode;
  tone?: "purple" | "blue" | "pink" | "cyan" | "green";
}) {
  return (
    <article className="ob-stat">
      {icon ? <span className={`ob-stat-icon ob-stat-icon--${tone}`}>{icon}</span> : null}
      <span className="ob-stat-label">{label}</span>
      <div className="ob-stat-bottom">
        <strong>{value}</strong>
        {hint ? <small>↑ {hint}</small> : null}
      </div>
    </article>
  );
}

export function QuickAction({
  href,
  label,
  icon,
  tone = "purple",
}: {
  href: string;
  label: string;
  icon: ReactNode;
  tone?: "purple" | "blue" | "green" | "pink" | "amber" | "cyan";
}) {
  return (
    <Link className={`ob-quick ob-quick--${tone}`} href={href}>
      <span className="ob-quick-icon">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

export function RailCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="ob-rail-card">
      <h3>{title}</h3>
      {children}
    </article>
  );
}
