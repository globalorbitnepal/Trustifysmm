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
  { id: "instagram", top: "8%", left: "6%", size: 34, delay: "0s" },
  { id: "youtube", top: "18%", left: "22%", size: 28, delay: "0.6s" },
  { id: "tiktok", top: "6%", left: "46%", size: 26, delay: "1.1s" },
  { id: "facebook", top: "14%", left: "78%", size: 30, delay: "0.3s" },
  { id: "x", top: "32%", left: "4%", size: 24, delay: "1.4s" },
  { id: "telegram", top: "28%", left: "88%", size: 28, delay: "0.8s" },
  { id: "whatsapp", top: "58%", left: "8%", size: 32, delay: "1.8s" },
  { id: "snapchat", top: "72%", left: "18%", size: 26, delay: "0.4s" },
  { id: "threads", top: "78%", left: "70%", size: 28, delay: "1.2s" },
  { id: "linkedin", top: "48%", left: "92%", size: 24, delay: "2s" },
  { id: "spotify", top: "84%", left: "42%", size: 22, delay: "0.9s" },
  { id: "pinterest", top: "40%", left: "14%", size: 22, delay: "1.6s" },
  { id: "instagram", top: "66%", left: "86%", size: 22, delay: "2.2s" },
  { id: "youtube", top: "4%", left: "64%", size: 20, delay: "1.5s" },
  { id: "tiktok", top: "88%", left: "58%", size: 20, delay: "0.2s" },
  { id: "facebook", top: "52%", left: "2%", size: 20, delay: "2.4s" },
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
      <img className="orbit-core" src="/brand/glass/glass-trustify-t.png" alt="" width={1024} height={1024} />
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
