const FLOATS = [
  { src: "/brand/glass/glass-instagram.png", x: "6%", y: "12%", size: 58, delay: "0s", dur: "11s" },
  { src: "/brand/glass/glass-facebook.png", x: "34%", y: "8%", size: 52, delay: "-2s", dur: "13s" },
  { src: "/brand/glass/glass-tiktok.png", x: "18%", y: "38%", size: 54, delay: "-4s", dur: "12s" },
  { src: "/brand/glass/glass-youtube.png", x: "40%", y: "52%", size: 56, delay: "-1s", dur: "14s" },
  { src: "/brand/glass/glass-x.png", x: "8%", y: "62%", size: 48, delay: "-3s", dur: "10s" },
  { src: "/brand/glass/glass-telegram.png", x: "28%", y: "78%", size: 50, delay: "-5s", dur: "12s" },
  { src: "/brand/glass/glass-whatsapp.png", x: "42%", y: "28%", size: 46, delay: "-2.5s", dur: "11s" },
  { src: "/brand/glass/glass-threads.png", x: "14%", y: "86%", size: 44, delay: "-6s", dur: "13s" },
  { src: "/brand/glass/glass-snapchat.png", x: "36%", y: "66%", size: 42, delay: "-1.5s", dur: "10s" },
  { src: "/brand/glass/glass-trustify-t.png", x: "22%", y: "22%", size: 64, delay: "-3.5s", dur: "15s" },
] as const;

export function AuthSocialBackdrop() {
  return (
    <div className="auth-social-backdrop" aria-hidden>
      <div className="auth-social-backdrop-veil" />
      <div className="auth-social-backdrop-glow auth-social-backdrop-glow--l" />
      <div className="auth-social-backdrop-glow auth-social-backdrop-glow--r" />
      {FLOATS.map((icon) => (
        <span
          key={icon.src}
          className="auth-social-float"
          style={{
            left: icon.x,
            top: icon.y,
            width: icon.size,
            height: icon.size,
            animationDelay: icon.delay,
            animationDuration: icon.dur,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={icon.src} alt="" width={icon.size} height={icon.size} decoding="async" draggable={false} />
        </span>
      ))}
    </div>
  );
}