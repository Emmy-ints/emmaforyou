/**
 * WhatsApp follow-up after someone uses a tool or leaves their details. The site can't send WhatsApp messages by
 * itself (that needs a WhatsApp Business API account), so the dashboard prepares each message and opens it in
 * WhatsApp with one tap; the owner sends it from his own number and marks the step done. Three steps per lead:
 * a thank-you with the next step (right away), a helpful nudge (2 days later), a last check-in (5 days after that).
 * Messages only use what the lead actually gave us. Pure and tested.
 */

export interface FollowLead {
  id: string;
  kind: string;
  name: string;
  business?: string;
  email?: string;
  whatsapp?: string;
  detail?: string;
  created_at: string;
  meta?: Record<string, string | undefined>;
}

export type Outcome = "open" | "replied" | "booked" | "won" | "lost";
export interface FollowState { lead_key: string; step: number; outcome: Outcome; last_sent_at: string | null; note?: string | null }

export const STEPS = [
  { n: 1, name: "Thank you + next step", afterDays: 0 },
  { n: 2, name: "Helpful nudge", afterDays: 2 },
  { n: 3, name: "Last check-in", afterDays: 5 },
] as const;

const DAY = 24 * 3_600_000;

/** WhatsApp number → international digits for wa.me. Nigerian 0-prefixed numbers become +234. */
export function waNumber(raw?: string | null): { digits: string; ok: boolean; note?: string } {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) return { digits: `234${d.slice(1)}`, ok: true, note: "Assumed a Nigerian number (+234)" };
  if (d.length < 10 || d.length > 15) return { digits: d, ok: false, note: d ? "Check the number: it needs a country code" : "No WhatsApp number" };
  if (d.startsWith("0")) return { digits: d, ok: false, note: "Check the number: it needs a country code" };
  return { digits: d, ok: true };
}

export const firstName = (name?: string) => (name || "").trim().split(/\s+/)[0] || "there";

/** "Website audit" → what the person did, in plain words. */
function thing(l: FollowLead): string {
  const m = l.meta ?? {};
  switch (l.kind) {
    case "Website audit": return `the free website audit${m.url ? ` of ${m.url}` : ""}`;
    case "ROI calculator": return "the ROI calculator";
    case "Quiz": return "the Growth Quiz";
    case "Analyser": return "the growth assessment";
    case "Business profile": return "your business profile";
    case "Resource": return m.resource ? `"${m.resource}"` : "the free resource";
    case "Proposal signed": return `your ${m.plan ?? ""} proposal`.replace("  ", " ");
    case "Call booked": return "our call";
    case "Prototype saved": return `your ${m.protoKind ?? ""} prototype`.replace("  ", " ");
    case "Goal planner": return "your 90-day plan";
    case "Smart contract review": return "the smart contract check";
    case "AI assistant chat": case "Ask Emma (qualified)": return "your chat with Emma on our website";
    case "Waitlist": return "the waitlist";
    default: return `your ${l.kind.toLowerCase()}`;
  }
}

export function messageFor(l: FollowLead, step: 1 | 2 | 3, site = "https://emmaforyou.lovable.app"): string {
  const hi = `Hi ${firstName(l.name)}, it's Emmanuel from EmmaForYou.`;
  const book = `${site.replace(/\/$/, "")}/book`;
  const m = l.meta ?? {};
  if (step === 1) {
    switch (l.kind) {
      case "Website audit":
        return `${hi} Thanks for running ${thing(l)}${m.score ? ` (it scored ${m.score}/100)` : ""}. I'd be happy to walk you through the fixes that would make the biggest difference. Would a quick 15-minute call this week suit you? You can pick a time here: ${book}`;
      case "ROI calculator":
        return `${hi} Thanks for trying ${thing(l)}${m.niche ? ` for your ${m.niche} business` : ""}. If you'd like, I can turn those numbers into a simple plan for your business. Is WhatsApp the best place to chat, or would a short call be easier? ${book}`;
      case "Quiz":
      case "Analyser":
        return `${hi} Thanks for taking ${thing(l)}${m.score ? ` (score ${m.score})` : ""}. Want me to explain what your result means and the first two things I'd change? Happy to do it here or on a quick call: ${book}`;
      case "Business profile":
        return `${hi} Thanks for sending ${thing(l)}. I'd love to go through it with you and suggest the first steps. When is a good time for a quick call? ${book}`;
      case "Proposal signed":
        return `${hi} Thank you for accepting ${thing(l)}! The next step is a short kick-off call so we can start. Which day works best for you this week?`;
      case "Call booked":
        return `${hi} Looking forward to our call${m.when ? ` (${m.when})` : ""}. Is there anything you'd like me to look at before we speak, like your website or Instagram?`;
      case "Prototype saved":
        return `${hi} Thanks for building ${thing(l)}${m.title ? ` "${m.title}"` : ""} on our website.${m.link ? ` Here's your link again: ${m.link}` : ""} Would you like to talk about turning it into the real thing? ${book}`;
      case "Ask Emma (qualified)":
      case "AI assistant chat":
        return `${hi} Thanks for ${thing(l)}${m.goal ? `. You mentioned you want ${m.goal.toLowerCase()}` : ""}. I'd be glad to show you how we'd do that for your business. Would a quick call work? ${book}`;
      case "Resource":
        return `${hi} I hope ${thing(l)} is useful! If you'd like help putting it into practice for your business, just reply here.`;
      default:
        return `${hi} Thanks for reaching out through ${thing(l)}. How can I help? If it's easier, you can pick a time for a free call here: ${book}`;
    }
  }
  if (step === 2) {
    const tip: Record<string, string> = {
      "Website audit": "One quick win: make sure a WhatsApp or call button is visible on the first screen on mobile. It's often the fastest way to get more enquiries.",
      "ROI calculator": "One quick win: reply to every new enquiry within 5 minutes. Even a simple automatic WhatsApp reply helps people wait instead of moving on.",
      "Prototype saved": "If you'd like, I can also show you a few real projects similar to your idea.",
    };
    return `${hi} Just a quick follow-up on ${thing(l)}. ${tip[l.kind] ?? "If you have any questions, I'm happy to answer them here."} Whenever you're ready, a free call is the quickest way to get a clear plan: ${book}`;
  }
  return `${hi} I don't want to crowd your messages, so this is my last check-in about ${thing(l)}. If now isn't the right time, no problem at all. Whenever you're ready, just reply here or pick a time: ${book}`;
}

export function waLink(l: FollowLead, step: 1 | 2 | 3, site?: string): string | null {
  const n = waNumber(l.whatsapp);
  if (!n.ok) return null;
  return `https://wa.me/${n.digits}?text=${encodeURIComponent(messageFor(l, step, site))}`;
}

export function mailLink(l: FollowLead, step: 1 | 2 | 3, site?: string): string | null {
  if (!l.email?.includes("@")) return null;
  return `mailto:${encodeURIComponent(l.email)}?subject=${encodeURIComponent("Following up from EmmaForYou")}&body=${encodeURIComponent(messageFor(l, step, site))}`;
}

export type Bucket = "due" | "waiting" | "done";

/** Where a lead stands: next step, when it's due, and which list it belongs in. */
export function plan(l: FollowLead, s: FollowState | undefined, now = new Date()): { bucket: Bucket; nextStep: 1 | 2 | 3 | null; dueAt: Date | null } {
  const step = s?.step ?? 0;
  const outcome = s?.outcome ?? "open";
  if (outcome !== "open" || step >= 3) return { bucket: "done", nextStep: null, dueAt: null };
  const next = (step + 1) as 1 | 2 | 3;
  const base = step === 0 ? new Date(l.created_at) : new Date(s?.last_sent_at ?? l.created_at);
  const dueAt = new Date(base.getTime() + STEPS[next - 1].afterDays * DAY);
  return { bucket: dueAt.getTime() <= now.getTime() ? "due" : "waiting", nextStep: next, dueAt };
}

/** Pull "Goal: …" style lines out of a saved summary (Ask Emma qualification). */
export function summaryField(summary: string | undefined, key: string): string | undefined {
  const m = (summary ?? "").match(new RegExp(`^${key}:\\s*(.+)$`, "mi"));
  return m?.[1]?.trim();
}
