import QRCode from "qrcode";
import { provisioningUri } from "@/lib/customer/totp";

/** PNG of the same otpauth URI the setup key uses. 512px with a quiet margin so a phone can scan it. */
export async function setupQr(secret: string, email: string) {
  const uri = provisioningUri(secret, email);
  const qr = await QRCode.toDataURL(uri, {
    width: 512,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#111111", light: "#ffffff" },
  });
  return { uri, qr };
}
