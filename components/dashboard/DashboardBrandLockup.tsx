import Link from "next/link";

type Props = {
  compact?: boolean;
  theme?: "dark" | "light";
  className?: string;
};

/** Same wordmark assets as the public site — crisp per theme. */
export function DashboardBrandLockup({ compact = false, theme = "dark", className = "" }: Props) {
  const logo = theme === "light" ? "/brand/orbit-logo-light.png" : "/brand/orbit-logo-dark.png";

  return (
    <Link
      href="/dashboard"
      className={`cp-brand-lockup${theme === "light" ? " is-light" : ""}${compact ? " is-compact" : ""} ${className}`.trim()}
      aria-label="TrustifySMM customer panel"
    >
      {compact ? (
        <span className="cp-brand-mark cp-brand-mark--vector" aria-hidden>
          T
        </span>
      ) : (
        <img className="cp-brand-logo" src={logo} alt="TrustifySMM SMM Panel" width={964} height={320} decoding="async" draggable={false} />
      )}
    </Link>
  );
}