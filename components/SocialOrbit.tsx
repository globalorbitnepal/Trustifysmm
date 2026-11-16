const tile = "19%";

const icons = [
  { name: "tiktok", src: "/brand/glass/glass-tiktok.png", z: 2, style: { top: "2%", left: "66%", width: tile, transform: "rotate(14deg)" } },
  { name: "instagram", src: "/brand/glass/glass-instagram.png", z: 3, style: { top: "6%", left: "36%", width: tile, transform: "rotate(-12deg)" } },
  { name: "youtube", src: "/brand/glass/glass-youtube.png", z: 2, style: { top: "22%", left: "2%", width: tile, transform: "rotate(-16deg)" } },
  { name: "facebook", src: "/brand/glass/glass-facebook.png", z: 4, style: { top: "16%", left: "77%", width: tile, transform: "rotate(8deg)" } },
  { name: "x", src: "/brand/glass/glass-x.png", z: 2, style: { top: "44%", left: "10%", width: tile, transform: "rotate(-8deg)" } },
  { name: "telegram", src: "/brand/glass/glass-telegram.png", z: 5, style: { top: "55%", left: "74%", width: tile, transform: "rotate(10deg)" } },
  { name: "threads", src: "/brand/glass/glass-threads.png", z: 3, style: { top: "68%", left: "58%", width: tile, transform: "rotate(8deg)" } },
  { name: "whatsapp", src: "/brand/glass/glass-whatsapp.png", z: 2, style: { top: "66%", left: "4%", width: tile, transform: "rotate(-8deg)" } },
  { name: "snapchat", src: "/brand/glass/glass-snapchat.png", z: 4, style: { top: "76%", left: "36%", width: tile, transform: "rotate(6deg)" } },
] as const;

export function SocialOrbit() {
  return (
    <div className="orbit" id="services">
      <div className="orbit-glow" aria-hidden />
      <svg className="orbit-lines" viewBox="0 0 640 560" fill="none" aria-hidden>
        <ellipse cx="330" cy="290" rx="248" ry="132" stroke="url(#ring)" strokeWidth="3" opacity="0.95" />
        <ellipse cx="340" cy="300" rx="286" ry="168" stroke="url(#ring)" strokeWidth="2.2" opacity="0.7" transform="rotate(-16 340 300)" />
        <defs>
          <linearGradient id="ring" x1="80" y1="160" x2="560" y2="420">
            <stop stopColor="#7C4DFF" />
            <stop offset="0.5" stopColor="#E879F9" />
            <stop offset="1" stopColor="#38BDF8" />
          </linearGradient>
        </defs>
      </svg>
      <div className="orbit-stage">
        <img className="orbit-core" src="/brand/glass/glass-trustify-t.png" alt="" width={1024} height={1024} />
        {icons.map((icon) => (
          <img
            key={icon.name}
            className="orbit-icon"
            src={icon.src}
            alt=""
            width={1024}
            height={1024}
            style={{ ...icon.style, zIndex: icon.z }}
          />
        ))}
      </div>
    </div>
  );
}