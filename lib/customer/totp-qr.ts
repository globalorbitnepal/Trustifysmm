import QRCode from "qrcode";
import { provisioningUri } from "@/lib/customer/totp";

/** PNG of the same otpauth URI the setup key uses. The scanned name is TrustifySMM only. */
export async function setupQr(secret: string) {
  const uri = provisioningUri(secret);
  const qr = await QRCode.toDataURL(uri, {
    width: 640,
    margin: 4,
    errorCorrectionLevel: "H",
    color: { dark: "#111111", light: "#ffffff" },
  });
  return { uri, qr };
}
