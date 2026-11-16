import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="TrustifySMM home">
      <img
        className="logo-mark"
        src="/brand/logo-mark.png"
        alt=""
        width={54}
        height={48}
      />
      <span className="wordmark">
        <strong>
          <em>
            Trustif
            <span className="iy">
              y
              <i className="tick" aria-hidden>
                <svg width="8" height="8" viewBox="0 0 12 12">
                  <path d="M2 6.2l2.4 2.4L10 3.2" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </i>
            </span>
          </em>
          <span>SMM</span>
        </strong>
        <span className="smm-sub">SMM PANEL</span>
      </span>
    </Link>
  );
}
