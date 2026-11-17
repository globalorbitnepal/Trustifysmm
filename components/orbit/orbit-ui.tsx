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
      : key.includes("pending") || key === "confirming" || key === "open" || key === "in progress" || key === "processing"
        ? "warn"
        : key.includes("fail") || key === "canceled" || key === "suspended" || key === "expired"
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

export function Donut({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((sum, row) => sum + row.value, 0) || 1;
  let offset = 0;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  return (
    <MotionStack>
      <svg className="ob-donut" viewBox="0 0 120 120" role="img" aria-label="Distribution chart">
        <g transform="translate(60 60)">
          {slices.map((slice) => {
            const dash = (slice.value / total) * circumference;
            const circle = (
              <circle
                key={slice.label}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth="14"
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
      <ul className="ob-donut-legend">
        {slices.map((slice) => (
          <li key={slice.label}>
            <i style={{ background: slice.color }} />
            {slice.label} <b>{slice.value}</b>
          </li>
        ))}
      </ul>
    </MotionStack>
  );
}

function MotionStack({ children }: { children: React.ReactNode }) {
  return <div className="ob-donut-wrap">{children}</div>;
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
  const max = Math.max(1, ...rows.flatMap((row) => keys.map((key) => row[key] ?? 0)));
  const width = 640;
  const height = 180;
  const palette = { orders: "#7c3aed", revenue: "#287bff", customers: "#27d9f5", deposits: "#16b67a" };
  return (
    <svg className="ob-area-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {keys.map((key) => {
        const points = rows.map((row, index) => {
          const x = (index / Math.max(rows.length - 1, 1)) * (width - 40) + 20;
          const y = height - 24 - ((row[key] ?? 0) / max) * (height - 48);
          return `${x},${y}`;
        });
        return (
          <g key={key}>
            <polyline fill="none" stroke={palette[key]} strokeWidth="2.5" points={points.join(" ")} />
          </g>
        );
      })}
    </svg>
  );
}

export function StatCard({
  label,
  value,
  hint,
  spark,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  spark?: number[];
  icon?: ReactNode;
}) {
  return (
    <article className="ob-stat">
      {icon ? (
        <div className="ob-stat-top">
          <span className="ob-stat-icon">{icon}</span>
          <span>{label}</span>
        </div>
      ) : null}
      <MotionStackLike>
        <div>
          {icon ? null : <span>{label}</span>}
          <strong>{value}</strong>
          {hint ? <small>{hint}</small> : null}
        </div>
        {spark ? <Sparkline values={spark} /> : null}
      </MotionStackLike>
    </article>
  );
}

function MotionStackLike({ children }: { children: React.ReactNode }) {
  return <div className="ob-stat-inner">{children}</div>;
}

export function QuickAction({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  return (
    <Link className="ob-quick" href={href}>
      <span className="ob-quick-icon">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

export function RailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="ob-rail-card">
      <h3>{title}</h3>
      {children}
    </article>
  );
}