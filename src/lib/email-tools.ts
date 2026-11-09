import type { EmailItem } from "./email-templates";

/** Plain-text export (paste into any email tool). */
export const toText = (items: EmailItem[]) => items.map((it) => `Day ${it.day}\nSubject: ${it.subject}\nPreview: ${it.preview}\n\n${it.body}`).join("\n\n---\n\n");

const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
/** CSV with one email per row (Mailchimp, Brevo, Klaviyo and spreadsheets all import this). */
export const toCsv = (items: EmailItem[]) => ["day,subject,preview,body", ...items.map((it) => [it.day, it.subject, it.preview, it.body].map(csvCell).join(","))].join("\r\n");

/**
 * A WhatsApp-sized version of an email: greeting + the first one or two paragraphs + the closing ask, under ~700
 * characters, with *bold* subject. Deterministic (no AI) so it never changes the meaning.
 */
export function toWhatsApp(it: EmailItem, max = 700): string {
  const paras = it.body.replace(/\r/g, "").split(/\n{2,}/).map((p) => p.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean);
  const sign = /^(best|thanks|cheers|warmly|regards|kind regards|talk soon|see you|love|xx|—|-)/i;
  const body = paras.filter((p) => !sign.test(p) && p.length > 2);
  const greeting = body[0] && body[0].length < 40 && /^(hi|hello|hey|dear|good)/i.test(body[0]) ? body.shift()! : "";
  const ask = [...body].reverse().find((p) => /\?|book|reply|order|tap|click|visit|call|whatsapp|shop|get|claim|use code/i.test(p) && p.length < 260) ?? "";
  const main = body.filter((p) => p !== ask);
  let out = [`*${it.subject}*`, greeting, ...main.slice(0, 2), ask].filter(Boolean).join("\n\n");
  if (out.length > max) {
    out = [`*${it.subject}*`, greeting, main[0] ?? "", ask].filter(Boolean).join("\n\n");
    if (out.length > max) out = `${out.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
  }
  return out;
}

/** mailto: link to send one email to yourself as a test. */
export const mailtoTest = (it: EmailItem) => `mailto:?subject=${encodeURIComponent(it.subject)}&body=${encodeURIComponent(it.body.slice(0, 1800))}`;
