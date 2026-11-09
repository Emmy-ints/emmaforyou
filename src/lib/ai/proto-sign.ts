import { cleanGeneratedHtml } from "../prototype";
import { visitorSalt } from "./provider";

/**
 * Server-only signature over a generated prototype. Only HTML our own generator produced can be saved and
 * shared at /p/<slug>; anything else (hand-written pages, edited HTML) is refused by /api/prototype-share.
 */
export async function signPrototype(html: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(`efy-proto|${visitorSalt()}`), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(cleanGeneratedHtml(html)));
  return Array.from(new Uint8Array(mac), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPrototype(html: string, sig: string): Promise<boolean> {
  const expected = await signPrototype(html);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}
