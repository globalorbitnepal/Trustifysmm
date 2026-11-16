const icons = [
  { src: "/brand/icon-youtube.png?v=8", name: "YouTube", left: "8%", top: "20%", size: "20%" },
  { src: "/brand/icon-instagram.png?v=8", name: "Instagram", left: "32%", top: "2%", size: "18%" },
  { src: "/brand/icon-tiktok.png?v=8", name: "TikTok", left: "56%", top: "-2%", size: "18%" },
  { src: "/brand/icon-facebook.png?v=8", name: "Facebook", left: "74%", top: "14%", size: "19%" },
  { src: "/brand/icon-telegram.png?v=8", name: "Telegram", left: "78%", top: "42%", size: "17%" },
  { src: "/brand/icon-threads.png?v=8", name: "Threads", left: "64%", top: "66%", size: "17%" },
  { src: "/brand/icon-snapchat.png?v=8", name: "Snapchat", left: "40%", top: "74%", size: "17%" },
  { src: "/brand/icon-whatsapp.png?v=8", name: "WhatsApp", left: "16%", top: "62%", size: "18%" },
  { src: "/brand/icon-x.png?v=8", name: "X", left: "6%", top: "42%", size: "17%" },
] as const;

export function OrbitCluster() {
  return (
    <div className="orbit-wrap" aria-hidden>
      <svg className="orbit-svg" viewBox="0 0 640 640" fill="none">
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#67e8f9" stopOpacity="0.1" />
            <stop offset="0.45" stopColor="#e879f9" />
            <stop offset="1" stopColor="#818cf8" stopOpacity="0.2" />
          </linearGradient>
          <filter id="ringGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <ellipse
          cx="320"
          cy="330"
          rx="250"
          ry="118"
          transform="rotate(-22 320 330)"
          stroke="url(#ring)"
          strokeWidth="3"
          filter="url(#ringGlow)"
        />
        <ellipse
          cx="320"
          cy="318"
          rx="268"
          ry="132"
          transform="rotate(16 320 318)"
          stroke="#67e8f9"
          strokeOpacity="0.25"
          strokeWidth="2"
          filter="url(#ringGlow)"
        />
      </svg>
      <div className="glass-node glass-node-core" style={{ left: "30%", top: "26%", width: "40%" }}>
        <img src="/brand/icon-trustify-t.png?v=8" alt="" />
      </div>
      {icons.map((icon) => (
        <div
          key={icon.name}
          className="glass-node"
          style={{ left: icon.left, top: icon.top, width: icon.size }}
        >
          <img src={icon.src} alt="" />
        </div>
      ))}
    </div>
  );
}
