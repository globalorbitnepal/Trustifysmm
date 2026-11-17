import Link from "next/link";

type Props = {
  compact?: boolean;
  theme?: "dark" | "light";
  className?: string;
};

/** Transparent mark + vector wordmark — sharp in light and dark, no logo PNG crop. */
export function DashboardBrandLockup({ compact = false, theme = "dark", className = "" }: Props) {
  return (
    <Link
      href="/dashboard"
      className={`cp-brand-lockup${theme === "light" ? " is-light" : ""}${compact ? " is-compact" : ""} ${className}`.trim()}
      aria-label="TrustifySMM customer panel"
    >
      <img
        className="cp-brand-mark-img"
        src="/brand/logo-mark-transparent.png"
        alt=""
        width={512}
        height={512}
        decoding="async"
        draggable={false}
      />
      {compact ? null : (
        <span className="cp-brand-copy">
          <strong>
            Trustify<span>SMM</span>
          </strong>
          <small>— SMM PANEL —</small>
        </span>
      )}
    </Link>
  );
}