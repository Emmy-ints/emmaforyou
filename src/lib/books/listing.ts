/** Checks for store listing copy against KDP's published rules (see specs.ts for sources). */
import { METADATA } from "./specs";

const URL_RE = /(https?:\/\/|www\.)\S+|\b[\w.-]+\.(com|net|org|ng|co\.uk|io)\b/i;
const EMAIL_RE = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;
const PHONE_RE = /(\+?\d[\d\s().-]{8,}\d)/;
const EMOJI_RE = /\p{Extended_Pictographic}/u;
const REVIEW_RE = /(“[^”]{5,}”|"[^"]{5,}")\s*[—–-]\s*[A-Z]|\b(reviewers?|readers) (say|are saying|call)\b|★|\b\d(\.\d)? stars?\b/i;
const CLAIM_RE = /\b(best[- ]?sell(er|ing)|#\s?1\b|number one|award[- ]winning|guaranteed?)\b/i;
const TIME_RE = /\b(on sale|limited time|today only|free this week|pre-?order (now|bonus)|\$\d|£\d|€\d|₦\d|price)\b/i;
const REVIEW_ASK_RE = /\b(leave|write|post) a review\b/i;

export function lintDescription(d: string): string[] {
  const out: string[] = [];
  if (d.length > METADATA.descriptionMax) out.push(`It's ${d.length.toLocaleString()} characters; KDP allows ${METADATA.descriptionMax.toLocaleString()} (HTML tags count).`);
  if (URL_RE.test(d) || EMAIL_RE.test(d) || PHONE_RE.test(d)) out.push("Remove links, email addresses and phone numbers — KDP doesn't allow contact details in descriptions.");
  if (EMOJI_RE.test(d)) out.push("Remove emoji — KDP doesn't accept them in descriptions.");
  if (REVIEW_RE.test(d)) out.push("It looks like it contains a review, quote or rating. KDP doesn't allow reviews, quotes or testimonials in the description.");
  if (REVIEW_ASK_RE.test(d)) out.push("Remove requests for reviews.");
  if (CLAIM_RE.test(d)) out.push("Remove claims like “bestseller”, “#1” or “award-winning” unless you can prove them; KDP removes misleading metadata.");
  if (TIME_RE.test(d)) out.push("Remove prices, sales and time-limited offers — they aren't allowed and go out of date.");
  if (d.trim() && d.trim().length < 150) out.push("This is very short. Most descriptions that sell use 150–300 words: a hook, the stakes or promise, and who it's for.");
  return out;
}

export function lintKeyword(k: string, titleEtc: string): string | null {
  const t = k.trim();
  if (!t) return null;
  if (t.length > 50) return "Long — the field has a character limit; keep it a short phrase.";
  if (/["“”]/.test(t)) return "Remove quotation marks.";
  if (CLAIM_RE.test(t) || /\b(best|top|new|free|sale)\b/i.test(t)) return "Avoid quality and time-sensitive words (best, new, free, sale).";
  if (/kindle unlimited|kdp select|kindle\+|amazon|audible/i.test(t)) return "Don't use Amazon programme or brand names.";
  const used = new Set((titleEtc.toLowerCase().match(/[\p{L}\p{N}]{4,}/gu) ?? []));
  const overlap = (t.toLowerCase().match(/[\p{L}\p{N}]{4,}/gu) ?? []).filter((w) => used.has(w));
  if (overlap.length) return `Repeats words already in your title or author name (${overlap.join(", ")}) — use the space for new terms.`;
  return null;
}
