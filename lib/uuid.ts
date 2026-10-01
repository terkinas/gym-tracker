/**
 * Client-safe UUID v4 generator.
 *
 * `crypto.randomUUID()` only exists in secure contexts (HTTPS / localhost) and
 * in reasonably recent browsers. Opening the dev server from a phone over
 * plain http://<LAN-IP>:3000 leaves it undefined, so fall back to
 * `crypto.getRandomValues` (available in insecure contexts too) and finally
 * to Math.random. These ids only identify sets in UI state / DB rows and are
 * not security-sensitive.
 */
export function generateId(): string {
  const c = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;

  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (c && typeof c.getRandomValues === "function") {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex
    .slice(6, 8)
    .join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}
