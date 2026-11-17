type OrbitSidebarLogoProps = { theme: "light" | "dark"; compact?: boolean };

/** HTML lockup so the wordmark stays as sharp as the rest of the UI. */
export function OrbitSidebarLogo({ theme, compact = false }: OrbitSidebarLogoProps) {
  return (
    <span className={`ob-brand-lockup${theme === "dark" ? " is-dark" : ""}${compact ? " is-compact" : ""}`}>
      <span className="ob-brand-mark" aria-hidden>
        T
      </span>
      {compact ? null : (
        <span className="ob-brand-copy">
          <strong>
            Trustify<span>SMM</span>
          </strong>
          <small>ORBIT ADMIN</small>
        </span>
      )}
      {compact ? null : <span className="ob-brand-live" aria-hidden />}
    </span>
  );
}
