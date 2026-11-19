import { PlatformFilterIcon } from "@/components/PlatformFilterIcon";

const INNER = [
  { id: "instagram", angle: -18 },
  { id: "tiktok", angle: 72 },
  { id: "youtube", angle: 162 },
  { id: "facebook", angle: 252 },
] as const;

const OUTER = [
  { id: "x", angle: 18 },
  { id: "telegram", angle: 90 },
  { id: "whatsapp", angle: 162 },
  { id: "snapchat", angle: 234 },
  { id: "threads", angle: 306 },
] as const;

const DUST = [
  { id: "instagram", top: "6%", left: "4%", size: 28, delay: "0s" },
  { id: "youtube", top: "4%", left: "58%", size: 22, delay: "0.6s" },
  { id: "tiktok", top: "8%", left: "92%", size: 24, delay: "1.1s" },
  { id: "facebook", top: "22%", left: "96%", size: 26, delay: "0.3s" },
  { id: "x", top: "46%", left: "1%", size: 22, delay: "1.4s" },
  { id: "telegram", top: "34%", left: "90%", size: 24, delay: "0.8s" },
  { id: "whatsapp", top: "70%", left: "2%", size: 24, delay: "1.8s" },
  { id: "snapchat", top: "86%", left: "12%", size: 22, delay: "0.4s" },
  { id: "threads", top: "82%", left: "78%", size: 24, delay: "1.2s" },
  { id: "linkedin", top: "58%", left: "94%", size: 22, delay: "2s" },
  { id: "spotify", top: "90%", left: "46%", size: 20, delay: "0.9s" },
  { id: "pinterest", top: "92%", left: "28%", size: 20, delay: "1.6s" },
  { id: "instagram", top: "74%", left: "88%", size: 20, delay: "2.2s" },
  { id: "youtube", top: "3%", left: "28%", size: 18, delay: "1.5s" },
  { id: "tiktok", top: "88%", left: "62%", size: 18, delay: "0.2s" },
  { id: "facebook", top: "16%", left: "1%", size: 18, delay: "2.4s" },
] as const;

export function HeroLogoField() {
  return (
    <div className="hero-logo-field" aria-hidden>
      {DUST.map((item, index) => (
        <span
          key={`${item.id}-${index}`}
          className="hero-logo-bit"
          style={{ top: item.top, left: item.left, width: item.size, animationDelay: item.delay }}
        >
          <PlatformFilterIcon platform={item.id} variant="tile" className="hero-logo-bit-icon" />
        </span>
      ))}
    </div>
  );
}

export function SocialOrbit() {
  return (
    <div className="orbit" id="services">
      <div className="orbit-glow" aria-hidden />
      <div className="orbit-rotor">
        <svg className="orbit-lines" viewBox="0 0 100 100" aria-hidden>
          <defs>
            <linearGradient id="ring" x1="10" y1="20" x2="90" y2="80">
              <stop stopColor="#7C4DFF" />
              <stop offset="0.5" stopColor="#E879F9" />
              <stop offset="1" stopColor="#38BDF8" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="32" fill="none" stroke="url(#ring)" strokeWidth="0.55" />
          <circle cx="50" cy="50" r="44" fill="none" stroke="url(#ring)" strokeWidth="0.4" opacity="0.8" />
        </svg>
        {INNER.map((icon) => (
          <OrbitSat key={icon.id} id={icon.id} angle={icon.angle} radius="32%" />
        ))}
        {OUTER.map((icon) => (
          <OrbitSat key={icon.id} id={icon.id} angle={icon.angle} radius="44%" />
        ))}
      </div>
      {/*
        This <img> is the mobile LCP element. It must load eagerly with high priority and
        stay off the lazy path; the 2 KB WebP variant renders identically to the 879 KB PNG
        it replaced at the size it is actually painted.
      */}
      <img
        className="orbit-core"
        src="/img/glass/glass-trustify-t-256.webp"
        srcSet="/img/glass/glass-trustify-t-128.webp 128w, /img/glass/glass-trustify-t-256.webp 256w"
        sizes="(max-width: 560px) 120px, 220px"
        alt=""
        width={256}
        height={256}
        loading="eager"
        fetchPriority="high"
        decoding="async"
      />
    </div>
  );
}

function OrbitSat({ id, angle, radius }: { id: string; angle: number; radius: string }) {
  return (
    <span className="orbit-sat" style={{ ["--a" as string]: `${angle}deg`, ["--r" as string]: radius }}>
      <span className="orbit-sat-face">
        <PlatformFilterIcon platform={id} variant="tile" className="orbit-sat-icon" />
      </span>
    </span>
  );
}
