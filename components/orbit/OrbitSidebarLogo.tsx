type OrbitSidebarLogoProps = { theme: "light" | "dark"; compact?: boolean };

/** Vector lockup — stays razor-sharp in light/dark Orbit sidebars (no PNG matte). */
export function OrbitSidebarLogo({ theme, compact = false }: OrbitSidebarLogoProps) {
  const isDark = theme === "dark";
  const text = isDark ? "#f4f6ff" : "#1a1248";
  const sub = isDark ? "#c4b5fd" : "#6d3df0";
  const markStroke = isDark ? "#a78bfa" : "#7c3aed";

  return (
    <svg
      className={`ob-brand-svg${compact ? " is-compact" : ""}`}
      viewBox="0 0 220 52"
      preserveAspectRatio={compact ? "xMinYMid slice" : "xMidYMid meet"}
      role="img"
      aria-label="TrustifySMM Orbit"
    >
      <defs>
        <linearGradient id="ob-mark-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="55%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect x="0" y="6" width="40" height="40" rx="12" fill="url(#ob-mark-grad)" />
      <text x="20" y="34" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="800" fontFamily="system-ui,Segoe UI,sans-serif">
        T
      </text>
      <text x="50" y="22" fill={text} fontSize="15.5" fontWeight="800" fontFamily="system-ui,Segoe UI,sans-serif" letterSpacing="-0.02em">
        Trustify
        <tspan fill={sub}>SMM</tspan>
      </text>
      <text x="50" y="40" fill={isDark ? "#9ca3c7" : "#6b7399"} fontSize="10.5" fontWeight="700" fontFamily="system-ui,Segoe UI,sans-serif" letterSpacing="0.12em">
        ORBIT ADMIN
      </text>
      <circle cx="208" cy="26" r="5" fill="none" stroke={markStroke} strokeWidth="1.5" opacity="0.85" />
      <circle cx="208" cy="26" r="1.8" fill={sub} />
    </svg>
  );
}