import { stableStringify } from "../showcase";
import { visitorSalt } from "./provider";

/**
 * Server-only signature over a tool's output (audit, email sequence, 90-day plan, makeover). The showcase only
 * accepts content carrying a valid signature, so nothing hand-written can be published as if a tool made it.
 */
async function key() {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(`efy-content|${visitorSalt()}`), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

export async function signContent(kind: string, value: unknown): Promise<string> {
  const mac = await crypto.subtle.sign("HMAC", await key(), new TextEncoder().encode(`${kind}|${stableStringify(value)}`));
  return Array.from(new Uint8Array(mac), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyContent(kind: string, value: unknown, sig: string): Promise<boolean> {
  const expected = await signContent(kind, value);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}
