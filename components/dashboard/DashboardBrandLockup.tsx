import Link from "next/link";

type Props = {
  compact?: boolean;
  theme?: "dark" | "light";
  className?: string;
};

/** Sidebar header lockup — crisp mark + vector wordmark (no soft PNG banner). */
export function DashboardBrandLockup({ compact = false, theme = "dark", className = "" }: Props) {
  return (
    <Link
      href="/dashboard"
      className={`cp-brand-lockup${theme === "light" ? " is-light" : ""}${compact ? " is-compact" : ""} ${className}`.trim()}
      aria-label="TrustifySMM customer panel"
    >
      <span className="cp-brand-mark" aria-hidden>
        <img src="/brand/logo-mark-transparent.png" alt="" width={80} height={80} decoding="async" />
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