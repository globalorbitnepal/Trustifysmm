const icons = [
  { src: "/brand/icon-youtube.png?v=2", name: "YouTube", left: "6%", top: "22%", size: "18%", delay: "0s" },
  { src: "/brand/icon-instagram.png?v=2", name: "Instagram", left: "28%", top: "4%", size: "17%", delay: "0.4s" },
  { src: "/brand/icon-tiktok.png?v=2", name: "TikTok", left: "54%", top: "0%", size: "17%", delay: "0.8s" },
  { src: "/brand/icon-facebook.png?v=2", name: "Facebook", left: "74%", top: "16%", size: "18%", delay: "0.2s" },
  { src: "/brand/icon-telegram.png?v=2", name: "Telegram", left: "78%", top: "42%", size: "16%", delay: "1s" },
  { src: "/brand/icon-threads.png?v=2", name: "Threads", left: "66%", top: "64%", size: "16%", delay: "0.6s", lift: true },
  { src: "/brand/icon-snapchat.png?v=2", name: "Snapchat", left: "40%", top: "74%", size: "16%", delay: "0.3s" },
  { src: "/brand/icon-whatsapp.png?v=2", name: "WhatsApp", left: "16%", top: "62%", size: "17%", delay: "0.9s" },
  { src: "/brand/icon-x.png?v=2", name: "X", left: "4%", top: "44%", size: "16%", delay: "0.5s" },
] as const;

export function OrbitCluster() {
  return (
    <div className="orbit-wrap" aria-hidden>
      <div className="orbit-glow" />
      <div className="orbit-ellipse" />
      <div className="orbit-ellipse orbit-ellipse-2" />
      <div
        className="glass-node glass-node-core"
        style={{ left: "32%", top: "28%", width: "36%", animationDelay: "0.1s" }}
      >
        <img src="/brand/icon-trustify-t.png?v=3" alt="" />
      </div>
      {icons.map((icon) => (
        <div
          key={icon.name}
          className={`glass-node${"lift" in icon && icon.lift ? " glass-node-lift" : ""}`}
          style={{
            left: icon.left,
            top: icon.top,
            width: icon.size,
            animationDelay: icon.delay,
          }}
        >
          <img src={icon.src} alt="" />
        </div>
      ))}
    </div>
  );
}
