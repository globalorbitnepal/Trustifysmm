/**
 * Customer-facing text must never reveal that a third-party Server API supplies the
 * catalog. Category and service names arrive from that server, so provider words are
 * removed before any customer page or public API response sees them.
 */
const PROVIDER_WORDS = [
  /\bhonest\s*smm\b/gi,
  /\bserver\s*api\b/gi,
  /\bapi\b/gi,
  /\bproviders?\b/gi,
  /\bpanels?\b/gi,
  /\bupstream\b/gi,
  /\bwholesale\b/gi,
];

/**
 * Product names that legitimately contain a provider-sounding word. They are swapped for a
 * placeholder first so the mask below cannot damage them (Discord Server Boost is a product,
 * not an integration detail).
 */
const KEEP = ["server boost", "server boosts"];

export function publicText(value: string) {
  let text = value;
  const restored: string[] = [];
  for (const phrase of KEEP) {
    const pattern = new RegExp(phrase.replace(/ /g, "\\s+"), "gi");
    text = text.replace(pattern, () => {
      restored.push(phrase);
      return `\u0000${restored.length - 1}\u0000`;
    });
  }
  for (const pattern of PROVIDER_WORDS) text = text.replace(pattern, " ");
  text = text.replace(/\bservers?\b/gi, " ");

  text = text
    .replace(/\s*[-–—|·]\s*(?=[-–—|·]|$)/g, "")
    .replace(/\(\s*\)/g, "")
    .replace(/\[\s*\]/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/^[\s\-–—|·,]+|[\s\-–—|·,]+$/g, "")
    .trim();

  return text.replace(/\u0000(\d+)\u0000/g, (_, index: string) => restoreCase(restored[Number(index)], value));
}

/** Restore the original capitalisation of a protected product name. */
function restoreCase(phrase: string, original: string) {
  const match = new RegExp(phrase.replace(/ /g, "\\s+"), "i").exec(original);
  return match ? match[0] : phrase.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** The description customers read. It carries no rate, cost or integration detail. */
export function publicDescription(type: string) {
  return `${type === "Package" ? "Package delivery" : "Standard delivery"}. Price already includes all fees.`;
}
