import type { ReactNode } from "react";

export const iconPaths: Record<string, ReactNode> = {
  dashboard: <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1Z" />,
  activity: <path d="M4 18V6m4 12V10m4 8V8m4 10V4m4 14v-6" />,
  customers: <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm9 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20a5 5 0 0 1 8-4m8 4a5 5 0 0 0-8-4" />,
  wallet: <path d="M4 8h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Zm14 4h3v4h-3" />,
  services: <path d="M5 6h14v4H5zm0 8h14v4H5z" />,
  orders: <path d="M7 4h10l2 4v12H5V8zm3 8h4" />,
  banker: <path d="M12 3 4 7v10l8 4 8-4V7zm0 3.5 5 2.5-5 2.5-5-2.5z" />,
  pages: <path d="M6 4h9l5 5v11H6zm8 0v5h5" />,
  blog: <path d="M6 5h12v14H6zm3 4h6m-6 4h6m-6 4h4" />,
  seo: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-1 4h2v2h-2zm0 4h2v6h-2z" />,
  support: <path d="M4 6a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4h-2l-3 3-3-3H8a4 4 0 0 1-4-4Z" />,
  settings: <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8.5 4a6.8 6.8 0 0 0 .1-1 6.8 6.8 0 0 0-.1-1l2.1-1.6-2-3.4-2.5 1a7.5 7.5 0 0 0-1.7-1L15.5 2h-4L12.5 6a7.5 7.5 0 0 0-1.7 1l-2.5-1-2 3.4L8.4 11c-.1.3-.1.7-.1 1s0 .7.1 1L6.2 14.6l2 3.4 2.5-1c.5.4 1.1.7 1.7 1L11.5 22h4l.5-4c.6-.3 1.2-.6 1.7-1l2.5 1 2-3.4Z" />,
  media: <path d="M5 5h14v14H5zm2 2v6l4-3 4 3V7z" />,
  providers: <path d="M12 2 3 7v10l9 5 9-5V7zm0 3.5L17.5 9 12 11.5 6.5 9z" />,
};

export function OrbitIcon({ name }: { name: string }) {
  const body = iconPaths[name] ?? iconPaths.dashboard;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {body}
    </svg>
  );
}