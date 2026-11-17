/**
 * Ultra-HD dashboard hero art — pure SVG so it stays razor sharp at any DPI.
 * Rendered at 1400x520 viewBox, glass + neon orbit cluster for Orbit hero banner.
 */
export function OrbitHeroArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1400 520" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" aria-hidden>
      <defs>
        <radialGradient id="oha-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#6366f1" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="oha-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="50%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id="oha-chrome" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="42%" stopColor="#dbeafe" />
          <stop offset="72%" stopColor="#93c5fd" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="oha-tile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#e0e7ff" stopOpacity="0.55" />
        </linearGradient>
        <filter id="oha-soft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <filter id="oha-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="16" floodColor="#4c1d95" floodOpacity="0.28" />
        </filter>
      </defs>

      <ellipse cx="1010" cy="260" rx="330" ry="230" fill="url(#oha-glow)" filter="url(#oha-soft)" />

      <g opacity="0.95">
        <ellipse cx="1000" cy="255" rx="272" ry="126" stroke="url(#oha-ring)" strokeWidth="3.4" opacity="0.95" transform="rotate(-14 1000 255)" />
        <ellipse cx="1010" cy="268" rx="316" ry="164" stroke="url(#oha-ring)" strokeWidth="1.8" opacity="0.6" transform="rotate(11 1010 268)" />
        <ellipse cx="990" cy="250" rx="216" ry="196" stroke="url(#oha-ring)" strokeWidth="1.2" opacity="0.42" />
      </g>

      <g filter="url(#oha-shadow)">
        <rect x="916" y="166" width="168" height="184" rx="40" fill="url(#oha-tile)" />
        <rect x="916.9" y="166.9" width="166.2" height="182.2" rx="39.2" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1.8" />
        <text x="1000" y="298" textAnchor="middle" fontFamily="system-ui,Segoe UI,sans-serif" fontSize="126" fontWeight="800" fill="url(#oha-chrome)" letterSpacing="-6">
          T
        </text>
      </g>

      {[
        { x: 706, y: 96, size: 88, r: -12, color: "#f472b6", label: "IG" },
        { x: 1228, y: 118, size: 78, r: 14, color: "#60a5fa", label: "X" },
        { x: 1288, y: 306, size: 84, r: -8, color: "#38bdf8", label: "TG" },
        { x: 754, y: 344, size: 80, r: 10, color: "#34d399", label: "WA" },
        { x: 1128, y: 402, size: 72, r: 6, color: "#fbbf24", label: "SC" },
      ].map((tile, index) => (
        <g key={index} transform={`rotate(${tile.r} ${tile.x + tile.size / 2} ${tile.y + tile.size / 2})`} filter="url(#oha-shadow)">
          <rect x={tile.x} y={tile.y} width={tile.size} height={tile.size} rx={tile.size * 0.3} fill="url(#oha-tile)" />
          <rect x={tile.x + 0.9} y={tile.y + 0.9} width={tile.size - 1.8} height={tile.size - 1.8} rx={tile.size * 0.3 - 0.9} stroke="#ffffff" strokeOpacity="0.78" strokeWidth="1.6" />
          <circle cx={tile.x + tile.size / 2} cy={tile.y + tile.size / 2} r={tile.size * 0.24} fill={tile.color} opacity="0.22" />
          <text
            x={tile.x + tile.size / 2}
            y={tile.y + tile.size / 2 + 6}
            textAnchor="middle"
            fontFamily="system-ui,Segoe UI,sans-serif"
            fontSize={tile.size * 0.29}
            fontWeight="800"
            fill={tile.color}
          >
            {tile.label}
          </text>
        </g>
      ))}

      <g filter="url(#oha-shadow)">
        <rect x="1044" y="352" width="286" height="86" rx="24" fill="#3b1a86" fillOpacity="0.82" />
        <rect x="1044.9" y="352.9" width="284.2" height="84.2" rx="23.2" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="1.6" />
        <text x="1072" y="388" fontFamily="system-ui,Segoe UI,sans-serif" fontSize="15" fontWeight="700" fill="#f5f3ff">
          Grow Faster With
        </text>
        <text x="1072" y="412" fontFamily="system-ui,Segoe UI,sans-serif" fontSize="18" fontWeight="800" fill="#ffffff">
          TrustifySMM
        </text>
        <path d="M1290 424l14-14m0 0h-11m11 0v11" stroke="#a5f3fc" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}