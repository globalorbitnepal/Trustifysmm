const floaters = [
  { src: "/brand/glass/glass-instagram.png", name: "Instagram", style: { top: "6%", left: "2%", width: "22%" } },
  { src: "/brand/glass/glass-x.png", name: "X", style: { top: "2%", right: "16%", width: "16%" } },
  { src: "/brand/glass/glass-tiktok.png", name: "TikTok", style: { top: "36%", right: "1%", width: "18%" } },
  { src: "/brand/glass/glass-telegram.png", name: "Telegram", style: { bottom: "8%", left: "0%", width: "17%" } },
  { src: "/brand/glass/glass-whatsapp.png", name: "WhatsApp", style: { bottom: "4%", right: "22%", width: "15%" } },
] as const;

/** Real 1024px glass marks on vector rings — stays sharp, matches the public hero. */
export function OrbitHeroArt({ className }: { className?: string }) {
  return (
    <div className={`ob-hero-stage${className ? ` ${className}` : ""}`} aria-hidden>
      <svg className="ob-hero-rings" viewBox="0 0 640 420" fill="none">
        <defs>
          <linearGradient id="ohr" x1="40" y1="40" x2="600" y2="380">
            <stop stopColor="#e9d5ff" />
            <stop offset="0.45" stopColor="#c4b5fd" />
            <stop offset="1" stopColor="#67e8f9" />
          </linearGradient>
        </defs>
        <ellipse cx="330" cy="210" rx="210" ry="92" stroke="url(#ohr)" strokeWidth="2.4" opacity="0.95" transform="rotate(-16 330 210)" />
        <ellipse cx="340" cy="220" rx="250" ry="128" stroke="url(#ohr)" strokeWidth="1.4" opacity="0.55" transform="rotate(12 340 220)" />
        <ellipse cx="320" cy="200" rx="150" ry="150" stroke="url(#ohr)" strokeWidth="1.1" opacity="0.35" />
      </svg>
      {floaters.map((item) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={item.name} className="ob-hero-float" src={item.src} alt="" style={item.style} />
      ))}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="ob-hero-core" src="/brand/glass/glass-trustify-t.png" alt="" />
      <div className="ob-hero-chip">
        <strong>Grow Faster</strong>
        <span>With TrustifySMM</span>
        <i aria-hidden>↗</i>
      </div>
    </div>
  );
}
