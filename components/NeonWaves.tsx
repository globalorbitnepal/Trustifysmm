export function NeonWaves() {
  return (
    <div className="waves" aria-hidden>
      <svg viewBox="0 0 1440 280" fill="none">
        <path
          d="M-80 40C120 -10 220 90 160 150C80 230 40 40 260 30"
          stroke="url(#w1)"
          strokeWidth="22"
          strokeLinecap="round"
          opacity="0.45"
        />
        <path
          d="M-20 210C180 170 260 40 460 70C660 100 700 230 920 210C1140 190 1220 70 1480 90"
          stroke="url(#w1)"
          strokeWidth="18"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d="M-40 230C160 150 300 90 500 120C720 154 760 250 980 228C1180 208 1280 120 1500 150"
          stroke="url(#w2)"
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M-10 250C200 210 340 130 560 160C760 188 820 260 1040 240C1240 222 1320 170 1500 190"
          stroke="url(#w3)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="w1" x1="0" y1="0" x2="1440" y2="0">
            <stop stopColor="#c084fc" />
            <stop offset="0.45" stopColor="#e879f9" />
            <stop offset="1" stopColor="#67e8f9" />
          </linearGradient>
          <linearGradient id="w2" x1="0" y1="0" x2="1440" y2="0">
            <stop stopColor="#a78bfa" />
            <stop offset="0.5" stopColor="#f0abfc" />
            <stop offset="1" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id="w3" x1="0" y1="0" x2="1440" y2="0">
            <stop stopColor="#ddd6fe" />
            <stop offset="1" stopColor="#e879f9" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
