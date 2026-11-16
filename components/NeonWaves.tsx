export function NeonWaves() {
  return (
    <>
      <div className="ribbon ribbon-left" aria-hidden>
        <svg viewBox="0 0 460 300" fill="none">
          <g filter="url(#glowL)">
            <path
              d="M-40 220C30 30 110 -10 170 80C230 170 90 250 200 230C320 208 300 20 480 100"
              stroke="url(#lgL)"
              strokeWidth="26"
              strokeLinecap="round"
            />
          </g>
          <defs>
            <linearGradient id="lgL" x1="0" y1="0" x2="460" y2="80">
              <stop stopColor="#e879f9" />
              <stop offset="1" stopColor="#67e8f9" />
            </linearGradient>
            <filter id="glowL" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="12" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      </div>
      <div className="ribbon ribbon-bottom" aria-hidden>
        <svg viewBox="0 0 1440 320" fill="none" preserveAspectRatio="none">
          <g filter="url(#glowB)">
            <path
              d="M-60 200C160 20 340 10 520 90C700 170 780 250 980 210C1180 170 1280 70 1540 120"
              stroke="url(#lgB)"
              strokeWidth="36"
              strokeLinecap="round"
            />
            <path
              d="M-40 230C180 70 360 60 540 130C720 200 840 270 1040 230C1240 190 1340 110 1560 150"
              stroke="url(#lgB2)"
              strokeWidth="12"
              strokeLinecap="round"
            />
          </g>
          <defs>
            <linearGradient id="lgB" x1="0" y1="0" x2="1440" y2="0">
              <stop stopColor="#c084fc" />
              <stop offset="0.4" stopColor="#f0abfc" />
              <stop offset="0.75" stopColor="#67e8f9" />
              <stop offset="1" stopColor="#38bdf8" />
            </linearGradient>
            <linearGradient id="lgB2" x1="0" y1="0" x2="1440" y2="0">
              <stop stopColor="#fae8ff" />
              <stop offset="1" stopColor="#a5f3fc" />
            </linearGradient>
            <filter id="glowB" x="-8%" y="-80%" width="116%" height="260%">
              <feGaussianBlur stdDeviation="14" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      </div>
    </>
  );
}
