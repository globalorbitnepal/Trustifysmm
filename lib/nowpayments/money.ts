/** Exact decimal helpers. No floating-point financial math. */

export function decimalToScaled(value: string | number, scale: number): bigint | null {
  const raw = String(value).trim();
  if (!/^-?\d+(\.\d+)?$/.test(raw)) return null;
  const negative = raw.startsWith("-");
  const unsigned = negative ? raw.slice(1) : raw;
  const [whole, fraction = ""] = unsigned.split(".");
  if (fraction.length > scale) return null;
  const padded = fraction.padEnd(scale, "0");
  try {
    const scaled = BigInt(whole) * BigInt(10) ** BigInt(scale) + BigInt(padded || "0");
    return negative ? -scaled : scaled;
  } catch {
    return null;
  }
}

export function scaledToDecimal(value: bigint, scale: number): string {
  const negative = value < BigInt(0);
  const abs = negative ? -value : value;
  const text = abs.toString().padStart(scale + 1, "0");
  const whole = text.slice(0, text.length - scale);
  const fraction = text.slice(text.length - scale).replace(/0+$/, "");
  const body = fraction ? `${whole}.${fraction}` : whole;
  return negative ? `-${body}` : body;
}

export function compareDecimal(left: string | number, right: string | number, scale: number): -1 | 0 | 1 | null {
  const a = decimalToScaled(left, scale);
  const b = decimalToScaled(right, scale);
  if (a === null || b === null) return null;
  if (a === b) return 0;
  return a > b ? 1 : -1;
}