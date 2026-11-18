"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function CryptoDepositQr({ value, label }: { value: string; label?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!value) {
      setSrc(null);
      return;
    }
    let cancelled = false;
    void QRCode.toDataURL(value, {
      width: 220,
      margin: 1,
      color: { dark: "#0f0a28", light: "#ffffff" },
    }).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value]);

  if (!src) return null;
  return (
    <figure className="cp-funds-qr">
      <img src={src} alt={label || "Payment QR code"} width={220} height={220} />
      {label ? <figcaption>{label}</figcaption> : null}
    </figure>
  );
}