import Link from "next/link";

type Props = {
  compact?: boolean;
  theme?: "dark" | "light";
  className?: string;
};

/** Vector lockup — no raster halos on light/dark panels. */
export function DashboardBrandLockup({ compact = false, theme = "dark", className = "" }: Props) {
  return (
    <Link
      href="/dashboard"
      className={`cp-brand-lockup${theme === "light" ? " is-light" : ""}${compact ? " is-compact" : ""} ${className}`.trim()}
      aria-label="TrustifySMM customer panel"
    >
      <span className="cp-brand-mark cp-brand-mark--vector" aria-hidden>
        T
      </span>
      {compact ? null : (
        <span className="cp-brand-copy">
          <strong>
            Trustify<span>SMM</span>
          </strong>
          <small>— SMM PANEL —</small>
        </span>
      )}
      {compact ? null : <span className="cp-brand-verified" aria-hidden title="Verified panel" />}
    </Link>
  );
}