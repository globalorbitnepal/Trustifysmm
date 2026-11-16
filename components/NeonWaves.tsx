export function NeonWaves() {
  return (
    <>
      <div className="ribbon ribbon-left" aria-hidden>
        <svg viewBox="0 0 420 280" fill="none">
          <g filter="url(#glowL)">
            <path
              d="M-30 210C40 40 90 10 150 70C210 130 120 230 210 210C300 190 280 40 430 90"
              stroke="url(#lgL)"
              strokeWidth="18"
              strokeLinecap="round"
            />
          </g>
          <defs>
            <linearGradient id="lgL" x1="0" y1="0" x2="420" y2="80">
              <stop stopColor="#e879f9" />
              <stop offset="1" stopColor="#67e8f9" />
            </linearGradient>
            <filter id="glowL" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="8" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      </div>
      <div className="ribbon ribbon-bottom" aria-hidden>
        <svg viewBox="0 0 1440 280" fill="none" preserveAspectRatio="none">
          <g filter="url(#glowB)">
            <path
              d="M-40 168C180 40 320 40 500 110C680 180 760 240 960 200C1160 160 1240 70 1500 110"
              stroke="url(#lgB)"
              strokeWidth="28"
              strokeLinecap="round"
            />
            <path
              d="M-20 210C200 90 360 80 540 140C720 200 820 250 1020 220C1220 190 1300 120 1520 150"
              stroke="url(#lgB2)"
              strokeWidth="10"
              strokeLinecap="round"
            />
          </g>
          <defs>
            <linearGradient id="lgB" x1="0" y1="0" x2="1440" y2="0">
              <stop stopColor="#c084fc" />
              <stop offset="0.45" stopColor="#f0abfc" />
              <stop offset="1" stopColor="#67e8f9" />
            </linearGradient>
            <linearGradient id="lgB2" x1="0" y1="0" x2="1440" y2="0">
              <stop stopColor="#fae8ff" />
              <stop offset="1" stopColor="#a5f3fc" />
            </linearGradient>
            <filter id="glowB" x="-10%" y="-80%" width="120%" height="260%">
              <feGaussianBlur stdDeviation="10" result="b" />
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
